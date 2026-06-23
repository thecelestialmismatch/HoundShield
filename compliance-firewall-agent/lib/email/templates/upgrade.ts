const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://houndshield.com';
const FROM = 'HoundShield <noreply@houndshield.com>';

// Display name + headline benefit per paid tier — keeps the receipt on-message.
const TIER_COPY: Record<string, { name: string; unlocks: string }> = {
  pro: { name: 'Pro', unlocks: '90-day audit retention, unlimited PDF reports, and the full 110-control coverage map' },
  growth: { name: 'Growth', unlocks: 'multi-seat access, priority detection tuning, and unlimited evidence exports' },
  enterprise: { name: 'Enterprise', unlocks: 'unlimited retention, SSO, and a dedicated compliance success contact' },
  agency: { name: 'Agency', unlocks: 'white-label dashboards and multi-tenant client management for your C3PAO practice' },
};

/**
 * Transactional payment confirmation — fires from the Stripe webhook on
 * checkout.session.completed. Confirms the charge and reinforces the value
 * the customer just unlocked (no upsell; this is a receipt, not a pitch).
 */
export const upgradeEmail = {
  from: FROM,
  subject: (tier: string) => `You're on HoundShield ${(TIER_COPY[tier]?.name ?? 'Pro')} — receipt inside`,
  html: (orgName: string, tier: string) => {
    const copy = TIER_COPY[tier] ?? TIER_COPY.pro;
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <div style="background:#0f172a;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">HoundShield</h1>
      <p style="color:#ea580c;margin:6px 0 0;font-size:13px;">AI Compliance Firewall for Defense Contractors</p>
    </div>

    <div style="padding:40px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Payment confirmed — welcome to ${copy.name}, ${orgName}</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        Your subscription is active. Your plan now unlocks ${copy.unlocks}.
      </p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 24px;">
        <p style="color:#14532d;font-weight:600;margin:0 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Plan</p>
        <p style="color:#166534;font-size:16px;margin:0;font-weight:700;">HoundShield ${copy.name}</p>
        <p style="color:#3f6212;font-size:13px;margin:6px 0 0;">A full invoice is available any time in your billing portal.</p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/command-center/shield/reports"
          style="background:#ea580c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Generate your C3PAO report →
        </a>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;">
        Manage your subscription or download invoices any time from
        <a href="${APP_URL}/command-center/settings" style="color:#ea580c;">billing settings</a>.
        Questions about your plan? Just reply to this email.
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
</html>`;
  },
};
