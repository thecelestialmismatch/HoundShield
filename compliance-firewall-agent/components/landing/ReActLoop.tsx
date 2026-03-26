"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { Eye, Cpu, Zap, RefreshCw } from "lucide-react";

const STEPS = [
  {
    Icon: Eye,
    iconColor: "text-blue-400",
    ringClass: "bg-blue-500/10 border-blue-500/25",
    name: "Observe",
    eli5: "The Detective looks at the backpack.",
    desc: "Agent reads the full prompt context and metadata",
  },
  {
    Icon: Cpu,
    iconColor: "text-purple-400",
    ringClass: "bg-purple-500/10 border-purple-500/25",
    name: "Think",
    eli5: 'He thinks, "Wait, is that a recipe?"',
    desc: "Agent reasons about data sensitivity and context",
  },
  {
    Icon: Zap,
    iconColor: "text-amber-400",
    ringClass: "bg-amber-500/10 border-amber-500/25",
    name: "Act",
    eli5: "He checks his rulebook and makes a call.",
    desc: "Agent runs external database queries via 8 tools",
  },
  {
    Icon: RefreshCw,
    iconColor: "text-emerald-400",
    ringClass: "bg-emerald-500/10 border-emerald-500/25",
    name: "Iterate",
    eli5: "He keeps checking until it's safe.",
    desc: "Agent confirms threat neutralization via loop",
  },
];

export function ReActLoop() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section ref={ref} className="py-24 md:py-32 bg-[#07070b]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            The Intelligence Engine
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.1] text-white mb-4">
            We Don&apos;t Just Scan.{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              We Think.
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-[580px] mx-auto">
            Traditional DLP tools use regex and flag everything. Kaelus uses a ReAct agent loop — 13 AI models reasoning about context — to achieve a 99.9% detection rate with only 0.01% false positives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {STEPS.map((step, i) => {
            const isActive = activeStep === i;
            const Icon = step.Icon;
            return (
              <button
                key={step.name}
                onClick={() => setActiveStep(i)}
                className={`relative text-left p-7 rounded-[18px] border overflow-hidden transition-all duration-400 cursor-pointer ${
                  isActive
                    ? "bg-white/[0.05] border-indigo-500/40 -translate-y-1"
                    : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15]"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-4 border-2 transition-all duration-400 ${step.ringClass} ${isActive ? "scale-110" : ""}`}
                >
                  <Icon className={`w-7 h-7 ${step.iconColor}`} />
                </div>
                <div className="text-base font-extrabold text-white mb-2 text-center">{step.name}</div>
                <div className={`text-[13px] font-medium mb-2.5 text-center ${step.iconColor}`}>{step.eli5}</div>
                <div className="text-[12px] text-white/35 font-mono leading-relaxed text-center border-t border-white/[0.06] pt-2.5">
                  {step.desc}
                </div>
                {/* Progress bar at bottom */}
                <div
                  className={`absolute bottom-0 left-0 h-[3px] rounded-b-[18px] bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all ${isActive ? "duration-[2500ms]" : "duration-0"}`}
                  style={{ width: isActive ? "100%" : "0%" }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
