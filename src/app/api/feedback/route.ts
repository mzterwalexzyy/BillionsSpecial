// src/app/api/feedback/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // body: { username?: string, rating?: number, feedback?: string, timestamp?: string }
    // TODO: replace this with DB save logic (Supabase / Prisma / Mongo / etc.)
    console.log("Received feedback (placeholder):", body);

    return NextResponse.json({ ok: true, message: "Feedback received (placeholder)" }, { status: 200 });
  } catch (err) {
    console.error("feedback POST error", err);
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
  }
}
