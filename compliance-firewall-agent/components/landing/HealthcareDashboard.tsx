"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, ClipboardList, ShieldAlert,
  Users, BarChart3, ChevronRight, AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  BarChart, Bar, XAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

/* ── Mock data ─────────────────────────────────────── */
const PHI_EVENTS = [
  { source: "ehr-assist",    detail: "Patient intake form pasted into ChatGPT",   count: 6, status: "BLOCKED"     as const },
  { source: "clinic-chatbot",detail: "Discharge summary sent to AI writing tool", count: 4, status: "QUARANTINED" as const },
  { source: "billing-ai",    detail: "Insurance claim data in AI prompt",          count: 5, status: "BLOCKED"     as const },
];

const PHI_BY_CATEGORY = [
  { cat: "Name",  v: 38 },
  { cat: "SSN",   v: 28 },
  { cat: "DOB",   v: 24 },
  { cat: "Phone", v: 22 },
  { cat: "MRN",   v: 19 },
  { cat: "Email", v: 18 },
  { cat: "ZIP",   v: 14 },
  { cat: "IP",    v: 11 },
];

const COVERAGE_DONUT = [
  { name: "Protected", value: 13, color: "#10B981" },
  { name: "Scanning",  value: 5,  color: "#F59E0B" },
];

const NAV_ITEMS = [
  { icon: BarChart3,    label: "PHI Monitor",  active: true },
  { icon: ClipboardList,label: "HIPAA Audit" },
  { icon: ShieldAlert,  label: "Risk Score" },
  { icon: Users,        label: "Care Teams" },
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
      {payload[0].value} incidents
    </div>
  );
}

/* ── Component ──────────────────────────────────────── */
export function HealthcareDashboard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phiBlocked, setPhiBlocked] = useState(1247);
  const [penaltySaved, setPenaltySaved] = useState(1.9);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % PHI_EVENTS.length);
      setPhiBlocked((n) => n + Math.floor(Math.random() * 3) + 1);
      if (Math.random() > 0.7) setPenaltySaved((n) => parseFloat((n + 0.1).toFixed(1)));
    }, 3600);
    return () => clearInterval(t);
  }, []);

  const event = PHI_EVENTS[activeIdx];
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
            <span className="text-[11px] font-mono text-slate-500">kaelus — hipaa-shield</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider">PHI Monitor Active</span>
          </div>
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.04] border-b border-white/[0.04]">
          {[
            { label: "PHI Incidents Blocked", value: phiBlocked.toLocaleString(), color: "text-red-400" },
            { label: "HIPAA Risk Level",       value: "LOW",                        color: "text-emerald-400" },
            { label: "Penalty Avoided",        value: `$${penaltySaved}M`,          color: "text-amber-400" },
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
                  item.active ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-white/[0.03]"
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${item.active ? "text-emerald-400" : "text-slate-600"}`} />
                  <span className={`text-[11px] font-medium ${item.active ? "text-emerald-400" : "text-slate-600"}`}>{item.label}</span>
                </div>
              );
            })}

            {/* HIPAA 18/18 badge */}
            <div className="mx-2 mt-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-1.5 mb-1">
                <HeartPulse className="w-3 h-3 text-red-400" />
                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">HIPAA</span>
              </div>
              <div className="text-[14px] font-mono font-black text-emerald-400">18/18</div>
              <div className="text-[9px] font-mono text-slate-600">identifiers</div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-h-[260px]">

            {/* Live PHI intercept */}
            <AnimatePresence mode="wait">
              <motion.div key={activeIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                className={`mb-3 p-2.5 rounded-xl border ${sc.border} ${sc.bg} flex items-start gap-2`}
              >
                <AlertTriangle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${sc.text}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-mono text-slate-500 truncate">src: {event.source}</span>
                    <span className={`ml-auto text-[9px] font-mono font-bold flex-shrink-0 ${sc.text}`}>{event.status}</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300">{event.detail}</p>
                  <p className="text-[9px] font-mono text-slate-600 mt-0.5">{event.count}/18 HIPAA identifiers detected</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Charts row */}
            <div className="flex gap-3">

              {/* Bar chart — PHI by category */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1">PHI by Category</p>
                {mounted ? (
                  <ResponsiveContainer width="100%" height={88}>
                    <BarChart data={PHI_BY_CATEGORY} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <XAxis dataKey="cat" tick={{ fill: "#4a3020", fontSize: 7, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="v" fill="#EF4444" radius={[2, 2, 0, 0]} opacity={0.8} maxBarSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[88px] rounded bg-white/[0.03] animate-pulse" />
                )}
              </div>

              {/* Donut — 18/18 coverage */}
              <div className="w-[110px] flex-shrink-0">
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1">Coverage</p>
                <div className="relative">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height={88}>
                      <PieChart>
                        <Pie data={COVERAGE_DONUT} cx="50%" cy="50%" innerRadius={24} outerRadius={40}
                          dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                          {COVERAGE_DONUT.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                        </Pie>
                        <Tooltip formatter={(v: number, n: string) => [`${v}`, n]}
                          contentStyle={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 9, fontFamily: "monospace" }}
                          labelStyle={{ color: "#9ca3af" }} itemStyle={{ color: "#e2e8f0" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[88px] rounded bg-white/[0.03] animate-pulse" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-[10px] font-mono font-bold text-white">18</div>
                      <div className="text-[8px] font-mono text-slate-600">PHI</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5 mt-1">
                  {COVERAGE_DONUT.map((d) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-[8px] font-mono text-slate-600 truncate">{d.name}</span>
                      <span className="ml-auto text-[8px] font-mono" style={{ color: d.color }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-600">HIPAA Safe Harbor · 18 identifier scanner · &lt;10ms</span>
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
