import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle, ScanLine, FileText, Lock, Activity, ShieldCheck } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { BRAND } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "HIPAA Compliance for AI | HoundShield",
  description:
    "Stop PHI from leaking into ChatGPT, Copilot, and Claude. HoundShield detects all 18 HIPAA Safe Harbor identifiers locally in under 10ms, blocks them before they reach any AI provider, and logs HIPAA-compliant evidence. BAA available.",
  alternates: { canonical: `${BRAND.url}/hipaa` },
};

const STATS = [
  { v: "18", l: "Safe Harbor identifiers detected" },
  { v: "<10ms", l: "Local scan latency" },
  { v: "45 CFR 164", l: "Privacy & Security Rules" },
  { v: "BAA", l: "Available on Growth and above" },
];

const IDENTIFIERS = [
  "Names", "Geographic data", "Dates (DOB, admission)", "Phone numbers", "Fax numbers", "Email addresses",
  "Social Security numbers", "Medical record numbers", "Health plan beneficiary #", "Account numbers",
  "Certificate/license #", "Vehicle identifiers", "Device identifiers", "Web URLs", "IP addresses",
  "Biometric identifiers", "Full-face photos", "Any other unique ID",
];

const STEPS = [
  { icon: ScanLine, title: "Detect", body: "Every prompt your clinical staff send to an AI tool is scanned locally for all 18 PHI identifiers — names, MRNs, dates, SSNs, device IDs, and the rest — in under 10ms." },
  { icon: Lock, title: "Block", body: "If PHI is present, the prompt is blocked before it ever reaches ChatGPT, Copilot, Claude, or Gemini. The patient data never leaves your network." },
  { icon: FileText, title: "Prove", body: "Each event is logged with a SHA-256 hash chain — no PHI in plaintext — producing HIPAA-compliant audit evidence and a breach-risk summary on demand." },
];

export default function HipaaPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      <section className="spotlight relative pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-4 font-[var(--font-body)]">HIPAA · 45 CFR 164</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[var(--hs-ink)] leading-tight tracking-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Keep PHI out of <span className="text-gradient-brand">ChatGPT.</span>
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] leading-relaxed max-w-2xl mx-auto font-[var(--font-body)]">
            When clinical staff paste patient records into AI for documentation, it&apos;s a reportable breach. HoundShield detects all 18 HIPAA Safe Harbor identifiers locally and blocks them before they ever reach an AI provider.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/signup" className="btn-primary text-sm">Start free <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/how-it-works" className="btn-ghost text-sm">See how it works</Link>
          </div>
        </div>
      </section>

      <section className="py-14 border-y border-[var(--hs-border-subtle)] bg-[var(--hs-surface-2)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.l}>
                <div className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-1 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{s.v}</div>
                <div className="text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The risk */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-navy)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-steel-dark)]/10 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <AlertTriangle className="w-8 h-8 text-[var(--hs-sky)] mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>One pasted chart note is a breach.</h2>
          <p className="text-base text-[var(--hs-sky)]/80 max-w-2xl mx-auto font-[var(--font-body)]">
            Cloud AI-DLP tools scan PHI by sending it to their servers — relocating the exposure, not removing it. HoundShield scans inside your network, so the safeguard never becomes the disclosure.
          </p>
        </div>
      </section>

      {/* Detect / Block / Prove */}
      <section className="spotlight py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-surface-1)]">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-4" style={{ fontFamily: "var(--font-display)" }}>Detect. Block. Prove.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="glass-card p-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] mb-4"><Icon className="w-5 h-5" /></div>
                  <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2 font-[var(--font-body)]">{s.title}</h3>
                  <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed font-[var(--font-body)]">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 18 identifiers */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-4" style={{ fontFamily: "var(--font-display)" }}>All 18 Safe Harbor identifiers</h2>
            <p className="text-base text-[var(--hs-ink-secondary)] max-w-xl mx-auto font-[var(--font-body)]">Detected and blocked in real time — never stored in plaintext.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {IDENTIFIERS.map((id) => (
              <div key={id} className="flex items-center gap-2.5 glass-card px-4 py-3">
                <ShieldCheck className="w-4 h-4 text-[var(--hs-steel)] shrink-0" />
                <span className="text-sm text-[var(--hs-ink-secondary)] font-[var(--font-body)]">{id}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">
            <Activity className="w-4 h-4 text-[var(--hs-steel)]" /> Works with Epic, Cerner, and any OpenAI-compatible tool — no EHR changes.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--hs-navy)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-steel-dark)]/10 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>Protect PHI without slowing clinicians.</h2>
          <p className="text-base text-[var(--hs-sky)] mb-10 max-w-lg mx-auto font-[var(--font-body)]">Sub-10ms scanning, zero EHR changes, BAA available on Growth and above.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--hs-navy)] bg-white rounded-[var(--radius-md)] hover:bg-[var(--hs-cream)] transition-colors font-[var(--font-body)]">Start free <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-white/20 rounded-[var(--radius-md)] hover:bg-white/10 transition-colors font-[var(--font-body)]">Request a BAA</Link>
          </div>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
