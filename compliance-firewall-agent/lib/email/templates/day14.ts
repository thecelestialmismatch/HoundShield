const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://houndshield.com';
const FROM = 'HoundShield <noreply@houndshield.com>';

/**
 * Day 14 onboarding finale.
 *
 * Per the prime objective, the C3PAO-ready PDF evidence report is the purchase
 * unlock — not the dashboard. By day 14 the user has data; this email pushes
 * them to generate the report a C3PAO assessor accepts, which is the moment
 * value becomes undeniable and the upgrade conversation starts.
 */
export const day14Email = {
  from: FROM,
  subject: 'Generate the evidence report your C3PAO will ask for',
  html: (orgName: string) => `
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
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Two weeks in, ${orgName} — time for the artifact</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        HoundShield has been governing your AI traffic for two weeks. That history is now
        <strong>evidence</strong> — and evidence is exactly what a C3PAO assessor asks for.
      </p>

      <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
        Generate your assessment report in one click: a tamper-evident, SHA-256-chained PDF
        showing every CUI detection, the NIST 800-171 controls it maps to, and your SPRS impact.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/command-center/shield/reports"
          style="background:#ea580c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Generate your C3PAO report →
        </a>
      </div>

      <div style="background:#fff7ed;border-left:4px solid #ea580c;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
        <p style="color:#9a3412;font-weight:600;margin:0 0 6px;font-size:13px;">What's in the report</p>
        <p style="color:#78350f;font-size:14px;margin:0;line-height:1.6;">
          Executive summary · per-control coverage map · audit-trail hash chain ·
          SPRS score delta · detection log with timestamps. Five pages your assessor can drop
          straight into your evidence package.
        </p>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;">
        Cloud AI-DLP tools can't produce this without shipping your CUI to their servers first.
        HoundShield builds it locally — the data never leaves your network. That's the difference
        between evidence and another spill.
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
