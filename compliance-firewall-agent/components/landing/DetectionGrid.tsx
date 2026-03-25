"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Key, CreditCard, Fingerprint, HeartPulse,
  DollarSign, Mail, Globe, Lock,
  Code2, Coins, FileWarning, FlaskConical,
  ShieldAlert, Building2, MapPin, ScanFace,
} from "lucide-react";

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
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

const DETECTION_TYPES = [
  { icon: Key, title: "API Keys", example: "sk-proj-***, AKIA***", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { icon: Fingerprint, title: "SSN / Gov IDs", example: "123-45-6789", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { icon: CreditCard, title: "Credit Cards", example: "4111-****-****-1111", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { icon: HeartPulse, title: "Medical Data", example: "Patient names, Diagnosis", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { icon: DollarSign, title: "Financial Data", example: "Q4 Revenue, M&A terms", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { icon: Mail, title: "Emails / Phones", example: "user@company.com", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { icon: Globe, title: "Internal IPs", example: "192.168.x.x, *.corp", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  { icon: Lock, title: "Passwords", example: "DB passwords, tokens", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { icon: Code2, title: "Source Code", example: "private keys, schemas", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { icon: Coins, title: "Crypto Secrets", example: "Private keys, seeds", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { icon: FileWarning, title: "Legal Documents", example: "Contracts, NDAs", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { icon: FlaskConical, title: "Trade Secrets", example: "Formulas, blueprints", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { icon: ShieldAlert, title: "CUI / ITAR Data", example: "Export-controlled data", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { icon: Building2, title: "Corp Identifiers", example: "EIN, CAGE codes", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  { icon: MapPin, title: "PII Locations", example: "Home address, GPS", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { icon: ScanFace, title: "Biometric Data", example: "Face IDs, fingerprints", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
];

export function DetectionGrid() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Section gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            What We Detect
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
            16 Data Categories.
            <br />
            <span className="italic text-brand-400">Real-Time. Every Request.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-[560px] mx-auto">
            We scan for every type of sensitive data — from API keys to medical records — across every AI request your team makes.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {DETECTION_TYPES.map((item, i) => {
            const Icon = item.icon;
            const [textColor, bgColor, borderColor] = item.color.split(" ");
            return (
              <FadeIn key={item.title} delay={i * 0.03}>
                <div className="group relative p-5 rounded-xl bg-white/[0.03] border border-white/[0.07] overflow-hidden cursor-default hover:bg-white/[0.06] hover:border-brand-400/20 hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bgColor} border ${borderColor}`}>
                    <Icon className={`w-4 h-4 ${textColor}`} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                  <div className="text-[11px] text-slate-500 font-mono group-hover:text-brand-400 transition-colors">
                    {item.example}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
