/**
 * Builds the HTML string for the LeakWall weekly digest email.
 * Called server-side — no JSX, pure string template.
 *
 * @param {Object} opts
 * @param {string}  opts.orgName
 * @param {Object}  opts.stats         { total, critical, high, medium, low, blocked, dismissed }
 * @param {Array}   opts.topMembers    [{ name, count }]
 * @param {Array}   opts.recentCritical [{ category_label, ai_tool_name, member }]
 * @param {string}  opts.dashboardUrl
 * @param {string}  opts.periodLabel   e.g. "Apr 28 – May 5, 2026"
 */
export function buildDigestHtml({
  orgName,
  stats,
  topMembers,
  recentCritical,
  dashboardUrl,
  periodLabel,
}) {
  const riskColor = stats.critical > 0 ? "#C41E3A" : stats.high > 0 ? "#C2511A" : "#2D6A4F";
  const riskLabel = stats.critical > 0 ? "Critical activity detected" :
                    stats.high > 0     ? "High-risk activity detected" :
                    stats.total > 0    ? "Activity within normal range" :
                                         "Clean week — no leak attempts";

  const severityBadge = (sev) => {
    const map = {
      critical: ["#FFF0F2", "#C41E3A", "CRITICAL"],
      high:     ["#FFF4ED", "#C2511A", "HIGH"],
      medium:   ["#FFFBEB", "#92650A", "MEDIUM"],
      low:      ["#F0FFF4", "#2D6A4F", "LOW"],
    };
    const [bg, color, label] = map[sev] || map.low;
    return `<span style="background:${bg};color:${color};border-radius:3px;padding:2px 7px;font-size:11px;font-weight:700;letter-spacing:0.06em;font-family:monospace">${label}</span>`;
  };

  const topMembersRows = topMembers.length > 0
    ? topMembers.map((m, i) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F0EEE8;font-size:14px;color:#1A1A18">${i + 1}. ${m.name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #F0EEE8;text-align:right;font-size:14px;font-weight:600;color:#1A1A18">${m.count}</td>
        </tr>`).join("")
    : `<tr><td colspan="2" style="padding:16px 0;color:#9B9B96;font-size:14px">No activity this week.</td></tr>`;

  const recentRows = recentCritical.length > 0
    ? recentCritical.map(e => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F0EEE8;font-size:13px;color:#1A1A18">${e.category_label}</td>
          <td style="padding:10px 0;border-bottom:1px solid #F0EEE8;font-size:13px;color:#6B6B65">${e.ai_tool_name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #F0EEE8;font-size:13px;color:#6B6B65">${e.member?.display_name || "—"}</td>
        </tr>`).join("")
    : `<tr><td colspan="3" style="padding:16px 0;color:#9B9B96;font-size:13px">No high-severity events this week.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>LeakWall Weekly Report</title>
</head>
<body style="margin:0;padding:0;background:#F7F6F3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F3;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- HEADER -->
        <tr>
          <td style="background:#1A1A18;border-radius:12px 12px 0 0;padding:28px 36px;text-align:left">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:20px;font-weight:900;color:#FFFFFF;letter-spacing:-0.03em">Leak<span style="color:#C41E3A">Wall</span></span>
                </td>
                <td align="right">
                  <span style="font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:0.04em;text-transform:uppercase">Weekly Report</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ORG + PERIOD -->
        <tr>
          <td style="background:#1A1A18;padding:0 36px 28px">
            <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#FFFFFF">${orgName}</p>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45)">${periodLabel}</p>
          </td>
        </tr>

        <!-- RISK BANNER -->
        <tr>
          <td style="background:${riskColor};padding:14px 36px">
            <p style="margin:0;font-size:13px;font-weight:600;color:#FFFFFF;letter-spacing:0.02em">⚡ ${riskLabel}</p>
          </td>
        </tr>

        <!-- STAT GRID -->
        <tr>
          <td style="background:#FFFFFF;padding:32px 36px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="25%" style="text-align:center;padding:0 8px 0 0">
                  <div style="background:#F7F6F3;border-radius:8px;padding:16px 8px">
                    <div style="font-size:32px;font-weight:700;color:#1A1A18;line-height:1">${stats.total}</div>
                    <div style="font-size:11px;color:#6B6B65;margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">Total</div>
                  </div>
                </td>
                <td width="25%" style="text-align:center;padding:0 4px">
                  <div style="background:#FFF0F2;border-radius:8px;padding:16px 8px">
                    <div style="font-size:32px;font-weight:700;color:#C41E3A;line-height:1">${stats.critical}</div>
                    <div style="font-size:11px;color:#C41E3A;margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">Critical</div>
                  </div>
                </td>
                <td width="25%" style="text-align:center;padding:0 4px">
                  <div style="background:#FFF4ED;border-radius:8px;padding:16px 8px">
                    <div style="font-size:32px;font-weight:700;color:#C2511A;line-height:1">${stats.high}</div>
                    <div style="font-size:11px;color:#C2511A;margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">High</div>
                  </div>
                </td>
                <td width="25%" style="text-align:center;padding:0 0 0 8px">
                  <div style="background:#F0FFF4;border-radius:8px;padding:16px 8px">
                    <div style="font-size:32px;font-weight:700;color:#2D6A4F;line-height:1">${stats.blocked}</div>
                    <div style="font-size:11px;color:#2D6A4F;margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">Blocked</div>
                  </div>
                </td>
              </tr>
            </table>

            ${stats.dismissed > 0 ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
              <tr>
                <td style="background:#FFFBEB;border-radius:8px;padding:12px 16px">
                  <p style="margin:0;font-size:13px;color:#92650A">
                    ⚠ <strong>${stats.dismissed} warning${stats.dismissed !== 1 ? "s" : ""} dismissed</strong> — employees saw a warning and pasted anyway.
                    Consider switching these categories to <strong>Block</strong> in your policy settings.
                  </p>
                </td>
              </tr>
            </table>` : ""}
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr><td style="background:#FFFFFF;padding:0 36px"><div style="height:1px;background:#F0EEE8"></div></td></tr>

        <!-- TOP MEMBERS -->
        <tr>
          <td style="background:#FFFFFF;padding:24px 36px">
            <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B65">Most Active Members</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <th style="text-align:left;font-size:12px;color:#9B9B96;font-weight:500;padding-bottom:8px">Member</th>
                <th style="text-align:right;font-size:12px;color:#9B9B96;font-weight:500;padding-bottom:8px">Events</th>
              </tr>
              ${topMembersRows}
            </table>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr><td style="background:#FFFFFF;padding:0 36px"><div style="height:1px;background:#F0EEE8"></div></td></tr>

        <!-- RECENT HIGH/CRITICAL -->
        <tr>
          <td style="background:#FFFFFF;padding:24px 36px">
            <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B65">Recent High-Priority Events</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <th style="text-align:left;font-size:12px;color:#9B9B96;font-weight:500;padding-bottom:8px">Data Type</th>
                <th style="text-align:left;font-size:12px;color:#9B9B96;font-weight:500;padding-bottom:8px">AI Tool</th>
                <th style="text-align:left;font-size:12px;color:#9B9B96;font-weight:500;padding-bottom:8px">Member</th>
              </tr>
              ${recentRows}
            </table>
            <p style="margin:16px 0 0;font-size:12px;color:#9B9B96">
              Individual content is never stored — LeakWall logs metadata only.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#FFFFFF;padding:8px 36px 36px;text-align:center">
            <a href="${dashboardUrl}"
               style="display:inline-block;background:#1A1A18;color:#FFFFFF;text-decoration:none;border-radius:8px;padding:14px 32px;font-size:14px;font-weight:600;letter-spacing:0.01em">
              View full dashboard →
            </a>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#F0EEE8;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center">
            <p style="margin:0 0 6px;font-size:12px;color:#9B9B96">
              You're receiving this because you're an admin at <strong>${orgName}</strong>.
            </p>
            <p style="margin:0;font-size:12px;color:#9B9B96">
              <a href="${dashboardUrl}/settings/digest" style="color:#6B6B65">Manage digest settings</a> &middot;
              <a href="${dashboardUrl}/settings/digest?unsubscribe=1" style="color:#6B6B65">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
