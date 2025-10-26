import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { z } from "zod";

// Define a Zod schema for the request body
const AuthBodySchema = z.object({
  username: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the request body with the schema
    const result = AuthBodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { username } = result.data;

    // If no username provided → assign a guest name automatically
    const finalUsername =
      username && username.trim().length > 0
        ? username.trim()
        : `Guest_${Math.floor(Math.random() * 100000)}`;

    // ✅ Try to find user by username
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("username", finalUsername)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // ✅ If user exists → return them
    if (user) {
      return NextResponse.json({
        message: `Welcome back, ${user.username}!`,
        user,
      });
    }

    // ✅ Otherwise create a new guest user automatically
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
