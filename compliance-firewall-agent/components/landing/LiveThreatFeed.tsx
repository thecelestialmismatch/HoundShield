"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ThreatEvent {
  id: number;
  timestamp: string;
  type: "BLOCKED" | "REDACTED" | "QUARANTINED";
  category: string;
  detail: string;
  source: string;
}

const THREAT_POOL: Omit<ThreatEvent, "id" | "timestamp">[] = [
  { type: "BLOCKED", category: "CUI", detail: "CAGE code 7X4K2 detected in prompt", source: "eng-team-3" },
  { type: "REDACTED", category: "PII", detail: "SSN pattern ***-**-**** redacted", source: "hr-copilot" },
  { type: "BLOCKED", category: "PHI", detail: "Patient DOB + diagnosis intercepted", source: "clinic-ai" },
  { type: "QUARANTINED", category: "SECRET", detail: "AWS_SECRET_ACCESS_KEY in code block", source: "dev-assist" },
  { type: "BLOCKED", category: "CUI", detail: "Contract FA8802-24-C-0031 reference", source: "procurement" },
  { type: "REDACTED", category: "PII", detail: "Credit card 4***-****-****-7890", source: "support-bot" },
  { type: "BLOCKED", category: "SOURCE", detail: "Proprietary algorithm detectBreach()", source: "eng-copilot" },
  { type: "QUARANTINED", category: "PHI", detail: "HIPAA Safe Harbor: 6 identifiers found", source: "ehr-assist" },
  { type: "BLOCKED", category: "FOUO", detail: "FOUO document header detected", source: "doc-review" },
  { type: "REDACTED", category: "PII", detail: "Email + phone in employee record", source: "hr-chatbot" },
  { type: "BLOCKED", category: "IP", detail: "Trade secret: formula ZK-7 composition", source: "r-and-d-ai" },
  { type: "QUARANTINED", category: "SECRET", detail: "STRIPE_SECRET_KEY in prompt body", source: "dev-assist" },
  { type: "BLOCKED", category: "CUI", detail: "NIST 800-171 assessment raw scores", source: "compliance" },
  { type: "REDACTED", category: "PHI", detail: "MRN-4482917 patient name stripped", source: "clinic-ai" },
  { type: "BLOCKED", category: "SOURCE", detail: "Internal API endpoint /v2/auth/token", source: "eng-team-1" },
];

const TYPE_COLORS: Record<ThreatEvent["type"], { bg: string; text: string; dot: string }> = {
  BLOCKED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  REDACTED: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  QUARANTINED: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-500" },
};

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function LiveThreatFeed() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [count, setCount] = useState(2847);
  const idRef = useRef(0);
  const poolIndexRef = useRef(0);

  const addEvent = useCallback(() => {
    const template = THREAT_POOL[poolIndexRef.current % THREAT_POOL.length];
    poolIndexRef.current += 1;
    idRef.current += 1;

    const newEvent: ThreatEvent = {
      ...template,
      id: idRef.current,
      timestamp: formatTime(),
    };

    setEvents((prev) => [newEvent, ...prev].slice(0, 5));
    setCount((c) => c + 1);
  }, []);

  useEffect(() => {
    // Seed initial events
    const seeds: ThreatEvent[] = [];
    for (let i = 0; i < 3; i++) {
      idRef.current += 1;
      poolIndexRef.current += 1;
      seeds.push({
        ...THREAT_POOL[i],
        id: idRef.current,
        timestamp: formatTime(),
      });
    }
    setEvents(seeds);

    const interval = setInterval(addEvent, 2800);
    return () => clearInterval(interval);
  }, [addEvent]);

  return (
    <div className="w-full max-w-[540px] mx-auto">
      {/* Terminal chrome */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0a0a12] overflow-hidden shadow-2xl shadow-black/40">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="ml-2 text-[11px] font-mono text-slate-500">
              kaelus — threat-monitor
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Counter bar */}
        <div className="px-4 py-2 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
            Threats intercepted today
          </span>
          <motion.span
            key={count}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-mono font-bold text-white tabular-nums"
          >
            {count.toLocaleString()}
          </motion.span>
        </div>

        {/* Event feed */}
        <div className="p-2 min-h-[220px] space-y-0.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {events.map((event) => {
              const colors = TYPE_COLORS[event.type];
              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                  className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  {/* Dot */}
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                        {event.type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600">
                        {event.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-700 ml-auto flex-shrink-0">
                        {event.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      {event.detail}
                    </p>
                    <span className="text-[10px] font-mono text-slate-600">
                      src: {event.source}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom status */}
        <div className="px-4 py-2 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-600">
            16 detection engines active
          </span>
          <span className="text-[10px] font-mono text-emerald-500/70">
            latency: &lt;48ms
          </span>
        </div>
      </div>
    </div>
  );
}
