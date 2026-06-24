"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Users,
  Shield,
  Zap,
  CheckCircle2,
  Building2,
  DollarSign,
  Award,
  Calculator,
  TrendingUp,
  FileText,
  Clock,
  Star,
} from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { ModeBNotice } from "@/components/ModeBNotice";
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

const PARTNER_TIERS = [
  {
    icon: FileText,
    name: "Report Co-Brand",
    price: "$299 wholesale",
    commission: "Sell at $499–$999",
    highlight: "RECOMMENDED",
    features: [
      "Co-branded $499 CMMC AI Risk Assessment Report",
      "You pay $299 wholesale, charge your client $499–$999",
      "Your logo on the SHA-256-signed PDF",
      "Bundle into your existing CMMC readiness package",
      "No subscription, no MSA — a $499 PO bypasses procurement",
      "48-hour partner onboarding call",
    ],
    cta: "Apply to Co-Brand",
    type: "reseller",
    bestFor: "RPOs, CMMC-focused MSPs, compliance consultants",
  },
  {
    icon: Users,
    name: "Referral Partner",
    price: "Free",
    commission: "40% of the report",
    highlight: null,
    features: [
      "40% commission on every $499 report you refer",
      "Unique referral link + tracking dashboard",
      "Co-branded one-pager for client conversations",
      "HoundShield demo sandbox access",
      "20% recurring on any monitoring subscription that follows",
    ],
    cta: "Apply Now",
    type: "referral",
    bestFor: "Consultants and advisors who refer, not resell",
  },
  {
    icon: Zap,
    name: "Technology Partner",
    price: "Custom",
    commission: "Revenue share",
    highlight: null,
    features: [
      "Full proxy + classifier API access",
      "Custom SIEM / GRC integrations",
      "SDK + OpenAPI documentation",
      "Joint go-to-market planning",
      "Co-sell with the HoundShield team",
      "Revenue share model — negotiated",
    ],
    cta: "Apply for Tech Partner",
    type: "technology",
    bestFor: "GRC platforms, SIEM vendors, compliance toolchains",
  },
];

const PARTNER_VALUE_PROPS = [
  {
    icon: FileText,
    title: "A $499 product that sells itself",
    body: "RPOs charge $5K–$15K for a gap assessment. A $499 AI-risk report is an impulse add-on your client approves without a procurement review — and it's evidence of both the problem and the fix.",
  },
  {
    icon: TrendingUp,
    title: "Keep the margin",
    body: "Co-brand at $299 wholesale, charge your client $499–$999. Or refer and earn 40% of the report plus 20% recurring on any monitoring that follows. No cap.",
  },
  {
    icon: Clock,
    title: "Delivers in 14 days",
    body: "Deploy the proxy in the client's own environment (Mode B / Docker), let it observe AI prompt traffic, hand them a signed PDF mapped to NIST 800-171. Fast enough to fit inside an active engagement.",
  },
  {
    icon: Shield,
    title: "Tamper-evident evidence",
    body: "Every event is written to a SHA-256 hash-chained log. Your client gets assessment-grade evidence; you get a repeatable, branded deliverable.",
  },
];

function CommissionCalculator() {
  const [reports, setReports] = useState(10);
  const [model, setModel] = useState<"cobrand" | "refer">("cobrand");

  // Co-brand: buy at $299, sell at $499 → $200 margin/report.
  // Refer: 40% of the $499 report → ~$200/report.
  const perReport = model === "cobrand" ? 200 : Math.round(499 * 0.4);
  const total = reports * perReport;
  const annualized = total * 4; // ~quarterly cadence across a client book

  return (
    <div className="glass-card-glow rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-400/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--hs-ink)]">Partner Earnings</h3>
          <p className="text-xs text-[var(--hs-ink-tertiary)]">$499 report · co-brand wholesale or 40% referral</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block text-xs font-semibold text-[var(--hs-ink-secondary)] uppercase tracking-wider mb-2">
            Reports placed
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={50}
              value={reports}
              onChange={(e) => setReports(Number(e.target.value))}
              className="flex-1 accent-brand-500 cursor-pointer"
            />
            <span className="w-8 text-right text-[var(--hs-ink)] font-mono font-bold">{reports}</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--hs-ink-secondary)] uppercase tracking-wider mb-2">
            Model
          </label>
          <div className="flex gap-2">
            {([
              { k: "cobrand", label: "Co-brand $299" },
              { k: "refer", label: "Refer 40%" },
            ] as const).map((m) => (
              <button
                key={m.k}
                onClick={() => setModel(m.k)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  model === m.k
                    ? "bg-brand-500 text-white"
                    : "bg-white text-[var(--hs-ink-secondary)] hover:bg-[var(--hs-mist)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[var(--hs-border-subtle)]">
        <div className="text-center">
          <div className="text-2xl font-extrabold text-[var(--hs-ink)] font-mono">
            ${perReport}
          </div>
          <div className="text-xs text-[var(--hs-ink-tertiary)] mt-1">Per report</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold text-brand-400 font-mono">
            ${total.toLocaleString()}
          </div>
          <div className="text-xs text-[var(--hs-ink-tertiary)] mt-1">This batch</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold text-[var(--hs-success)] font-mono">
            ${annualized.toLocaleString()}
          </div>
          <div className="text-xs text-[var(--hs-ink-tertiary)] mt-1">Annualized</div>
        </div>
      </div>
    </div>
  );
}

export default function PartnersPage() {
  const [formState, setFormState] = useState({
    name: "",
    company: "",
    email: "",
    clientCount: "",
    partnerType: "reseller",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          clientCount: formState.clientCount
            ? parseInt(formState.clientCount, 10)
            : 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[var(--hs-surface-0)] min-h-screen relative">
      <ScrollProgressBar />
      <NavV3 />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.15] pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 40% at 50% 60%, rgba(129,166,198,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-400/20 bg-brand-400/[0.08] text-brand-400 text-xs font-semibold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Partner Program · RPOs · MSPs · Compliance Consultants
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-editorial text-[clamp(36px,6vw,72px)] font-bold leading-[1.05] tracking-[-1px] max-w-[900px] mx-auto mb-6 text-[var(--hs-ink)]"
          >
            Add a $499 AI Risk Report<br className="hidden sm:block" />
            to Every Client You{" "}
            <span className="italic bg-gradient-to-r from-brand-400 via-accent to-brand-400 bg-clip-text text-transparent">
              Advise
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[clamp(16px,2vw,20px)] text-[var(--hs-ink-secondary)] max-w-[620px] mx-auto mb-4 leading-relaxed"
          >
            Co-brand the CMMC AI Risk Assessment Report at $299 wholesale and charge your clients
            $499–$999. Or refer and earn 40% per report. It drops straight into your CMMC readiness package.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-sm font-mono text-brand-400/80 mb-10"
          >
            10 co-branded reports × $200 margin = <span className="text-brand-400 font-bold">$2,000</span> per client batch
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#apply"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-glow text-base"
            >
              Apply for Partner Program
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#calculator"
              className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium text-sm transition-colors"
            >
              Calculate my earnings <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>

          {/* C3PAO exclusion — legal honesty up front */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xs text-[var(--hs-ink-tertiary)] max-w-[560px] mx-auto mt-8 leading-relaxed"
          >
            A note on C3PAOs: a C3PAO cannot recommend a product to a client it assesses
            (32 CFR Part 170 · ISO 17020 cooling-off). This program is for RPOs, MSPs, and
            consultants — not assessors.
          </motion.p>
        </div>
      </section>

      {/* ── Why partners win ──────────────────── */}
      <section className="py-24 md:py-32 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
              Built for RPOs &amp; MSPs
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)] max-w-2xl mx-auto">
              A branded deliverable that pays — on every client engagement
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-14">
            {PARTNER_VALUE_PROPS.map((prop, i) => (
              <FadeIn key={prop.title} delay={i * 0.08}>
                <div className="glass-card rounded-xl p-7 h-full">
                  <div className="w-10 h-10 rounded-xl bg-brand-400/10 flex items-center justify-center mb-4">
                    <prop.icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2">{prop.title}</h3>
                  <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{prop.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* RPO / MSP math */}
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-xl p-8">
                <div className="w-12 h-12 rounded-xl bg-brand-400/10 flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--hs-ink)] mb-4">For RPOs</h3>
                <ul className="flex flex-col gap-3">
                  {[
                    "Bundle the $499 report into your readiness packages",
                    "Co-brand at $299 wholesale — keep the $200+ margin",
                    "Give clients NIST 800-171 AI evidence in 14 days",
                    "A low-friction upsell on every engagement",
                    "Tamper-evident SHA-256 logs your clients can hand to an assessor",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--hs-ink-secondary)]">
                      <CheckCircle2 className="w-4 h-4 text-[var(--hs-success)] flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card rounded-xl p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--hs-ink)] mb-4">For MSPs</h3>
                <ul className="flex flex-col gap-3">
                  {[
                    "Manage 10–100 clients from one dashboard",
                    "Your logo. Your pricing. Your relationships.",
                    "Co-brand reports or white-label the platform",
                    "20% recurring on any monitoring subscription that follows",
                    "CMMC + HIPAA + SOC 2 detection in one proxy",
                    "Mode B (Docker) keeps client CUI inside their boundary",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--hs-ink-secondary)]">
                      <CheckCircle2 className="w-4 h-4 text-[var(--hs-success)] flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.3} className="mt-10">
            <ModeBNotice variant="inline" />
          </FadeIn>
        </div>
      </section>

      {/* ── Earnings Calculator ─────────────── */}
      <section id="calculator" className="py-24 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
              See Your Numbers
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)]">
              What&apos;s your client book worth?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <CommissionCalculator />
          </FadeIn>
          <FadeIn delay={0.2} className="mt-5 text-center">
            <p className="text-xs text-[var(--hs-ink-tertiary)] font-mono">
              Co-brand payouts net of wholesale · referral commissions paid on the 1st · 60-day attribution
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Partner Tiers ─────────────────────── */}
      <section id="reseller" className="py-24 md:py-32 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
              Partner Tiers
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)]">
              Choose your partnership level
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PARTNER_TIERS.map((tier, i) => (
              <FadeIn key={tier.name} delay={i * 0.08}>
                <div
                  className={`relative p-7 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 flex flex-col h-full ${
                    tier.highlight
                      ? "bg-brand-400/[0.06] border border-brand-400/40 hover:border-brand-400/60"
                      : "bg-white border border-[var(--hs-border-subtle)] hover:border-[var(--hs-border)]"
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                      {tier.highlight}
                    </div>
                  )}
                  <tier.icon className="w-8 h-8 text-brand-400 mb-4" />
                  <div className="text-[13px] font-bold text-[var(--hs-ink-tertiary)] uppercase tracking-widest mb-1">
                    {tier.name}
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-[var(--hs-ink)] mb-1">
                    {tier.price}
                  </div>
                  <div className="text-xs font-mono text-brand-400/80 mb-5">{tier.commission}</div>

                  <ul className="flex flex-col gap-2 mb-5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-[var(--hs-ink-secondary)]">
                        <CheckCircle2 className="w-4 h-4 text-[var(--hs-success)] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="text-[11px] text-[var(--hs-ink-tertiary)] font-mono mb-4 border-t border-[var(--hs-border-subtle)] pt-4">
                    Best for: {tier.bestFor}
                  </div>

                  <a
                    href="#apply"
                    onClick={() => setFormState((s) => ({ ...s, partnerType: tier.type }))}
                    className={`block w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${
                      tier.highlight
                        ? "bg-brand-600 hover:bg-brand-700 text-white"
                        : "bg-white text-[var(--hs-ink)] border border-[var(--hs-border)] hover:bg-white/[0.1]"
                    }`}
                  >
                    {tier.cta}
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ──────────────────────── */}
      <section className="py-16 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-brand-400 text-brand-400" />
              ))}
            </div>
            <p className="text-sm text-[var(--hs-ink-tertiary)]">For compliance consultants across the DIB</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                quote: "A $499 add-on my clients approve without a procurement cycle. It pays for itself the first time it catches CUI in a prompt log.",
                author: "RPO consultant, mid-Atlantic",
                stars: 5,
              },
              {
                quote: "Co-brand wholesale plus the recurring monitoring share is the model we've wanted. Our logo, our margin, their CUI never leaves their network.",
                author: "MSP, 40+ DoD clients",
                stars: 5,
              },
              {
                quote: "Deploy in Docker, 14 days later there's a signed PDF mapped to 800-171. It slots into our readiness engagements cleanly.",
                author: "Independent CMMC consultant",
                stars: 5,
              },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="glass-card rounded-xl p-6 flex flex-col gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-brand-400 text-brand-400" />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                  <p className="text-xs text-[var(--hs-ink-tertiary)] font-mono">{t.author}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.2} className="mt-6 text-center">
            <p className="text-[11px] text-[var(--hs-ink-tertiary)]">
              Illustrative of the partner model. We do not publish client names or fabricated counts.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Application Form ──────────────────── */}
      <section id="apply" className="py-24 md:py-32 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-400/20 bg-brand-400/[0.08] text-brand-400 text-xs font-semibold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              48-hour response time
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-editorial font-bold tracking-tight leading-[1.1] text-[var(--hs-ink)] mb-4">
              Apply for Partner Program
            </h2>
            <p className="text-[var(--hs-ink-secondary)]">
              Tell us about your practice. We respond within 48 hours with your co-brand or referral materials.
            </p>
          </FadeIn>

          {submitted ? (
            <FadeIn>
              <div className="glass-card rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[rgba(5,150,105,0.1)] flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-[var(--hs-success)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--hs-ink)] mb-2">
                  Application received
                </h3>
                <p className="text-[var(--hs-ink-secondary)] mb-5">
                  We&apos;ll review your application and get back to you within 48 hours at{" "}
                  <span className="text-[var(--hs-ink)]">{formState.email}</span>.
                </p>
                <p className="text-xs text-[var(--hs-ink-tertiary)] font-mono">
                  While you wait — read{" "}
                  <Link href="/blog/why-cloud-ai-dlp-violates-dfars-7012" className="text-brand-400 hover:underline">
                    why cloud DLP violates DFARS 7012
                  </Link>{" "}
                  to brief your clients.
                </p>
              </div>
            </FadeIn>
          ) : (
            <FadeIn>
              <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--hs-ink-secondary)] mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400/50 transition"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--hs-ink-secondary)] mb-1.5">
                      Company *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.company}
                      onChange={(e) => setFormState((s) => ({ ...s, company: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400/50 transition"
                      placeholder="Acme Compliance LLC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--hs-ink-secondary)] mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400/50 transition"
                    placeholder="jane@acme.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--hs-ink-secondary)] mb-1.5">
                      DoD clients (approx.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formState.clientCount}
                      onChange={(e) => setFormState((s) => ({ ...s, clientCount: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400/50 transition"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--hs-ink-secondary)] mb-1.5">
                      Partner Type
                    </label>
                    <select
                      value={formState.partnerType}
                      onChange={(e) => setFormState((s) => ({ ...s, partnerType: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--hs-surface-0)] border border-[var(--hs-border)] text-[var(--hs-ink)] focus:outline-none focus:border-brand-400/50 transition"
                    >
                      <option value="reseller">Report Co-Brand ($299 wholesale)</option>
                      <option value="referral">Referral Partner (40% per report)</option>
                      <option value="technology">Technology Partner (custom)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--hs-ink-secondary)] mb-1.5">
                    Tell us about your practice
                  </label>
                  <textarea
                    rows={3}
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400/50 transition resize-none"
                    placeholder="How many DoD contractors do you work with? Are you an RPO, MSP, or independent consultant?"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <>Submit Application <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <p className="text-xs text-center text-[var(--hs-ink-tertiary)]">
                  By applying you agree to the{" "}
                  <Link href="/terms" className="text-[var(--hs-ink-tertiary)] hover:text-[var(--hs-ink-secondary)] underline">
                    partner terms
                  </Link>
                  . We respond within 48 hours.
                </p>
              </form>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────── */}
      <section className="py-16 border-t border-[var(--hs-border-subtle)]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <DollarSign className="w-10 h-10 mx-auto text-brand-400 mb-4" />
            <p className="text-2xl md:text-3xl font-bold text-[var(--hs-ink)] mb-2">
              3 RPOs × 10 co-branded reports × $200 ={" "}
              <span className="text-brand-400">$6,000</span>
            </p>
            <p className="text-sm text-[var(--hs-ink-secondary)] mb-6">
              In margin. Before a single monitoring subscription.
            </p>
            <a
              href="#apply"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-glow text-base"
            >
              Apply Now — Free <ArrowRight className="w-4 h-4" />
            </a>
          </FadeIn>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
