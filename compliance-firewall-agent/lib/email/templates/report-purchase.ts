const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://houndshield.com';
const FROM = 'HoundShield <noreply@houndshield.com>';

/**
 * Transactional confirmation for the Stage-1 lead product: the one-time
 * $499 CMMC AI Risk Assessment Report. Fires from the Stripe webhook on a
 * `checkout.session.completed` event in `payment` mode (product=report).
 * Sets clear next-step expectations so the buyer knows how the report is
 * delivered — this is the purchase that proves the PDF sells.
 */
export const reportPurchaseEmail = {
  from: FROM,
  subject: 'Your CMMC AI Risk Assessment Report — order confirmed',
  html: (orgName: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <div style="background:#0f172a;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">HoundShield</h1>
      <p style="color:#ea580c;margin:6px 0 0;font-size:13px;">AI Compliance Firewall</p>
    </div>

    <div style="padding:40px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Order confirmed — thank you, ${orgName}</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        Your <strong>$499 CMMC AI Risk Assessment Report</strong> is paid and in motion. This is the
        evidence artifact you can hand to an assessor: a local scan of your AI usage, findings mapped to
        NIST 800-171 controls, delivered as a tamper-evident PDF.
      </p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 24px;">
        <p style="color:#14532d;font-weight:600;margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">What happens next</p>
        <p style="color:#166534;font-size:14px;margin:0 0 8px;line-height:1.6;">1. We'll email you the short intake (which AI tools, how many seats, deployment mode).</p>
        <p style="color:#166534;font-size:14px;margin:0 0 8px;line-height:1.6;">2. You run the local scan via the Docker proxy (Mode B — data never leaves your network).</p>
        <p style="color:#166534;font-size:14px;margin:0;line-height:1.6;">3. You receive your finished PDF report, ready for your assessor.</p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/command-center/shield/reports"
          style="background:#ea580c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Open your report workspace →
        </a>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;">
        Questions, or need it fast for a deadline? Just reply to this email — a real person answers.
      </p>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        HoundShield &mdash; AI Compliance Firewall<br />
        <a href="${APP_URL}/command-center/settings" style="color:#94a3b8;">Manage notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`,
};
