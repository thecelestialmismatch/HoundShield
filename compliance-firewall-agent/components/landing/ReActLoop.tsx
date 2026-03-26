"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

const STEPS = [
  {
    icon: "👁️",
    colorClass: "bg-blue-500/12 border-blue-500/30",
    name: "Observe",
    eli5: "The Detective looks at the backpack.",
    desc: "Agent reads the full prompt context and metadata",
  },
  {
    icon: "🧠",
    colorClass: "bg-purple-500/12 border-purple-500/30",
    name: "Think",
    eli5: 'He thinks, "Wait, is that a recipe?"',
    desc: "Agent reasons about data sensitivity and context",
  },
  {
    icon: "⚡",
    colorClass: "bg-amber-500/12 border-amber-500/30",
    name: "Act",
    eli5: "He checks his rulebook and makes a call.",
    desc: "Agent runs external database queries via 8 tools",
  },
  {
    icon: "🔄",
    colorClass: "bg-emerald-500/12 border-emerald-500/30",
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
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-4">
            The Intelligence Engine
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.1] text-gray-900 mb-4">
            We Don't Just Scan.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              We Think.
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-[580px] mx-auto">
            Traditional DLP tools use regex and flag everything. Kaelus uses a ReAct agent loop — 13 AI models reasoning about context — to achieve a 99.9% detection rate with only 0.01% false positives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {STEPS.map((step, i) => {
            const isActive = activeStep === i;
            return (
              <button
                key={step.name}
                onClick={() => setActiveStep(i)}
                className={`relative text-left p-7 rounded-[18px] border overflow-hidden transition-all duration-400 cursor-pointer ${
                  isActive
                    ? "bg-indigo-50 border-indigo-300 shadow-sm -translate-y-1"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-[18px] flex items-center justify-center text-[26px] mx-auto mb-4 border-2 transition-all duration-400 ${step.colorClass} ${isActive ? "scale-110" : ""}`}
                >
                  {step.icon}
                </div>
                <div className="text-base font-extrabold text-gray-900 mb-2 text-center">{step.name}</div>
                <div className="text-[13px] text-indigo-600 font-medium mb-2.5 text-center">{step.eli5}</div>
                <div className="text-[12px] text-gray-500 font-mono leading-relaxed text-center border-t border-gray-200 pt-2.5">
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
