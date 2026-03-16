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

const PLANS = [
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
    ctaClass: "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50",
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
      "Real-time threat alerts",
      "Email notifications",
      "Priority support",
    ],
    cta: "Start Pro →",
    ctaClass: "bg-indigo-600 hover:bg-indigo-500 text-white border-none",
    featured: true,
  },
  {
    name: "ENTERPRISE",
    tier: "enterprise",
    price: "$249",
    period: "/mo",
    desc: "Full compliance stack for growing contractors",
    features: [
      "Everything in Pro",
      "Unlimited AI agents",
      "25 team seats",
      "Audit trail export",
      "API gateway mode",
      "Slack/webhook integrations",
      "Custom compliance policies",
    ],
    cta: "Start Enterprise →",
    ctaClass: "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50",
    featured: false,
  },
  {
    name: "AGENCY",
    tier: "agency",
    price: "$599",
    period: "/mo",
    desc: "Multi-tenant dashboard for MSPs and consultants",
    features: [
      "Everything in Enterprise",
      "25 client accounts",
      "White-label option",
      "Bulk compliance reports",
      "Partner API access",
      "Dedicated onboarding",
    ],
    cta: "Contact us →",
    ctaClass: "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50",
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
    <section id="pricing" className="py-24 md:py-32 bg-[#F7F5F0]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <FadeIn className="mb-14">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-4">
            Pricing
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.1] text-gray-900 mb-4">
            Start free. Pay when it&apos;s worth it.
          </h2>
          <p className="text-lg text-gray-600 max-w-[520px] mx-auto">
            No contracts. No enterprise sales calls. No &ldquo;contact us for pricing.&rdquo; Real prices for real defense contractors.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.08}>
              <div
                className={`relative p-7 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 ${
                  plan.featured
                    ? "bg-indigo-50 border border-indigo-400 hover:border-indigo-500"
                    : "bg-white border border-gray-200 hover:border-indigo-200"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {plan.name}
                </div>
                <div className="text-[36px] font-extrabold tracking-tight text-gray-900 mb-1">
                  {plan.price}
                  <span className="text-base font-normal text-gray-500">{plan.period}</span>
                </div>
                <div className="text-[13px] text-gray-500 leading-relaxed mb-5">{plan.desc}</div>

                <ul className="flex flex-col gap-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] text-gray-700">
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
