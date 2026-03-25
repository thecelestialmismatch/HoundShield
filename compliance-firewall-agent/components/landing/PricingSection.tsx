"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Shield, Activity, Lock } from "lucide-react";

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
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

type IndustryTab = "defense" | "healthcare" | "technology";

const INDUSTRY_TABS: { key: IndustryTab; label: string; icon: typeof Shield; subtitle: string }[] = [
  { key: "defense", label: "Defense", icon: Shield, subtitle: "CMMC · NIST 800-171" },
  { key: "healthcare", label: "Healthcare", icon: Activity, subtitle: "HIPAA · PHI Protection" },
  { key: "technology", label: "Technology", icon: Lock, subtitle: "SOC 2 · IP Protection" },
];

interface PlanDef {
  name: string;
  tier: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  ctaClass: string;
  featured: boolean;
}

const PLANS_BY_INDUSTRY: Record<IndustryTab, PlanDef[]> = {
  defense: [
    {
      name: "FREE",
      tier: "free",
      price: "$0",
      period: "/mo",
      desc: "Get started and know your SPRS score today",
      features: [
        "100 API scans / month",
        "Full CMMC self-assessment",
        "Live SPRS calculator",
        "1 AI compliance agent",
        "Community support",
      ],
      cta: "Get started →",
      ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
      featured: false,
    },
    {
      name: "PRO",
      tier: "pro",
      price: "$69",
      period: "/mo",
      desc: "Everything to get and stay CMMC certified",
      features: [
        "Unlimited API scanning",
        "PDF compliance reports",
        "Gap analysis + roadmap",
        "5 AI compliance agents",
        "Real-time CUI threat alerts",
        "Email notifications",
        "Priority support",
      ],
      cta: "Start Pro →",
      ctaClass: "bg-accent hover:bg-accent-dark text-white border-none",
      featured: true,
    },
    {
      name: "ENTERPRISE",
      tier: "enterprise",
      price: "$249",
      period: "/mo",
      desc: "Full compliance stack for defense contractors",
      features: [
        "Everything in Pro",
        "Unlimited AI agents",
        "25 team seats",
        "Blockchain-anchored audit trail",
        "API gateway mode",
        "Slack/webhook integrations",
        "Custom CMMC policies",
      ],
      cta: "Start Enterprise →",
      ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
      featured: false,
    },
    {
      name: "AGENCY",
      tier: "agency",
      price: "$599",
      period: "/mo",
      desc: "Multi-tenant dashboard for MSPs and C3PAOs",
      features: [
        "Everything in Enterprise",
        "25 client accounts",
        "White-label option",
        "Bulk compliance reports",
        "Partner API access",
        "Dedicated onboarding",
      ],
      cta: "Contact us →",
      ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
      featured: false,
    },
  ],
  healthcare: [
    {
      name: "FREE",
      tier: "free",
      price: "$0",
      period: "/mo",
      desc: "Scan your AI risk and assess HIPAA posture",
      features: [
        "100 AI scans / month",
        "HIPAA control assessment",
        "PHI risk scoring",
        "1 AI compliance agent",
        "Community support",
      ],
      cta: "Get started →",
      ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
      featured: false,
    },
    {
      name: "PRO",
      tier: "pro",
      price: "$69",
      period: "/mo",
      desc: "Complete HIPAA AI compliance for healthcare orgs",
      features: [
        "Unlimited AI scanning",
        "All 18 PHI identifier detection",
        "HIPAA compliance reports (PDF)",
        "5 AI compliance agents",
        "Real-time PHI leak alerts",
        "Email notifications",
        "Priority support",
      ],
      cta: "Start Pro →",
      ctaClass: "bg-accent hover:bg-accent-dark text-white border-none",
      featured: true,
    },
    {
      name: "ENTERPRISE",
      tier: "enterprise",
      price: "$249",
      period: "/mo",
      desc: "Full HIPAA compliance stack for health systems",
      features: [
        "Everything in Pro",
        "Unlimited AI agents",
        "25 team seats",
        "Blockchain-anchored audit trail",
        "API gateway mode",
        "Slack/webhook integrations",
        "Custom HIPAA policies",
      ],
      cta: "Start Enterprise →",
      ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
      featured: false,
    },
    {
      name: "AGENCY",
      tier: "agency",
      price: "$599",
      period: "/mo",
      desc: "Multi-tenant dashboard for healthcare MSPs",
      features: [
        "Everything in Enterprise",
        "25 client accounts",
        "White-label option",
        "Bulk HIPAA reports",
        "Partner API access",
        "Dedicated onboarding",
      ],
      cta: "Contact us →",
      ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
      featured: false,
    },
  ],
  technology: [
    {
      name: "FREE",
      tier: "free",
      price: "$0",
      period: "/mo",
      desc: "Scan your AI tools for data leak risks",
      features: [
        "100 AI scans / month",
        "PII & IP risk assessment",
        "SOC 2 control mapping",
        "1 AI compliance agent",
        "Community support",
      ],
      cta: "Get started →",
      ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
      featured: false,
    },
    {
      name: "PRO",
      tier: "pro",
      price: "$69",
      period: "/mo",
      desc: "AI governance for engineering teams",
      features: [
        "Unlimited AI scanning",
        "Source code & API key detection",
        "SOC 2 compliance reports (PDF)",
        "5 AI compliance agents",
        "Real-time data leak alerts",
        "Email notifications",
        "Priority support",
      ],
      cta: "Start Pro →",
      ctaClass: "bg-accent hover:bg-accent-dark text-white border-none",
      featured: true,
    },
    {
      name: "ENTERPRISE",
      tier: "enterprise",
      price: "$249",
      period: "/mo",
      desc: "Full AI governance for growing tech companies",
      features: [
        "Everything in Pro",
        "Unlimited AI agents",
        "25 team seats",
        "Blockchain-anchored audit trail",
        "API gateway mode",
        "Slack/webhook integrations",
        "Custom security policies",
      ],
      cta: "Start Enterprise →",
      ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
      featured: false,
    },
    {
      name: "AGENCY",
      tier: "agency",
      price: "$599",
      period: "/mo",
      desc: "Multi-tenant dashboard for IT consultancies",
      features: [
        "Everything in Enterprise",
        "25 client accounts",
        "White-label option",
        "Bulk compliance reports",
        "Partner API access",
        "Dedicated onboarding",
      ],
      cta: "Contact us →",
      ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
      featured: false,
    },
  ],
};

export function PricingSection() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<IndustryTab>("defense");

  const plans = PLANS_BY_INDUSTRY[activeTab];

  async function handleCheckout(tier: string) {
    try {
      setLoading(tier);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billing: "monthly" }),
      });
      if (res.status === 401) {
        router.push("/login?redirect=/pricing");
        return;
      }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="py-24 md:py-32 bg-[#07070b]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <FadeIn className="mb-10">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            Pricing
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
            Start free. <span className="italic text-brand-400">Pay when it&apos;s worth it.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-[520px] mx-auto">
            No contracts. No enterprise sales calls. Real prices for regulated industries.
          </p>
        </FadeIn>

        {/* Industry tabs */}
        <FadeIn delay={0.05} className="mb-10">
          <div className="flex items-center justify-center gap-2">
            {INDUSTRY_TABS.map(({ key, label, icon: Icon, subtitle }) => {
              const isActive = key === activeTab;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-brand-400/[0.12] border border-brand-400/30 text-white"
                      : "bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-400" : "text-slate-600"}`} />
                  <div>
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-[10px] text-slate-500">{subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, i) => (
            <FadeIn key={`${activeTab}-${plan.name}`} delay={i * 0.08}>
              <div
                className={`relative p-7 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 ${
                  plan.featured
                    ? "bg-brand-400/[0.06] border border-brand-400/40 hover:border-brand-400/60"
                    : "bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15]"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  {plan.name}
                </div>
                <div className="text-[36px] font-extrabold tracking-tight text-white mb-1">
                  {plan.price}
                  <span className="text-base font-normal text-slate-500">{plan.period}</span>
                </div>
                <div className="text-[13px] text-slate-400 leading-relaxed mb-5">{plan.desc}</div>

                <ul className="flex flex-col gap-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.tier === "free" ? (
                  <Link
                    href="/signup"
                    className={`block w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${plan.ctaClass}`}
                  >
                    {plan.cta}
                  </Link>
                ) : plan.tier === "agency" ? (
                  <Link
                    href="/contact?plan=agency"
                    className={`block w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${plan.ctaClass}`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.tier)}
                    disabled={loading === plan.tier}
                    className={`block w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${plan.ctaClass} ${
                      loading === plan.tier ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {loading === plan.tier ? "Redirecting..." : plan.cta}
                  </button>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
