"use client";

import { TextLogo } from "@/components/TextLogo";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AnimatedSection } from "@/components/landing/animated-section";
import {
  Zap, Lock, Eye, Radar, FileCheck, Fingerprint,
  CheckCircle2, ArrowRight, Shield, ShieldCheck, Globe,
  Scale, Heart, BadgeCheck, Terminal,
} from "lucide-react";

const features = [
  { icon: Zap, title: "Real-Time Interception", stat: "<50ms", desc: "Sub-50ms P99 latency. Zero-copy stream scanning on every LLM request.", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: Lock, title: "Encrypted Quarantine", stat: "AES-256", desc: "Flagged prompts encrypted at rest. Zero plaintext storage. HITL review.", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: Eye, title: "Immutable Audit Trail", stat: "SHA-256", desc: "Every event in a tamper-proof hash chain. One-click integrity verification.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: Radar, title: "16 Detection Patterns", stat: "16", desc: "PII, financial, IP, medical, strategic data. Regex + NER + contextual.", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { icon: FileCheck, title: "1-Click Reports", stat: "1-Click", desc: "Board-ready compliance reports. SOC 2, GDPR, HIPAA, EU AI Act.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { icon: Fingerprint, title: "Zero Trust", stat: "Zero", desc: "Continuous verification. Least-privilege. Microsegmented data flows.", color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
];

const compliance = [
  { name: "SOC 2 Type II", icon: ShieldCheck, color: "text-emerald-400" },
  { name: "GDPR", icon: Globe, color: "text-blue-400" },
  { name: "EU AI Act", icon: Scale, color: "text-brand-400" },
  { name: "HIPAA", icon: Heart, color: "text-pink-400" },
  { name: "ISO 27001", icon: BadgeCheck, color: "text-amber-400" },
  { name: "PCI DSS", icon: Shield, color: "text-white/40" },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <AnimatedSection>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-400 font-semibold mb-4">Feature Overview</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              Everything in <span className="text-gradient-brand">Kaelus</span>
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8 leading-relaxed">
              A quick-reference of every capability. For deep dives, interactive demos, and live simulations,{" "}
              <Link href="/" className="text-brand-400 hover:text-brand-300 underline underline-offset-4 transition-colors">
                visit our homepage
              </Link>.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <AnimatedSection key={f.title} delay={i * 80}>
                <div className="glass-card-glow p-7 h-full group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${f.bg} border flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <span className="text-lg font-bold text-white/80">{f.stat}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight">Compliance Ready</h2>
          </AnimatedSection>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {compliance.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.name} className="flex items-center gap-2 glass-card px-5 py-3">
                  <Icon className={`w-5 h-5 ${c.color}`} />
                  <span className="text-sm font-semibold text-white/70">{c.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to see it in action?</h2>
            <p className="text-white/40 mb-8">
              Explore our interactive demo, live scanner, and architecture deep-dive on the homepage.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/" className="btn-primary px-8 py-3.5">
                Explore Full Demo <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth" className="btn-ghost px-8 py-3.5">
                <Terminal className="w-4 h-4" /> Start Free Trial
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <TextLogo />
          </Link>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-white/20">
          &copy; {new Date().getFullYear()} Kaelus.ai — All rights reserved.
        </div>
      </footer>
    </div>
  );
}
