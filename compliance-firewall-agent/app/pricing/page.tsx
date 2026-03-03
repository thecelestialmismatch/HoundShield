"use client";

import { Logo } from "@/components/Logo";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LocalizedPrice } from "@/components/LocalizedPrice";
import { Navbar } from "@/components/Navbar";
import {
  Shield,
  ArrowRight,
  Check,
  X,
  Menu,
  ChevronDown,
  Zap,
  Crown,
  Building2,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  Clock,
  Users,
  Lock,
  Star,
  Minus,
} from "lucide-react";

/* ===== PRICING DATA ===== */
const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For small teams exploring AI compliance. Get started with zero risk.",
    features: [
      "1,000 scans per month",
      "4 detection categories",
      "Basic compliance dashboard",
      "Email alerts",
      "Community support",
      "7-day log retention",
      "Single workspace",
    ],
    cta: "Start Free",
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
    monthlyPrice: 49,
    annualPrice: 39,
    description: "For growing teams with serious compliance needs. Full protection suite.",
    features: [
      "Unlimited scans",
      "16 detection patterns",
      "Encrypted quarantine vault",
      "CFO-ready audit reports",
      "Slack & webhook integrations",
      "Priority support (< 4hr SLA)",
      "90-day log retention",
      "5 workspaces",
      "Custom alert rules",
      "API access",
    ],
    cta: "Start Pro Trial",
    ctaStyle: "btn-primary",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    monthlyPrice: -1,
    annualPrice: -1,
    description: "For organizations requiring full control and dedicated infrastructure.",
    features: [
      "Everything in Pro",
      "Self-hosted deployment",
      "Custom detection rules",
      "SSO & RBAC",
      "Dedicated account manager",
      "SLA guarantee (99.99%)",
      "Unlimited log retention",
      "Unlimited workspaces",
      "On-premise support",
      "Custom AI model hosting",
    ],
    cta: "Contact Sales",
    ctaStyle: "btn-ghost",
    highlighted: false,
    badge: null,
  },
];

/* ===== COMPARISON TABLE DATA ===== */
type FeatureValue = boolean | string;
interface ComparisonRow {
  feature: string;
  starter: FeatureValue;
  pro: FeatureValue;
  enterprise: FeatureValue;
  category: string;
}

const comparisonFeatures: ComparisonRow[] = [
  // Scanning & Detection
  { feature: "Monthly scans", starter: "1,000", pro: "Unlimited", enterprise: "Unlimited", category: "Scanning & Detection" },
  { feature: "Detection categories", starter: "4", pro: "16", enterprise: "16+ Custom", category: "Scanning & Detection" },
  { feature: "Scan latency", starter: "<50ms", pro: "<50ms", enterprise: "<50ms", category: "Scanning & Detection" },
  { feature: "Custom detection rules", starter: false, pro: false, enterprise: true, category: "Scanning & Detection" },
  { feature: "Real-time interception", starter: true, pro: true, enterprise: true, category: "Scanning & Detection" },
  // Security & Compliance
  { feature: "Encrypted quarantine", starter: false, pro: true, enterprise: true, category: "Security & Compliance" },
  { feature: "AES-256 encryption", starter: false, pro: true, enterprise: true, category: "Security & Compliance" },
  { feature: "SHA-256 audit chain", starter: true, pro: true, enterprise: true, category: "Security & Compliance" },
  { feature: "CFO-ready reports", starter: false, pro: true, enterprise: true, category: "Security & Compliance" },
  { feature: "SOC 2 compliance", starter: false, pro: true, enterprise: true, category: "Security & Compliance" },
  { feature: "HIPAA compliance", starter: false, pro: false, enterprise: true, category: "Security & Compliance" },
  { feature: "SSO & RBAC", starter: false, pro: false, enterprise: true, category: "Security & Compliance" },
  // Platform & Integrations
  { feature: "Dashboard access", starter: "Basic", pro: "Full", enterprise: "Full + Custom", category: "Platform & Integrations" },
  { feature: "Log retention", starter: "7 days", pro: "90 days", enterprise: "Unlimited", category: "Platform & Integrations" },
  { feature: "Workspaces", starter: "1", pro: "5", enterprise: "Unlimited", category: "Platform & Integrations" },
  { feature: "Slack integration", starter: false, pro: true, enterprise: true, category: "Platform & Integrations" },
  { feature: "Webhook integration", starter: false, pro: true, enterprise: true, category: "Platform & Integrations" },
  { feature: "API access", starter: false, pro: true, enterprise: true, category: "Platform & Integrations" },
  { feature: "Self-hosted deployment", starter: false, pro: false, enterprise: true, category: "Platform & Integrations" },
  // Support
  { feature: "Community support", starter: true, pro: true, enterprise: true, category: "Support" },
  { feature: "Email support", starter: true, pro: true, enterprise: true, category: "Support" },
  { feature: "Priority support", starter: false, pro: true, enterprise: true, category: "Support" },
  { feature: "Dedicated account manager", starter: false, pro: false, enterprise: true, category: "Support" },
  { feature: "SLA guarantee", starter: false, pro: false, enterprise: "99.99%", category: "Support" },
  { feature: "On-premise support", starter: false, pro: false, enterprise: true, category: "Support" },
];

/* ===== FAQ DATA ===== */
const faqData = [
  {
    q: "Is the Starter plan really free forever?",
    a: "Yes, absolutely. The Starter plan includes 1,000 scans per month, basic dashboard access, and email alerts at zero cost. No credit card required to sign up. You can use it indefinitely and upgrade whenever you need more capacity.",
  },
  {
    q: "What happens if I exceed 1,000 scans on the free plan?",
    a: "You'll receive an email alert at 80% and 100% of your quota. Once you hit the limit, additional requests will pass through without scanning until the next billing cycle. We never block your API traffic \u2014 we just pause the compliance layer. Upgrade to Pro for unlimited scans.",
  },
  {
    q: "Can I switch between monthly and annual billing?",
    a: "Yes. You can switch from monthly to annual billing at any time and the savings (20% off) apply immediately. If you switch from annual to monthly, the change takes effect at the end of your current annual period. No penalties or hidden fees.",
  },
  {
    q: "What's included in the 14-day Pro trial?",
    a: "Full access to every Pro feature: unlimited scans, 16 detection patterns, encrypted quarantine, CFO-ready reports, Slack/webhook integrations, and priority support. No credit card required. If you don't upgrade after 14 days, you automatically move to the Starter plan.",
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
      className={`transition-all duration-700 ease-out ${className} ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
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
    <div className="border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.1] transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-medium text-white/80 pr-4">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm text-white/40 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categories = [...new Set(comparisonFeatures.map((f) => f.category))];

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      {/* ===== FLOATING ORBS ===== */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ===== NAV ===== */}
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid animate-grid-fade" />
        <div className="absolute inset-0 bg-hero-glow" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>14-day free trial on Pro &mdash; No credit card required</span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-display-sm md:text-display lg:text-display-lg mb-6">
              Simple,{" "}
              <span className="text-gradient-brand">Transparent</span>{" "}
              Pricing
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
              Protect your enterprise from AI data leaks without the enterprise
              pricing headache. Start free, scale when you&apos;re ready.
            </p>
          </AnimatedSection>

          {/* ===== BILLING TOGGLE ===== */}
          <AnimatedSection delay={300}>
            <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  !isAnnual
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  isAnnual
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Annual
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                  Save 20%
                </span>
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== PRICING CARDS ===== */}
      <section className="relative px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => {
              const price =
                plan.monthlyPrice === -1
                  ? null
                  : isAnnual
                  ? plan.annualPrice
                  : plan.monthlyPrice;
              const Icon = plan.icon;

              return (
                <AnimatedSection key={plan.id} delay={i * 150}>
                  <div
                    className={`relative h-full flex flex-col rounded-2xl transition-all duration-300 ${
                      plan.highlighted
                        ? "scale-[1.02] md:scale-105"
                        : "hover:scale-[1.02]"
                    }`}
                  >
                    {/* Gradient border for highlighted card */}
                    {plan.highlighted && (
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-brand-400 via-brand-500/50 to-purple-500/30 opacity-100" />
                    )}

                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/30">
                          <Star className="w-3 h-3" />
                          {plan.badge}
                        </div>
                      </div>
                    )}

                    <div
                      className={`relative h-full flex flex-col p-8 rounded-2xl ${
                        plan.highlighted
                          ? "bg-surface-50"
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
                          <h3 className="text-lg font-semibold text-white">
                            {plan.name}
                          </h3>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        {price !== null ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white tracking-tight">
                              {price === 0 ? "Free" : `$${price}`}
                            </span>
                            {price > 0 && (
                              <span className="text-sm text-white/30">
                                /mo
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white tracking-tight">
                              Custom
                            </span>
                          </div>
                        )}
                        {price !== null && price > 0 && isAnnual && (
                          <p className="text-xs text-white/30 mt-1">
                            Billed annually at ${price * 12}/yr
                          </p>
                        )}
                        {price !== null && price > 0 && !isAnnual && (
                          <p className="text-xs text-emerald-400/60 mt-1">
                            Save ${(plan.monthlyPrice - plan.annualPrice) * 12}/yr with annual billing
                          </p>
                        )}
                      </div>

                      <p className="text-sm text-white/35 leading-relaxed mb-6">
                        {plan.description}
                      </p>

                      {/* CTA */}
                      <Link
                        href={plan.id === "enterprise" ? "#contact" : "/auth"}
                        className={`${plan.ctaStyle} w-full justify-center text-sm mb-8 ${
                          plan.highlighted ? "py-3" : ""
                        }`}
                      >
                        {plan.cta}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

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
                              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                plan.highlighted
                                  ? "text-brand-400"
                                  : "text-emerald-400/70"
                              }`}
                            />
                            <span className="text-white/50">{feature}</span>
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
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  30-Day Money-Back Guarantee
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  Try any paid plan risk-free. If you&apos;re not completely satisfied
                  within the first 30 days, we&apos;ll refund every penny. No
                  questions asked, no hoops to jump through. We&apos;re that
                  confident you&apos;ll love Kaelus.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ===== FEATURE COMPARISON TABLE ===== */}
      <section className="relative px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-display-sm md:text-display mb-4">
                Compare{" "}
                <span className="text-gradient-brand">Every Feature</span>
              </h2>
              <p className="text-white/40 max-w-xl mx-auto">
                A detailed breakdown of what&apos;s included in each plan so you
                can make the right choice for your team.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <div className="glass-card overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-4 border-b border-white/[0.06]">
                <div className="p-5 text-sm font-medium text-white/30">
                  Feature
                </div>
                {["Starter", "Pro", "Enterprise"].map((name) => (
                  <div
                    key={name}
                    className={`p-5 text-center text-sm font-semibold ${
                      name === "Pro"
                        ? "text-brand-400 bg-brand-500/[0.04]"
                        : "text-white/60"
                    }`}
                  >
                    {name}
                    {name === "Pro" && (
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
                  <div className="grid grid-cols-4 border-b border-white/[0.04] bg-white/[0.015]">
                    <div className="col-span-4 p-4 px-5">
                      <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">
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
                        className="grid grid-cols-4 border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors"
                      >
                        <div className="p-4 px-5 text-sm text-white/50">
                          {row.feature}
                        </div>
                        {(
                          ["starter", "pro", "enterprise"] as const
                        ).map((planKey) => {
                          const val = row[planKey];
                          return (
                            <div
                              key={planKey}
                              className={`p-4 text-center text-sm ${
                                planKey === "pro" ? "bg-brand-500/[0.02]" : ""
                              }`}
                            >
                              {typeof val === "boolean" ? (
                                val ? (
                                  <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                ) : (
                                  <Minus className="w-4 h-4 text-white/15 mx-auto" />
                                )
                              ) : (
                                <span
                                  className={
                                    planKey === "pro"
                                      ? "text-brand-300 font-medium"
                                      : "text-white/50"
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

      {/* ===== TRUSTED LOGOS / STATS BAR ===== */}
      <section className="relative px-6 pb-24">
        <AnimatedSection>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                stat: "2M+",
                label: "Scans processed",
                color: "text-brand-400",
              },
              {
                icon: Clock,
                stat: "<50ms",
                label: "Average latency",
                color: "text-emerald-400",
              },
              {
                icon: Lock,
                stat: "99.99%",
                label: "Uptime SLA",
                color: "text-amber-400",
              },
              {
                icon: Users,
                stat: "500+",
                label: "Teams protected",
                color: "text-purple-400",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card p-6 text-center"
              >
                <item.icon
                  className={`w-5 h-5 ${item.color} mx-auto mb-3`}
                />
                <p className="text-2xl font-bold text-white mb-1">
                  {item.stat}
                </p>
                <p className="text-xs text-white/30">{item.label}</p>
              </div>
            ))}
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
              <p className="text-white/40">
                Everything you need to know about Kaelus pricing and plans.
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
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/8 via-transparent to-purple-500/5" />
              <div className="absolute inset-0 bg-dot-grid opacity-30" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-6">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  SOC 2 &middot; GDPR &middot; HIPAA &middot; EU AI Act
                </div>

                <h2 className="text-display-sm md:text-display mb-4">
                  Ready to{" "}
                  <span className="text-gradient-brand">
                    Secure Your AI?
                  </span>
                </h2>
                <p className="text-white/40 max-w-xl mx-auto mb-8 leading-relaxed">
                  Join 500+ teams that trust Kaelus to protect their most
                  sensitive data from unauthorized AI exposure. Deploy in
                  under 15 minutes.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/auth" className="btn-primary px-8 py-3">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="#contact" className="btn-ghost px-8 py-3">
                    Talk to Sales
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-xs text-white/20 mt-6">
                  No credit card required &middot; 14-day Pro trial &middot;
                  Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Logo />
                <span className="font-bold">Kaelus<span className="text-brand-400">.ai</span></span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed">
                AI-powered compliance firewall protecting enterprise data from
                LLM leaks.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">
                Product
              </p>
              <div className="space-y-2.5">
                <Link
                  href="/#features"
                  className="block text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="block text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/dashboard"
                  className="block text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/#agents"
                  className="block text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  AI Agents
                </Link>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">
                Compliance
              </p>
              <div className="space-y-2.5">
                <span className="block text-sm text-white/30">SOC 2</span>
                <span className="block text-sm text-white/30">GDPR</span>
                <span className="block text-sm text-white/30">EU AI Act</span>
                <span className="block text-sm text-white/30">HIPAA</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">
                Company
              </p>
              <div className="space-y-2.5">
                <Link
                  href="/docs"
                  className="block text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  Documentation
                </Link>
                <Link
                  href="/auth"
                  className="block text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth"
                  className="block text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/15">
              &copy; 2026 Kaelus.ai — All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/20">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
