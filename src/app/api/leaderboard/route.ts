// src/app/api/leaderboard/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Example: receive { username, level, score, total } and store it in a DB.
  // For now we return 501 to indicate "not implemented"
  try {
    const data = await req.json();
    console.log("leaderboard submit:", data);
    // TODO: insert into database
    return NextResponse.json({ ok: true, note: "No DB connected — implement DB logic here" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
