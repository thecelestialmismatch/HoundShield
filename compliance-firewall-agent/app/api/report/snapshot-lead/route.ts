import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/report/snapshot-lead
 *
 * Opt-in lead capture for the Instant AI Risk Snapshot (/demo#snapshot). A
 * visitor who generated a snapshot can ask us to email them the summary and
 * flag a human review — turning a self-serve demo into a warm lead routed to
 * the founder.
 *
 * PRIVACY BOUNDARY (non-negotiable): this endpoint accepts finding COUNTS only.
 * There is deliberately NO field for the pasted prompt text or matched strings —
 * the whole product promise is that prompt content never leaves the user's
 * device, and this route upholds it. The zod schema is `.strict()` so any
 * attempt to smuggle raw content is rejected, not silently forwarded.
 *
 * Delivery is email-only (Resend) — same rail as /api/contact. No new DB table.
 * If Resend is unconfigured we return 503 + a fallback address; we never fake
 * success and never drop the lead silently.
 */

const NOTIFY_FROM = "HoundShield <noreply@houndshield.com>";

/** Resolved per-request so deploy-time env changes take effect without a cold restart. */
function founderInbox(): string {
  return process.env.FOUNDER_EMAIL || "contact@houndshield.com";
}

const nonNegInt = z.number().int().min(0).max(100000);

const LeadSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(320),
    company: z.string().max(200).optional(),
    vertical: z.enum(["defense", "healthcare", "legal"]).optional(),
    criticalCount: nonNegInt,
    highCount: nonNegInt,
    mediumCount: nonNegInt,
    totalMatches: nonNegInt,
    promptsScanned: nonNegInt,
    controls: z.array(z.string().max(24)).max(30).optional(),
  })
  .strict(); // reject unknown keys — no smuggling of pasted text

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
    const raw = await request.json();
    const parsed = LeadSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path?.join(".") ?? "input";
      return NextResponse.json(
        { error: `${field}: ${issue?.message ?? "Invalid input"}` },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      company,
      vertical,
      criticalCount,
      highCount,
      mediumCount,
      totalMatches,
      promptsScanned,
      controls,
    } = parsed.data;

    const leadTo = founderInbox();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "email_unconfigured", fallbackEmail: leadTo },
        { status: 503 }
      );
    }

    const industry = vertical ?? "defense";
    const controlList = controls && controls.length > 0 ? controls.join(", ") : "None";
    const countsLine = `${criticalCount} critical · ${highCount} high · ${mediumCount} medium · ${totalMatches} total across ${promptsScanned} prompt(s)`;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 1) Founder alert — a warm lead who has already seen their own risk.
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: leadTo,
      replyTo: email,
      subject: `New snapshot lead: ${escapeHtml(name)} — ${criticalCount}C/${highCount}H (${escapeHtml(industry)})`,
      html: `
        <h2>New AI risk snapshot lead</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${company ? escapeHtml(company) : "Not specified"}</p>
        <p><strong>Industry:</strong> ${escapeHtml(industry)}</p>
        <p><strong>Findings:</strong> ${escapeHtml(countsLine)}</p>
        <p><strong>NIST controls implicated:</strong> ${escapeHtml(controlList)}</p>
        <p style="color:#6b7280;font-size:12px">Counts only — no prompt content is collected or transmitted.</p>
      `,
      text: `New AI risk snapshot lead\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || "Not specified"}\nIndustry: ${industry}\nFindings: ${countsLine}\nNIST controls: ${controlList}\n\nCounts only — no prompt content is collected.`,
    });

    // 2) Requester confirmation — their summary + the $499 next step.
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: email,
      replyTo: leadTo,
      subject: "Your HoundShield AI risk snapshot",
      html: `
        <h2>Your AI risk snapshot</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Here's the summary from the snapshot you generated in your browser:</p>
        <p><strong>${escapeHtml(countsLine)}</strong></p>
        <p>These findings map to NIST 800-171 controls: ${escapeHtml(controlList)}.</p>
        <p>Your pasted text never left your device — this email contains counts only.</p>
        <p>The <strong>$499 CMMC AI Risk Assessment Report</strong> runs HoundShield in your own
        environment for 14 days and delivers a SHA-256-signed PDF your assessor accepts:
        <a href="https://houndshield.com/assessment">houndshield.com/assessment</a>.</p>
        <p>See a sample of the full report:
        <a href="https://houndshield.com/api/reports/sample">sample report (PDF)</a>.</p>
        <p>— HoundShield</p>
      `,
      text: `Your AI risk snapshot\n\nHi ${name},\n\nSummary: ${countsLine}\nNIST controls: ${controlList}\n\nYour pasted text never left your device — this email contains counts only.\n\nThe $499 CMMC AI Risk Assessment Report runs HoundShield in your environment for 14 days and delivers a signed PDF your assessor accepts: https://houndshield.com/assessment\nSample report: https://houndshield.com/api/reports/sample\n\n— HoundShield`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Snapshot lead error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
