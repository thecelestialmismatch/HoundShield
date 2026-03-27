"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ShieldAlert,
  ClipboardCheck,
  Link2,
  Bot,
  FileText,
  KeyRound,
  ArrowUpRight,
} from "lucide-react";

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

const FEATURES = [
  {
    icon: ShieldAlert,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    title: "One Platform. All Frameworks.",
    desc: "SOC 2, HIPAA, and CMMC Level 2 enforced simultaneously — not separate products, not separate deployments. One firewall agent covers every regulatory obligation your organization faces today and as you grow.",
    span: "md:col-span-2", // wide card
  },
  {
    icon: ClipboardCheck,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    title: "CMMC Self-Assessment",
    desc: "Walk through all 110 NIST 800-171 controls with guided questions. Get your real SPRS score and know exactly which controls you're failing.",
    span: "md:col-span-1",
  },
  {
    icon: Link2,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border border-amber-500/20",
    title: "Cryptographic Audit Trail",
    desc: "Every compliance event is logged with a SHA-256 hash chain. Tamper-evident, export-ready. Give your C3PAO assessor exactly what they need.",
    span: "md:col-span-1",
  },
  {
    icon: Bot,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border border-indigo-500/20",
    title: "AI Compliance Assistant",
    desc: 'Ask "What are my top 5 risks?" and get answers based on your actual assessment data. Powered by multiple AI models through OpenRouter.',
    span: "md:col-span-1",
  },
  {
    icon: FileText,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    title: "PDF Compliance Reports",
    desc: "One-click export of your full compliance posture \u2014 SPRS score, control family breakdown, gap analysis, and remediation roadmap.",
    span: "md:col-span-1",
  },
  {
    icon: KeyRound,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border border-violet-500/20",
    title: "AES-256 Quarantine",
    desc: "Flagged content is encrypted and quarantined, never forwarded. Your team gets blocked with context. The AI never sees the sensitive data.",
    span: "md:col-span-1",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-24 md:py-32 overflow-hidden">
      {/* Section-unique gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 70% 20%, rgba(99,102,241,0.05) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 20% 80%, rgba(200,125,62,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            Features
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white">
            One platform.
            <br />
            <span className="italic text-brand-400">Every compliance framework.</span>
          </h2>
        </FadeIn>

        {/* Bento grid — 3 columns, first card spans 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <FadeIn key={feature.title} delay={i * 0.08} className={feature.span}>
                <div className="group h-full p-7 bg-white/[0.025] border border-white/[0.06] rounded-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-400/25 hover:bg-white/[0.045] hover:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(245,200,66,0.08)]">
                  {/* Hover glow sweep */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,200,66,0.04) 0%, transparent 70%)" }}
                  />
                  {/* Icon */}
                  <div className={`relative w-11 h-11 rounded-[10px] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${feature.iconBg}`}>
                    <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  {/* Arrow reveal */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 group-hover:translate-x-0">
                    <ArrowUpRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-brand-400 transition-colors duration-200">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
