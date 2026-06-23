const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://houndshield.com';
const FROM = 'HoundShield Partners <noreply@houndshield.com>';

/**
 * Transactional confirmation sent to a C3PAO / partner applicant the moment
 * they apply (from /api/partners/apply). The founder already gets an internal
 * notification; this is the applicant-facing acknowledgement that sets
 * expectations and keeps the channel — the prime-objective wedge — warm.
 */
export const partnerWelcomeEmail = {
  from: FROM,
  subject: 'We received your HoundShield partner application',
  html: (name: string, company: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <div style="background:#0f172a;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">HoundShield</h1>
      <p style="color:#ea580c;margin:6px 0 0;font-size:13px;">Partner Program</p>
    </div>

    <div style="padding:40px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Thanks, ${name} — we've got it</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        Your partner application for <strong>${company}</strong> is in. A member of our team will
        review it and reach out within two business days to talk through fit, commercials, and
        how we can make your clients' CMMC assessments easier.
      </p>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px;margin:0 0 24px;">
        <p style="color:#9a3412;font-weight:600;margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Why partners choose HoundShield</p>
        <p style="color:#7c2d12;font-size:14px;margin:0 0 8px;line-height:1.6;">
          • <strong>Local-only by design</strong> — your clients' CUI never leaves their network, so recommending us never creates a DFARS 7012 spill.
        </p>
        <p style="color:#7c2d12;font-size:14px;margin:0 0 8px;line-height:1.6;">
          • <strong>C3PAO-ready evidence</strong> — tamper-evident PDF reports your assessors can use directly.
        </p>
        <p style="color:#7c2d12;font-size:14px;margin:0;line-height:1.6;">
          • <strong>Recurring referral commission</strong> — aligned with the clients you already serve.
        </p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/partners"
          style="background:#ea580c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Review the partner program →
        </a>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;">
        Have a deadline-driven client who can't wait? Reply to this email and we'll prioritize your review.
      </p>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        HoundShield &mdash; AI Compliance Firewall<br />
        <a href="${APP_URL}/partners" style="color:#94a3b8;">Partner program</a>
      </p>
    </div>
  </div>
</body>
</html>`,
};
