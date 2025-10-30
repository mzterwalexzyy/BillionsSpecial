// src/app/api/feedback/route.ts
import { NextResponse } from "next/server";
// NOTE: We assume that the Supabase client is correctly exported from this path
import { supabase } from "@/lib/supabaseClient"; 

// Interface for the data expected from the client
interface FeedbackPayload {
  user_id?: string; // Optional, useful if the user is logged in
  username?: string; // Optional display name
  rating: number | null; // Rating value (e.g., 1 to 5 stars)
  feedback: string; // The main text content of the feedback
}

export async function POST(request: Request) {
  let body: FeedbackPayload;

  try {
    // 1. Parse the incoming JSON body
    body = (await request.json()) as FeedbackPayload;

    // Basic validation: ensure the primary feedback text is present
    if (!body.feedback || typeof body.feedback !== 'string' || body.feedback.trim().length === 0) {
      console.warn("Feedback validation failed: missing text.");
      return NextResponse.json({ ok: false, message: "Feedback text is required." }, { status: 400 });
    }

    // 2. Prepare the data for insertion, defaulting optional fields
    const dataToInsert = {
      // Use nullish coalescing to ensure DB fields are handled correctly
      user_id: body.user_id ?? null,
      username: body.username ?? 'Anonymous',
      rating: body.rating ?? null,
      feedback_text: body.feedback.trim(),
    };

    // 3. Save the feedback to the 'user_feedback' table in Supabase
    const { error } = await supabase
      .from("user_feedback")
      .insert([dataToInsert]);

    if (error) {
      console.error("Supabase feedback insert error:", error);
      // Return a 500 status code on database failure
      return NextResponse.json({ ok: false, message: "Failed to save feedback due to a server error." }, { status: 500 });
    }

    // 4. Success response
    return NextResponse.json({ ok: true, message: "Feedback successfully received and saved." }, { status: 200 });

  } catch (err) {
    // This catches JSON parsing errors or other unexpected issues
    console.error("Feedback POST error", err);
    return NextResponse.json({ ok: false, message: "Invalid request payload or internal server error." }, { status: 400 });
  }
}
