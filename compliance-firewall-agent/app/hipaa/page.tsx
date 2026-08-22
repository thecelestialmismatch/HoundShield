"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Scan,
  FileText,
  Lock,
  Activity,
} from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { FaqSection } from "@/components/seo/FaqSection";
import { hipaaFaqs } from "@/lib/seo/faqs";
import { CROSS_INDUSTRY_GENAI, REGULATED_SHARE_GENAI } from "@/lib/market/netskope";
import { ScrollProgressBar } from "@/components/scroll-effects";

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
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PHI_IDENTIFIERS = [
  "Patient names",
  "Geographic data (street, city, zip)",
  "Dates (DOB, admission, discharge)",
  "Phone & fax numbers",
  "Email addresses",
  "Social Security Numbers",
  "Medical record numbers (MRN)",
  "Health plan beneficiary IDs",
  "Account numbers",
  "Certificate/license numbers",
  "Vehicle identifiers (VIN)",
  "Device identifiers & serials",
  "URLs & IP addresses",
  "Biometric identifiers",
  "Full-face photographs",
  "Medicare/Medicaid IDs",
  "Encounter/visit IDs",
  "Any unique identifying number",
];

const FEATURES = [
  {
    icon: Scan,
    title: "Real-Time PHI Scanning",
    desc: "Intercept every AI query before it leaves your network. Detect all 18 HIPAA Safe Harbor identifiers in <10ms.",
  },
  {
    icon: Lock,
    title: "Block Before It Leaks",
    desc: "Automatically quarantine or block prompts containing PHI. AES-256 encrypted quarantine vault for review.",
  },
  {
    icon: FileText,
    title: "HIPAA Control Mapping",
    desc: "Map your AI security posture to all 18 HIPAA Security Rule controls. Generate audit-ready compliance reports.",
  },
  {
    icon: Activity,
    title: "Tamper-Evident Audit Trail",
    desc: "SHA-256 hash-chained audit log. Every AI interaction recorded with evidence you can hand to an auditor.",
  },
];

export default function HIPAAPage() {
  return (
    <div className="bg-[var(--hs-surface-0)] min-h-screen relative section-stripe">
      <ScrollProgressBar />
      <NavV3 />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center overflow-hidden pt-8 pb-20">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.15] pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(5,150,105,0.2)] bg-[rgba(5,150,105,0.08)] text-[var(--hs-success)] text-xs font-semibold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--hs-success)] animate-pulse" />
              HIPAA Security Rule · 45 CFR Part 164 · Healthcare AI Compliance
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-editorial text-[clamp(36px,6vw,72px)] font-bold leading-[1.05] tracking-[-1px] max-w-[900px] mx-auto mb-6 text-[var(--hs-ink)]"
          >
            AI Compliance Firewall for{" "}
            <span className="italic bg-gradient-to-r from-[var(--hs-steel-dark)] via-[var(--hs-steel)] to-[var(--hs-sky)] bg-clip-text text-transparent">
              Healthcare
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[clamp(16px,2vw,20px)] text-[var(--hs-ink-secondary)] max-w-[640px] mx-auto mb-10 leading-relaxed"
          >
            Stop PHI from leaking into ChatGPT, Microsoft Copilot, and Claude.
            Get the $499 report — and run self-hosted (Mode&nbsp;B) for live PHI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--hs-steel-dark)] hover:bg-[var(--hs-steel)] text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(129,166,198,0.35)] text-base"
            >
              Scan Your AI Risk Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-white/[0.10] text-[var(--hs-ink)] font-semibold rounded-xl border border-[var(--hs-border)] hover:border-[var(--hs-border-strong)] transition-all hover:-translate-y-0.5 text-base"
            >
              See a Live Demo
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-sm text-[var(--hs-ink-tertiary)] max-w-[640px] mx-auto mb-12 leading-relaxed"
          >
            <strong className="text-[var(--hs-ink-secondary)]">PHI boundary:</strong> the hosted trial runs on
            Vercel and is for non-PHI evaluation only — it is not covered by a BAA. For live PHI, run HoundShield
            self-hosted (Mode&nbsp;B, Docker), where prompt content never leaves your network.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
          >
            {[
              { num: "$100–$50K", label: "fine per HIPAA violation" },
              { num: "$1.9M", label: "annual penalty cap" },
              { num: "800K+", label: "healthcare practices using AI" },
              { num: "<10ms", label: "HoundShield intercept latency" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--hs-ink)] mb-1">
                  {num}
                </div>
                <div className="text-sm text-[var(--hs-ink-secondary)]">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Problem ───────────────────────────────── */}
      <section className="py-24 md:py-32 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
              <AlertTriangle className="w-3.5 h-3.5" />
              The Problem
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)] mb-4">
              Your team is using AI tools.{" "}
              <span className="italic text-red-400">HIPAA doesn&apos;t care.</span>
            </h2>
            <p className="text-lg text-[var(--hs-ink-secondary)] max-w-[580px] mx-auto">
              Every time a clinician pastes patient notes into ChatGPT, your organization faces a potential breach.
              HIPAA violations don&apos;t require intent — they require exposure.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                stat: "$100–$50,000",
                label: "per violation",
                detail: "Tier 1–4 penalties under the HITECH Act. Willful neglect without correction = $50K per incident.",
              },
              {
                stat: "$7.42M",
                label: "avg data breach cost",
                detail: "Average cost of a US healthcare data breach — the highest of any industry (IBM Cost of a Data Breach Report 2025).",
              },
              {
                stat: REGULATED_SHARE_GENAI.value,
                label: "involve regulated data",
                detail: `Share of healthcare data policy violations tied to generative AI that involve regulated data, versus ${CROSS_INDUSTRY_GENAI.value} across all industries (${REGULATED_SHARE_GENAI.source}, ${REGULATED_SHARE_GENAI.published}).`,
              },
            ].map(({ stat, label, detail }, i) => (
              <FadeIn key={label} delay={i * 0.1}>
                <div className="glass-card rounded-xl p-7">
                  <div className="text-3xl font-extrabold text-[var(--hs-ink)] mb-1">{stat}</div>
                  <div className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wider">{label}</div>
                  <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution — How HoundShield Works ─────────── */}
      <section className="py-24 md:py-32 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-700 mb-4">
              How It Works
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)] mb-4">
              Intercept. Classify. Protect.
            </h2>
            <p className="text-lg text-[var(--hs-ink-secondary)] max-w-[560px] mx-auto">
              HoundShield sits between your workforce and every AI tool — scanning for PHI in real-time before it ever leaves your environment.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <div className="glass-card rounded-xl p-7 flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-400/10 flex items-center justify-center">
                    <f.icon className="w-6 h-6 text-brand-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--hs-ink)] mb-2">{f.title}</h3>
                    <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 18 PHI Identifiers ─────────────────── */}
      <section className="py-24 md:py-32 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--hs-success)] mb-4">
              Complete Coverage
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)] mb-4">
              All 18 HIPAA Safe Harbor Identifiers
            </h2>
            <p className="text-lg text-[var(--hs-ink-secondary)] max-w-[560px] mx-auto">
              HoundShield detects every PHI category defined in 45 CFR §164.514(b)(2) — the standard for de-identification.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PHI_IDENTIFIERS.map((id, i) => (
              <FadeIn key={id} delay={i * 0.03}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-[var(--hs-border-subtle)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--hs-success)] flex-shrink-0" />
                  <span className="text-sm text-[var(--hs-ink-secondary)]">{id}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ────────────────────────── */}
      <section className="py-24 md:py-32 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <Shield className="w-14 h-14 mx-auto text-[var(--hs-success)] mb-6" />
            <h2 className="text-[clamp(28px,4vw,44px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)] mb-4">
              Start protecting PHI today
            </h2>
            <p className="text-lg text-[var(--hs-ink-secondary)] max-w-[480px] mx-auto mb-8">
              The free in-browser scan checks your prompts for PHI in seconds — no signup, nothing leaves your browser.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--hs-steel-dark)] hover:bg-[var(--hs-steel)] text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(129,166,198,0.35)] text-base"
              >
                Scan Your AI Risk Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-white/[0.10] text-[var(--hs-ink)] font-semibold rounded-xl border border-[var(--hs-border)] hover:border-[var(--hs-border-strong)] transition-all text-base"
              >
                View Pricing
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Compliance posture — the Business Associate position ───────── */}
      <section
        id="compliance-posture"
        className="py-24 md:py-32 border-t border-[var(--hs-border-subtle)]"
      >
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-12">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--hs-success)] mb-4">
              Our HIPAA Position
            </div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)] mb-4">
              Where HoundShield stands, in plain terms
            </h2>
            <p className="text-lg text-[var(--hs-ink-secondary)]">
              A Privacy Officer should not have to guess whether a vendor is a business associate.
              Here is our position, stated once, precisely.
            </p>
          </FadeIn>

          <div className="space-y-4">
            <FadeIn>
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2">
                  Mode A (hosted trial): evaluation only, no PHI, no BAA
                </h3>
                <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
                  The hosted endpoint at houndshield.com runs on Vercel and exists for evaluating
                  the product with non-PHI data. We do not offer a BAA for it, and you must not
                  send PHI through it. A vendor that receives PHI on your behalf becomes your
                  business associate under 45 CFR 160.103 — which is exactly the relationship
                  Mode A is designed not to create.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.08}>
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2">
                  Mode B (self-hosted): PHI never reaches us, so no BAA is needed with us
                </h3>
                <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
                  In Mode B the proxy runs as Docker inside your own network. Prompt content —
                  including any PHI a clinician tries to paste — is scanned locally and never
                  transmitted to HoundShield. Because we do not create, receive, maintain, or
                  transmit PHI on your behalf, HoundShield does not act as a business associate
                  in this deployment, and no BAA between you and HoundShield is required. This
                  is the deployment mode for live PHI.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.16}>
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2">
                  The telemetry that keeps that true
                </h3>
                <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
                  The only data a Mode B deployment sends back to houndshield.com is an enumerated
                  metadata set: the action taken, risk level, pattern name, timestamps, and scan
                  timing. Never prompt text, never the matched content. That contract is enforced
                  by an allowlist in the proxy&rsquo;s code — fields outside the list are stripped
                  before anything leaves your network — not merely promised in a document. Vendor
                  details are on the{" "}
                  <Link href="/subprocessors" className="text-brand-700 hover:text-brand-700">
                    sub-processors page
                  </Link>
                  .
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.24}>
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2">
                  What stays your responsibility
                </h3>
                <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
                  BAAs with AI vendors you deliberately send PHI to — under your own API keys, at
                  your instruction — remain between you and those vendors. HoundShield&rsquo;s job
                  is making sure the traffic that should not happen gets blocked before it leaves,
                  and giving you the audit trail that proves it.
                </p>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.3}>
            <p className="mt-8 text-xs text-[var(--hs-ink-tertiary)] text-center leading-relaxed">
              This is our good-faith reading of 45 CFR 160.103 as it applies to each deployment
              mode. It is not legal advice — confirm the analysis with your privacy counsel. All
              of our legal documents are collected at{" "}
              <Link href="/legal" className="text-brand-700 hover:text-brand-700">
                /legal
              </Link>
              .
            </p>
          </FadeIn>
        </div>
      </section>

      <FaqSection items={hipaaFaqs} title="HIPAA & AI: frequently asked questions" />

      <FooterV3 />
    </div>
  );
}
