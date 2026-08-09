import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  DATA_ROOM_COOKIE,
  dataRoomCookieOptions,
  mintDataRoomToken,
  verifyPassword,
} from "@/lib/data-room-auth";
import { logDataRoomVisit } from "@/lib/data-room-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { password?: string; name?: string; firm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const firm = typeof body.firm === "string" ? body.firm.trim() : "";

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Tell us who you are — name is required." },
      { status: 400 },
    );
  }

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const token = mintDataRoomToken({ name, firm });
  const jar = await cookies();
  jar.set(DATA_ROOM_COOKIE, token, dataRoomCookieOptions());

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");

  await logDataRoomVisit({
    name,
    firm,
    userAgent: request.headers.get("user-agent"),
    ip,
  });

  return NextResponse.json({ ok: true, name, firm });
}
