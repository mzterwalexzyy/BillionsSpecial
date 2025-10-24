import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface AuthBody {
  username?: string; // optional, since guest users may not send one
}

export async function POST(req: NextRequest) {
  try {
    const { username } = (await req.json()) as AuthBody;

    // If no username provided → assign guest name
    const finalUsername =
      username && username.trim().length > 0
        ? username.trim()
        : `Guest_${Math.floor(Math.random() * 100000)}`;

    // ✅ Check if the user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("username", finalUsername)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // ✅ If user exists, return it
    if (existingUser) {
      return NextResponse.json({
        message: `Welcome back, ${existingUser.username}!`,
        user: existingUser,
      });
    }

    // ✅ If not, create a new one
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{ username: finalUsername }])
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      message: `Welcome, ${newUser.username}! You’re in.`,
      user: newUser,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
