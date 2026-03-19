import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = "Kaelus.online <noreply@kaelus.online>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kaelus.online";

/**
 * POST /api/email/welcome
 *
 * Sends the onboarding welcome email.
 * Requires auth — only sends to the signed-in user.
 *
 * Body: { orgName: string }
 */
export async function POST(req: NextRequest) {
  const resend = getResend();
  if (!resend) {
    // Resend not configured — log and return success so onboarding isn't blocked
    console.warn("[email/welcome] RESEND_API_KEY not set — skipping email send");
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
    <div style="background: #1e40af; padding: 32px 40px;">
      <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Kaelus.online</h1>
      <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px;">AI Compliance Firewall for Defense Contractors</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px;">Welcome to Kaelus, ${orgName} 👋</h2>

      <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
        You&apos;re set up. Now let&apos;s get your CMMC gap score — it takes about 15 minutes and tells you exactly where you stand before a C3PAO assessment.
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/command-center/shield/assessment"
          style="background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          Complete your CMMC assessment →
        </a>
      </div>

      <!-- What's next -->
      <div style="background: #f0f9ff; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <p style="color: #0369a1; font-weight: 600; margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
          Your 3-step quickstart
        </p>
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
          <span style="background: #2563eb; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">1</span>
          <span style="color: #334155; font-size: 14px;">Complete the 110-control CMMC gap assessment</span>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
          <span style="background: #2563eb; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">2</span>
          <span style="color: #334155; font-size: 14px;">Route your first AI query through the Kaelus gateway</span>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="background: #2563eb; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">3</span>
          <span style="color: #334155; font-size: 14px;">See your first compliance event in the dashboard</span>
        </div>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
        CMMC Level 2 enforcement begins November 2026. 80,000+ defense contractors need to certify.
        Only 0.5% have done it. You&apos;re ahead of the curve.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        Kaelus.online &mdash; AI Compliance Firewall<br />
        <a href="${APP_URL}/command-center/settings" style="color: #94a3b8;">Manage notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Welcome to Kaelus — your CMMC assessment is ready`,
    html,
  });

  if (error) {
    console.error("[email/welcome] Resend error:", error);
    return NextResponse.json({ sent: false, error: error.message });
  }

  return NextResponse.json({ sent: true, id: data?.id });
}
