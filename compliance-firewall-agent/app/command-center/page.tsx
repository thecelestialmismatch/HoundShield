"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Activity,
  AlertTriangle,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Lock,
  Globe,
  BarChart3,
  Target,
  Scan,
  Brain,
  Bot,
  ShieldCheck,
  Crosshair,
  ClipboardCheck,
  RefreshCw,
  Calendar,
  Filter,
  Database,
  Cpu,
  Wifi,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
  LineChart,
  Line,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import SPRSGauge from "@/components/dashboard/SPRSGauge";
import { ALL_CONTROLS } from "@/lib/shieldready/controls";
import {
  calculateSPRS,
  getCompletionPercent,
  getRemediationPriorities,
} from "@/lib/shieldready/scoring";
import { getAssessmentResponses } from "@/lib/shieldready/storage";
// BarLineChartPlayer (Remotion) moved to legacy — using Recharts ComposedChart instead

/* ── Chart Colors ──────────────────────────────────────────────── */
const CHART_BLUE = "#2563EB";
const CHART_EMERALD = "#10B981";
const CHART_VIOLET = "#7C3AED";
const CHART_AMBER = "#F59E0B";
const CHART_RED = "#EF4444";
const CHART_CYAN = "#06B6D4";

/* ── Mock Data ─────────────────────────────────────────────────── */
const generateTokenData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day) => ({
    day,
    tokens: Math.floor(Math.random() * 120000) + 20000,
    requests: Math.floor(Math.random() * 800) + 200,
    blocked: Math.floor(Math.random() * 50) + 5,
  }));
};

const threatDistribution = [
  { name: "PII Detected", value: 42, color: CHART_RED },
  { name: "Financial Data", value: 18, color: CHART_AMBER },
  { name: "Code/IP", value: 25, color: CHART_VIOLET },
  { name: "Strategic Intel", value: 8, color: CHART_CYAN },
  { name: "Clean", value: 107, color: CHART_EMERALD },
];

const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  events: Math.floor(Math.random() * 150) + 20,
  blocked: Math.floor(Math.random() * 15),
}));

/* Compliance trend over 12 months */
const complianceTrend = [
  { month: "Apr", score: -170, controls: 8 },
  { month: "May", score: -155, controls: 16 },
  { month: "Jun", score: -140, controls: 24 },
  { month: "Jul", score: -120, controls: 35 },
  { month: "Aug", score: -100, controls: 44 },
  { month: "Sep", score: -80, controls: 55 },
  { month: "Oct", score: -60, controls: 64 },
  { month: "Nov", score: -45, controls: 72 },
  { month: "Dec", score: -30, controls: 80 },
  { month: "Jan", score: -18, controls: 88 },
  { month: "Feb", score: -10, controls: 95 },
  { month: "Mar", score: 0, controls: 102 },
];

/* Risk assessment radar */
const riskRadarData = [
  { category: "Access Control", current: 85, target: 100 },
  { category: "Awareness", current: 72, target: 100 },
  { category: "Audit", current: 90, target: 100 },
  { category: "Config Mgmt", current: 65, target: 100 },
  { category: "Identification", current: 78, target: 100 },
  { category: "Incident Resp.", current: 55, target: 100 },
  { category: "Maintenance", current: 82, target: 100 },
  { category: "Media Protect.", current: 68, target: 100 },
];

/* Provider breakdown */
const providerBreakdown = [
  { provider: "OpenAI", passed: 340, blocked: 22, warning: 18 },
  { provider: "Anthropic", passed: 280, blocked: 8, warning: 12 },
  { provider: "Google", passed: 190, blocked: 15, warning: 9 },
  { provider: "OpenRouter", passed: 120, blocked: 5, warning: 7 },
  { provider: "Local LLMs", passed: 85, blocked: 1, warning: 3 },
];

const recentEvents = [
  {
    id: "evt_3a7f2c",
    provider: "openai",
    model: "gpt-4o",
    tokens: 1247,
    time: "2s ago",
    status: "blocked",
    risk: "HIGH",
    detail: "PII detected in prompt — SSN pattern match",
  },
  {
    id: "evt_8b1d4e",
    provider: "anthropic",
    model: "claude-3.5",
    tokens: 892,
    time: "15s ago",
    status: "passed",
    risk: "LOW",
    detail: "Clean request — code generation task",
  },
  {
    id: "evt_c42f91",
    provider: "google",
    model: "gemini-pro",
    tokens: 3421,
    time: "32s ago",
    status: "warning",
    risk: "MEDIUM",
    detail: "Unusual token volume — potential data exfiltration",
  },
  {
    id: "evt_d93a12",
    provider: "openai",
    model: "gpt-4o",
    tokens: 567,
    time: "1m ago",
    status: "blocked",
    risk: "CRITICAL",
    detail: "Financial data — credit card pattern intercepted",
  },
  {
    id: "evt_e15b37",
    provider: "anthropic",
    model: "claude-3.5",
    tokens: 2103,
    time: "2m ago",
    status: "passed",
    risk: "LOW",
    detail: "Clean request — summarization task",
  },
  {
    id: "evt_f28c49",
    provider: "openrouter",
    model: "llama-3.3",
    tokens: 445,
    time: "3m ago",
    status: "warning",
    risk: "MEDIUM",
    detail: "API key pattern detected — redacted before forward",
  },
];

/* ── Tooltip ────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-white/10 rounded-xl px-3 py-2 text-xs shadow-lg">
      <div className="text-slate-400 mb-1 font-mono">{label}</div>
      {payload.map((item: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
          <span className="text-slate-500">{item.name}:</span>
          <span className="text-white font-bold font-mono">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Status badge colors ── */
const statusColor: Record<string, string> = {
  blocked: "bg-rose-500/10 text-rose-600 ring-rose-500/20",
  warning: "bg-amber-500/10 text-amber-600 ring-amber-200",
  passed: "bg-emerald-500/10 text-emerald-600 ring-emerald-200",
};

const riskColor: Record<string, string> = {
  CRITICAL: "text-rose-600",
  HIGH: "text-rose-500",
  MEDIUM: "text-amber-500",
  LOW: "text-emerald-500",
};

/* ── Revenue Chart (replaces Remotion BarLineChartPlayer) ──────── */
const REVENUE_DATA = [
  { month: "Jan", revenue: 0, conversion: 0 },
  { month: "Feb", revenue: 800, conversion: 1.2 },
  { month: "Mar", revenue: 2400, conversion: 2.8 },
  { month: "Apr", revenue: 4100, conversion: 3.5 },
  { month: "May", revenue: 6800, conversion: 4.9 },
  { month: "Jun", revenue: 9200, conversion: 6.1 },
];

function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={REVENUE_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip contentStyle={{ background: "#0e0e18", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="revenue" fill={CHART_BLUE} fillOpacity={0.7} radius={[3, 3, 0, 0]} name="Revenue ($)" />
        <Line yAxisId="right" type="monotone" dataKey="conversion" stroke={CHART_EMERALD} strokeWidth={2} dot={false} name="Conversion (%)" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMMAND CENTER OVERVIEW
   ══════════════════════════════════════════════════════════════════ */
export default function CommandCenterOverview() {
  const [responses, setResponses] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [tokenData] = useState(generateTokenData);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "blocked" | "warning" | "passed"
  >("all");

  useEffect(() => {
    setMounted(true);
    setResponses(getAssessmentResponses());
  }, []);

  const sprs = useMemo(
    () => calculateSPRS(ALL_CONTROLS, responses),
    [responses]
  );
  const completion = useMemo(
    () => getCompletionPercent(ALL_CONTROLS.length, responses),
    [responses]
  );
  const priorities = useMemo(
    () => getRemediationPriorities(ALL_CONTROLS, responses),
    [responses]
  );

  const responseMap = useMemo(
    () => new Map(responses.map((r: any) => [r.controlId, r])),
    [responses]
  );
  const statusCounts = useMemo(() => {
    let met = 0,
      partial = 0,
      unmet = 0,
      open = 0;
    for (const c of ALL_CONTROLS) {
      const s = responseMap.get(c.id)?.status ?? "NOT_ASSESSED";
      if (s === "MET") met++;
      else if (s === "PARTIAL") partial++;
      else if (s === "UNMET") unmet++;
      else open++;
    }
    return { met, partial, unmet, open };
  }, [responseMap]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return recentEvents;
    return recentEvents.filter((e) => e.status === activeFilter);
  }, [activeFilter]);

  const totalTokens = tokenData.reduce((acc, d) => acc + d.tokens, 0);
  const totalRequests = tokenData.reduce((acc, d) => acc + d.requests, 0);
  const totalBlocked = tokenData.reduce((acc, d) => acc + d.blocked, 0);

  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">
            Dashboard Overview
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500/100 animate-pulse" />
              <span className="text-emerald-600 font-medium">Live</span>
            </div>
            <span>·</span>
            <span className="font-mono text-xs">
              Last update: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-white/10 text-slate-400 rounded-xl hover:bg-white/[0.03] transition-colors">
            <Calendar className="w-4 h-4" /> Last 7 days
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-white/10 text-slate-400 rounded-xl hover:bg-white/[0.03] transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        {[
          {
            label: "Total Events",
            value: totalRequests.toLocaleString(),
            change: "+12%",
            trend: "up",
            icon: Activity,
            color: "text-brand-500",
            bg: "bg-brand-500/10",
          },
          {
            label: "Blocked",
            value: totalBlocked.toString(),
            change: "-8%",
            trend: "down",
            icon: Shield,
            color: "text-rose-600",
            bg: "bg-rose-500/10",
          },
          {
            label: "Tokens Scanned",
            value: `${(totalTokens / 1000).toFixed(0)}K`,
            change: "+23%",
            trend: "up",
            icon: Zap,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
          },
          {
            label: "SPRS Score",
            value: sprs.total.toString(),
            change: "+5 pts",
            trend: "up",
            icon: Target,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Controls Met",
            value: `${statusCounts.met}/110`,
            change: `${completion.toFixed(0)}%`,
            trend: "up",
            icon: ClipboardCheck,
            color: "text-brand-600",
            bg: "bg-brand-50",
          },
          {
            label: "Active Agents",
            value: "7",
            change: "Online",
            trend: "up",
            icon: Bot,
            color: "text-cyan-600",
            bg: "bg-cyan-50",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="metric-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.bg} ${kpi.color}`}
              >
                {kpi.change}
              </span>
            </div>
            <p className="font-display font-bold text-2xl text-white mb-0.5">
              {kpi.value}
            </p>
            <p className="text-xs text-slate-400">{kpi.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Usage Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-white">
              Token Activity
            </h3>
            <span className="text-xs text-slate-400 font-mono">7-day trend</span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_BLUE} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={CHART_BLUE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_RED} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={CHART_RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke={CHART_BLUE}
                  strokeWidth={2}
                  fill="url(#blueGrad)"
                  name="Tokens"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stroke={CHART_RED}
                  strokeWidth={2}
                  fill="url(#redGrad)"
                  name="Blocked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution */}
        <div className="glass-card p-5">
          <h3 className="font-display font-bold text-base text-white mb-4">
            Threat Distribution
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {threatDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {threatDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SPRS + Hourly Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SPRS Gauge */}
        <div className="glass-card p-5 text-center">
          <h3 className="font-display font-bold text-base text-white mb-4">
            SPRS Score
          </h3>
          <SPRSGauge score={sprs.total} />
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="text-center">
              <p className="font-display font-bold text-lg text-emerald-600">
                {statusCounts.met}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Met</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-amber-500">
                {statusCounts.partial}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Partial</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-rose-500">
                {statusCounts.unmet}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Unmet</p>
            </div>
          </div>
          {/* SPRS improvement from HoundShield */}
          <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
            <p className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider mb-0.5">
              HoundShield Impact
            </p>
            <p className="text-xs text-emerald-300">
              <span className="font-bold">+18 pts</span> protected — AC.L2-3.1.3, AU.L2-3.3.1, SI.L2-3.14.1
            </p>
            <p className="text-[10px] text-emerald-500/70 mt-0.5">
              CUI flow control · audit logging · flaw remediation
            </p>
          </div>
          <Link
            href="/command-center/shield"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            View Full Assessment <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hourly Activity */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-white">
              24h Activity
            </h3>
            <span className="text-xs text-slate-400 font-mono">events per hour</span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="hour"
                  stroke="#94a3b8"
                  fontSize={10}
                  interval={3}
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="events"
                  fill={CHART_BLUE}
                  radius={[4, 4, 0, 0]}
                  name="Events"
                  opacity={0.6}
                />
                <Bar
                  dataKey="blocked"
                  fill={CHART_RED}
                  radius={[4, 4, 0, 0]}
                  name="Blocked"
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── NEW: Compliance Trend + Risk Radar + Provider Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Trend */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-white">
              SPRS Compliance Trend
            </h3>
            <span className="text-xs text-slate-400 font-mono">12-month history</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complianceTrend}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_EMERALD} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={CHART_EMERALD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={CHART_EMERALD}
                  strokeWidth={2.5}
                  dot={{ fill: CHART_EMERALD, strokeWidth: 0, r: 3 }}
                  name="SPRS Score"
                />
                <Line
                  type="monotone"
                  dataKey="controls"
                  stroke={CHART_BLUE}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: CHART_BLUE, strokeWidth: 0, r: 2 }}
                  name="Controls Met"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Radar */}
        <div className="glass-card p-5">
          <h3 className="font-display font-bold text-base text-white mb-4">
            Risk Assessment
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskRadarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: "#64748b" }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke={CHART_BLUE}
                  fill={CHART_BLUE}
                  fillOpacity={0.05}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke={CHART_EMERALD}
                  fill={CHART_EMERALD}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Provider Breakdown ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-base text-white">
            Provider Breakdown
          </h3>
          <span className="text-xs text-slate-400 font-mono">requests by LLM provider</span>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={providerBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="provider" type="category" stroke="#94a3b8" fontSize={11} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="passed" stackId="a" fill={CHART_EMERALD} name="Passed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="warning" stackId="a" fill={CHART_AMBER} name="Warning" />
              <Bar dataKey="blocked" stackId="a" fill={CHART_RED} name="Blocked" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Live Events ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-base text-white">
            Live Events
          </h3>
          <div className="flex items-center gap-2">
            {(["all", "blocked", "warning", "passed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeFilter === f
                    ? "bg-brand-500/10 text-brand-500"
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-400"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white border border-white/[0.06] hover:border-white/10 transition-colors"
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {evt.status === "blocked" ? (
                  <XCircle className="w-5 h-5 text-rose-500" />
                ) : evt.status === "warning" ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{evt.detail}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="font-mono">{evt.id}</span>
                  <span>{evt.provider}/{evt.model}</span>
                  <span>{evt.tokens} tokens</span>
                </div>
              </div>

              {/* Risk + Time */}
              <div className="flex-shrink-0 text-right">
                <span className={`text-xs font-bold ${riskColor[evt.risk]}`}>
                  {evt.risk}
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {evt.time}
                </div>
              </div>

              {/* Status badge */}
              <span
                className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${
                  statusColor[evt.status]
                }`}
              >
                {evt.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/command-center/events"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
        >
          View All Events <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Revenue & Conversion Chart ── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Revenue & Conversion Rate</h3>
            <p className="text-xs text-slate-400 mt-0.5">Monthly revenue vs conversion — Jan to Jun 2025</p>
          </div>
          <span className="text-xs font-mono text-brand-400 bg-brand-400/10 px-2 py-1 rounded-lg">LIVE</span>
        </div>
        <RevenueChart />
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Run Full Scan",
            icon: Scan,
            href: "/command-center/scanner",
            color: "bg-brand-500/10 text-brand-500",
          },
          {
            label: "CMMC Assessment",
            icon: ShieldCheck,
            href: "/command-center/shield/assessment",
            color: "bg-emerald-500/10 text-emerald-600",
          },
          {
            label: "Agent Workspace",
            icon: Brain,
            href: "/command-center/workspace",
            color: "bg-brand-50 text-brand-600",
          },
          {
            label: "Generate Report",
            icon: BarChart3,
            href: "/command-center/shield/reports",
            color: "bg-amber-500/10 text-amber-600",
          },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="glass-card p-4 flex items-center gap-3 group hover:-translate-y-1 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
              <action.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white group-hover:text-brand-500 transition-colors">
                {action.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-300 group-hover:text-brand-400 inline ml-2 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
