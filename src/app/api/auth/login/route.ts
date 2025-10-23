import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { discordName, guest } = await req.json();

    let username = discordName;
    let is_guest = false;

    // If user chooses guest mode, generate random name
    if (guest) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      username = `Guest_${randomNum}`;
      is_guest = true;
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    let user = existingUser;

    // If not, create them
    if (!user) {
      const { data, error } = await supabase
        .from("users")
        .insert([{ username, is_guest }])
        .select()
        .single();

      if (error) throw error;
      user = data;
    }

    return NextResponse.json({
      message: `Welcome ${user.is_guest ? "Guest" : user.username}!`,
      user,
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 400 }
    );
  }
}
