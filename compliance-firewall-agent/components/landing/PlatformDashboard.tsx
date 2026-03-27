"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, HeartPulse, Shield, ChevronRight, AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  BarChart, Bar, XAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

/* ── All-framework event pool ──────────────────────────── */
const ALL_EVENTS = [
  { framework: "SOC 2",  color: "#6366F1", detail: "GitHub token in AI prompt body",          status: "BLOCKED"     as const },
  { framework: "HIPAA",  color: "#10B981", detail: "Patient DOB + SSN in ChatGPT session",    status: "BLOCKED"     as const },
  { framework: "CMMC",   color: "#F5C842", detail: "CUI contract FA8802-24-C-0031 detected",  status: "QUARANTINED" as const },
  { framework: "SOC 2",  color: "#6366F1", detail: "Stripe secret key in code review prompt", status: "BLOCKED"     as const },
  { framework: "HIPAA",  color: "#10B981", detail: "Discharge summary sent to AI tool",       status: "QUARANTINED" as const },
  { framework: "CMMC",   color: "#F5C842", detail: "Export-controlled tech data — ITAR flag", status: "BLOCKED"     as const },
];

const WEEKLY = [
  { day: "Mon", soc2: 8,  hipaa: 5,  cmmc: 4  },
  { day: "Tue", soc2: 15, hipaa: 8,  cmmc: 7  },
  { day: "Wed", soc2: 12, hipaa: 10, cmmc: 6  },
  { day: "Thu", soc2: 23, hipaa: 14, cmmc: 11 },
  { day: "Fri", soc2: 19, hipaa: 9,  cmmc: 8  },
  { day: "Sat", soc2: 7,  hipaa: 4,  cmmc: 3  },
  { day: "Sun", soc2: 11, hipaa: 6,  cmmc: 5  },
];

const FRAMEWORK_SHARE = [
  { name: "SOC 2",  value: 45, color: "#6366F1" },
  { name: "HIPAA",  value: 32, color: "#10B981" },
  { name: "CMMC",   value: 23, color: "#F5C842" },
];

const FRAMEWORKS = [
  { key: "SOC 2",  Icon: Lock,       color: "text-indigo-400", bg: "bg-indigo-500/10",  border: "border-indigo-500/20",  label: "SOC 2 Type II",    active: true  },
  { key: "HIPAA",  Icon: HeartPulse, color: "text-emerald-400",bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "HIPAA Safe Harbor", active: true  },
  { key: "CMMC",   Icon: Shield,     color: "text-amber-400",  bg: "bg-amber-500/10",   border: "border-amber-500/20",  label: "CMMC Level 2",      active: true  },
];

const STATUS_STYLES = {
  BLOCKED:     { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20"    },
  QUARANTINED: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2 py-1 rounded bg-[#16161f] border border-white/[0.08] text-[9px] font-mono text-white">
      {payload.reduce((s, p) => s + p.value, 0)} total
    </div>
  );
}

/* ── Component ──────────────────────────────────────────── */
export function PlatformDashboard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [totalBlocked, setTotalBlocked] = useState(1612);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % ALL_EVENTS.length);
      setTotalBlocked((n) => n + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const event = ALL_EVENTS[activeIdx];
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
            <span className="text-[11px] font-mono text-slate-500">kaelus — unified platform</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-400/10 border border-brand-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-[10px] font-mono text-brand-400 font-semibold tracking-wider">3 FRAMEWORKS ACTIVE</span>
          </div>
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.04] border-b border-white/[0.04]">
          {[
            { label: "Total Blocked",    value: totalBlocked.toLocaleString(), color: "text-red-400"     },
            { label: "Frameworks",       value: "3 / 3",                       color: "text-emerald-400" },
            { label: "Avg Coverage",     value: "92%",                         color: "text-brand-400"   },
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
          {/* Sidebar — framework status */}
          <div className="w-36 border-r border-white/[0.04] bg-white/[0.01] py-3 flex-shrink-0">
            {FRAMEWORKS.map((fw) => {
              const Icon = fw.Icon;
              return (
                <div key={fw.key} className={`flex items-center gap-2 px-3 py-2 mx-2 rounded-lg mb-1 ${fw.bg} border ${fw.border}`}>
                  <Icon className={`w-3 h-3 flex-shrink-0 ${fw.color}`} />
                  <div className="min-w-0">
                    <div className={`text-[9px] font-mono font-bold truncate ${fw.color}`}>{fw.label}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`w-1 h-1 rounded-full bg-emerald-400`} />
                      <span className="text-[8px] font-mono text-emerald-500">active</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Unified coverage badge */}
            <div className="mx-2 mt-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1">Detection</div>
              <div className="text-[14px] font-mono font-black text-brand-400">16+</div>
              <div className="text-[8px] font-mono text-slate-600">data categories</div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-h-[260px]">

            {/* Live multi-framework event */}
            <AnimatePresence mode="wait">
              <motion.div key={activeIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                className={`mb-3 p-2.5 rounded-xl border ${sc.border} ${sc.bg} flex items-start gap-2`}
              >
                <AlertTriangle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${sc.text}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[9px] font-mono font-bold flex-shrink-0 px-1.5 py-0.5 rounded"
                      style={{ color: event.color, background: `${event.color}18`, border: `1px solid ${event.color}30` }}
                    >
                      {event.framework}
                    </span>
                    <span className={`ml-auto text-[9px] font-mono font-bold flex-shrink-0 ${sc.text}`}>{event.status}</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300">{event.detail}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Charts row */}
            <div className="flex gap-3">

              {/* Stacked bar — weekly across all frameworks */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1">Blocked This Week</p>
                {mounted ? (
                  <ResponsiveContainer width="100%" height={88}>
                    <BarChart data={WEEKLY} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fill: "#4a3020", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="soc2"  stackId="a" fill="#6366F1" opacity={0.8} radius={[0, 0, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="hipaa" stackId="a" fill="#10B981" opacity={0.8} radius={[0, 0, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="cmmc"  stackId="a" fill="#F5C842" opacity={0.8} radius={[2, 2, 0, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[88px] rounded bg-white/[0.03] animate-pulse" />
                )}
              </div>

              {/* Donut — framework share */}
              <div className="w-[110px] flex-shrink-0">
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1">By Framework</p>
                <div className="relative">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height={88}>
                      <PieChart>
                        <Pie data={FRAMEWORK_SHARE} cx="50%" cy="50%" innerRadius={24} outerRadius={40}
                          dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                          {FRAMEWORK_SHARE.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                        </Pie>
                        <Tooltip formatter={(v: number, n: string) => [`${v}%`, n]}
                          contentStyle={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 9, fontFamily: "monospace" }}
                          labelStyle={{ color: "#9ca3af" }} itemStyle={{ color: "#e2e8f0" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[88px] rounded bg-white/[0.03] animate-pulse" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-[10px] font-mono font-bold text-white">ALL</div>
                      <div className="text-[8px] font-mono text-slate-600">unified</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5 mt-1">
                  {FRAMEWORK_SHARE.map((d) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-[8px] font-mono text-slate-600 truncate">{d.name}</span>
                      <span className="ml-auto text-[8px] font-mono" style={{ color: d.color }}>{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-600">SOC 2 · HIPAA · CMMC · 16 engines · &lt;10ms</span>
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
