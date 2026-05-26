const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://houndshield.com';
const FROM = 'Hound Shield <noreply@houndshield.com>';

export const day3Email = {
  from: FROM,
  subject: 'Did you route your first AI query through Hound Shield?',
  html: (orgName: string) => `
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
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Quick check-in, ${orgName}</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        It&apos;s been 3 days since you signed up. One question:
        <strong>have you routed a single AI query through Hound Shield yet?</strong>
      </p>

      <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
        If not, it takes 60 seconds — you just change one URL in your AI client:
      </p>

      <div style="background:#fff7ed;border-left:4px solid #ea580c;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;font-family:monospace;font-size:13px;color:#1e293b;">
        https://gateway.houndshield.com/v1
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/command-center/shield/quickstart"
          style="background:#ea580c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Open quickstart guide →
        </a>
      </div>

      <div style="background:#fef9ec;border-radius:10px;padding:20px;margin:24px 0;border:1px solid #fde68a;">
        <p style="color:#92400e;font-weight:600;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">
          Why this matters
        </p>
        <p style="color:#78350f;font-size:14px;margin:0;line-height:1.6;">
          Every unmonitored AI query is a potential CUI leak. C3PAO assessors will ask
          for proof that AI tools were governed during the assessment period.
          The clock is running.
        </p>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;">
        CMMC Level 2 enforcement: November 2026. 80,000+ contractors need to certify.
        The ones auditing AI usage now will pass on the first try.
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
</html>`,
};
