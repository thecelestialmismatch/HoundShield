import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import { z } from "zod";

// Bounded, validated input (audit M2).
const ApplySchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  email: z.string().email().max(320),
  clientCount: z.number().int().min(0).max(1_000_000).optional(),
  partnerType: z.enum(["referral", "reseller", "technology"]).optional(),
  message: z.string().max(5000).optional(),
});

/** Escape untrusted text before interpolating into notification HTML (audit M2). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: NextRequest) {
  try {
    // Let malformed JSON throw → handled as 500 by the outer catch.
    const raw = await request.json();
    const parsed = ApplySchema.safeParse(raw);
    if (!parsed.success) {
      // Surface the offending field in the error string (e.g. "email: ...").
      const issue = parsed.error.issues[0];
      const field = issue?.path?.join(".") ?? "input";
      return NextResponse.json(
        { error: `${field}: ${issue?.message ?? "Invalid application"}`, details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, company, email, clientCount, message } = parsed.data;
    const type = parsed.data.partnerType ?? "referral";

    const supabase = createServiceClient();

    const { error } = await supabase.from("partner_applications").insert({
      name,
      company,
      email,
      client_count: typeof clientCount === "number" ? clientCount : 0,
      partner_type: type,
      message: message || null,
      status: "pending",
    });

    if (error) {
      console.error("Partner application insert failed:", error);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    // Send notification email to founder (non-blocking)
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "HoundShield Partners <noreply@houndshield.com>",
          to: process.env.FOUNDER_EMAIL || "info@houndshield.com",
          subject: `New Partner Application: ${escapeHtml(company)}`,
          html: `
            <h2>New Partner Application</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Company:</strong> ${escapeHtml(company)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Client Count:</strong> ${clientCount ?? "Not specified"}</p>
            <p><strong>Partner Type:</strong> ${escapeHtml(type)}</p>
            <p><strong>Message:</strong> ${message ? escapeHtml(message) : "None"}</p>
          `,
        });

        // Applicant-facing confirmation — keeps the RPO / MSP partner channel warm.
        const { partnerWelcomeEmail } = await import("@/lib/email/templates/partner-welcome");
        await resend.emails.send({
          from: partnerWelcomeEmail.from,
          to: email,
          subject: partnerWelcomeEmail.subject,
          html: partnerWelcomeEmail.html(name, company),
        });
      }
    } catch (emailErr) {
      // Email failure should never block the application
      console.error("Partner notification email failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Partner application error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
