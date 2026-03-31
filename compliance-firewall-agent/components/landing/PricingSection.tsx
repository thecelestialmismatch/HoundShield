"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

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

const PLANS: PlanDef[] = [
  {
    name: "FREE TRIAL",
    tier: "free",
    price: "Free",
    period: "7-day trial",
    desc: "Try the full platform — no credit card required",
    features: [
      "100 AI scans / month",
      "PII & IP risk assessment",
      "SOC 2 control mapping",
      "1 AI compliance agent",
      "Community support",
    ],
    cta: "Start free trial →",
    ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
    featured: false,
  },
  {
    name: "SOLO",
    tier: "solo",
    price: "$29",
    period: "/mo",
    desc: "For freelancers & individual developers",
    features: [
      "1,000 AI scans / month",
      "PII, IP & secret detection",
      "SOC 2 PDF report",
      "1 seat",
      "Email support",
    ],
    cta: "Start Solo →",
    ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
    featured: false,
  },
  {
    name: "PRO",
    tier: "pro",
    price: "$99",
    period: "/mo",
    desc: "AI governance for growing teams",
    features: [
      "Unlimited AI scanning",
      "Source code & API key detection",
      "SOC 2 + HIPAA reports (PDF)",
      "5 team seats",
      "Real-time data leak alerts",
      "Priority support",
    ],
    cta: "Start Pro →",
    ctaClass: "bg-accent hover:bg-accent-dark text-white border-none",
    featured: true,
  },
  {
    name: "GROWTH",
    tier: "growth",
    price: "$249",
    period: "/mo",
    desc: "CMMC Level 2 for defense contractors",
    features: [
      "Everything in Pro",
      "CMMC Level 2 enforcement",
      "15 team seats",
      "Blockchain audit trail",
      "API gateway mode",
      "Slack/webhook integrations",
    ],
    cta: "Start Growth →",
    ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
    featured: false,
  },
  {
    name: "ENTERPRISE",
    tier: "enterprise",
    price: "$599",
    period: "/mo",
    desc: "Full AI governance for regulated industries",
    features: [
      "Everything in Growth",
      "Unlimited AI agents",
      "50 team seats",
      "Custom security policies",
      "SSO / SAML",
      "SLA guarantee",
      "Dedicated CSM",
    ],
    cta: "Start Enterprise →",
    ctaClass: "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]",
    featured: false,
  },
  {
    name: "AGENCY",
    tier: "agency",
    price: "$1,499",
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
];

export function PricingSection() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

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
            7 days free. <span className="italic text-brand-400">Pay when it&apos;s worth it.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-[520px] mx-auto">
            Start with a 7-day free trial — no credit card required. No contracts. Real prices for regulated industries.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
          {PLANS.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.08}>
              <div
                className={`relative p-7 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 ${plan.featured
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
                  {plan.tier === "free" ? (
                    <span className="ml-2 text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{plan.period}</span>
                  ) : (
                    <span className="text-base font-normal text-slate-500">{plan.period}</span>
                  )}
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
                    className={`block w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${plan.ctaClass} ${loading === plan.tier ? "opacity-60 pointer-events-none" : ""
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
