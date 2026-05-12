import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser client (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only admin client (bypasses RLS — never expose to browser)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ── Typed queries ──────────────────────────────────────────

/** Fetch org + member list for an admin user */
export async function getOrgWithMembers(orgId) {
  const { data, error } = await supabase
    .from("organizations")
    .select(`
      *,
      members:organization_members (
        id, email, display_name, role, status,
        joined_at, last_active_at
      )
    `)
    .eq("id", orgId)
    .single();
  if (error) throw error;
  return data;
}

/** Fetch dashboard stats for the last N days */
export async function getDashboardStats(orgId, days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data, error } = await supabase
    .from("leak_events")
    .select(`
      id, severity, category, category_label,
      ai_tool_name, was_blocked, was_warned, was_dismissed,
      created_at, member_id,
      member:organization_members(display_name, email)
    `)
    .eq("org_id", orgId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const events = data || [];
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  events.forEach(e => counts[e.severity]++);

  const memberMap = {};
  events.forEach(e => {
    const key = e.member_id;
    if (!memberMap[key]) {
      memberMap[key] = {
        id: key,
        name: e.member?.display_name || e.member?.email || "Unknown",
        events: 0, critical: 0, high: 0, medium: 0, low: 0,
        blocked: 0, dismissed: 0, tools: new Set()
      };
    }
    memberMap[key].events++;
    memberMap[key][e.severity]++;
    if (e.was_blocked) memberMap[key].blocked++;
    if (e.was_dismissed) memberMap[key].dismissed++;
    memberMap[key].tools.add(e.ai_tool_name);
  });

  const members = Object.values(memberMap).map(m => ({
    ...m,
    tools: [...m.tools]
  }));

  const toolMap = {};
  events.forEach(e => {
    toolMap[e.ai_tool_name] = (toolMap[e.ai_tool_name] || 0) + 1;
  });

  // Daily buckets for sparkline chart
  const dailyBuckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    dailyBuckets[key] = { date: key, critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  }
  events.forEach(e => {
    const key = e.created_at.slice(0, 10);
    if (dailyBuckets[key]) {
      dailyBuckets[key][e.severity]++;
      dailyBuckets[key].total++;
    }
  });

  return {
    totals: counts,
    total: events.length,
    blocked: events.filter(e => e.was_blocked).length,
    dismissed: events.filter(e => e.was_dismissed).length,
    members,
    toolBreakdown: Object.entries(toolMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    daily: Object.values(dailyBuckets),
    recentEvents: events.slice(0, 50)
  };
}

/** Fetch policy rules for an org */
export async function getPolicyRules(orgId) {
  const { data, error } = await supabase
    .from("policy_rules")
    .select("*")
    .eq("org_id", orgId)
    .order("category");
  if (error) throw error;
  return data;
}

/** Update a single policy rule */
export async function updatePolicyRule(ruleId, action, enabled) {
  const { error } = await supabase
    .from("policy_rules")
    .update({ action, enabled, updated_at: new Date().toISOString() })
    .eq("id", ruleId);
  if (error) throw error;
}
