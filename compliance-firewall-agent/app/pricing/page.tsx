"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ScrollProgressBar } from "@/components/scroll-effects";
import {
  ArrowRight, Check, ChevronDown, Minus, ShieldCheck, BadgeCheck,
  Zap, Crown, TrendingUp, Building2, Users, type LucideIcon,
} from "lucide-react";
import { PLANS, COMPARISON, FAQ, type PlanId } from "./_data";

const PLAN_ICONS: Record<string, LucideIcon> = {
  Zap, Crown, TrendingUp, Building2, Users,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-slate-200 pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-72 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

const PLAN_KEYS: PlanId[] = ["starter", "pro", "growth", "enterprise", "agency"];
const CATEGORIES = [...new Set(COMPARISON.map((r) => r.category))];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckout(tierId: string) {
    if (tierId === "starter") { router.push("/signup"); return; }
    if (tierId === "agency")  { router.push("/contact"); return; }
    setError(null);
    setLoading(tierId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId, billing: isAnnual ? "annual" : "monthly" }),
      });
      if (res.status === 401) { router.push("/login?redirect=/pricing"); return; }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Checkout failed. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="dark min-h-screen bg-[#07070b]">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm px-5 py-3 rounded-xl">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-rose-400/60 hover:text-rose-400">✕</button>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-400/30 bg-brand-400/5 text-brand-400 text-xs font-mono mb-6">
            <BadgeCheck className="w-3.5 h-3.5" />
            CMMC Level 2 · DFARS 7012 · NIST 800-171
          </div>
          <h1 className="text-5xl md:text-6xl font-editorial font-bold text-white mb-5 leading-tight">
            Simple,{" "}
            <span className="text-brand-400">Transparent</span>{" "}
            Pricing
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-4 leading-relaxed">
            Jordan pays for Pro. Her C3PAO gets the PDF. Her SPRS score improves.
            One proxy URL change — deploy in under 10 minutes.
          </p>
          <p className="text-sm text-slate-500 mb-10">
            Prompt content never leaves your network. DFARS 7012 compliant by design.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${!isAnnual ? "bg-brand-400 text-black" : "text-slate-400 hover:text-slate-300"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${isAnnual ? "bg-brand-400 text-black" : "text-slate-400 hover:text-slate-300"}`}
            >
              Annual
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing cards ── */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {PLANS.map((plan) => {
            const Icon = PLAN_ICONS[plan.icon];
            const price = isAnnual ? plan.annualMonthly : plan.monthlyPrice;
            const isHighlighted = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-6 transition-all ${
                  isHighlighted
                    ? "bg-[#0d0d14] border border-brand-400/40 ring-1 ring-brand-400/20 scale-[1.02]"
                    : "bg-[#0d0d14] border border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      isHighlighted
                        ? "bg-brand-400 text-black border-brand-400"
                        : "bg-[#0d0d14] text-brand-400 border-brand-400/40"
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 mb-4 mt-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${plan.iconBg}`}>
                    <Icon className={`w-4.5 h-4.5 ${plan.iconColor}`} />
                  </div>
                  <span className="font-semibold text-white text-base">{plan.name}</span>
                </div>

                <div className="mb-1">
                  {plan.monthlyPrice === 0 ? (
                    <span className="text-3xl font-bold text-white">Free</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">${price}</span>
                      <span className="text-sm text-slate-500">/mo</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mb-4 font-mono">
                  {plan.monthlyPrice === 0
                    ? "No credit card required"
                    : isAnnual
                      ? `$${plan.annualTotal.toLocaleString()}/yr · save 20%`
                      : "Billed monthly"}
                </p>

                <p className="text-xs text-slate-500 leading-relaxed mb-5 flex-none">{plan.description}</p>

                {plan.ctaHref ? (
                  <Link
                    href={plan.ctaHref}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors mb-6 ${
                      isHighlighted
                        ? "bg-brand-400 text-black hover:bg-brand-400/90"
                        : "border border-white/10 text-slate-300 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading === plan.id}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors mb-6 disabled:opacity-60 ${
                      isHighlighted
                        ? "bg-brand-400 text-black hover:bg-brand-400/90"
                        : "border border-white/10 text-slate-300 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {loading === plan.id ? "Redirecting…" : plan.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="border-t border-white/[0.05] pt-5">
                  <ul className="space-y-2.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isHighlighted ? "text-brand-400" : "text-emerald-400/70"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Jordan callout ── */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-brand-400/10 border border-brand-400/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-400 mb-1 font-mono uppercase tracking-wider">For DoD contractors facing CMMC Level 2</p>
              <p className="text-sm text-slate-300 leading-relaxed mb-2">
                Your C3PAO will ask: <em>"What controls do you have on AI tool usage?"</em> HoundShield is the answer.
                Start on Pro — deploy the proxy, block the first CUI exfiltration attempt, export the JSON report.
                When your audit date approaches, upgrade to Growth for the PDF your assessor can stamp.
              </p>
              <p className="text-xs text-slate-500">Most contractors move Pro → Growth 60 days before their C3PAO assessment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Money-back guarantee ── */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">30-Day Money-Back Guarantee</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                If HoundShield does not improve your CMMC posture within 30 days, we refund every dollar. No questions, no forms, no holds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-editorial font-bold text-white mb-3">
              Compare <span className="text-brand-400">Every Feature</span>
            </h2>
            <p className="text-slate-500 text-sm">Full breakdown across all five tiers.</p>
          </div>

          <div className="glass-card overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-6 min-w-[760px] border-b border-white/[0.06]">
              <div className="p-4 text-xs text-slate-500 font-medium">Feature</div>
              {PLAN_KEYS.map((key) => {
                const plan = PLANS.find((p) => p.id === key)!;
                return (
                  <div key={key} className={`p-4 text-center text-xs font-semibold ${key === "pro" ? "text-brand-400 bg-brand-400/[0.03]" : "text-slate-400"}`}>
                    {plan.name}
                    {key === "pro" && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-400/15 text-brand-300 text-[9px] font-bold">Popular</span>}
                  </div>
                );
              })}
            </div>

            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <div className="grid grid-cols-6 min-w-[760px] bg-white/[0.015] border-b border-white/[0.04]">
                  <div className="col-span-6 px-4 py-2.5">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{cat}</span>
                  </div>
                </div>
                {COMPARISON.filter((r) => r.category === cat).map((row, i) => (
                  <div key={i} className="grid grid-cols-6 min-w-[760px] border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                    <div className="p-3 px-4 text-xs text-slate-400">{row.feature}</div>
                    {PLAN_KEYS.map((key) => {
                      const val = row[key];
                      return (
                        <div key={key} className={`p-3 text-center text-xs ${key === "pro" ? "bg-brand-400/[0.02]" : ""}`}>
                          {typeof val === "boolean" ? (
                            val ? <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <Minus className="w-3.5 h-3.5 text-slate-700 mx-auto" />
                          ) : (
                            <span className={key === "pro" ? "text-brand-300 font-medium" : "text-slate-400"}>{val}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product facts bar (no fake stats) ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { stat: "16",          label: "Detection engines",         sub: "CUI · PII · PHI · secrets · CAGE" },
            { stat: "<10ms",       label: "Scan latency",              sub: "Zero user impact" },
            { stat: "110",         label: "NIST 800-171 controls",     sub: "CMMC Level 2 full coverage" },
            { stat: "1 URL",       label: "To deploy",                 sub: "Works with any AI provider" },
          ].map((item) => (
            <div key={item.stat} className="glass-card p-5 text-center">
              <p className="text-2xl font-bold font-mono text-brand-400 mb-1">{item.stat}</p>
              <p className="text-xs font-semibold text-white mb-1">{item.label}</p>
              <p className="text-[10px] text-slate-600">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-editorial font-bold text-white mb-3">
              Frequently Asked <span className="text-brand-400">Questions</span>
            </h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center glass-card p-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-400/30 bg-brand-400/5 text-brand-400 text-xs font-mono mb-5">
            <BadgeCheck className="w-3.5 h-3.5" />
            CMMC Level 2 · HIPAA · SOC 2
          </div>
          <h2 className="text-4xl font-editorial font-bold text-white mb-3">
            Deploy before your <span className="text-brand-400">C3PAO assessment.</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8">
            One proxy URL change. All AI prompts scanned locally. CUI blocked before it reaches ChatGPT.
            7-day free trial — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="flex items-center gap-2 px-7 py-3 bg-brand-400 text-black font-semibold rounded-lg hover:bg-brand-400/90 transition-colors text-sm">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="flex items-center gap-2 px-7 py-3 border border-white/10 text-slate-300 font-semibold rounded-lg hover:border-white/20 hover:text-white transition-colors text-sm">
              Talk to Sales <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-slate-700 mt-5">No credit card required · 7-day Pro trial · Cancel anytime</p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
