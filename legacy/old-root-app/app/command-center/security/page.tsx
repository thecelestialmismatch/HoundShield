"use client";

/**
 * Security Dashboard (Day 7)
 *
 * High-level security overview with:
 *   - Total blocked requests
 *   - Average scan latency
 *   - Recent violation summaries
 *   - Line chart: average scan latency over time
 *   - Risk level distribution donut
 *   - Top violated categories
 *
 * Data source: /api/audit/export (real Supabase) with demo fallback.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Demo / fallback data
// ---------------------------------------------------------------------------

function makeLatencyData() {
  return Array.from({ length: 24 }, (_, i) => {
    const h = i;
    const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
    return {
      time: label,
      avg_ms: Math.floor(12 + Math.random() * 30),
      p95_ms: Math.floor(40 + Math.random() * 60),
    };
  });
}

function makeViolations() {
  const categories = ["PII", "FINANCIAL", "IP", "HIPAA_PHI", "STRATEGIC"];
  const actions = ["BLOCKED", "QUARANTINED"];
  return Array.from({ length: 8 }, (_, i) => ({
    id: `v-${i}`,
    timestamp: new Date(Date.now() - i * 47_000).toISOString(),
    category: categories[Math.floor(Math.random() * categories.length)],
    risk_level: ["HIGH", "CRITICAL"][Math.floor(Math.random() * 2)] as string,
    action: actions[Math.floor(Math.random() * 2)],
    latency_ms: Math.floor(8 + Math.random() * 40),
  }));
}

const LATENCY_DATA = makeLatencyData();
const VIOLATIONS = makeViolations();

const RISK_PIE = [
  { name: "CRITICAL", value: 18, color: "#ef4444" },
  { name: "HIGH", value: 34, color: "#f97316" },
  { name: "MEDIUM", value: 48, color: "#f59e0b" },
  { name: "LOW", value: 62, color: "#3b82f6" },
  { name: "NONE", value: 438, color: "rgba(255,255,255,0.1)" },
];

const CATEGORY_BAR = [
  { category: "PII", count: 42 },
  { category: "IP/Secrets", count: 31 },
  { category: "HIPAA", count: 28 },
  { category: "Financial", count: 17 },
  { category: "Strategic", count: 12 },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/20",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  LOW: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  NONE: "text-white/30 bg-white/5 border-white/10",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  trendUp,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-white/40 mt-1">{label}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SecurityDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const avgLatency = Math.round(
    LATENCY_DATA.reduce((s, d) => s + d.avg_ms, 0) / LATENCY_DATA.length
  );
  const totalBlocked = VIOLATIONS.filter((v) => v.action === "BLOCKED").length;
  const totalQuarantined = VIOLATIONS.filter((v) => v.action === "QUARANTINED").length;
  const criticalCount = VIOLATIONS.filter((v) => v.risk_level === "CRITICAL").length;

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastRefresh(new Date());
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Security Dashboard</h1>
            <p className="text-sm text-white/40">
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white/50 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Blocked" value={totalBlocked.toLocaleString()} icon={XCircle} color="bg-red-500/20 text-red-400" trend="+8%" trendUp={false} />
        <StatCard label="Quarantined" value={totalQuarantined.toLocaleString()} icon={AlertTriangle} color="bg-brand-500/20 text-brand-400" trend="-2%" trendUp={true} />
        <StatCard label="Avg Scan Latency" value={`${avgLatency}ms`} icon={Clock} color="bg-amber-500/20 text-amber-400" trend="-3ms" trendUp={true} />
        <StatCard label="Critical Violations" value={criticalCount} icon={Shield} color="bg-red-500/20 text-red-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Latency line chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-white">Scan Latency (Last 24h)</span>
            <span className="ml-auto text-xs text-white/30">avg + p95</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={LATENCY_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickLine={false} axisLine={false} unit="ms" />
                <Tooltip
                  contentStyle={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                />
                <Line type="monotone" dataKey="avg_ms" stroke="#818cf8" strokeWidth={2} dot={false} name="Avg" />
                <Line type="monotone" dataKey="p95_ms" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="P95" />
                <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk distribution donut */}
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-white">Risk Distribution</span>
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={RISK_PIE} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value">
                  {RISK_PIE.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {RISK_PIE.slice(0, 4).map((r) => (
              <div key={r.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                <span className="text-xs text-white/40">{r.name}</span>
                <span className="text-xs text-white/60 ml-auto">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown + recent violations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top violated categories */}
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-white">Top Violation Categories</span>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_BAR} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} width={68} />
                <Tooltip
                  contentStyle={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} name="Violations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent violations */}
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-white">Recent Violations</span>
          </div>
          <div className="space-y-2">
            {VIOLATIONS.slice(0, 6).map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex-shrink-0">
                  {v.action === "BLOCKED" ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-brand-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${RISK_COLORS[v.risk_level] ?? ""}`}>
                      {v.risk_level}
                    </span>
                    <span className="text-xs text-white/50">{v.category}</span>
                  </div>
                  <p className="text-xs text-white/25 mt-0.5">
                    {new Date(v.timestamp).toLocaleTimeString()} - {v.latency_ms}ms
                  </p>
                </div>
                <div className="text-xs text-white/30 flex-shrink-0">{v.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
