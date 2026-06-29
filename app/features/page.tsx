import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScanLine, FileCheck, Zap, RefreshCw, Fingerprint, Brain, Shield, Heart, Lock } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { BRAND } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Features | HoundShield — Local AI Compliance Firewall",
  description:
    "16 detection engines, sub-10ms local scanning, C3PAO-ready PDF export. Every HoundShield feature maps to a NIST 800-171 Rev 2 control for CMMC Level 2, HIPAA, and SOC 2.",
  alternates: { canonical: `${BRAND.url}/features` },
};

const FEATURES = [
  { icon: ScanLine, title: "Local Scanning", control: "SC.3.177", desc: "Every prompt is classified on your hardware before it leaves. No cloud hop, no third-party eyes on your data." },
  { icon: FileCheck, title: "C3PAO-Ready PDF", control: "CA.3.162", desc: "One-click audit export your assessor can accept the day of the visit. Evidence-ready, formatted for DIBCAC review." },
  { icon: Zap, title: "Zero-Friction Deploy", control: "CM.2.061", desc: "One proxy URL change. Works with ChatGPT, Copilot, Claude, and every OpenAI-compatible client. Live in minutes." },
  { icon: RefreshCw, title: "OODA Engine", control: "AU.2.041", desc: "Real-time Observe–Orient–Decide–Act loop surfaces violations as they happen and logs every decision for your audit trail." },
  { icon: Fingerprint, title: "16 CUI Patterns", control: "MP.2.120", desc: "Covering ITAR, EAR, PHI, PII, and classified markings. Regex + semantic dual-layer detection under 10ms." },
  { icon: Brain, title: "Brain AI", control: "AT.2.056", desc: "On-device knowledge graph answers “what controls do I still need?” without sending your gap analysis to any cloud." },
];

const FRAMEWORKS = [
  { id: "cmmc", icon: Shield, tag: "CMMC Level 2 · NIST 800-171 Rev 2", title: "Built for the November 2026 deadline", body: "HoundShield maps all 110 NIST 800-171 Rev 2 controls and calculates your live SPRS score. Because scanning is local, CUI never crosses your control boundary — satisfying NIST 3.13.1 and supporting CMMC Level 2 certification. Export the C3PAO-ready evidence package on demand." },
  { id: "soc2", icon: Lock, tag: "SOC 2 · Trust Services Criteria", title: "Security and confidentiality for AI data handling", body: "Prevent unauthorized disclosure of customer data through AI tools, maintain an immutable SHA-256 hash-chained audit trail, and hand your auditor exportable evidence of every control in action." },
  { id: "nist", icon: FileCheck, tag: "NIST SP 800-171 Rev 2", title: "Every intercept maps to a control", body: "14 control families, 110 practices. HoundShield links each AI intercept to the relevant control and shows your live SPRS impact per domain — Access Control, Audit & Accountability, System & Communications Protection, and the rest." },
  { id: "dfars", icon: Heart, tag: "DFARS 252.204-7012", title: "The fix can't be the violation", body: "Cloud AI-DLP tools transmit your CUI to their servers to scan it — itself a DFARS 7012 spill. HoundShield scans entirely within your boundary, so achieving compliance never creates a new incident." },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      <section className="spotlight relative pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-4 font-[var(--font-body)]">Features</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[var(--hs-ink)] leading-tight tracking-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
            One firewall. <span className="text-gradient-brand">Every framework.</span>
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] leading-relaxed max-w-2xl mx-auto font-[var(--font-body)]">
            Every feature maps to a NIST SP 800-171 Rev 2 control. CMMC Level 2, HIPAA, and SOC 2 — enforced on every request, locally.
          </p>
        </div>
      </section>

      <section className="py-14 border-y border-[var(--hs-border-subtle)] bg-[var(--hs-surface-2)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[["16", "Detection engines"], ["110", "NIST controls mapped"], ["<10ms", "Scan latency"], ["100%", "Local — zero cloud hop"]].map(([v, l]) => (
              <div key={l}>
                <div className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-1 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{v}</div>
                <div className="text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="spotlight py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-surface-1)]">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-4" style={{ fontFamily: "var(--font-display)" }}>Built for the audit. Not for the demo.</h2>
            <p className="text-base text-[var(--hs-ink-secondary)] max-w-xl mx-auto font-[var(--font-body)]">Every feature maps to a NIST SP 800-171 Rev 2 control.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-card p-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2 font-[var(--font-body)]">{f.title}</h3>
                  <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed mb-4 font-[var(--font-body)]">{f.desc}</p>
                  <span className="inline-block font-[var(--font-mono)] text-[11px] text-[var(--hs-steel-dark)] bg-[var(--hs-mist-md)] px-2 py-1 rounded-[6px]">{f.control}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {FRAMEWORKS.map((fw) => {
            const Icon = fw.icon;
            return (
              <div key={fw.id} id={fw.id} className="glass-card p-8 scroll-mt-24">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)] bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--hs-steel-dark)] font-[var(--font-mono)] mb-2">{fw.tag}</div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[var(--hs-ink)] mb-3" style={{ fontFamily: "var(--font-display)" }}>{fw.title}</h3>
                <p className="text-base text-[var(--hs-ink-secondary)] leading-relaxed max-w-3xl font-[var(--font-body)]">{fw.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--hs-navy)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-steel-dark)]/10 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>See it on your own prompts.</h2>
          <p className="text-base text-[var(--hs-sky)] mb-10 max-w-lg mx-auto font-[var(--font-body)]">Free to start, one URL change, live in ten minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--hs-navy)] bg-white rounded-[var(--radius-md)] hover:bg-[var(--hs-cream)] transition-colors font-[var(--font-body)]">Start free <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/how-it-works" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-white/20 rounded-[var(--radius-md)] hover:bg-white/10 transition-colors font-[var(--font-body)]">See how it works</Link>
          </div>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
