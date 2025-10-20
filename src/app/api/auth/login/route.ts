import { NextResponse } from "next/server";
import { loginUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { username, pin } = await req.json();
    const data = loginUser(username, pin);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
