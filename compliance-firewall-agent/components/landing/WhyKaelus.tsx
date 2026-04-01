"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Layers, Timer, FileCheck } from "lucide-react";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.4, 0.25, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

function AnimatedCount({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1400;
    const step = () => {
      start += 16;
      const pct = Math.min(start / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(ease * to));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* Card with cursor-tracked border glow */
function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [pos, setPos] = useState({ x: 0, y: 0, visible: false });
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current!.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
  };

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={() => setPos(p => ({ ...p, visible: false }))}
      className={`relative h-full rounded-2xl overflow-hidden group ${className}`}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Dynamic border glow */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: pos.visible ? 1 : 0,
          background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(99,102,241,0.15), transparent 60%)`,
        }} />
      {children}
    </div>
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
    stat: { label: "Avg cost reduction vs 3 tools", value: 73, suffix: "%" },
    accentColor: "text-brand-400",
    barColor: "bg-brand-400",
  },
  {
    icon: Timer,
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
    eyebrow: "vs. VPNs and endpoint agents",
    title: "Under 10ms.\nZero behaviour change.",
    body: "A single URL swap is all your engineers change. Kaelus sits inline at the gateway — invisible to users, impenetrable to leaks.",
    stat: { label: "Avg deploy time (minutes)", value: 15, suffix: "min" },
    accentColor: "text-emerald-400",
    barColor: "bg-emerald-400",
  },
  {
    icon: FileCheck,
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
    iconColor: "text-indigo-400",
    eyebrow: "vs. manual audit prep",
    title: "Audit-ready\nfrom day one.",
    body: "Every blocked query is logged in an immutable SHA-256 hash chain. Export your complete audit trail in seconds — SOC 2, HIPAA, or C3PAO.",
    stat: { label: "Audit findings prevented (avg)", value: 94, suffix: "%" },
    accentColor: "text-indigo-400",
    barColor: "bg-indigo-400",
  },
];

export function WhyKaelus() {
  return (
    <section className="relative py-24 px-6 bg-[#0d0d14]">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-3">Why Kaelus</p>
          <h2 className="text-[clamp(28px,4vw,46px)] font-editorial font-bold tracking-tight leading-[1.1] text-white">
            Better than the alternative
            <br />
            <span className="italic text-slate-400">in every direction.</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5">
          {PILLARS.map(({ icon: Icon, iconBg, iconColor, eyebrow, title, body, stat, accentColor, barColor }, i) => (
            <FadeIn key={eyebrow} delay={i * 0.1}>
              <GlowCard>
                <div className="relative z-10 h-full p-8 flex flex-col hover:-translate-y-1 transition-transform duration-300">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 border ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>

                  {/* Eyebrow */}
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-600 mb-3">{eyebrow}</p>

                  {/* Title */}
                  <h3 className="text-[clamp(17px,1.8vw,20px)] font-bold text-white leading-snug mb-3 whitespace-pre-line">{title}</h3>

                  {/* Body */}
                  <p className="text-sm text-slate-400 leading-relaxed">{body}</p>

                  {/* Animated stat */}
                  <div className="mt-6 pt-5 border-t border-white/[0.06]">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-[11px] text-slate-600">{stat.label}</span>
                      <span className={`text-lg font-black font-mono ${accentColor}`}>
                        <AnimatedCount to={stat.value} suffix={stat.suffix} />
                      </span>
                    </div>
                    {/* Animated progress bar */}
                    <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${barColor} rounded-full`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(stat.value, 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: i * 0.1 + 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </GlowCard>
            </FadeIn>
          ))}
        </div>

        {/* Bottom proof strip */}
        <FadeIn delay={0.4}>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-8">
            {[
              { metric: "23,000+", label: "AI threats blocked today" },
              { metric: "<10ms",   label: "Detection latency" },
              { metric: "3-in-1",  label: "Frameworks, one proxy URL" },
            ].map(({ metric, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black font-mono text-white mb-1">{metric}</div>
                <div className="text-[11px] text-slate-600 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
