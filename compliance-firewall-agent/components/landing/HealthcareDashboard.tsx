"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, ClipboardList, ShieldAlert,
  Users, BarChart3, Zap, ChevronRight, AlertTriangle,
} from "lucide-react";

const PHI_EVENTS = [
  {
    source: "ehr-assist",
    identifiers: ["Name", "DOB", "SSN", "MRN", "ZIP Code", "Phone"],
    count: 6,
    detail: "Patient intake form pasted into ChatGPT",
    status: "BLOCKED" as const,
  },
  {
    source: "clinic-chatbot",
    identifiers: ["Name", "Diagnosis", "MRN", "DOB"],
    count: 4,
    detail: "Discharge summary sent to AI writing tool",
    status: "QUARANTINED" as const,
  },
  {
    source: "billing-ai",
    identifiers: ["SSN", "Insurance ID", "Account #", "Name", "DOB"],
    count: 5,
    detail: "Insurance claim data in AI prompt",
    status: "BLOCKED" as const,
  },
];

const IDENTIFIER_GROUPS = [
  { label: "Direct Identifiers", items: ["Name", "SSN", "MRN", "Account #"], done: true },
  { label: "Geographic",          items: ["ZIP Code", "Street Address"],        done: true },
  { label: "Temporal",            items: ["DOB", "Admission Date", "Discharge"], done: true },
  { label: "Contact",             items: ["Phone", "Fax", "Email", "URL"],      done: true },
  { label: "Device / Biometric",  items: ["Device ID", "IP Address", "Photos"], done: false },
];

const NAV_ITEMS = [
  { icon: BarChart3,    label: "PHI Monitor", active: true },
  { icon: ClipboardList,label: "HIPAA Audit" },
  { icon: ShieldAlert,  label: "Risk Score" },
  { icon: Users,        label: "Care Teams" },
];

const STATUS_STYLES = {
  BLOCKED:     { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  QUARANTINED: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

export function HealthcareDashboard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phiBlocked, setPhiBlocked] = useState(1247);
  const [penaltySaved, setPenaltySaved] = useState(1.9);

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
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.active ? "text-emerald-400" : "text-slate-600"}`} />
                  <span className={`text-[11px] font-medium ${item.active ? "text-emerald-400" : "text-slate-600"}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}

            {/* HIPAA badge */}
            <div className="mx-2 mt-4 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-1.5 mb-1">
                <HeartPulse className="w-3 h-3 text-red-400" />
                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">HIPAA</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold">18/18</div>
              <div className="text-[9px] font-mono text-slate-600">identifiers</div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-h-[230px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                PHI Intercept — Critical
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-600">live</span>
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
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500">Source: {event.source}</span>
                    <p className="text-[11px] font-mono text-slate-300 mt-0.5">{event.detail}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0 ml-2 ${sc.bg} ${sc.text} border ${sc.border}`}>
                    {event.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {event.identifiers.map((id) => (
                    <span key={id} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      {id}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="text-[10px] font-mono text-slate-500">{event.count}/18 HIPAA identifiers · PHI not transmitted</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Identifier coverage */}
            <div className="space-y-1.5">
              {IDENTIFIER_GROUPS.slice(0, 3).map((g) => (
                <div key={g.label} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${g.done ? "bg-emerald-500" : "bg-slate-700"}`} />
                  <span className="text-[10px] font-mono text-slate-500 w-32 flex-shrink-0">{g.label}</span>
                  <div className="flex flex-wrap gap-1">
                    {g.items.map((item) => (
                      <span key={item} className="text-[9px] font-mono text-slate-600">{item}</span>
                    ))}
                  </div>
                  <span className={`ml-auto text-[9px] font-mono font-bold flex-shrink-0 ${g.done ? "text-emerald-400" : "text-slate-600"}`}>
                    {g.done ? "✓" : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-600">HIPAA Safe Harbor · 18 identifier scanner · &lt;10ms</span>
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
