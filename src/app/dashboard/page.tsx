"use client";

// Supabase browser client requires env vars at runtime — skip static prerender
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, TrendingUp, Activity, Shield, LogOut, AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import type { OrgRow, BudgetRow, DailySpendRow } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DailyPoint { day: string; cost: number }
interface ProjectPoint { project: string; cost: number }
interface StatCard { label: string; value: string; sub?: string; icon: React.ElementType; warn?: boolean }

// ── Helpers ───────────────────────────────────────────────────────────────────
function usd(n: number) {
  return n < 0.01 ? `$${n.toFixed(6)}` : `$${n.toFixed(2)}`;
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCardView({ card }: { card: StatCard }) {
  return (
    <div className={`rounded-xl border p-5 ${card.warn ? "border-amber-500/40 bg-amber-950/20" : "border-white/10 bg-white/5"}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{card.label}</p>
        <card.icon className={`h-4 w-4 ${card.warn ? "text-amber-400" : "text-slate-500"}`} />
      </div>
      <p className={`mt-2 text-2xl font-bold ${card.warn ? "text-amber-400" : "text-slate-100"}`}>
        {card.value}
      </p>
      {card.sub && <p className="mt-1 text-xs text-slate-500">{card.sub}</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
      <Activity className="h-10 w-10 text-slate-600 mb-4" />
      <h3 className="text-slate-300 font-medium">No usage data yet</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-xs">
        Point your AI SDK to <code className="text-blue-400">aibudgetguard.com/v1</code> and
        add <code className="text-blue-400">x-org-id</code> header. Costs appear here in real time.
      </p>
      <div className="mt-6 rounded-lg bg-slate-900 p-4 text-left text-xs font-mono text-slate-300">
        <p className="text-slate-500"># OpenAI SDK — one line change</p>
        <p>baseURL: <span className="text-green-400">&quot;https://aibudgetguard.com/v1&quot;</span></p>
        <p>defaultHeaders: {"{"}</p>
        <p>{"  "}&quot;x-org-id&quot;: <span className="text-green-400">&quot;{"{your-org-id}"}&quot;</span></p>
        <p>{"}"}</p>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [org, setOrg] = useState<OrgRow | null>(null);
  const [budget, setBudget] = useState<BudgetRow | null>(null);
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);
  const [projectData, setProjectData] = useState<ProjectPoint[]>([]);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [requestsToday, setRequestsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  useEffect(() => {
    async function load() {
      // Auth check
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) { router.push("/login"); return; }

      // Org
      const { data: orgData, error: orgErr } = await supabase
        .from("orgs")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (orgErr) { setError(orgErr.message); setLoading(false); return; }

      // New user — create org
      if (!orgData) {
        const slug = user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "-") ?? "my-org";
        const { data: newOrg, error: createErr } = await supabase
          .from("orgs")
          .insert({ owner_id: user.id, name: slug, slug: `${slug}-${Date.now()}` })
          .select()
          .single();
        if (createErr) { setError(createErr.message); setLoading(false); return; }
        setOrg(newOrg);
        setLoading(false);
        return;
      }

      setOrg(orgData);

      // Budget
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("*")
        .eq("org_id", orgData.id)
        .eq("scope_type", "org")
        .eq("scope_id", "*")
        .eq("period", "monthly")
        .maybeSingle();
      setBudget(budgetData ?? null);

      // Daily spend — last 30 days
      const { data: daily } = await supabase
        .from("daily_spend")
        .select("day,cost_usd")
        .eq("org_id", orgData.id)
        .gte("day", thirtyDaysAgo())
        .order("day");

      if (daily) {
        // Collapse by day (view groups by project too, so sum per day)
        const byDay = new Map<string, number>();
        for (const r of daily as DailySpendRow[]) {
          byDay.set(r.day, (byDay.get(r.day) ?? 0) + Number(r.cost_usd));
        }
        setDailyData(
          Array.from(byDay.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([day, cost]) => ({ day: day.slice(5), cost: Number(cost.toFixed(6)) }))
        );
      }

      // Monthly totals per project
      const { data: monthly } = await supabase
        .from("daily_spend")
        .select("project_id,cost_usd")
        .eq("org_id", orgData.id)
        .gte("day", monthStart().split("T")[0]);

      if (monthly) {
        const byProject = new Map<string, number>();
        for (const r of monthly as DailySpendRow[]) {
          byProject.set(r.project_id, (byProject.get(r.project_id) ?? 0) + Number(r.cost_usd));
        }
        const sorted = Array.from(byProject.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([project, cost]) => ({ project, cost: Number(cost.toFixed(6)) }));
        setProjectData(sorted);
        setTotalThisMonth(sorted.reduce((s, p) => s + p.cost, 0));
      }

      // Requests today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgData.id)
        .gte("recorded_at", todayStart.toISOString());
      setRequestsToday(count ?? 0);

      setLoading(false);
    }

    load().catch((err) => {
      setError(String(err));
      setLoading(false);
    });
  }, [supabase, router]);

  // Export CSV
  function exportCsv() {
    const rows = [
      ["Day", "Cost (USD)"],
      ...dailyData.map((d) => [d.day, d.cost.toString()]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aibudgetguard-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#07070b" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#07070b" }}>
        <div className="text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400 mb-4" />
          <p className="text-slate-300">Something went wrong</p>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const budgetPct = budget && totalThisMonth
    ? Math.min((totalThisMonth / Number(budget.limit_usd)) * 100, 100)
    : null;

  const stats: StatCard[] = [
    {
      label: "Spend this month",
      value: usd(totalThisMonth),
      sub: budget ? `of $${Number(budget.limit_usd).toFixed(2)} budget` : "No budget set",
      icon: DollarSign,
      warn: budgetPct !== null && budgetPct >= 80,
    },
    {
      label: "Budget used",
      value: budgetPct !== null ? `${budgetPct.toFixed(1)}%` : "—",
      sub: budget ? `Hard block at ${budget.hard_block_pct}%` : "Set a budget in Settings",
      icon: TrendingUp,
      warn: budgetPct !== null && budgetPct >= 80,
    },
    {
      label: "Requests today",
      value: requestsToday.toLocaleString(),
      icon: Activity,
    },
    {
      label: "Plan",
      value: org?.plan ? org.plan.charAt(0).toUpperCase() + org.plan.slice(1) : "—",
      sub: "aibudgetguard.com/dashboard/billing",
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen text-slate-100" style={{ background: "#07070b" }}>
      {/* Topbar */}
      <header className="flex h-14 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Shield className="h-4 w-4 text-blue-500" />
          AIBudgetGuard
          {org && (
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
              {org.name}
            </span>
          )}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => <StatCardView key={s.label} card={s} />)}
        </div>

        {/* Budget progress bar */}
        {budgetPct !== null && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Budget utilization</span>
              <span>{budgetPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetPct >= 100 ? "bg-red-500" :
                  budgetPct >= 80  ? "bg-amber-400" :
                  "bg-blue-500"
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        )}

        {dailyData.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Daily spend chart */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-slate-200">Daily spend — last 30 days</h2>
                <button
                  onClick={exportCsv}
                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1 rounded-md transition-colors"
                >
                  Export CSV
                </button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#60a5fa" }}
                    formatter={(v) => [`$${Number(v ?? 0).toFixed(6)}`, "Cost"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </section>

            {/* Spend by project */}
            {projectData.length > 0 && (
              <section className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-semibold text-slate-200 mb-6">Spend by project — this month</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={projectData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="project" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                      labelStyle={{ color: "#94a3b8" }}
                      itemStyle={{ color: "#818cf8" }}
                      formatter={(v) => [`$${Number(v ?? 0).toFixed(6)}`, "Cost"]}
                    />
                    <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            )}
          </>
        )}

        {/* Org ID helper */}
        {org && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Your org ID — add to every AI request</h2>
            <code className="block rounded-lg bg-slate-950 px-4 py-3 font-mono text-sm text-blue-300 select-all">
              x-org-id: {org.id}
            </code>
            <p className="mt-2 text-xs text-slate-500">
              Copy this into your SDK&apos;s <code>defaultHeaders</code>. Every request tagged with this header will appear in your dashboard.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
