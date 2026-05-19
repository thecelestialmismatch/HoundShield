const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://houndshield.com';
const FROM = 'Hound Shield <noreply@houndshield.com>';

export const day7Email = {
  from: FROM,
  subject: 'Your CMMC compliance snapshot — week 1 with Hound Shield',
  html: (orgName: string, tier: string) => {
    const isFreeTier = tier === 'free';
    const upgradeBlock = isFreeTier ? `
      <div style="background:#f0fdf4;border-radius:10px;padding:20px;margin:24px 0;border:1px solid #bbf7d0;">
        <p style="color:#14532d;font-weight:600;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">
          Unlock full compliance coverage
        </p>
        <p style="color:#166534;font-size:14px;margin:0 0 16px;line-height:1.6;">
          Free tier monitors 3 CUI patterns. Pro monitors all 16 — including export-controlled
          technical data, classified contract numbers, and ITAR-restricted specs.
        </p>
        <div style="text-align:center;">
          <a href="${APP_URL}/pricing"
            style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
            Upgrade to Pro — $199/mo →
          </a>
        </div>
      </div>` : '';

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <div style="background:#0f172a;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Hound Shield</h1>
      <p style="color:#ea580c;margin:6px 0 0;font-size:13px;">AI Compliance Firewall for Defense Contractors</p>
    </div>

    <div style="padding:40px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">One week in, ${orgName}</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        You&apos;ve had Hound Shield running for 7 days. Here&apos;s what that means for your CMMC readiness:
      </p>

      <div style="background:#f8fafc;border-radius:10px;padding:20px;margin:0 0 24px;border:1px solid #e2e8f0;">
        <p style="color:#0f172a;font-weight:600;margin:0 0 12px;font-size:14px;">Your compliance posture</p>
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
          <span style="color:#ea580c;font-size:18px;line-height:1;">✓</span>
          <span style="color:#334155;font-size:14px;">AI prompt interception: <strong>active</strong></span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
          <span style="color:#ea580c;font-size:18px;line-height:1;">✓</span>
          <span style="color:#334155;font-size:14px;">CUI detection layer: <strong>monitoring</strong></span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#ea580c;font-size:18px;line-height:1;">✓</span>
          <span style="color:#334155;font-size:14px;">CMMC control AC.3.012: <strong>evidence accumulating</strong></span>
        </div>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/command-center/shield/assessment"
          style="background:#ea580c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          View your compliance dashboard →
        </a>
      </div>

      ${upgradeBlock}

      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:24px 0 0;">
        Questions? Reply to this email — our compliance team responds within 24 hours.
      </p>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        Hound Shield &mdash; AI Compliance Firewall<br />
        <a href="${APP_URL}/command-center/settings" style="color:#94a3b8;">Manage notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  },
};
