"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ClipboardCheck, TrendingUp,
  AlertTriangle, Zap, ChevronRight, Lock,
} from "lucide-react";

const CUI_INTERCEPTS = [
  { source: "procurement", category: "CUI", detail: "CAGE code 7X4K2 in AI prompt", status: "BLOCKED" as const },
  { source: "compliance",  category: "FOUO", detail: "FOUO document header detected", status: "BLOCKED" as const },
  { source: "contracts",   category: "CUI", detail: "Contract FA8802-24-C-0031 ref", status: "QUARANTINED" as const },
  { source: "engineering", category: "ITAR", detail: "Export-controlled tech data", status: "BLOCKED" as const },
];

const CONTROL_FAMILIES = [
  { id: "AC", name: "Access Control",         pct: 82, reqs: 22 },
  { id: "AU", name: "Audit & Accountability",  pct: 63, reqs: 9  },
  { id: "CM", name: "Configuration Mgmt",     pct: 55, reqs: 9  },
  { id: "IA", name: "Identification & Auth",  pct: 91, reqs: 11 },
  { id: "SC", name: "Sys & Comm Protection",  pct: 48, reqs: 24 },
  { id: "SI", name: "Sys & Info Integrity",   pct: 78, reqs: 7  },
];

const NAV_ITEMS = [
  { icon: Shield,        label: "CMMC Level 2", active: true },
  { icon: ClipboardCheck,label: "110 Controls" },
  { icon: TrendingUp,    label: "SPRS Score" },
  { icon: Lock,          label: "CUI Monitor" },
];

const STATUS_STYLES = {
  BLOCKED:     { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  QUARANTINED: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

function SPRSGauge({ score }: { score: number }) {
  // SPRS range: -203 to +110
  const min = -203;
  const max = 110;
  const pct = Math.round(((score - min) / (max - min)) * 100);
  const color = score < -100 ? "text-red-400" : score < 0 ? "text-amber-400" : "text-emerald-400";
  const barColor = score < -100 ? "bg-red-500" : score < 0 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider block">Current SPRS</span>
          <motion.span
            key={score}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-2xl font-mono font-black tabular-nums ${color}`}
          >
            {score}
          </motion.span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider block">Target</span>
          <span className="text-2xl font-mono font-black text-brand-400">110</span>
        </div>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: [0.25, 0.4, 0.25, 1] }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <div className="flex justify-between text-[9px] font-mono text-slate-700">
        <span>-203 (worst)</span>
        <span className="text-emerald-500/60">+110 (perfect)</span>
      </div>
    </div>
  );
}

export function DefenseDashboard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [cuiBlocked, setCuiBlocked] = useState(342);
  const [sprs] = useState(-83);

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
            { label: "CUI Intercepts",      value: cuiBlocked.toLocaleString(), color: "text-red-400"    },
            { label: "Controls Completed",  value: "71 / 110",                  color: "text-brand-400"  },
            { label: "C3PAO Ready",         value: "Nov 2026",                  color: "text-amber-400"  },
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
            {/* SPRS gauge */}
            <div className="mb-4">
              <SPRSGauge score={sprs} />
            </div>

            {/* Control families */}
            <div className="space-y-1.5 mb-3">
              {CONTROL_FAMILIES.map((cf, i) => (
                <div key={cf.id} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-600 w-6 flex-shrink-0">{cf.id}</span>
                  <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cf.pct}%` }}
                      transition={{ duration: 1.0 + i * 0.12, ease: [0.25, 0.4, 0.25, 1] }}
                      className={`h-full rounded-full ${cf.pct >= 80 ? "bg-emerald-500" : cf.pct >= 60 ? "bg-brand-400" : "bg-red-500/70"}`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 w-8 text-right flex-shrink-0">{cf.pct}%</span>
                </div>
              ))}
            </div>

            {/* Live CUI intercept */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
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
            <Zap className="w-3 h-3 text-brand-400" />
            <span className="text-[10px] font-mono text-brand-400">kaelus.online</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
