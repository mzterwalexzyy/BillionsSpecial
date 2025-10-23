import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, pin } = await req.json();
    const data = registerUser(username, pin);
    return NextResponse.json(data);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
