"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Layers, Timer, FileCheck } from "lucide-react";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedCount({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1200;
    const step = () => {
      start += 16;
      const pct = Math.min(start / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(ease * to));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const PILLARS = [
  {
    icon: Layers,
    iconBg: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-700",
    eyebrow: "vs. buying 3 separate tools",
    title: "One deployment. Every framework.",
    body: "SOC 2, HIPAA, and CMMC Level 2 enforced simultaneously — not three separate products or vendors. One proxy, one dashboard, one bill.",
    stat: { label: "Avg cost reduction vs. 3 tools", value: 73, suffix: "%" },
    accentColor: "text-blue-700",
  },
  {
    icon: Timer,
    iconBg: "bg-[var(--hs-success-bg)] border-[rgba(5,150,105,0.25)]",
    iconColor: "text-[var(--hs-success)]",
    eyebrow: "vs. VPNs and endpoint agents",
    title: "Under 10ms. Zero behaviour change.",
    body: "A single URL swap is all your engineers change. houndshield sits inline at the gateway — invisible to users, impenetrable to leaks.",
    stat: { label: "Deploy time", value: 15, suffix: " min" },
    accentColor: "text-[var(--hs-success)]",
  },
  {
    icon: FileCheck,
    iconBg: "bg-brand-50 border-brand-200",
    iconColor: "text-brand-600",
    eyebrow: "vs. manual audit prep",
    title: "Audit-ready from day one.",
    body: "Every blocked query is logged in an immutable SHA-256 hash chain. Export your complete audit trail in seconds — SOC 2, HIPAA, or C3PAO.",
    stat: { label: "Audit findings prevented (avg)", value: 94, suffix: "%" },
    accentColor: "text-brand-600",
  },
];

export function WhyHoundshield() {
  return (
    <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 mb-3">Why houndshield</p>
          <h2 className="text-[clamp(26px,3.5vw,42px)] font-display font-bold tracking-tight leading-[1.1] text-slate-900">
            One tool does what three tools used to.
          </h2>
          <p className="mt-3 text-lg text-slate-600 max-w-xl leading-[1.6]">
            Most compliance stacks are three separate products that don&apos;t talk to each other.
            houndshield enforces all three frameworks from a single proxy URL.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5">
          {PILLARS.map(({ icon: Icon, iconBg, iconColor, eyebrow, title, body, stat, accentColor }, i) => (
            <FadeIn key={eyebrow} delay={i * 0.1}>
              <div className="h-full p-7 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-5 border ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">{eyebrow}</p>
                <h3 className="text-[17px] font-bold text-slate-900 leading-snug mb-3">{title}</h3>
                <p className="text-sm text-slate-600 leading-[1.6] flex-1">{body}</p>
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-end justify-between">
                  <span className="text-xs text-slate-500 max-w-[100px] leading-tight">{stat.label}</span>
                  <span className={`text-xl font-black font-mono ${accentColor}`}>
                    <AnimatedCount to={stat.value} suffix={stat.suffix} />
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.35}>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200 pt-8">
            {[
              { metric: "16",     label: "Detection engines" },
              { metric: "<10ms",  label: "Scan latency" },
              { metric: "3-in-1", label: "Frameworks, one URL" },
            ].map(({ metric, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black font-mono text-slate-900 mb-1">{metric}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
