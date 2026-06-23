import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistEntry = {
  fullName: string;
  countryCode: string;
  countryIso: string;
  mobile: string;
  phone: string;
  email: string;
  platform: string;
};

function parseEntry(body: unknown): WaitlistEntry | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;

  const fullName = typeof b.fullName === "string" ? b.fullName.trim() : "";
  const countryCode = typeof b.countryCode === "string" ? b.countryCode.trim() : "";
  const countryIso = typeof b.countryIso === "string" ? b.countryIso.trim() : "";
  const mobile =
    typeof b.mobile === "string" ? b.mobile.replace(/[^\d]/g, "") : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const platform = b.platform === "android" ? "android" : "ios";

  if (!fullName) return { error: "Full name is required." };
  if (mobile.length < 6) return { error: "A valid mobile number is required." };
  if (!EMAIL_RE.test(email)) return { error: "A valid email is required." };

  return {
    fullName,
    countryCode: countryCode || "+1",
    countryIso: countryIso || "US",
    mobile,
    phone: `${countryCode || "+1"}${mobile}`,
    email,
    platform,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = parseEntry(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // The SQL/storage endpoint is supplied via env var (set in Railway Variables).
  // Until it's configured, log the entry so the form is usable in dev.
  const endpoint = process.env.WAITLIST_ENDPOINT?.trim();
  if (!endpoint) {
    console.log("[waitlist] no WAITLIST_ENDPOINT set — entry:", parsed);
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(process.env.WAITLIST_API_KEY
          ? { authorization: `Bearer ${process.env.WAITLIST_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ ...parsed, source: "waitlist", createdAt: new Date().toISOString() }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[waitlist] upstream ${res.status}: ${detail}`);
      return NextResponse.json(
        { error: "Could not save your spot. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] failed to reach endpoint:", err);
    return NextResponse.json(
      { error: "Could not reach the waitlist service. Please try again." },
      { status: 503 },
    );
  }
}
