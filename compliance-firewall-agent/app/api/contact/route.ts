import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/contact — delivers a website contact message to the founder inbox.
 *
 * Before this route existed, the /contact form faked success (a setTimeout →
 * "Message sent") and delivered nothing, silently dropping every lead — including
 * the $499 report buyers deflected here when Stripe checkout is unconfigured.
 *
 * Delivery is email-only (no new DB table): a Resend notification to the founder.
 * If Resend is not configured we return 503 with a fallback address so the form
 * can tell the visitor to email us directly — never a fake success.
 */

const CONTACT_TO = process.env.FOUNDER_EMAIL || "contact@houndshield.com";
const CONTACT_FROM = "HoundShield Contact <noreply@houndshield.com>";

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  company: z.string().max(200).optional(),
  subject: z.string().max(120).optional(),
  message: z.string().min(1).max(5000),
});

/** Escape untrusted text before interpolating into notification HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Malformed JSON throws → handled as 500 by the outer catch.
    const raw = await request.json();
    const parsed = ContactSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path?.join(".") ?? "input";
      return NextResponse.json(
        { error: `${field}: ${issue?.message ?? "Invalid message"}` },
        { status: 400 }
      );
    }

    const { name, email, company, subject, message } = parsed.data;
    const topic = subject?.trim() || "General";

    // No Resend key → do NOT fake success. Tell the caller to email directly so
    // the lead is never silently lost.
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "email_unconfigured", fallbackEmail: CONTACT_TO },
        { status: 503 }
      );
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `New contact (${escapeHtml(topic)}): ${escapeHtml(name)}`,
      html: `
        <h2>New website contact message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${company ? escapeHtml(company) : "Not specified"}</p>
        <p><strong>Subject:</strong> ${escapeHtml(topic)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
      text: `New website contact message\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || "Not specified"}\nSubject: ${topic}\n\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact message error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
