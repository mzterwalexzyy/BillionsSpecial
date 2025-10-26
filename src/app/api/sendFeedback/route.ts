import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { username, rating, feedback } = await req.json();

    if (!feedback) {
      return NextResponse.json({ error: "Feedback message is required." }, { status: 400 });
    }

    const emailData = {
      from: "Billions Quiz <no-reply@billionsspecial.xyz>",
      to: "feedback@billionsspecial.xyz", // 🔸 Change to your email
      subject: `New Feedback from ${username || "Anonymous"}`,
      text: `🧠 Quiz Feedback\n\nFrom: ${username || "Anonymous"}\nRating: ${rating ?? "N/A"}\n\nMessage:\n${feedback}`,
    };

    const result = await resend.emails.send(emailData);

    if (result.error) {
      console.error("Resend error:", result.error);
      return NextResponse.json({ error: "Failed to send feedback email." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Feedback sent successfully!" });
  } catch (err) {
    console.error("Feedback send error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
