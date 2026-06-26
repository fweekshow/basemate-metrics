import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FundSessionRow = {
  payment_link_url: string;
  expires_at: string;
  consumed_at: string | null;
};

const TOKEN_RE = /^[a-f0-9]{21}$/i;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Missing or invalid payment session." }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return NextResponse.json({ error: "Payment sessions are not configured." }, { status: 500 });
  }

  try {
    const sql = neon(databaseUrl);
    const rows = await sql`
      SELECT payment_link_url, expires_at, consumed_at
      FROM fund_sessions
      WHERE token = ${token}
      LIMIT 1
    ` as FundSessionRow[];

    const session = rows[0];
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "This payment link has expired. Ask Basemate for a new one." }, { status: 404 });
    }

    if (!session.consumed_at) {
      await sql`
        UPDATE fund_sessions
        SET consumed_at = NOW()
        WHERE token = ${token} AND consumed_at IS NULL
      `;
    }

    return NextResponse.json(
      {
        paymentLinkUrl: session.payment_link_url,
        expiresAt: session.expires_at,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[pay] failed to load fund session:", err);
    return NextResponse.json({ error: "Could not load payment session." }, { status: 503 });
  }
}
