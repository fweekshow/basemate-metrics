import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

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

type WaitlistPayload = WaitlistEntry & {
  source: "waitlist";
  createdAt: string;
};

function isPostgresUrl(value: string) {
  return value.startsWith("postgres://") || value.startsWith("postgresql://");
}

function isNeonPostgresUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "neon.tech" || hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

function getWaitlistDatabaseUrl() {
  const candidates = [
    process.env.WAITLIST_DATABASE_URL?.trim(),
    process.env.NEON_DATABASE_URL?.trim(),
    process.env.DATABASE_URL?.trim(),
  ].filter((value): value is string => Boolean(value));

  return candidates.find(
    (value) => isPostgresUrl(value) && isNeonPostgresUrl(value),
  );
}

function isHttpUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

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

async function saveToNeon(connectionString: string, payload: WaitlistPayload) {
  const sql = neon(connectionString);

  await sql`
    CREATE TABLE IF NOT EXISTS waitlist_entries (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      country_code TEXT NOT NULL,
      country_iso TEXT NOT NULL,
      mobile TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      platform TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO waitlist_entries (
      full_name,
      country_code,
      country_iso,
      mobile,
      phone,
      email,
      platform,
      source,
      created_at
    ) VALUES (
      ${payload.fullName},
      ${payload.countryCode},
      ${payload.countryIso},
      ${payload.mobile},
      ${payload.phone},
      ${payload.email},
      ${payload.platform},
      ${payload.source},
      ${payload.createdAt}
    )
  `;
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

  const payload: WaitlistPayload = {
    ...parsed,
    source: "waitlist",
    createdAt: new Date().toISOString(),
  };

  const databaseUrl = getWaitlistDatabaseUrl();
  const endpoint = process.env.WAITLIST_ENDPOINT?.trim();
  const postgresUrl =
    databaseUrl ??
    (endpoint && isPostgresUrl(endpoint) && isNeonPostgresUrl(endpoint)
      ? endpoint
      : undefined);

  if (postgresUrl) {
    try {
      await saveToNeon(postgresUrl, payload);
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("[waitlist] failed to save entry:", err);
      return NextResponse.json(
        { error: "Could not save your spot. Please try again." },
        { status: 502 },
      );
    }
  }

  if (endpoint && isPostgresUrl(endpoint)) {
    console.error("[waitlist] WAITLIST_ENDPOINT must be a Neon Postgres URL.");
    return NextResponse.json(
      { error: "Waitlist database is not configured correctly." },
      { status: 500 },
    );
  }

  if (!endpoint) {
    console.error("[waitlist] no Neon database URL configured.");
    return NextResponse.json(
      { error: "Waitlist database is not configured." },
      { status: 500 },
    );
  }

  if (!isHttpUrl(endpoint)) {
    console.error("[waitlist] WAITLIST_ENDPOINT must be an HTTP URL.");
    return NextResponse.json(
      { error: "Waitlist storage is not configured correctly." },
      { status: 500 },
    );
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
      body: JSON.stringify(payload),
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
