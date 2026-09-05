import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { error: "The waitlist is closed. Text Stablemate to get started." },
    { status: 410 },
  );
}
