"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ClipboardCheck, TrendingUp,
  AlertTriangle, ChevronRight, Lock,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  LineChart, Line, XAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

/* ── Mock data ─────────────────────────────────────── */
const CUI_INTERCEPTS = [
  { source: "procurement", category: "CUI",  detail: "CAGE code 7X4K2 in AI prompt",   status: "BLOCKED"     as const },
  { source: "compliance",  category: "FOUO", detail: "FOUO document header detected",   status: "BLOCKED"     as const },
  { source: "contracts",   category: "CUI",  detail: "Contract FA8802-24-C-0031 ref",   status: "QUARANTINED" as const },
  { source: "engineering", category: "ITAR", detail: "Export-controlled tech data",      status: "BLOCKED"     as const },
];

const SPRS_TRAJECTORY = [
  { wk: "W1", score: -130 },
  { wk: "W2", score: -120 },
  { wk: "W3", score: -108 },
  { wk: "W4", score: -95  },
  { wk: "W5", score: -88  },
  { wk: "W6", score: -83  },
];

const CONTROLS_DONUT = [
  { name: "Complete",    value: 71, color: "#10B981" },
  { name: "In Progress", value: 23, color: "#F5C842" },
  { name: "Not Started", value: 16, color: "#374151" },
];

const NAV_ITEMS = [
  { icon: Shield,         label: "CMMC Level 2", active: true },
  { icon: ClipboardCheck, label: "110 Controls" },
  { icon: TrendingUp,     label: "SPRS Score" },
  { icon: Lock,           label: "CUI Monitor" },
];

const STATUS_STYLES = {
  BLOCKED:     { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  QUARANTINED: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

/* ── Custom tooltip ─────────────────────────────────── */
function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2 py-1 rounded bg-[#16161f] border border-white/[0.08] text-[9px] font-mono text-white">
      SPRS: {payload[0].value}
    </div>
  );
}

/* ── SPRS mini-gauge ─────────────────────────────────── */
function SPRSBadge({ score }: { score: number }) {
  const color = score < -100 ? "text-red-400" : score < 0 ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="flex items-end gap-2 mb-3">
      <div>
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider block">Current SPRS</span>
        <motion.span key={score} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={`text-2xl font-mono font-black tabular-nums ${color}`}>{score}
        </motion.span>
      </div>
      <div className="ml-auto text-right">
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider block">Target</span>
        <span className="text-2xl font-mono font-black text-brand-400">110</span>
      </div>
    </div>
  );
}

/* ── Component ──────────────────────────────────────── */
export function DefenseDashboard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [cuiBlocked, setCuiBlocked] = useState(342);
  const [sprs] = useState(-83);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % CUI_INTERCEPTS.length);
      setCuiBlocked((n) => n + 1);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  const event = CUI_INTERCEPTS[activeIdx];
  const sc = STATUS_STYLES[event.status];

  return (
    <div className="w-full max-w-[580px] mx-auto">
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a12] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.65)]">

        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.015]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-amber-500/60" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <span className="text-[11px] font-mono text-slate-500">kaelus — cmmc-shield</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-400/10 border border-brand-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-[10px] font-mono text-brand-400 font-semibold tracking-wider">CMMC L2 Assessment</span>
          </div>
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.04] border-b border-white/[0.04]">
          {[
            { label: "CUI Intercepts",     value: cuiBlocked.toLocaleString(), color: "text-red-400"   },
            { label: "Controls Completed", value: "71 / 110",                  color: "text-brand-400" },
            { label: "C3PAO Ready",        value: "Nov 2026",                  color: "text-amber-400" },
          ].map((m) => (
            <div key={m.label} className="px-4 py-2.5">
              <span className="block text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-0.5">{m.label}</span>
              <motion.span key={String(m.value)} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }}
                className={`text-base font-mono font-bold tabular-nums ${m.color}`}>{m.value}
              </motion.span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-36 border-r border-white/[0.04] bg-white/[0.01] py-3 flex-shrink-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-lg transition-all cursor-pointer ${
                  item.active ? "bg-brand-400/10 border border-brand-400/20" : "hover:bg-white/[0.03]"
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${item.active ? "text-brand-400" : "text-slate-600"}`} />
                  <span className={`text-[11px] font-medium ${item.active ? "text-brand-400" : "text-slate-600"}`}>{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-h-[260px]">
            {/* SPRS mini-gauge */}
            <SPRSBadge score={sprs} />

            {/* Charts row */}
            <div className="flex gap-3 mb-3">

              {/* Line chart — SPRS trajectory */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1">SPRS Trajectory</p>
                {mounted ? (
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={SPRS_TRAJECTORY} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sprsGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#EF4444" />
                          <stop offset="100%" stopColor="#F5C842" />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="wk" tick={{ fill: "#4a3020", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
                      <Line type="monotone" dataKey="score" stroke="url(#sprsGrad)" strokeWidth={2}
                        dot={{ r: 2, fill: "#F5C842", strokeWidth: 0 }}
                        activeDot={{ r: 3, fill: "#F5C842" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[80px] rounded bg-white/[0.03] animate-pulse" />
                )}
              </div>

              {/* Donut — control completion */}
              <div className="w-[110px] flex-shrink-0">
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1">Controls</p>
                <div className="relative">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height={80}>
                      <PieChart>
                        <Pie data={CONTROLS_DONUT} cx="50%" cy="50%" innerRadius={22} outerRadius={38}
                          dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                          {CONTROLS_DONUT.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.9} />)}
                        </Pie>
                        <Tooltip formatter={(v: number, n: string) => [`${v}`, n]}
                          contentStyle={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 9, fontFamily: "monospace" }}
                          labelStyle={{ color: "#9ca3af" }} itemStyle={{ color: "#e2e8f0" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[80px] rounded bg-white/[0.03] animate-pulse" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-[10px] font-mono font-bold text-white">110</div>
                      <div className="text-[8px] font-mono text-slate-600">ctrl</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5 mt-1">
                  {CONTROLS_DONUT.map((d) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-[8px] font-mono text-slate-600 truncate">{d.name}</span>
                      <span className="ml-auto text-[8px] font-mono" style={{ color: d.color === "#374151" ? "#6b7280" : d.color }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Live CUI intercept */}
            <AnimatePresence mode="wait">
              <motion.div key={activeIdx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }}
                className={`p-2.5 rounded-lg border ${sc.border} ${sc.bg} flex items-center gap-2`}
              >
                <AlertTriangle className={`w-3 h-3 flex-shrink-0 ${sc.text}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 truncate block">{event.detail}</span>
                  <span className="text-[9px] font-mono text-slate-600">src: {event.source} · {event.category}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold flex-shrink-0 ${sc.text}`}>{event.status}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-600">NIST 800-171 Rev 2 · 110 controls · DoD v1.2.1</span>
          <div className="flex items-center gap-1.5">
            <Logo className="!w-4 !h-4 !rounded-md" />
            <span className="text-[10px] font-mono text-brand-400">kaelus.online</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
