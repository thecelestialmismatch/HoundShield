"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const TESTIMONIALS = [
  {
    quote:
      "We deployed Kaelus in 15 minutes and it caught 47 sensitive data leaks in the first week that we had no idea were happening. Our CISO approved the budget on the spot.",
    metric: "47 leaks caught in Week 1",
    author: "Sarah Chen",
    role: "VP of Engineering · Series C FinTech Startup",
    initials: "SC",
    avatarClass: "bg-brand-400/15 text-brand-400",
  },
  {
    quote:
      "Before Kaelus, we had zero visibility into what our engineers were sending to AI. Now we have a complete audit trail that satisfies our SOC 2 auditors. It literally saved our compliance program.",
    metric: "SOC 2 audit passed in 3 weeks",
    author: "Marcus Williams",
    role: "CISO · Healthcare SaaS Platform",
    initials: "MW",
    avatarClass: "bg-emerald-500/15 text-emerald-400",
  },
  {
    quote:
      "The ReAct agent loop is what sets Kaelus apart. Other DLP tools flag everything. Kaelus actually understands context — it let through recipe prompts mentioning 'Apple' while blocking actual Apple Inc. financials.",
    metric: "0.01% false positive rate",
    author: "Dr. Keiko Tanaka",
    role: "Head of AI Safety · Enterprise Cloud Provider",
    initials: "KT",
    avatarClass: "bg-purple-500/15 text-purple-400",
  },
  {
    quote:
      "We were about to build our own DLP solution for AI traffic. Then we found Kaelus and integrated it in a single afternoon. The ROI was immediate — we estimated it saved us $400K in potential breach costs.",
    metric: "$400K saved in breach prevention",
    author: "James Rodriguez",
    role: "CTO · Legal Tech Unicorn",
    initials: "JR",
    avatarClass: "bg-rose-500/15 text-rose-400",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 bg-[#07070b]">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            Customer Stories
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
            Loved by{" "}
            <span className="italic text-brand-400">Security Teams</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-[520px] mx-auto">
            See why enterprise security leaders trust Kaelus to protect their most sensitive data.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.author} delay={i * 0.1}>
              <div className="relative p-8 rounded-[20px] bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] hover:border-brand-400/30 hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute top-6 right-6 text-[40px] text-white/10 leading-none select-none font-serif">
                  &rdquo;
                </div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-slate-400 leading-[1.75] italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-[11px] font-bold text-emerald-400 mb-5">
                  ✓ {t.metric}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold border border-white/10 flex-shrink-0 ${t.avatarClass}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.author}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
