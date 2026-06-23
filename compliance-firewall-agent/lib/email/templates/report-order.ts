const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://houndshield.com';
const FROM = 'HoundShield <noreply@houndshield.com>';

/**
 * Transactional fulfillment email for the $499 one-time "CMMC AI Risk
 * Assessment Report" — fires from the Stripe webhook on
 * checkout.session.completed when session.mode === 'payment'.
 *
 * This is the Stage 1 primary product. The email confirms the charge and
 * starts the 14-day engagement: deploy the proxy in the customer's own
 * environment (Mode B — Docker), let it observe AI prompt traffic, then
 * receive a SHA-256-signed PDF that risk-scores every event against
 * NIST 800-171. It is a receipt + onboarding kickoff, not an upsell.
 */
export const reportOrderEmail = {
  from: FROM,
  subject: 'Your CMMC AI Risk Assessment Report — order confirmed',
  html: (name: string) => {
    const greetingName = name && name.trim() ? name : 'there';
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <div style="background:#0f172a;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">HoundShield</h1>
      <p style="color:#ea580c;margin:6px 0 0;font-size:13px;">CMMC AI Risk Assessment Report</p>
    </div>

    <div style="padding:40px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Order confirmed — let's get your report started, ${greetingName}</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        Thank you. Your <strong>$499 CMMC AI Risk Assessment Report</strong> is paid in full.
        Over the next 14 days HoundShield will observe AI prompt traffic in <em>your own</em>
        environment and produce a SHA-256-signed PDF that risk-scores every event against
        NIST 800-171 Rev 2 — the evidence format a C3PAO assessor expects.
      </p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 24px;">
        <p style="color:#14532d;font-weight:600;margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Your 14-day engagement</p>
        <p style="color:#166534;font-size:14px;margin:0 0 6px;"><strong>1.</strong> Deploy the proxy in your environment (Mode B — Docker, ~15 min).</p>
        <p style="color:#166534;font-size:14px;margin:0 0 6px;"><strong>2.</strong> Point your AI tools at the proxy URL. It scans locally; nothing leaves your network.</p>
        <p style="color:#166534;font-size:14px;margin:0;"><strong>3.</strong> Day 14: receive your signed PDF risk report mapped to NIST 800-171.</p>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
        <p style="color:#991b1b;font-size:13px;line-height:1.6;margin:0;">
          <strong>CUI handling:</strong> Run the proxy in your own infrastructure (Mode B / Docker)
          for any environment that touches CUI. The hosted trial endpoint is for non-CUI evaluation
          only — it is not FedRAMP-authorized.
        </p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/docs/quickstart"
          style="background:#ea580c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Deploy the proxy (15 min) →
        </a>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;">
        Want us to walk you through deployment, or have a tight assessment deadline? Just reply to
        this email — a human reads every one. 30-day money-back guarantee applies.
      </p>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        HoundShield &mdash; local-only AI prompt-compliance firewall<br />
        <a href="${APP_URL}/security" style="color:#94a3b8;">Security &amp; deployment modes</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  },
};
