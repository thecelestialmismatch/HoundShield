"use client";

import Link from "next/link";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { AnimatedSection, AnimatedCounter } from "@/components/landing/animated-section";
import { ScrollProgressBar } from "@/components/scroll-effects";
import { PURCHASABLE_OFFER } from "@/lib/billing/entitlements";
import { PRODUCT_METRICS } from "@/lib/site/metrics";
import { ENGINE_COUNT, PATTERN_COUNT } from "@/lib/detection/engines";
import { RISK_REPORT } from "@/lib/pricing/plans";
import {
    Shield, Lock, Bot, Eye, DollarSign, CheckCircle,
    ArrowRight, Calendar,
} from "lucide-react";

/* ===== DATA ===== */

/*
 * Every figure here must be one a buyer can verify (NEVER-DO: fictional
 * metrics). Two of these used to fail that test:
 *   - a "$49" monthly starting price — no such plan has ever existed. It was
 *     assembled at render time from prefix + value + suffix, so it appeared
 *     in the DOM while staying invisible to any source grep for that string.
 *   - a fourteen-day no-charge trial "no card required" — there is no paid
 *     subscription to trial. /pricing sells one thing: the $499 report.
 * Product figures come from PRODUCT_METRICS and RISK_REPORT so a change to
 * the shipped product moves this page with it.
 */
const stats = [
    { value: 76598, suffix: "", label: "US defense contractors needing CMMC Level 2" },
    { value: PRODUCT_METRICS.nistControls, suffix: "", label: "NIST 800-171 Rev 2 controls mapped" },
    { value: RISK_REPORT.oneTimePrice, prefix: "$", suffix: "", label: "One-time AI Risk Assessment Report" },
    { value: PRODUCT_METRICS.detectionEngines, suffix: "", label: "Local detection engines" },
];

const values = [
    { icon: Lock, title: "Security First", desc: "Zero-trust architecture from day one. Every layer encrypted, every access logged, every action auditable.", color: "text-brand-500", bg: "bg-brand-50 border-brand-200" },
    { icon: Shield, title: "Defense-Grade", desc: "Purpose-built for CMMC Level 2. We map all 110 controls so you don't have to decode 800-171 yourself.", color: "text-[var(--hs-success)]", bg: "bg-[rgba(5,150,105,0.1)] border-[rgba(5,150,105,0.2)]" },
    { icon: Bot, title: "AI-Powered", desc: "Automated gap analysis identifies exactly where you fall short and generates remediation plans in minutes.", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
    { icon: Eye, title: "Transparent", desc: "Open audit trails with SHA-256 integrity. Assessors see the evidence they need, nothing hidden.", color: "text-brand-700", bg: "bg-brand-500/10 border-brand-500/20" },
    { icon: DollarSign, title: "Affordable", desc: "$0 to start. Enterprise-grade compliance shouldn't bankrupt a small defense subcontractor.", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
    { icon: CheckCircle, title: "Compliant", desc: "SOC 2 and GDPR ready out of the box. We practice the compliance we preach.", color: "text-brand-700", bg: "bg-brand-500/10 border-brand-500/20" },
];

/*
 * Honesty sweep, continued. Three things used to live here and had to go:
 *
 *   1. Three testimonials attributed to named people at named companies
 *      ("Sarah Mitchell, VP of Cybersecurity, Ridgeline Defense Systems" and
 *      two others). None of those people or companies exist. Fabricated
 *      endorsements are an FTC exposure (16 CFR Part 255) and the exact thing
 *      a defense buyer runs down before a call — one search and the whole
 *      site's credibility is gone.
 *   2. A "Trusted by Defense Contractors" heading over them.
 *   3. A timeline row claiming "1,000+ Users — trusted by over a thousand
 *      defense contractors", plus "20 defense subcontractors" in the beta row.
 *      Both are customer counts we cannot substantiate.
 *
 * What replaces them is the strongest honest claim available: proof the
 * reader can check themselves, computed from the shipped product. Nothing
 * here asserts a customer, a logo, or a quote.
 *
 * Locked by app/about/__tests__/about-honesty.test.tsx.
 */
const proofs = [
    {
        icon: Eye,
        title: "Read the detection source",
        desc: `All ${ENGINE_COUNT} engines and ${PATTERN_COUNT} patterns are plain regex in the repository. No model, no black box — diff them against your own CUI markings before you buy.`,
    },
    {
        icon: Lock,
        title: "Verify the audit chain yourself",
        desc: "Every event is SHA-256 hash-chained. Recompute the chain from your own log and confirm no entry was altered or removed — the integrity claim does not depend on trusting us.",
    },
    {
        icon: Shield,
        title: "Run it inside your own boundary",
        desc: "Mode B ships as a Docker image on your infrastructure. Prompt content never leaves your network, so there is no vendor cloud in the CUI path to take on faith.",
    },
    {
        icon: CheckCircle,
        title: "Benchmark the latency claim",
        desc: `The <${PRODUCT_METRICS.scanLatencyMs}ms figure is enforced by a benchmark in CI, not a marketing estimate. Run it on your own hardware and hold us to the number.`,
    },
];

/*
 * Dated rows describe engineering milestones only — what was built and when.
 * No row may assert a customer count; see the honesty note above.
 */
const timeline = [
    { date: "2024 Q3", title: "Founded", desc: "HoundShield launched with a singular mission: make CMMC compliance accessible to every defense contractor." },
    { date: "2024 Q4", title: "First Beta", desc: "Closed early-access program. Validated the core assessment engine against real contractor workflows." },
    { date: "2025 Q1", title: "NIST 800-171 Engine", desc: "Full mapping of all 110 security controls with automated evidence collection." },
    { date: "2025 Q3", title: "Public Launch", desc: "General availability with AI-powered gap analysis, remediation plans, and audit trail generation." },
    { date: "2026 Q1", title: "CMMC Level 2 Mapping", desc: "Complete alignment with CMMC 2.0 assessment objectives and C3PAO preparation workflows." },
];

/* ===== PAGE ===== */

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)] relative overflow-hidden">
            <ScrollProgressBar />
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <NavV3 />

            {/* Hero */}
            <section className="relative pt-16 pb-16 md:pt-24 md:pb-20">
                <div className="absolute inset-0 bg-hero-glow" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <AnimatedSection>
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-4">About HoundShield</p>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Building the Future of{" "}
                            <span className="text-gradient-brand">Defense Compliance</span>
                        </h1>
                        <p className="text-lg text-[var(--hs-ink-secondary)] max-w-2xl mx-auto leading-relaxed">
                            87,000 defense contractors need CMMC certification. Most can&apos;t afford six-figure consulting fees.
                            We built HoundShield to change that.
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Mission Panel */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <AnimatedSection>
                        <div className="border border-[var(--hs-border)] bg-white backdrop-blur-sm rounded-2xl p-10 md:p-14 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(90,134,168,0.05)] to-[rgba(129,166,198,0.05)] pointer-events-none" />
                            <div className="relative z-10">
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Our Mission</h2>
                                <p className="text-xl md:text-2xl font-medium text-[var(--hs-ink-secondary)] leading-relaxed max-w-2xl mx-auto">
                                    Democratize CMMC compliance for every defense contractor — from
                                    sole proprietors to mid-tier primes — so protecting national security
                                    is never gated by budget.
                                </p>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Numbers */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">By the Numbers</h2>
                    </AnimatedSection>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((s, i) => (
                            <AnimatedSection key={s.label} delay={i * 100}>
                                <div className="border border-[var(--hs-border)] bg-white backdrop-blur-sm rounded-2xl p-6 text-center">
                                    <p className="text-3xl md:text-4xl font-extrabold text-[var(--hs-ink)] mb-2 font-mono">
                                        <AnimatedCounter target={s.value} prefix={s.prefix || ""} suffix={s.suffix} />
                                    </p>
                                    <p className="text-sm text-[var(--hs-ink-secondary)]">{s.label}</p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">What We Stand For</h2>
                    </AnimatedSection>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.map((v, i) => {
                            const Icon = v.icon;
                            return (
                                <AnimatedSection key={v.title} delay={i * 80}>
                                    <div className="border border-[var(--hs-border)] bg-white backdrop-blur-sm rounded-2xl p-7 h-full">
                                        <div className={`w-11 h-11 rounded-xl ${v.bg} border flex items-center justify-center mb-4`}>
                                            <Icon className={`w-5 h-5 ${v.color}`} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-[var(--hs-ink)] mb-2">{v.title}</h3>
                                        <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{v.desc}</p>
                                    </div>
                                </AnimatedSection>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Proof you can check yourself (replaces fabricated testimonials) */}
            <section className="py-16 px-6 bg-[var(--hs-surface-1)]">
                <div className="max-w-5xl mx-auto">
                    <AnimatedSection className="text-center mb-4">
                        <h2 className="text-3xl font-bold tracking-tight">Don&apos;t Take Our Word For It</h2>
                    </AnimatedSection>
                    <AnimatedSection className="text-center mb-12">
                        <p className="text-[var(--hs-ink-secondary)] max-w-2xl mx-auto leading-relaxed">
                            We&apos;re early, and we&apos;d rather show you something checkable than a
                            wall of logos. Every claim below can be verified before you spend a dollar.
                        </p>
                    </AnimatedSection>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {proofs.map((p, i) => {
                            const Icon = p.icon;
                            return (
                                <AnimatedSection key={p.title} delay={i * 100}>
                                    <div className="border border-[var(--hs-border)] bg-white backdrop-blur-sm rounded-2xl p-7 h-full">
                                        <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center mb-4">
                                            <Icon className="w-5 h-5 text-brand-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-[var(--hs-ink)] mb-2">{p.title}</h3>
                                        <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{p.desc}</p>
                                    </div>
                                </AnimatedSection>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">Our Journey</h2>
                    </AnimatedSection>
                    <div className="space-y-0">
                        {timeline.map((t, i) => (
                            <AnimatedSection key={i} delay={i * 80}>
                                <div className="flex gap-6">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-brand-500 flex-shrink-0 mt-1" />
                                        {i < timeline.length - 1 && (
                                            <div className="w-px flex-1 bg-gradient-to-b from-brand-500/30 to-transparent mt-2" />
                                        )}
                                    </div>
                                    <div className="pb-10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-3 h-3 text-brand-500/60" />
                                            <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">{t.date}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-[var(--hs-ink)] mb-1">{t.title}</h3>
                                        <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{t.desc}</p>
                                    </div>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <AnimatedSection>
                        <div className="border border-[var(--hs-border)] bg-white backdrop-blur-sm rounded-2xl p-10 md:p-14 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(90,134,168,0.05)] to-[rgba(129,166,198,0.05)] pointer-events-none" />
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Join the Mission</h2>
                                {/* Free-tier sweep: this promised a fortnight-long no-charge
                                    evaluation "no credit card required" and pointed at /signup —
                                    neither exists. One offer, one CTA, from PURCHASABLE_OFFER. */}
                                <p className="text-[var(--hs-ink-secondary)] mb-8 max-w-md mx-auto">
                                    See what your team has been pasting into AI tools — and hand your
                                    auditor the evidence. One report, one price, no subscription.
                                </p>
                                <Link
                                    href={PURCHASABLE_OFFER.href}
                                    className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
                                >
                                    {PURCHASABLE_OFFER.ctaLabel} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            <FooterV3 />
        </div>
    );
}
