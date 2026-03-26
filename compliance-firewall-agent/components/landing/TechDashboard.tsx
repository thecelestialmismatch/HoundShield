"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Key, ShieldCheck, Fingerprint,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  ComposedChart, Bar, Line, XAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

/* ── Mock data ─────────────────────────────────────── */
const WEEKLY = [
  { day: "Mon", v: 8  },
  { day: "Tue", v: 15 },
  { day: "Wed", v: 12 },
  { day: "Thu", v: 23 },
  { day: "Fri", v: 19 },
  { day: "Sat", v: 7  },
  { day: "Sun", v: 11 },
];

const DONUT = [
  { name: "API Keys",    value: 62, color: "#EF4444" },
  { name: "Source Code", value: 21, color: "#F59E0B" },
  { name: "IP/Secrets",  value: 17, color: "#8B5CF6" },
];

const INTERCEPTS = [
  { file: "src/auth/oauth.ts",        type: "API_KEY", detail: "GITHUB_TOKEN exposed in message",      status: "BLOCKED"     as const },
  { file: "lib/payments/stripe.ts",   type: "SECRET",  detail: "STRIPE_SECRET_KEY in prompt body",    status: "QUARANTINED" as const },
  { file: "backend/models/user.ts",   type: "IP",      detail: "Proprietary auth algorithm detected", status: "REDACTED"    as const },
  { file: "services/aws/s3.ts",       type: "API_KEY", detail: "AWS_ACCESS_KEY_ID intercepted",       status: "BLOCKED"     as const },
];

const NAV_ITEMS = [
  { icon: Code2,       label: "Code Scanner" },
  { icon: Key,         label: "API Keys",    active: true },
  { icon: ShieldCheck, label: "SOC 2" },
  { icon: Fingerprint, label: "IP Guard" },
];

const STATUS_STYLES = {
  BLOCKED:     { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  QUARANTINED: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  REDACTED:    { text: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
};

/* ── Custom tooltip ─────────────────────────────────── */
function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2 py-1 rounded bg-[#16161f] border border-white/[0.08] text-[9px] font-mono text-white">
      {payload[0].value} blocked
    </div>
  );
}

/* ── Component ──────────────────────────────────────── */
export function TechDashboard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [keysBlocked, setKeysBlocked] = useState(23);
  const [leaksBlocked, setLeaksBlocked] = useState(7);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % INTERCEPTS.length);
      setKeysBlocked((n) => n + 1);
      if (Math.random() > 0.6) setLeaksBlocked((n) => n + 1);
    }, 3400);
    return () => clearInterval(t);
  }, []);

  const event = INTERCEPTS[activeIdx];
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
            <span className="text-[11px] font-mono text-slate-500">kaelus — code-shield</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider">SOC 2 Active</span>
          </div>
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.04] border-b border-white/[0.04]">
          {[
            { label: "API Keys Blocked", value: keysBlocked, color: "text-red-400" },
            { label: "IP Leaks Stopped", value: leaksBlocked, color: "text-amber-400" },
            { label: "SOC 2 Coverage",   value: "87%",        color: "text-emerald-400" },
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

            {/* Live intercept */}
            <AnimatePresence mode="wait">
              <motion.div key={activeIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                className={`mb-3 p-2.5 rounded-xl border ${sc.border} ${sc.bg} flex items-start gap-2`}
              >
                <AlertTriangle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${sc.text}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-mono text-slate-500 truncate">{event.file}</span>
                    <span className={`ml-auto text-[9px] font-mono font-bold flex-shrink-0 ${sc.text}`}>{event.status}</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300">{event.detail}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Charts row */}
            <div className="flex gap-3">

              {/* Composed chart — bars + line overlay */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1">Blocked This Week</p>
                {mounted ? (
                  <ResponsiveContainer width="100%" height={88}>
                    <ComposedChart data={WEEKLY} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fill: "#4a3020", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="v" fill="#F5C842" opacity={0.25} radius={[2, 2, 0, 0]} maxBarSize={14} />
                      <Line type="monotone" dataKey="v" stroke="#F5C842" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#F5C842" }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[88px] rounded bg-white/[0.03] animate-pulse" />
                )}
              </div>

              {/* Donut — threat breakdown */}
              <div className="w-[110px] flex-shrink-0">
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mb-1">Threat Type</p>
                <div className="relative">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height={88}>
                      <PieChart>
                        <Pie data={DONUT} cx="50%" cy="50%" innerRadius={24} outerRadius={40}
                          dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                          {DONUT.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
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
                      <div className="text-[10px] font-mono font-bold text-white">16</div>
                      <div className="text-[8px] font-mono text-slate-600">types</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5 mt-1">
                  {DONUT.map((d) => (
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
          <span className="text-[10px] font-mono text-slate-600">16 detection engines · &lt;10ms latency</span>
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
