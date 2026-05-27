import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = "Hound Shield <noreply@houndshield.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

/**
 * POST /api/email/day7
 *
 * Day-7 drip: DFARS 7012 education + gateway activation nudge.
 * Call from a cron or Supabase scheduled function 7 days after signup.
 *
 * Body: { orgName?: string }
 */
export async function POST(req: NextRequest) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email/day7] RESEND_API_KEY not set — skipping");
    return NextResponse.json({ sent: false, reason: "Resend not configured" });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sent: false, reason: "Demo mode" });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const orgName: string = body.orgName ?? "your organization";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: #0f172a; padding: 32px 40px;">
      <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Hound Shield</h1>
      <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">AI Compliance Firewall for Defense Contractors</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <p style="color: #64748b; font-size: 14px; margin: 0 0 4px;">Day 7 — compliance brief</p>
      <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px;">The AI tool your employees are using right now is a DFARS violation</h2>

      <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
        Most IT security managers don't realize this until a C3PAO assessor brings it up. Here's the short version of a problem that's getting bigger every week:
      </p>

      <!-- Key insight box -->
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
        <p style="color: #7f1d1d; font-weight: 700; font-size: 15px; margin: 0 0 10px;">The problem with cloud-based AI DLP tools</p>
        <p style="color: #991b1b; line-height: 1.6; font-size: 14px; margin: 0;">
          Nightfall, Strac, even Microsoft Purview — these tools scan your prompts in <em>their cloud</em>. Under DFARS 252.204-7012, any system that processes Covered Defense Information must be FedRAMP authorized. None of these vendors are. Your DLP tool is itself a compliance violation.
        </p>
      </div>

      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
        The only architecturally compliant solution is local-only scanning — where prompt content never leaves your network. That's what Hound Shield does. The proxy runs on your infrastructure. Pattern matching happens in memory, on your machines. Only a SHA-256 license hash leaves your environment. Never prompt content.
      </p>

      <!-- The fix in 2 steps -->
      <div style="background: #f0f9ff; border-radius: 10px; padding: 20px; margin: 0 0 28px;">
        <p style="color: #0369a1; font-weight: 600; margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
          Activate the Hound Shield gateway in 2 steps
        </p>
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
          <span style="background: #1e40af; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; line-height: 24px; text-align: center;">1</span>
          <div>
            <p style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 4px;">Deploy the Docker container on your own infrastructure</p>
            <code style="background: #f1f5f9; color: #334155; padding: 6px 10px; border-radius: 6px; font-size: 12px; display: block; margin: 0;">docker run -p 8080:8080 houndshield/proxy:latest</code>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="background: #1e40af; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; line-height: 24px; text-align: center;">2</span>
          <div>
            <p style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 4px;">Point your AI tools at the local endpoint</p>
            <code style="background: #f1f5f9; color: #334155; padding: 6px 10px; border-radius: 6px; font-size: 12px; display: block; margin: 0;">OPENAI_BASE_URL=http://localhost:8080/v1</code>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/docs/quickstart"
          style="background: #1e40af; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          Read the full quickstart guide →
        </a>
      </div>

      <!-- Blog post callout -->
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">From the blog</p>
        <a href="${APP_URL}/blog/why-cloud-ai-dlp-violates-dfars-7012" style="color: #1e40af; font-weight: 600; font-size: 15px; text-decoration: none; display: block; margin: 0 0 6px;">
          Why Cloud-Based AI DLP Violates DFARS 7012 →
        </a>
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Nightfall, Strac, and Microsoft Purview all send your data to the cloud. Under DFARS 252.204-7012, that's a reportable incident waiting to happen.
        </p>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
        Questions? Reply to this email — we read and respond to every message from defense contractors.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        Hound Shield &mdash; AI Compliance Firewall<br />
        <a href="${APP_URL}/command-center/settings" style="color: #94a3b8;">Manage notifications</a>
        &nbsp;&middot;&nbsp;
        <a href="${APP_URL}/unsubscribe" style="color: #94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Your team is using AI tools that violate DFARS 7012 — here's the fix`,
    html,
  });

  if (error) {
    console.error("[email/day7] Resend error:", error);
    return NextResponse.json({ sent: false, error: error.message });
  }

  return NextResponse.json({ sent: true, id: data?.id });
}
