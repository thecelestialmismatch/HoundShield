"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, HeartPulse, Shield, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie,
} from "recharts";

/* ── Event pool ────────────────────────────────────────── */
const EVENT_POOL = [
  { framework: "SOC 2",  color: "#6366F1", detail: "GitHub token in Copilot prompt body",       status: "BLOCKED"     as const, engine: "secrets" },
  { framework: "HIPAA",  color: "#10B981", detail: "Patient DOB + MRN in ChatGPT session",      status: "BLOCKED"     as const, engine: "PHI" },
  { framework: "CMMC",   color: "#F5C842", detail: "CUI contract FA8802-24-C-0031 detected",    status: "QUARANTINED" as const, engine: "CUI" },
  { framework: "SOC 2",  color: "#6366F1", detail: "Stripe secret key in code review prompt",   status: "BLOCKED"     as const, engine: "secrets" },
  { framework: "HIPAA",  color: "#10B981", detail: "Discharge summary pasted to AI tool",       status: "QUARANTINED" as const, engine: "PHI" },
  { framework: "CMMC",   color: "#F5C842", detail: "Export-controlled ITAR tech data flagged",  status: "BLOCKED"     as const, engine: "CUI" },
  { framework: "SOC 2",  color: "#6366F1", detail: "AWS access key in Claude.ai message",       status: "BLOCKED"     as const, engine: "secrets" },
  { framework: "HIPAA",  color: "#10B981", detail: "SSN + insurance ID in AI billing prompt",   status: "BLOCKED"     as const, engine: "PII" },
  { framework: "CMMC",   color: "#F5C842", detail: "CAGE code 3GTK7 in AI proposal draft",      status: "QUARANTINED" as const, engine: "CUI" },
];

const ENGINE_COLORS = ["#6366F1", "#10B981", "#F5C842", "#F87171"];

function initBar() {
  return [
    { engine: "PHI",  count: rand(3, 18) },
    { engine: "PII",  count: rand(2, 12) },
    { engine: "CUI",  count: rand(1, 9)  },
    { engine: "KEYS", count: rand(4, 22) },
  ];
}

function initPie() {
  const soc = rand(35, 50);
  const hipaa = rand(22, 36);
  return [
    { name: "SOC 2", value: soc,               color: "#6366F1" },
    { name: "HIPAA", value: hipaa,             color: "#10B981" },
    { name: "CMMC",  value: 100 - soc - hipaa, color: "#F5C842" },
  ];
}

const STATUS_STYLES = {
  BLOCKED:     { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20"    },
  QUARANTINED: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initChart() {
  return Array.from({ length: 10 }, (_, i) => ({
    t: i,
    soc2:  rand(4, 20),
    hipaa: rand(2, 14),
    cmmc:  rand(1, 10),
  }));
}

function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2 py-1 rounded bg-[#16161f] border border-white/[0.08] text-[9px] font-mono text-white">
      {payload.reduce((s, p) => s + (p.value || 0), 0)} blocked
    </div>
  );
}

/* ── Live log entry ────────────────────────────────────── */
type LogEntry = { id: number; framework: string; color: string; detail: string; status: "BLOCKED" | "QUARANTINED"; engine: string; ts: string };

function getTs() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

/* ── Component ─────────────────────────────────────────── */
export function PlatformDashboard() {
  const [mounted, setMounted]           = useState(false);
  const [totalBlocked, setTotalBlocked] = useState(14_388);
  const [chartData, setChartData]       = useState(initChart);
  const [barData, setBarData]           = useState(initBar);
  const [pieData, setPieData]           = useState(initPie);
  const [log, setLog]                   = useState<LogEntry[]>([]);
  const [scanPct, setScanPct]           = useState(0);
  const counterRef                      = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  /* Seed initial log entries */
  useEffect(() => {
    const seed = EVENT_POOL.slice(0, 3).map((e, i) => ({
      ...e, id: i, ts: getTs(),
    }));
    setLog(seed);
  }, []);

  /* Live event feed: new entry every 2.2s */
  useEffect(() => {
    const t = setInterval(() => {
      const ev = EVENT_POOL[counterRef.current % EVENT_POOL.length];
      counterRef.current += 1;
      setLog((prev) => [{ ...ev, id: Date.now(), ts: getTs() }, ...prev].slice(0, 5));
      setTotalBlocked((n) => n + rand(1, 4));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  /* Chart updates: shift left + add new point every 1.8s */
  useEffect(() => {
    const t = setInterval(() => {
      setChartData((prev) => [
        ...prev.slice(1),
        { t: (prev[prev.length - 1]?.t ?? 0) + 1, soc2: rand(4, 22), hipaa: rand(2, 15), cmmc: rand(1, 11) },
      ]);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  /* Bar chart — updates every 1.6s (animated bars = "moving") */
  useEffect(() => {
    const t = setInterval(() => {
      setBarData([
        { engine: "PHI",  count: rand(3, 18) },
        { engine: "PII",  count: rand(2, 12) },
        { engine: "CUI",  count: rand(1, 9)  },
        { engine: "KEYS", count: rand(4, 22) },
      ]);
    }, 1600);
    return () => clearInterval(t);
  }, []);

  /* Donut pie — framework split updates every 2.8s */
  useEffect(() => {
    const t = setInterval(() => {
      const soc   = rand(35, 50);
      const hipaa = rand(22, 36);
      setPieData([
        { name: "SOC 2", value: soc,               color: "#6366F1" },
        { name: "HIPAA", value: hipaa,             color: "#10B981" },
        { name: "CMMC",  value: 100 - soc - hipaa, color: "#F5C842" },
      ]);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  /* Scan progress bar — loops 0→100 every 3s */
  useEffect(() => {
    const t = setInterval(() => {
      setScanPct((p) => (p >= 100 ? 0 : p + 4));
    }, 120);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full bg-[#080810]">
      <div className="flex flex-col">

        {/* ── Top bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <Logo className="!w-5 !h-5 !rounded-md" />
            <span className="text-[11px] font-mono text-slate-500">kaelus — command center</span>
            {/* Scanning pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Activity className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[9px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">Scanning</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-400/10 border border-brand-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-[9px] font-mono text-brand-400 font-semibold tracking-wider">3 FRAMEWORKS ACTIVE</span>
          </div>
        </div>

        {/* ── Scan progress bar ─────────────────────────── */}
        <div className="h-[2px] bg-white/[0.04] relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500/80 via-brand-400/80 to-indigo-500/80"
            style={{ width: `${scanPct}%` }}
            transition={{ duration: 0 }}
          />
        </div>

        {/* ── Metrics strip ─────────────────────────────── */}
        <div className="grid grid-cols-4 divide-x divide-white/[0.04] border-b border-white/[0.04]">
          {[
            { label: "Blocked today", value: totalBlocked.toLocaleString(), color: "text-red-400"     },
            { label: "SOC 2",         value: "Active",                       color: "text-indigo-400"  },
            { label: "HIPAA",         value: "Active",                       color: "text-emerald-400" },
            { label: "CMMC L2",       value: "Active",                       color: "text-brand-400"   },
          ].map((m) => (
            <div key={m.label} className="px-4 py-2.5">
              <span className="block text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-0.5">{m.label}</span>
              <AnimatePresence mode="wait">
                <motion.span key={m.value} initial={{ opacity: 0.4, y: 3 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                  className={`text-sm font-mono font-bold tabular-nums ${m.color}`}
                >
                  {m.value}
                </motion.span>
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* ── Body ──────────────────────────────────────── */}
        <div className="flex min-h-[280px]">

          {/* Left — live event log */}
          <div className="flex-1 border-r border-white/[0.04] p-4 overflow-hidden">
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
              Live threat feed
            </p>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {log.map((entry) => {
                  const sc = STATUS_STYLES[entry.status];
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -16, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border ${sc.border} ${sc.bg}`}
                    >
                      <AlertTriangle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${sc.text}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span
                            className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ color: entry.color, background: `${entry.color}18`, border: `1px solid ${entry.color}30` }}
                          >
                            {entry.framework}
                          </span>
                          <span className="text-[8px] font-mono text-slate-600 flex-shrink-0">{entry.engine}</span>
                          <span className={`ml-auto text-[8px] font-mono font-bold flex-shrink-0 ${sc.text}`}>{entry.status}</span>
                        </div>
                        <p className="text-[9px] font-mono text-slate-400 truncate">{entry.detail}</p>
                      </div>
                      <span className="text-[8px] font-mono text-slate-700 flex-shrink-0 mt-0.5">{entry.ts}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Right — charts */}
          <div className="w-[290px] flex-shrink-0 p-4 space-y-4">

            {/* 1 ── Live area chart */}
            <div>
              <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-2">Real-time blocks</p>
              {mounted ? (
                <ResponsiveContainer width="100%" height={86}>
                  <AreaChart data={chartData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="soc2g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="hipaag" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="cmmcg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F5C842" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F5C842" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" hide />
                    <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
                    <Area type="monotone" dataKey="soc2"  stroke="#6366F1" fill="url(#soc2g)"  strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Area type="monotone" dataKey="hipaa" stroke="#10B981" fill="url(#hipaag)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Area type="monotone" dataKey="cmmc"  stroke="#F5C842" fill="url(#cmmcg)"  strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[86px] rounded bg-white/[0.03] animate-pulse" />
              )}
            </div>

            {/* 2 ── Moving bar chart — detection engine breakdown */}
            <div>
              <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-2">Engine activity</p>
              {mounted ? (
                <ResponsiveContainer width="100%" height={76}>
                  <BarChart data={barData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }} barCategoryGap="28%">
                    <XAxis dataKey="engine" tick={{ fontSize: 7, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={380} animationEasing="ease-out">
                      {barData.map((_, i) => (
                        <Cell key={i} fill={ENGINE_COLORS[i % ENGINE_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[76px] rounded bg-white/[0.03] animate-pulse" />
              )}
            </div>

            {/* 3 ── Donut — framework split */}
            <div>
              <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-2">Framework split</p>
              <div className="flex items-center gap-3">
                {mounted ? (
                  <PieChart width={84} height={84}>
                    <Pie
                      data={pieData}
                      cx={40}
                      cy={40}
                      innerRadius={27}
                      outerRadius={40}
                      dataKey="value"
                      strokeWidth={0}
                      isAnimationActive={false}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : (
                  <div className="w-[84px] h-[84px] rounded-full bg-white/[0.03] animate-pulse flex-shrink-0" />
                )}
                <div className="flex flex-col gap-1.5 flex-1">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-[9px] font-mono text-slate-500 flex-1">{d.name}</span>
                      <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: d.color }}>{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 ── Framework status pills */}
            <div className="space-y-1">
              {[
                { key: "SOC 2",  Icon: Lock,       color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/20"  },
                { key: "HIPAA",  Icon: HeartPulse, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                { key: "CMMC",   Icon: Shield,     color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
              ].map((fw) => {
                const Icon = fw.Icon;
                return (
                  <div key={fw.key} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${fw.bg} border ${fw.border}`}>
                    <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${fw.color}`} />
                    <span className={`text-[8px] font-mono font-bold ${fw.color}`}>{fw.key}</span>
                    <div className="ml-auto flex items-center gap-0.5">
                      <CheckCircle2 className="w-2 h-2 text-emerald-400" />
                      <span className="text-[7px] font-mono text-emerald-500">active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="px-5 py-2.5 border-t border-white/[0.04] flex items-center justify-between bg-white/[0.005]">
          <span className="text-[9px] font-mono text-slate-600">SOC 2 · HIPAA · CMMC · 16 engines · &lt;10ms detection</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono text-emerald-500">All systems operational</span>
          </div>
        </div>

      </div>
    </div>
  );
}
