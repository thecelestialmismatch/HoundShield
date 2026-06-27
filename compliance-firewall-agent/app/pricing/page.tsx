"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ScrollProgressBar, ScrollReveal } from "@/components/scroll-effects";
import { useRouter } from "next/navigation";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { FaqSection } from "@/components/seo/FaqSection";
import { ModeBNotice } from "@/components/ModeBNotice";
import { pricingFaqs } from "@/lib/seo/faqs";
import { getPlanPrice } from "@/lib/pricing/plans";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Zap,
  Crown,
  Building2,
  ShieldCheck,
  BadgeCheck,
  FileText,
  Fingerprint,
  Users,
  Star,
  Minus,
} from "lucide-react";

/* ===== PRICING DATA ===== */
const plans = [
  {
    id: "free",
    name: "Starter",
    icon: Zap,
    iconColor: "text-[var(--hs-success)]",
    iconBg: "bg-[rgba(5,150,105,0.1)] border-[rgba(5,150,105,0.2)]",
    ...getPlanPrice("free"),
    description: "7-day free trial — no credit card required. Explore CMMC tools and see your SPRS score.",
    features: [
      "HoundShield CMMC assessment (read-only)",
      "110-control gap analysis",
      "Live SPRS score calculator",
      "Basic compliance dashboard",
      "Community support",
      "No AI gateway access",
    ],
    cta: "Start 7-Day Trial",
    ctaStyle: "btn-ghost",
    highlighted: false,
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    iconColor: "text-brand-400",
    iconBg: "bg-brand-500/10 border-brand-500/20",
    ...getPlanPrice("pro"),
    description: "AI gateway + full CMMC compliance suite for defense contractors.",
    features: [
      "AI gateway — 50,000 scans/mo",
      "HoundShield assessment (editable)",
      "10 user seats",
      "Gap analysis + remediation roadmap",
      "JSON compliance reports",
      "SSP & policy document generation",
      "Email & Slack alerts",
      "Priority support (< 4hr SLA)",
      "90-day log retention",
      "API access",
    ],
    cta: "Start 7-Day Trial",
    ctaStyle: "btn-primary",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "growth",
    name: "Growth",
    icon: ShieldCheck,
    iconColor: "text-[var(--hs-steel)]",
    iconBg: "bg-[rgba(129,166,198,0.1)] border-[rgba(129,166,198,0.2)]",
    ...getPlanPrice("growth"),
    description: "Unlimited scans, PDF reports, and C3PAO coordination for growing primes.",
    features: [
      "AI gateway — unlimited scans",
      "Everything in Pro",
      "25 user seats",
      "PDF compliance reports",
      "C3PAO assessment coordination",
      "Audit trail export",
      "SSO & RBAC",
      "Dedicated onboarding",
      "Custom SLA (99.9%)",
    ],
    cta: "Start 7-Day Trial",
    ctaStyle: "btn-ghost",
    highlighted: false,
    badge: null,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    iconColor: "text-brand-400",
    iconBg: "bg-brand-500/10 border-brand-500/20",
    ...getPlanPrice("enterprise"),
    description: "On-prem deployment, unlimited seats, and air-gapped support for large primes.",
    features: [
      "Everything in Growth",
      "Unlimited user seats",
      "PDF reports (white-labeled)",
      "On-prem / air-gapped deployment",
      "Custom SLA (99.99%)",
      "Dedicated account manager",
      "HITL quarantine review",
      "Custom detection rules",
    ],
    cta: "Contact Sales",
    ctaStyle: "btn-ghost",
    highlighted: false,
    badge: null,
  },
  {
    id: "agency",
    name: "Agency / MSP",
    icon: Users,
    iconColor: "text-brand-400",
    iconBg: "bg-brand-500/10 border-brand-500/20",
    ...getPlanPrice("agency"),
    description: "Multi-tenant platform for consultants managing multiple defense contractors.",
    features: [
      "Everything in Enterprise",
      "Multi-tenant dashboard",
      "White-label compliance reports",
      "Unlimited client accounts",
      "Bulk compliance reporting",
      "Partner API access",
      "Revenue-share program",
      "Dedicated success manager",
      "SLA guarantee (99.99%)",
    ],
    cta: "Contact Sales",
    ctaStyle: "btn-ghost",
    highlighted: false,
    badge: "For Consultants",
  },
];

/* ===== COMPARISON TABLE DATA ===== */
type FeatureValue = boolean | string;
interface ComparisonRow {
  feature: string;
  free: FeatureValue;
  pro: FeatureValue;
  growth: FeatureValue;
  enterprise: FeatureValue;
  agency: FeatureValue;
  category: string;
}

const comparisonFeatures: ComparisonRow[] = [
  // AI Gateway
  { feature: "Monthly API scans", free: "None", pro: "50K", growth: "Unlimited", enterprise: "Unlimited", agency: "Unlimited", category: "AI Gateway" },
  { feature: "Detection patterns", free: false, pro: "16", growth: "16", enterprise: "16+ Custom", agency: "16+ Custom", category: "AI Gateway" },
  { feature: "Real-time threat feed", free: false, pro: true, growth: true, enterprise: true, agency: true, category: "AI Gateway" },
  { feature: "Custom detection rules", free: false, pro: false, growth: false, enterprise: true, agency: true, category: "AI Gateway" },
  { feature: "HITL quarantine review", free: false, pro: false, growth: false, enterprise: true, agency: true, category: "AI Gateway" },
  // CMMC & Compliance
  { feature: "CMMC self-assessment", free: "Read-only", pro: true, growth: true, enterprise: true, agency: "White-label", category: "CMMC & Compliance" },
  { feature: "SPRS score calculator", free: true, pro: true, growth: true, enterprise: true, agency: true, category: "CMMC & Compliance" },
  { feature: "Gap analysis & remediation", free: false, pro: true, growth: true, enterprise: true, agency: true, category: "CMMC & Compliance" },
  { feature: "JSON compliance reports", free: false, pro: true, growth: true, enterprise: true, agency: true, category: "CMMC & Compliance" },
  { feature: "PDF compliance reports", free: false, pro: false, growth: true, enterprise: true, agency: "White-label", category: "CMMC & Compliance" },
  { feature: "SSP document generation", free: false, pro: true, growth: true, enterprise: true, agency: true, category: "CMMC & Compliance" },
  { feature: "Audit trail export", free: false, pro: false, growth: true, enterprise: true, agency: true, category: "CMMC & Compliance" },
  { feature: "C3PAO coordination", free: false, pro: false, growth: true, enterprise: true, agency: true, category: "CMMC & Compliance" },
  // Platform & Integrations
  { feature: "Dashboard access", free: "Basic", pro: "Full", growth: "Full", enterprise: "Full", agency: "Multi-tenant", category: "Platform & Integrations" },
  { feature: "Log retention", free: "7 days", pro: "90 days", growth: "Unlimited", enterprise: "Unlimited", agency: "Unlimited", category: "Platform & Integrations" },
  { feature: "Team seats", free: "1", pro: "10", growth: "25", enterprise: "Unlimited", agency: "Unlimited", category: "Platform & Integrations" },
  { feature: "Client accounts", free: false, pro: false, growth: false, enterprise: false, agency: "Unlimited", category: "Platform & Integrations" },
  { feature: "Slack & webhook alerts", free: false, pro: true, growth: true, enterprise: true, agency: true, category: "Platform & Integrations" },
  { feature: "API access", free: false, pro: true, growth: true, enterprise: true, agency: true, category: "Platform & Integrations" },
  { feature: "SSO & RBAC", free: false, pro: false, growth: true, enterprise: true, agency: true, category: "Platform & Integrations" },
  { feature: "White-label reports", free: false, pro: false, growth: false, enterprise: false, agency: true, category: "Platform & Integrations" },
  { feature: "On-prem / air-gapped", free: false, pro: false, growth: false, enterprise: true, agency: true, category: "Platform & Integrations" },
  // Support
  { feature: "Community support", free: true, pro: true, growth: true, enterprise: true, agency: true, category: "Support" },
  { feature: "Priority support (< 4hr)", free: false, pro: true, growth: true, enterprise: true, agency: true, category: "Support" },
  { feature: "Dedicated onboarding", free: false, pro: false, growth: true, enterprise: true, agency: true, category: "Support" },
  { feature: "Dedicated account manager", free: false, pro: false, growth: false, enterprise: true, agency: true, category: "Support" },
  { feature: "SLA guarantee", free: false, pro: false, growth: "99.9%", enterprise: "99.99%", agency: "99.99%", category: "Support" },
];

/* ===== FAQ DATA ===== */
const faqData = [
  {
    q: "What's included in the 7-day free trial?",
    a: "Full access to the Starter tier — CMMC self-assessment, 110-control gap analysis, live SPRS calculator, and basic compliance dashboard. No credit card required. After 7 days, choose a paid plan to keep your data and continue scanning.",
  },
  {
    q: "What happens when the free trial ends?",
    a: "After 7 days, your account is paused until you select a paid plan. Your assessment data and scores are saved. Upgrade to Pro for unlimited scans, AI gateway access, and PDF compliance reports. We'll remind you by email before the trial expires.",
  },
  {
    q: "Can I switch between monthly and annual billing?",
    a: "Yes. You can switch from monthly to annual billing at any time and the savings (20% off) apply immediately. If you switch from annual to monthly, the change takes effect at the end of your current annual period. No penalties or hidden fees.",
  },
  {
    q: "What's included in the 7-day Pro trial?",
    a: "Full access to every Pro feature: unlimited scans, 16 detection patterns, encrypted quarantine, CFO-ready reports, Slack/webhook integrations, and priority support. No credit card required. If you don't upgrade after 7 days, you automatically move to the Starter plan.",
  },
  {
    q: "How does self-hosted deployment work on Enterprise?",
    a: "We provide Docker images and Kubernetes manifests (Helm charts) for on-premise deployment. Your data never leaves your infrastructure. Our team assists with setup, configuration, and ongoing maintenance. We also support air-gapped environments.",
  },
  {
    q: "Do you offer discounts for startups or nonprofits?",
    a: "Yes. We offer 50% off Pro plans for verified startups (under $5M funding, under 50 employees) and nonprofits. Contact our sales team with proof of eligibility. Educational institutions also qualify for special pricing.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express), ACH bank transfers, and wire transfers for annual Enterprise contracts. All payments are processed securely through Stripe. We also support purchase orders for Enterprise customers.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes. All paid plans include a 30-day money-back guarantee. If you're not completely satisfied within the first 30 days, contact us for a full refund, no questions asked. We're confident you'll see the value within the first week.",
  },
];

/* ===== INTERSECTION OBSERVER HOOK ===== */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ===== ANIMATED SECTION ===== */
function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ===== FAQ ITEM ===== */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-[var(--hs-border-subtle)] rounded-xl overflow-hidden hover:border-[var(--hs-border)] transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-medium text-[var(--hs-ink)] pr-4">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--hs-ink-tertiary)] flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""
            }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${open ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const router = useRouter();

  async function handleReportCheckout() {
    setCheckoutError(null);
    try {
      setLoading("report");
      const res = await fetch("/api/stripe/report-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "Checkout failed. Please try again.");
      }
    } catch {
      setCheckoutError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleCheckout(tier: string, billing: "monthly" | "annual") {
    if (tier === "free") {
      router.push("/signup");
      return;
    }
    if (tier === "agency" || tier === "enterprise") {
      window.location.href = "#contact";
      return;
    }

    setCheckoutError(null);
    try {
      setLoading(tier);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billing }),
      });

      if (res.status === 401) {
        router.push("/login?redirect=/pricing");
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "Checkout failed. Please try again.");
      }
    } catch {
      setCheckoutError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(null);
    }
  }

  const categories = [...new Set(comparisonFeatures.map((f) => f.category))];

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] relative overflow-hidden">
      <ScrollProgressBar />
      {/* ===== FLOATING ORBS ===== */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ===== NAV ===== */}
      <NavV3 />

      {/* ===== CHECKOUT ERROR BANNER ===== */}
      {checkoutError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-5 py-3 rounded-xl backdrop-blur-sm shadow-lg">
          <span>{checkoutError}</span>
          <button onClick={() => setCheckoutError(null)} className="text-red-400/60 hover:text-red-400 ml-2">&#10005;</button>
        </div>
      )}

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid animate-grid-fade" />
        <div className="absolute inset-0 bg-hero-glow" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <h1 className="text-display-sm md:text-display lg:text-display-lg mb-6">
              Simple,{" "}
              <span className="text-gradient-brand">Transparent</span>{" "}
              Pricing
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="text-lg md:text-xl text-[var(--hs-ink-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Start with the <strong>$499 CMMC AI Risk Assessment Report</strong> — a one-time PDF
              that proves the problem and the fix. Add continuous monitoring when you&apos;re ready.
            </p>
          </AnimatedSection>

          {/* ===== $499 REPORT HERO ===== */}
          <AnimatedSection delay={250}>
            <div className="max-w-2xl mx-auto text-left mb-12">
              <div className="relative rounded-2xl border-2 border-brand-500/40 bg-white p-8 shadow-[var(--shadow-md)] overflow-hidden">
                <div className="absolute -top-3 left-8">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-600 text-white text-[11px] font-bold uppercase tracking-widest">
                    <Star className="w-3 h-3" /> Start here
                  </span>
                </div>
                <div className="flex items-start gap-4 mb-5 mt-2">
                  <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5.5 h-5.5 text-brand-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--hs-ink)]">CMMC AI Risk Assessment Report</h2>
                    <p className="text-sm text-[var(--hs-ink-secondary)] mt-0.5">
                      One-time. No subscription. No MSA. A $499 PO bypasses procurement.
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-5xl font-bold tracking-tight text-[var(--hs-ink)]">$499</span>
                  <span className="text-base text-[var(--hs-ink-tertiary)] ml-1">one-time</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {[
                    "Run the proxy 14 days in your own environment (Mode B / Docker)",
                    "Every AI prompt event risk-scored against NIST 800-171 Rev 2",
                    "SHA-256-signed PDF — the evidence format a C3PAO assessor expects",
                    "Nothing leaves your network — scanned locally in <10ms",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-[var(--hs-ink-secondary)]">
                      <Fingerprint className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleReportCheckout}
                  disabled={loading === "report"}
                  className={`btn-primary w-full justify-center py-3.5 text-base ${loading === "report" ? "opacity-60 pointer-events-none" : ""}`}
                >
                  {loading === "report" ? "Redirecting to checkout…" : "Get your $499 report"}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-[var(--hs-ink-tertiary)] mt-3 text-center">
                  30-day money-back guarantee · RPO/MSP co-brand available at wholesale
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* ===== MONITORING PLANS LABEL + BILLING TOGGLE ===== */}
          <AnimatedSection delay={300}>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--hs-ink-tertiary)] mb-5">
              Or add continuous monitoring
            </p>
            <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-white border border-[var(--hs-border)] shadow-[var(--shadow-sm)]">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${!isAnnual
                    ? "bg-brand-500 text-white "
                    : "text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]"
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isAnnual
                    ? "bg-brand-500 text-white "
                    : "text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]"
                  }`}
              >
                Annual
                <span className="px-2 py-0.5 rounded-full bg-[rgba(5,150,105,0.2)] text-[var(--hs-success)] text-[11px] font-semibold">
                  Save 20%
                </span>
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== PRICING CARDS ===== */}
      <section className="relative px-6 pb-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6 pt-6">
            {plans.map((plan, i) => {
              const Icon = plan.icon;

              return (
                <AnimatedSection key={plan.id} delay={i * 150}>
                  <div
                    className={`relative h-full flex flex-col rounded-2xl transition-all duration-300 ${plan.highlighted
                        ? "scale-[1.02] md:scale-105"
                        : "hover:scale-[1.02]"
                      }`}
                  >
                    {/* Gradient border for highlighted card */}
                    {plan.highlighted && (
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-brand-400 via-brand-500/50 to-[rgba(129,166,198,0.3)] opacity-100" />
                    )}

                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-[var(--hs-steel)] text-white text-xs font-semibold">
                          <Star className="w-3 h-3" />
                          {plan.badge}
                        </div>
                      </div>
                    )}

                    <div
                      className={`relative h-full flex flex-col p-8 rounded-2xl ${plan.highlighted
                          ? "bg-[#0F1E2E]"
                          : "glass-card-glow"
                        }`}
                    >
                      {/* Plan header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${plan.iconBg}`}
                        >
                          <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold ${plan.highlighted ? "text-white" : "text-[var(--hs-ink)]"}`}>
                            {plan.name}
                          </h3>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        {plan.id === 'free' ? (
                          <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-bold tracking-tight ${plan.highlighted ? "text-white" : "text-[var(--hs-ink)]"}`}>Free</span>
                            <span className={`text-base font-normal ml-1 ${plan.highlighted ? "text-slate-400" : "text-[var(--hs-ink-tertiary)]"}`}>7 days</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-bold tracking-tight ${plan.highlighted ? "text-white" : "text-[var(--hs-ink)]"}`}>
                              ${(isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice).toLocaleString()}
                            </span>
                            <span className={`text-base font-normal ml-1 ${plan.highlighted ? "text-slate-400" : "text-[var(--hs-ink-tertiary)]"}`}>
                              /mo
                            </span>
                          </div>
                        )}
                        <p className={`text-xs mt-1 ${plan.highlighted ? "text-slate-400" : "text-[var(--hs-ink-tertiary)]"}`}>
                          {plan.id === 'free'
                            ? 'No credit card required'
                            : isAnnual && plan.annualPrice
                              ? `$${plan.annualPrice.toLocaleString()}/yr billed annually · save 20%`
                              : 'Billed monthly'}
                        </p>
                      </div>

                      <p className={`text-sm leading-relaxed mb-6 ${plan.highlighted ? "text-slate-400" : "text-[var(--hs-ink-secondary)]"}`}>
                        {plan.description}
                      </p>

                      {/* CTA */}
                      {plan.id === "free" ? (
                        <Link
                          href="/signup"
                          className={`${plan.ctaStyle} w-full justify-center text-sm mb-8 ${plan.highlighted ? "py-3" : ""}`}
                        >
                          {plan.cta}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : plan.id === "agency" ? (
                        <Link
                          href="#contact"
                          className={`${plan.ctaStyle} w-full justify-center text-sm mb-8 ${plan.highlighted ? "py-3" : ""}`}
                        >
                          {plan.cta}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleCheckout(plan.id, isAnnual ? "annual" : "monthly")}
                          disabled={loading === plan.id}
                          className={`${plan.ctaStyle} w-full justify-center text-sm mb-8 ${plan.highlighted ? "py-3" : ""} ${loading === plan.id ? "opacity-60 pointer-events-none" : ""}`}
                        >
                          {loading === plan.id ? "Redirecting..." : plan.cta}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Feature divider */}
                      <div className="section-divider mb-6" />

                      {/* Features */}
                      <ul className="space-y-3 flex-1">
                        {plan.features.map((feature, fi) => (
                          <li
                            key={fi}
                            className="flex items-start gap-3 text-sm"
                          >
                            <Check
                              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlighted
                                  ? "text-brand-400"
                                  : "text-[rgba(5,150,105,0.7)]"
                                }`}
                            />
                            <span className={plan.highlighted ? "text-slate-400" : "text-[var(--hs-ink-secondary)]"}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== MONEY-BACK GUARANTEE ===== */}
      <section className="relative px-6 pb-24">
        <AnimatedSection>
          <div className="max-w-3xl mx-auto">
            <div className="glass-card p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.2)] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-8 h-8 text-[var(--hs-success)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--hs-ink)] mb-2">
                  30-Day Money-Back Guarantee
                </h3>
                <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
                  Try any paid plan risk-free. If you&apos;re not completely satisfied
                  within the first 30 days, we&apos;ll refund every penny. No
                  questions asked, no hoops to jump through. We&apos;re that
                  confident you&apos;ll love HoundShield.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ===== FEATURE COMPARISON TABLE ===== */}
      <section className="relative px-6 pb-24">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-display-sm md:text-display mb-4">
                Compare{" "}
                <span className="text-gradient-brand">Every Feature</span>
              </h2>
              <p className="text-[var(--hs-ink-secondary)] max-w-xl mx-auto">
                A detailed breakdown of what&apos;s included in each plan so you
                can make the right choice for your team.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <div className="glass-card overflow-x-auto">
              {/* Table header */}
              <div className="grid grid-cols-6 min-w-[780px] border-b border-[var(--hs-border-subtle)]">
                <div className="p-5 text-sm font-medium text-[var(--hs-ink-tertiary)]">
                  Feature
                </div>
                {([
                  { name: "Starter", key: "free" },
                  { name: "Pro", key: "pro" },
                  { name: "Growth", key: "growth" },
                  { name: "Enterprise", key: "enterprise" },
                  { name: "Agency", key: "agency" },
                ] as const).map((tier) => (
                  <div
                    key={tier.key}
                    className={`p-5 text-center text-sm font-semibold ${tier.key === "pro"
                        ? "text-[var(--hs-steel-dark)] bg-brand-500/[0.06]"
                        : "text-[var(--hs-ink-secondary)]"
                      }`}
                  >
                    {tier.name}
                    {tier.key === "pro" && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 text-[10px] font-semibold">
                        Popular
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Table body by category */}
              {categories.map((category) => (
                <div key={category}>
                  {/* Category header */}
                  <div className="grid grid-cols-6 min-w-[780px] border-b border-[var(--hs-border-subtle)] bg-[var(--hs-surface-1)]">
                    <div className="col-span-6 p-4 px-5">
                      <span className="text-xs uppercase tracking-wider text-[var(--hs-ink-tertiary)] font-semibold">
                        {category}
                      </span>
                    </div>
                  </div>

                  {/* Feature rows */}
                  {comparisonFeatures
                    .filter((f) => f.category === category)
                    .map((row, ri) => (
                      <div
                        key={ri}
                        className="grid grid-cols-6 min-w-[780px] border-b border-[var(--hs-border-subtle)] hover:bg-[var(--hs-mist)] transition-colors"
                      >
                        <div className="p-4 px-5 text-sm text-[var(--hs-ink-secondary)]">
                          {row.feature}
                        </div>
                        {(
                          ["free", "pro", "growth", "enterprise", "agency"] as const
                        ).map((planKey) => {
                          const val = row[planKey];
                          return (
                            <div
                              key={planKey}
                              className={`p-4 text-center text-sm ${planKey === "pro" ? "bg-brand-500/[0.02]" : ""
                                }`}
                            >
                              {typeof val === "boolean" ? (
                                val ? (
                                  <Check className="w-4 h-4 text-[var(--hs-success)] mx-auto" />
                                ) : (
                                  <Minus className="w-4 h-4 text-[var(--hs-border-strong)] mx-auto" />
                                )
                              ) : (
                                <span
                                  className={
                                    planKey === "pro"
                                      ? "text-[var(--hs-steel-dark)] font-medium"
                                      : "text-[var(--hs-ink-secondary)]"
                                  }
                                >
                                  {val}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== DEPLOYMENT MODES (architecture honesty) ===== */}
      <section className="relative px-6 pb-24">
        <AnimatedSection>
          <div className="max-w-5xl mx-auto">
            <ModeBNotice variant="full" />
          </div>
        </AnimatedSection>
      </section>

      {/* ===== FAQ ===== */}
      <section className="relative px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-display-sm md:text-display mb-4">
                Frequently Asked{" "}
                <span className="text-gradient-brand">Questions</span>
              </h2>
              <p className="text-[var(--hs-ink-secondary)]">
                Everything you need to know about HoundShield pricing and plans.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="space-y-3">
              {faqData.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="relative px-6 pb-24">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card-glow p-12 md:p-16 relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/8 via-transparent to-[rgba(129,166,198,0.05)]" />
              <div className="absolute inset-0 bg-dot-grid opacity-30" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-700 text-xs font-medium mb-6">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  SOC 2 &middot; GDPR &middot; HIPAA &middot; EU AI Act
                </div>

                <h2 className="text-display-sm md:text-display mb-4">
                  Ready to{" "}
                  <span className="text-gradient-brand">
                    Secure Your AI?
                  </span>
                </h2>
                <p className="text-[var(--hs-ink-secondary)] max-w-xl mx-auto mb-8 leading-relaxed">
                  Turn an AI policy violation into C3PAO-ready evidence in under 10 minutes.
                  Start with the $499 report; deploy the proxy in under 15 minutes.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={handleReportCheckout} className="btn-primary px-8 py-3">
                    Get your $499 report
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <Link href="/partners" className="btn-ghost px-8 py-3">
                    RPO / MSP partners
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-xs text-[var(--hs-ink-tertiary)] mt-6">
                  One-time &middot; no subscription required &middot; 30-day money-back guarantee
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <FaqSection items={pricingFaqs} title="Pricing & plans: frequently asked questions" />

      <FooterV3 />
    </div>
  );
}
