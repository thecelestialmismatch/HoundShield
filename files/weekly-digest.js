import { Resend } from "resend";
import { supabaseAdmin } from "../../../lib/supabase";
import { buildDigestHtml } from "../../../lib/buildDigestHtml";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only callable by Vercel Cron (add Authorization check)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") return res.status(405).end();

  const now = new Date();
  const dayOfWeek = now.getUTCDay();   // 0=Sun, 1=Mon ... 6=Sat
  const hourUtc   = now.getUTCHours();

  // Fetch all orgs whose digest should fire now
  const { data: settings, error } = await supabaseAdmin
    .from("digest_settings")
    .select(`
      org_id,
      recipient_emails,
      send_day,
      send_hour_utc,
      organizations ( name, slug, plan )
    `)
    .eq("enabled", true)
    .eq("send_day", dayOfWeek)
    .eq("send_hour_utc", hourUtc);

  if (error) {
    console.error("Digest settings fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch digest settings" });
  }

  const results = [];

  for (const setting of settings || []) {
    const orgId   = setting.org_id;
    const orgName = setting.organizations?.name || "Your Team";
    const since   = new Date(Date.now() - 7 * 86400000).toISOString();

    // Fetch stats for this org (using admin client to bypass RLS)
    const { data: events } = await supabaseAdmin
      .from("leak_events")
      .select(`
        severity, category_label, ai_tool_name,
        was_blocked, was_dismissed, created_at,
        member:organization_members(display_name, email)
      `)
      .eq("org_id", orgId)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    const evts = events || [];

    const stats = {
      total:    evts.length,
      critical: evts.filter(e => e.severity === "critical").length,
      high:     evts.filter(e => e.severity === "high").length,
      medium:   evts.filter(e => e.severity === "medium").length,
      low:      evts.filter(e => e.severity === "low").length,
      blocked:  evts.filter(e => e.was_blocked).length,
      dismissed:evts.filter(e => e.was_dismissed).length,
    };

    // Top members by event count
    const memberCounts = {};
    evts.forEach(e => {
      const name = e.member?.display_name || e.member?.email || "Unknown";
      memberCounts[name] = (memberCounts[name] || 0) + 1;
    });
    const topMembers = Object.entries(memberCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const recentCritical = evts
      .filter(e => e.severity === "critical" || e.severity === "high")
      .slice(0, 5);

    const html = buildDigestHtml({
      orgName,
      stats,
      topMembers,
      recentCritical,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      periodLabel: `${new Date(since).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    });

    const recipients = setting.recipient_emails || [];
    if (recipients.length === 0) continue;

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from:    "LeakWall <digest@leakwall.com>",
      to:      recipients,
      subject: `LeakWall weekly report — ${stats.total} leak attempts${stats.critical > 0 ? ` (${stats.critical} critical)` : ""}`,
      html,
    });

    if (!emailError) {
      // Log the digest
      await supabaseAdmin.from("digest_log").insert({
        org_id:         orgId,
        period_start:   since,
        period_end:     now.toISOString(),
        total_events:   stats.total,
        critical_events: stats.critical,
        high_events:    stats.high,
        active_members: topMembers.length,
        resend_message_id: emailResult?.id,
      });
      // Update last_sent_at
      await supabaseAdmin.from("digest_settings")
        .update({ last_sent_at: now.toISOString() })
        .eq("org_id", orgId);
    }

    results.push({ orgId, sent: !emailError, error: emailError?.message });
  }

  return res.status(200).json({ processed: results.length, results });
}
