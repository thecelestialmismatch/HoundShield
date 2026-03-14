"use client";

import React, { useRef, useState } from "react";
import { useScroll, useMotionValueEvent, motion, AnimatePresence } from "framer-motion";
import { Shield, ScanSearch, Lock, FileCheck } from "lucide-react";

interface StickyScrollItem {
  title: string;
  description: string;
  media: {
    type: "video" | "image";
    src: string;
    alt?: string;
  };
}

interface StickyScrollProps {
  content: StickyScrollItem[];
  containerClassName?: string;
}

// Inline style configs to avoid Tailwind dynamic class purging
const STEP_VISUALS = [
  {
    icon: Shield,
    gradientStyle: "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(79,70,229,0.15) 50%, rgba(30,27,75,0.4) 100%)",
    accentColor: "#818cf8",
    orbColor: "rgba(99,102,241,0.12)",
    label: "INTERCEPT",
  },
  {
    icon: ScanSearch,
    gradientStyle: "linear-gradient(135deg, rgba(6,182,212,0.25) 0%, rgba(37,99,235,0.15) 50%, rgba(30,27,75,0.4) 100%)",
    accentColor: "#22d3ee",
    orbColor: "rgba(6,182,212,0.12)",
    label: "SCAN",
  },
  {
    icon: Lock,
    gradientStyle: "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(234,88,12,0.15) 50%, rgba(127,29,29,0.4) 100%)",
    accentColor: "#fbbf24",
    orbColor: "rgba(245,158,11,0.12)",
    label: "QUARANTINE",
  },
  {
    icon: FileCheck,
    gradientStyle: "linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(5,150,105,0.15) 50%, rgba(19,78,74,0.4) 100%)",
    accentColor: "#34d399",
    orbColor: "rgba(16,185,129,0.12)",
    label: "AUDIT",
  },
];

export const StickyScroll = ({ content, containerClassName = "" }: StickyScrollProps) => {
  const [activeCard, setActiveCard] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardProgress = 1 / cardLength;
    const cardsPast = Math.floor(latest / cardProgress);
    if (cardsPast >= 0 && cardsPast < cardLength) {
      setActiveCard(cardsPast);
    }
  });

  return (
    <div
      ref={ref}
      className={`relative flex flex-col md:flex-row max-w-6xl mx-auto ${containerClassName}`}
      style={{ height: `${cardLength * 75}vh` }}
    >
      {/* Scrollable Content Side (Left) */}
      <div className="w-full md:w-1/2 relative h-full">
        {content.map((item, index) => (
          <div
            key={item.title + index}
            className="h-[75vh] flex flex-col justify-center px-6 md:px-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: activeCard === index ? 1 : 0.2,
                y: activeCard === index ? 0 : 20,
              }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                {item.title}
              </h3>
              <p className="text-lg text-slate-900/50 leading-relaxed max-w-md">
                {item.description}
              </p>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Sticky Visual Side (Right) */}
      <div className="hidden md:flex w-1/2 sticky top-0 h-screen items-center justify-center py-20 px-6">
        <div className="w-full h-[60vh] md:h-[70vh] rounded-3xl overflow-hidden relative border border-white/[0.06]" style={{ backgroundColor: "#0a0a14" }}>
          <AnimatePresence mode="popLayout">
            {content.map((item, index) => {
              if (activeCard !== index) return null;
              const visual = STEP_VISUALS[index] || STEP_VISUALS[0];
              const Icon = visual.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full"
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0" style={{ background: visual.gradientStyle }} />

                  {/* Grid pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                      backgroundSize: "40px 40px",
                    }}
                  />

                  {/* Floating orb (inline styles for color) */}
                  <motion.div
                    className="absolute w-64 h-64 rounded-full"
                    style={{ backgroundColor: visual.orbColor, filter: "blur(80px)", top: "20%", left: "30%" }}
                    animate={{
                      x: [0, 30, -20, 0],
                      y: [0, -40, 20, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Second smaller orb */}
                  <motion.div
                    className="absolute w-32 h-32 rounded-full"
                    style={{ backgroundColor: visual.orbColor, filter: "blur(60px)", bottom: "25%", right: "20%" }}
                    animate={{
                      x: [0, -20, 15, 0],
                      y: [0, 20, -30, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Center icon + label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <motion.div
                      className="w-24 h-24 rounded-2xl border flex items-center justify-center backdrop-blur-sm"
                      style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
                      animate={{ rotate: [0, 2, -2, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Icon className="w-10 h-10" style={{ color: visual.accentColor, opacity: 0.7 }} strokeWidth={1.5} />
                    </motion.div>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: visual.accentColor }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-xs font-mono tracking-[0.3em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {visual.label}
                      </span>
                    </div>

                    {/* Step indicator */}
                    <div className="flex gap-2 mt-4">
                      {content.map((_, i) => (
                        <div
                          key={i}
                          className="h-1 rounded-full transition-all duration-500"
                          style={{
                            width: i === index ? "32px" : "8px",
                            backgroundColor: i === index ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Subtle vignette */}
                  <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)" }} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
