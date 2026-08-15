import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GENERAL_INBOX, founderInbox, transactionalFrom } from "@/lib/email/identity";
import { emailButton, emailFooter, emailShell, escapeHtml } from "@/lib/email/shell";
import { siteUrl } from "@/lib/site-url";

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

const NOTIFY_FROM = transactionalFrom();

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
        // Published to the browser → the generic inbox, never the routing address.
        { error: "email_unconfigured", fallbackEmail: GENERAL_INBOX },
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
      // Branded like every other buyer-facing message, and pointed at SITE_URL
      // rather than the apex host: both links here were hardcoded
      // `https://houndshield.com/...`, which Vercel 308s to www. #290
      // single-sourced twenty-nine such copies and missed these two, because
      // they live inside a template literal in an API route rather than in a
      // metadata block.
      html: emailShell({
        tagline: "Instant AI Risk Snapshot",
        bodyHtml: `
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Your AI risk snapshot, ${escapeHtml(name)}</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        Here's the summary from the snapshot you generated in your browser.
      </p>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin:0 0 24px;">
        <p style="color:#991b1b;font-weight:600;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Findings</p>
        <p style="color:#7f1d1d;font-size:16px;margin:0 0 8px;font-weight:700;">${escapeHtml(countsLine)}</p>
        <p style="color:#991b1b;font-size:13px;margin:0;">Mapped to NIST 800-171 controls: ${escapeHtml(controlList)}.</p>
      </div>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        Your pasted text never left your device — this email contains counts only.
      </p>

      <p style="color:#475569;line-height:1.6;margin:0 0 8px;">
        The <strong>$499 CMMC AI Risk Assessment Report</strong> runs HoundShield in your own
        environment for 14 days and delivers a SHA-256-signed PDF your assessor accepts.
      </p>
${emailButton(siteUrl("/assessment"), "Start your $499 report →")}

      <p style="color:#64748b;font-size:13px;line-height:1.6;">
        Want to see the output first? Here's a
        <a href="${siteUrl("/api/reports/sample")}" style="color:#ea580c;">sample report (PDF)</a> —
        a real generated report, not a mockup. Reply to this email with any questions.
      </p>`,
        footerHtml: emailFooter(
          `<br /><a href="${siteUrl("/security")}" style="color:#94a3b8;">Security &amp; deployment modes</a>`
        ),
      }),
      text: `Your AI risk snapshot\n\nHi ${name},\n\nSummary: ${countsLine}\nNIST controls: ${controlList}\n\nYour pasted text never left your device — this email contains counts only.\n\nThe $499 CMMC AI Risk Assessment Report runs HoundShield in your environment for 14 days and delivers a signed PDF your assessor accepts: ${siteUrl("/assessment")}\nSample report: ${siteUrl("/api/reports/sample")}\n\n— HoundShield`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Snapshot lead error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
