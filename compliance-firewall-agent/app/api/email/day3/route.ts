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
 * POST /api/email/day3
 *
 * Day-3 drip: "Your CMMC gap assessment is waiting."
 * Call from a cron or Supabase scheduled function 3 days after signup.
 *
 * Body: { userId?: string } — falls back to the signed-in user.
 */
export async function POST(req: NextRequest) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email/day3] RESEND_API_KEY not set — skipping");
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
      <p style="color: #64748b; font-size: 14px; margin: 0 0 4px;">Day 3 check-in</p>
      <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 20px;">Your CMMC gap assessment is waiting, ${orgName}</h2>

      <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
        Most defense contractors start their CMMC journey and get stuck after the first few controls. The assessment is 110 questions — but it doesn't need to take 110 days.
      </p>

      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
        Here's the number that matters: your <strong>SPRS score</strong>. Every DoD contract auditor will ask for it. If you haven't completed your assessment, your score is essentially unknown — which is worse than a bad score, because at least a bad score shows you're measuring.
      </p>

      <!-- Urgency stat -->
      <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 10px; padding: 16px 20px; margin: 0 0 28px;">
        <p style="color: #92400e; font-weight: 600; font-size: 14px; margin: 0 0 4px;">⏱ CMMC Phase 2 enforcement begins November 2026</p>
        <p style="color: #b45309; font-size: 13px; margin: 0;">Less than 18 months. Assessment + remediation + C3PAO scheduling typically takes 6–12 months for most contractors.</p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/command-center/shield/assessment"
          style="background: #1e40af; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          Continue your CMMC assessment →
        </a>
      </div>

      <!-- What to expect -->
      <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <p style="color: #166534; font-weight: 600; margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
          What you get when you finish
        </p>
        <div style="margin-bottom: 10px;">
          <span style="color: #15803d; font-size: 18px; margin-right: 8px;">✓</span>
          <span style="color: #334155; font-size: 14px;">Your SPRS score (current baseline)</span>
        </div>
        <div style="margin-bottom: 10px;">
          <span style="color: #15803d; font-size: 18px; margin-right: 8px;">✓</span>
          <span style="color: #334155; font-size: 14px;">Gap analysis ranked by CMMC impact</span>
        </div>
        <div>
          <span style="color: #15803d; font-size: 18px; margin-right: 8px;">✓</span>
          <span style="color: #334155; font-size: 14px;">Print-ready PDF evidence for your C3PAO assessor</span>
        </div>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
        Takes about 15 minutes per domain. You can save progress and return any time.
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
    subject: `Your CMMC assessment is waiting — ${orgName}`,
    html,
  });

  if (error) {
    console.error("[email/day3] Resend error:", error);
    return NextResponse.json({ sent: false, error: error.message });
  }

  return NextResponse.json({ sent: true, id: data?.id });
}
