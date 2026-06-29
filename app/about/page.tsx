import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, Shield, Eye, Gauge, FileCheck, Server } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { BRAND } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About HoundShield | Local-only AI Compliance Firewall",
  description:
    "Why HoundShield exists: ~80,000 US defense contractors need CMMC Level 2 by November 2026, and every cloud AI-DLP tool leaks CUI to scan it. We scan locally. Nothing leaves your network.",
  alternates: { canonical: `${BRAND.url}/about` },
};

const STATS = [
  { value: "~80,000", label: "US contractors need CMMC Level 2" },
  { value: "110", label: "NIST 800-171 Rev 2 controls mapped" },
  { value: "<10ms", label: "Local scan latency, median" },
  { value: "Nov 2026", label: "CMMC Level 2 enforcement deadline" },
];

const VALUES = [
  { icon: Server, title: "Local-only by architecture", desc: "Prompt content is scanned on your hardware and never leaves your network. This isn't a setting — it's the design. It's also why a cloud DLP tool can't copy us without a rebuild." },
  { icon: Shield, title: "Defense-grade scope", desc: "We map all 110 NIST 800-171 Rev 2 controls so you don't decode the framework yourself. CUI, ITAR/EAR, FOUO, CAGE codes, contract numbers — detected in real time." },
  { icon: FileCheck, title: "Built for the audit", desc: "Every feature maps to a control and produces evidence. The deliverable isn't a dashboard — it's the C3PAO-ready PDF you hand your assessor." },
  { icon: Eye, title: "Tamper-evident", desc: "SHA-256 hash-chained audit logs. Each entry references the last, so the record can't be quietly altered after the fact." },
  { icon: Gauge, title: "Zero-friction", desc: "One environment-variable change points your AI tools at HoundShield. No agents, no firewall rules, no user retraining. Live in minutes." },
  { icon: Lock, title: "No data, no exposure", desc: "We can't lose what we never hold. Only a license-key hash and a prompt count leave for billing — never prompt content." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      {/* Hero */}
      <section className="spotlight relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-4 font-[var(--font-body)]">
            About {BRAND.name}
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[var(--hs-ink)] leading-tight tracking-tight mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Compliance shouldn&apos;t be gated by{" "}
            <span className="text-gradient-brand">budget.</span>
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] leading-relaxed max-w-2xl mx-auto font-[var(--font-body)]">
            Around 80,000 US defense contractors need CMMC Level 2 by November 2026. Most can&apos;t
            afford six-figure consultants — and the AI tools their teams already use are quietly
            leaking CUI. We built {BRAND.name} to close that gap for a price a 30-person shop can pay.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-14 border-y border-[var(--hs-border-subtle)] bg-[var(--hs-surface-2)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-1 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                  {s.value}
                </div>
                <div className="text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-navy)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-steel-dark)]/10 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-sky)] uppercase mb-3 font-[var(--font-body)]">
            Our mission
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white leading-snug mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Make CMMC compliance reachable for every defense contractor — from sole proprietors to
            mid-tier primes — so protecting national security is never a question of budget.
          </h2>
          <p className="text-base text-[var(--hs-sky)]/80 max-w-2xl mx-auto font-[var(--font-body)]">
            Every cloud AI-DLP tool sends your CUI to its servers to scan it. Under DFARS 7012 that
            transfer is itself a spill. {BRAND.name} scans locally — so the fix can&apos;t become the violation.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="spotlight py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-surface-1)]">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-4" style={{ fontFamily: "var(--font-display)" }}>
              What we stand for
            </h2>
            <p className="text-base text-[var(--hs-ink-secondary)] max-w-xl mx-auto font-[var(--font-body)]">
              Six principles that show up in the architecture, not just the marketing.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="glass-card p-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2 font-[var(--font-body)]">{v.title}</h3>
                  <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed font-[var(--font-body)]">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--hs-navy)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-steel-dark)]/10 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Start your assessment today.
          </h2>
          <p className="text-base text-[var(--hs-sky)] mb-10 max-w-lg mx-auto font-[var(--font-body)]">
            Free to start, no card required. See your AI compliance gaps in ten minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--hs-navy)] bg-white rounded-[var(--radius-md)] hover:bg-[var(--hs-cream)] transition-colors font-[var(--font-body)]"
            >
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-white/20 rounded-[var(--radius-md)] hover:bg-white/10 transition-colors font-[var(--font-body)]"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
