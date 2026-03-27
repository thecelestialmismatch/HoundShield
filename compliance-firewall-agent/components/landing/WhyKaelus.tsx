"use client";

import { useRef } from "react";
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

const PILLARS = [
  {
    icon: Layers,
    iconBg: "bg-brand-400/10 border-brand-400/20",
    iconColor: "text-brand-400",
    eyebrow: "vs. buying 3 separate tools",
    title: "One deployment.\nEvery framework.",
    body: "SOC 2, HIPAA, and CMMC Level 2 enforced simultaneously — not three separate products or vendors. One proxy, one dashboard, one bill.",
  },
  {
    icon: Timer,
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
    eyebrow: "vs. VPNs and endpoint agents",
    title: "Under 10ms.\nZero behaviour change.",
    body: "A single URL swap is all your engineers change. Kaelus sits inline at the gateway — invisible to users, impenetrable to leaks.",
  },
  {
    icon: FileCheck,
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
    iconColor: "text-indigo-400",
    eyebrow: "vs. manual audit prep",
    title: "Audit-ready\nfrom day one.",
    body: "Every blocked query is logged in an immutable SHA-256 hash chain. Export your complete audit trail in seconds — SOC 2, HIPAA, or C3PAO.",
  },
];

export function WhyKaelus() {
  return (
    <section className="relative py-24 px-6 bg-[#0d0d14]">
      {/* Hairline top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-3">
            Why Kaelus
          </p>
          <h2 className="text-[clamp(28px,4vw,46px)] font-editorial font-bold tracking-tight leading-[1.1] text-white">
            Better than the alternative
            <br />
            <span className="italic text-slate-400">in every direction.</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5">
          {PILLARS.map(({ icon: Icon, iconBg, iconColor, eyebrow, title, body }, i) => (
            <FadeIn key={eyebrow} delay={i * 0.1}>
              <div className="h-full p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.13] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 border ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>

                {/* Eyebrow */}
                <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-600 mb-3">
                  {eyebrow}
                </p>

                {/* Title — whitespace preserved */}
                <h3 className="text-[clamp(17px,1.8vw,20px)] font-bold text-white leading-snug mb-3 whitespace-pre-line">
                  {title}
                </h3>

                {/* Body */}
                <p className="text-sm text-slate-400 leading-relaxed mt-auto">
                  {body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
