// src/app/api/feedback/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
// NOTE: We assume that the Supabase client is correctly exported from this path
import { supabase } from "@/lib/supabaseClient"; 

const resend = new Resend(process.env.RESEND_API_KEY);

// Interface for the data expected from the client
interface FeedbackPayload {
  user_id?: string; // Optional, useful if the user is logged in
  username?: string; // Optional display name
  rating: number | null; // Rating value (e.g., 1 to 5 stars)
  feedback: string; // The main text content of the feedback
  level?: string | number | null; // The level/context where the feedback occurred (New)
}

export async function POST(request: Request) {
  let body: FeedbackPayload;

  try {
    // 1. Parse the incoming JSON body
    body = (await request.json()) as FeedbackPayload;

    // --- Validation ---
    // Require at least feedback text or a rating to proceed.
    if (!body.feedback && !body.rating) {
      return NextResponse.json(
        { ok: false, message: "Feedback text or a rating is required." }, 
        { status: 400 }
      );
    }
    
    // 2. Prepare the data for Supabase insertion
    const dataToInsert = {
      user_id: body.user_id ?? null,
      username: body.username ?? 'Anonymous',
      rating: body.rating ?? null,
      feedback_text: body.feedback ? body.feedback.trim() : null,
      context_level: body.level ?? null, // Save the level/context
    };

    // 3. --- DATABASE SAVE (Supabase) ---
    const { error: dbError } = await supabase
      .from("user_feedback")
      .insert([dataToInsert]);

    if (dbError) {
      console.error("Supabase feedback insert error:", dbError);
      // We will still attempt to send the email, but warn the client that persistence failed.
    }
    
    // 4. --- EMAIL NOTIFICATION (Resend) ---
    const to = process.env.TO_EMAIL;
    const from = process.env.FROM_EMAIL;

    if (!to || !from || !process.env.RESEND_API_KEY) {
      console.error("Missing email ENV vars. Skipping email notification.");
    } else {
        try {
            await resend.emails.send({
                from,
                to,
                subject: `Quiz Feedback — ${body.level || "General"}`,
                html: `
                    <div style="font-family:sans-serif;padding:16px;background:#f9f9f9;border-radius:12px;">
                        <h2 style="color:#FFD700;">📩 New Feedback Received</h2>
                        <p><strong>User:</strong> ${body.username || "Anonymous"}</p>
                        <p><strong>Level:</strong> ${body.level || "General"}</p>
                        <p><strong>Rating:</strong> ${body.rating || "No rating provided"}</p>
                        <h3 style="margin-bottom:8px;">Feedback Message:</h3>
                        <p style="background:#fff;padding:12px;border-radius:8px;border:1px solid #eee;">
                            ${body.feedback || "(No message provided, only rating)"}
                        </p>
                    </div>
                `,
            });
        } catch (emailErr) {
            console.error("Resend API error:", emailErr);
            // We log the email error but don't fail the entire request, since the DB save is more critical.
        }
    }

    // 5. Success response (regardless of email status, as long as DB was attempted)
    return NextResponse.json({ 
        ok: true, 
        message: dbError ? "Feedback received but database save failed." : "Feedback successfully received and saved."
    }, { status: dbError ? 500 : 200 });

  } catch (err) {
    // This catches JSON parsing errors or other unexpected issues
    console.error("Feedback POST error", err);
    return NextResponse.json({ ok: false, message: "Invalid request payload or internal server error." }, { status: 400 });
  }
}
