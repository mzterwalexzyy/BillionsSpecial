// src/app/api/leaderboard/sync/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // This endpoint could accept a batch of entries from the client and persist them
  // Implementation depends on chosen DB. We'll return 501-like response for now.
  return NextResponse.json({ ok: false, note: "Server sync not implemented. Connect a DB and save data." }, { status: 501 });
}
