import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { transactionalFrom } from "@/lib/email/identity";
import { emailHeader, manageNotificationsFooter } from "@/lib/email/shell";

import { SITE_URL } from "@/lib/site-url";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = transactionalFrom();
const APP_URL = SITE_URL;
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
${emailHeader()}

    <!-- Body -->
    <div style="padding: 40px;">
      <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px;">Welcome to HoundShield, ${orgName} </h2>

      <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
        You&apos;re set up. Now let&apos;s get your CMMC gap score — it takes about 15 minutes and tells you exactly where you stand before a C3PAO assessment.
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/command-center/shield/assessment"
          style="background: #ea580c; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          Complete your CMMC assessment →
        </a>
      </div>

      <!-- What's next -->
      <div style="background: #fff7ed; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <p style="color: #c2410c; font-weight: 600; margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
          Your 3-step quickstart
        </p>
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
          <span style="background: #ea580c; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">1</span>
          <span style="color: #334155; font-size: 14px;">Complete the 110-control CMMC gap assessment</span>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
          <span style="background: #ea580c; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">2</span>
          <span style="color: #334155; font-size: 14px;">Route your first AI query through the HoundShield gateway</span>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="background: #ea580c; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">3</span>
          <span style="color: #334155; font-size: 14px;">See your first compliance event in the dashboard</span>
        </div>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
        CMMC Phase 2 was suspended on 13 July 2026, so there is no certification deadline right now —
        but DFARS 252.204-7012, the 110 NIST 800-171 Rev 2 controls, and your annual SPRS
        self-attestation all still apply. With no assessor in the loop, that score is your own
        representation to the government. The evidence behind it is what we build.
      </p>
    </div>

${manageNotificationsFooter()}
  </div>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Welcome to HoundShield — your CMMC assessment is ready`,
    html,
  });

  if (error) {
    // Audit finding #13: this returned `error.message` — a raw upstream (Resend)
    // string — straight to the client. The detail belongs in the server log; the
    // caller gets a fixed string. Every other route in the app already does this
    // (login/route.ts:99-104, signup/route.ts:141-147); this was the one place
    // the pattern was broken.
    console.error("[email/welcome] Resend error:", error);
    return NextResponse.json({ sent: false, error: "Unable to send the welcome email." });
  }

  // Enroll in drip sequence — upsert so repeated calls are safe.
  const serviceClient = createServiceClient();
  const { error: enrollErr } = await serviceClient
    .from("onboarding_email_sequence")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

  if (enrollErr) {
    // Non-fatal — Day 1 email was sent; log and continue.
    console.error("[email/welcome] Enrollment upsert failed:", enrollErr);
  }

  return NextResponse.json({ sent: true, id: data?.id });
}
