import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { username, rating, feedback, level } = await req.json();

    if (!feedback && !rating) {
      return NextResponse.json({ error: "Missing feedback or rating" }, { status: 400 });
    }

    const to = process.env.TO_EMAIL;
    const from = process.env.FROM_EMAIL || "noreply@on.resend.dev";

    if (!to || !process.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY or TO_EMAIL env vars");
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const subject = `Billions Quiz Feedback — ${level || "General"}`;
    const html = `
      <div style="font-family: sans-serif; padding: 16px; background: #f9f9f9;">
        <h2>📩 New Feedback Received</h2>
        <p><strong>User:</strong> ${username || "Anonymous"}</p>
        <p><strong>Level:</strong> ${level || "Unknown"}</p>
        <p><strong>Rating:</strong> ${rating || "No rating"}</p>
        <p><strong>Feedback:</strong></p>
        <p style="background:#fff;padding:12px;border-radius:8px;">${feedback || "(no message)"}</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
