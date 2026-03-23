"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

const INITIAL_EVENTS = [
  { badge: "BLOCKED", badgeClass: "bg-red-500/15 text-red-400", text: "API key in GPT-4 prompt", time: "2s ago" },
  { badge: "ALLOWED", badgeClass: "bg-emerald-500/15 text-emerald-400", text: "Code review request forwarded", time: "5s ago" },
  { badge: "FLAGGED", badgeClass: "bg-amber-500/15 text-amber-400", text: "SSN pattern detected, pending review", time: "9s ago" },
];

const NEW_EVENTS = [
  { badge: "BLOCKED", badgeClass: "bg-red-500/15 text-red-400", text: "Credit card PAN in Anthropic call", time: "now" },
  { badge: "ALLOWED", badgeClass: "bg-emerald-500/15 text-emerald-400", text: "Documentation query — clean", time: "1s ago" },
  { badge: "BLOCKED", badgeClass: "bg-red-500/15 text-red-400", text: "Password hash in Cursor prompt", time: "3s ago" },
  { badge: "FLAGGED", badgeClass: "bg-amber-500/15 text-amber-400", text: "Internal IP address found", time: "6s ago" },
  { badge: "ALLOWED", badgeClass: "bg-emerald-500/15 text-emerald-400", text: "Report generation — no CUI", time: "8s ago" },
];

const SCORE_CARDS = [
  { label: "SPRS SCORE", value: "+47", className: "text-amber-400" },
  { label: "EVENTS TODAY", value: "1,284", className: "text-indigo-400" },
  { label: "BLOCKED", value: "23", className: "text-red-400" },
];

const HOW_STEPS = [
  {
    num: "01",
    title: "Get your SPRS score",
    desc: "Run through all 110 NIST 800-171 controls in 10 minutes. Get your real score (-203 to +110) and a gap analysis showing exactly what you're failing.",
  },
  {
    num: "02",
    title: "Deploy the compliance firewall",
    desc: "Point your team's AI tools through gateway.kaelus.online. Every request gets scanned for CUI, PII, credentials, and controlled data — in real time.",
  },
  {
    num: "03",
    title: "Generate your audit trail",
    desc: "Every event is logged with a SHA-256 cryptographic hash chain. Export a full compliance report for your C3PAO assessment — in one click.",
  },
  {
    num: "04",
    title: "Stay compliant automatically",
    desc: "Real-time alerts when new violations are detected. AI-powered remediation roadmap that updates as you fix gaps. Always know where you stand.",
  },
];

export function DashboardMockup() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [eventIdx, setEventIdx] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setEvents((prev) => {
        const newEvent = NEW_EVENTS[eventIdx % NEW_EVENTS.length];
        return [newEvent, ...prev.slice(0, 3)];
      });
      setEventIdx((i) => i + 1);
    }, 2200);
    return () => clearInterval(interval);
  }, [isInView, eventIdx]);

  return (
    <section id="how" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-4">
            How It Works
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.1] text-gray-900">
            Two products.
            <br />
            One compliance stack.
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">
          {/* Steps */}
          <div className="flex flex-col gap-5">
            {HOW_STEPS.map((step) => (
              <div
                key={step.num}
                className="flex gap-4 items-start p-5 rounded-[14px] bg-gray-50 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-default"
              >
                <div className="w-[34px] h-[34px] flex-shrink-0 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[13px] font-bold text-indigo-600">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard Mockup */}
          <div
            className="rounded-2xl overflow-hidden border border-indigo-500/10 bg-[#0d0d14]"
            style={{
              transform: "perspective(1200px) rotateY(-8deg) rotateX(4deg)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.18), 0 0 0 1px rgba(99,102,241,0.12)",
              transition: "transform 0.4s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "perspective(1200px) rotateY(-4deg) rotateX(2deg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "perspective(1200px) rotateY(-8deg) rotateX(4deg)";
            }}
          >
            {/* Window bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-b border-indigo-500/15">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-500 ml-2 font-mono">Kaelus Command Center</span>
            </div>

            <div className="p-5">
              {/* Score cards */}
              <div className="flex gap-3 mb-4">
                {SCORE_CARDS.map((card) => (
                  <div
                    key={card.label}
                    className="flex-1 p-3.5 rounded-xl bg-white/[0.03] border border-indigo-500/15"
                  >
                    <div className="text-[11px] text-slate-500 mb-1 font-mono">{card.label}</div>
                    <div className={`text-[22px] font-extrabold font-mono ${card.className}`}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live event feed */}
              <div className="flex flex-col gap-2">
                {events.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/[0.02] text-xs"
                    style={{
                      animation: i === 0 ? "slideInLeft 0.4s ease both" : undefined,
                    }}
                  >
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${ev.badgeClass}`}>
                      {ev.badge}
                    </span>
                    <span className="text-slate-500 flex-1 truncate">{ev.text}</span>
                    <span className="text-slate-600 text-[11px] flex-shrink-0">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
