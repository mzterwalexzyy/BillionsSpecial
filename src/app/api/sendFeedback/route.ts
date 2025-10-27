import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { username, rating, feedback, level } = await req.json();

    if (!feedback && !rating) {
      return NextResponse.json(
        { error: "Missing feedback or rating" },
        { status: 400 }
      );
    }

    const to = process.env.TO_EMAIL;
    const from = process.env.FROM_EMAIL;

    if (!to || !from || !process.env.RESEND_API_KEY) {
      console.error("Missing TO_EMAIL, FROM_EMAIL, or RESEND_API_KEY env vars");
      return NextResponse.json(
        { error: "Server not configured properly" },
        { status: 500 }
      );
    }

    try {
      await resend.emails.send({
        from,
        to,
        subject: `Billions Quiz Feedback — ${level || "General"}`,
        html: `
          <div style="font-family:sans-serif;padding:16px;background:#f9f9f9;">
            <h2>📩 New Feedback Received</h2>
            <p><strong>User:</strong> ${username || "Anonymous"}</p>
            <p><strong>Level:</strong> ${level || "Unknown"}</p>
            <p><strong>Rating:</strong> ${rating || "No rating"}</p>
            <p><strong>Feedback:</strong></p>
            <p style="background:#fff;padding:12px;border-radius:8px;">${feedback || "(no message)"}</p>
          </div>
        `,
      });
    } catch (err: any) {
      console.error("Resend API error:", err);

      if (err.status === 403) {
        return NextResponse.json(
          {
            error:
              "Forbidden: likely an unverified sender or invalid API key. Check FROM_EMAIL and RESEND_API_KEY.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: err.message || "Resend email send failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
