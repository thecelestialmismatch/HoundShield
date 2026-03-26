"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Key, ShieldCheck, Fingerprint,
  AlertTriangle, Zap, ChevronRight,
} from "lucide-react";

const INTERCEPTS = [
  { file: "src/auth/oauth.ts", type: "API_KEY", detail: "GITHUB_TOKEN exposed in message", status: "BLOCKED" as const },
  { file: "lib/payments/stripe.ts", type: "SECRET", detail: "STRIPE_SECRET_KEY in prompt body", status: "QUARANTINED" as const },
  { file: "backend/models/user.ts", type: "IP", detail: "Proprietary auth algorithm detected", status: "REDACTED" as const },
  { file: "services/aws/s3.ts", type: "API_KEY", detail: "AWS_ACCESS_KEY_ID intercepted", status: "BLOCKED" as const },
];

const CONTROLS = [
  { name: "API Key Protection", pct: 100, color: "bg-emerald-500" },
  { name: "Source Code Guard", pct: 94, color: "bg-brand-400" },
  { name: "SOC 2 Type II", pct: 87, color: "bg-brand-400" },
  { name: "IP Classification", pct: 76, color: "bg-amber-500" },
];

const NAV_ITEMS = [
  { icon: Code2, label: "Code Scanner" },
  { icon: Key, label: "API Keys", active: true },
  { icon: ShieldCheck, label: "SOC 2" },
  { icon: Fingerprint, label: "IP Guard" },
];

const STATUS_STYLES = {
  BLOCKED:     { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  QUARANTINED: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  REDACTED:    { text: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
};

export function TechDashboard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [keysBlocked, setKeysBlocked] = useState(23);
  const [leaksBlocked, setLeaksBlocked] = useState(7);

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
              <motion.span
                key={String(m.value)}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 1 }}
                className={`text-base font-mono font-bold tabular-nums ${m.color}`}
              >
                {m.value}
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
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-lg transition-all ${
                    item.active
                      ? "bg-brand-400/10 border border-brand-400/20"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.active ? "text-brand-400" : "text-slate-600"}`} />
                  <span className={`text-[11px] font-medium ${item.active ? "text-brand-400" : "text-slate-600"}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-h-[230px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Live Intercepts
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-600">real-time</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                className={`mb-4 p-3 rounded-xl border ${sc.border} ${sc.bg}`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[55%]">{event.file}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.text} border ${sc.border}`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-300 mb-2">{event.detail}</p>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="text-[10px] font-mono text-slate-500">Not forwarded · SHA-256 audit logged</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress bars */}
            <div className="space-y-2">
              {CONTROLS.map((c, i) => (
                <div key={c.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-500">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{c.pct}%</span>
                  </div>
                  <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.pct}%` }}
                      transition={{ duration: 1.2 + i * 0.15, ease: [0.25, 0.4, 0.25, 1] }}
                      className={`h-full rounded-full ${c.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-600">16 detection engines · &lt;10ms latency</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-brand-400" />
            <span className="text-[10px] font-mono text-brand-400">kaelus.online</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
