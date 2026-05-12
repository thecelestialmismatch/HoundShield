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
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
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
    icon: Users,
    name: "Referral Partner",
    price: "Free",
    commission: "20% recurring",
    highlight: null,
    features: [
      "20% recurring commission — forever",
      "Unique referral link + tracking dashboard",
      "Co-branded one-pager for client conversations",
      "HoundShield demo sandbox access",
      "48-hour partner onboarding call",
    ],
    cta: "Apply Now",
    type: "referral",
    bestFor: "C3PAOs, compliance consultants, security advisors",
  },
  {
    icon: Building2,
    name: "Reseller Partner",
    price: "$2,499/mo",
    commission: "Full margin control",
    highlight: "RECOMMENDED",
    features: [
      "White-label platform — your logo, your domain",
      "Unlimited client accounts at one flat rate",
      "Custom branding + color scheme",
      "Bulk PDF compliance reports",
      "Priority API access + SLA guarantee",
      "Dedicated onboarding + account manager",
      "Early access to new CMMC detection patterns",
    ],
    cta: "Apply for Reseller",
    type: "reseller",
    bestFor: "MSPs, IT security firms with 10+ DoD clients",
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
      "Co-sell with HoundShield sales team",
      "Revenue share model — negotiated",
    ],
    cta: "Apply for Tech Partner",
    type: "technology",
    bestFor: "GRC platforms, SIEM vendors, compliance toolchains",
  },
];

const C3PAO_VALUE_PROPS = [
  {
    icon: FileText,
    title: "Pre-collect client evidence",
    body: "HoundShield gives assessors 90 days of AI prompt audit logs before the assessment starts. Shorter fieldwork. Faster certification.",
  },
  {
    icon: Clock,
    title: "Reduce assessment time by 30%",
    body: "Practice 3.13.1, 3.13.2, and 3.13.8 documentation is auto-generated. Your assessors spend time on gaps, not on chasing logs.",
  },
  {
    icon: Shield,
    title: "Blockchain-verified audit trail",
    body: "Merkle-root sealed event logs. Tamper-proof evidence your clients can hand directly to DCSA or assessors.",
  },
  {
    icon: TrendingUp,
    title: "Turn findings into revenue",
    body: "Every SPRS deficiency you find is a HoundShield upsell. Refer clients, earn 20% recurring. Average referral = $50–$100/mo passive for years.",
  },
];

function CommissionCalculator() {
  const [clients, setClients] = useState(10);
  const [avgTier, setAvgTier] = useState<"pro" | "growth" | "enterprise">("growth");

  const tierPrices = { pro: 199, growth: 499, enterprise: 999 };
  const price = tierPrices[avgTier];
  const monthlyRevenue = clients * price;
  const commission = Math.round(monthlyRevenue * 0.2);
  const annualCommission = commission * 12;

  return (
    <div className="glass-card-glow rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-400/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Commission Calculator</h3>
          <p className="text-xs text-slate-500">Referral partner — 20% recurring, paid monthly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Clients referred
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={50}
              value={clients}
              onChange={(e) => setClients(Number(e.target.value))}
              className="flex-1 accent-brand-500 cursor-pointer"
            />
            <span className="w-8 text-right text-white font-mono font-bold">{clients}</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Average plan
          </label>
          <div className="flex gap-2">
            {(["pro", "growth", "enterprise"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAvgTier(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  avgTier === t
                    ? "bg-brand-500 text-white"
                    : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]"
                }`}
              >
                {t === "pro" ? "Pro $199" : t === "growth" ? "Growth $499" : "Ent. $999"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-5 border-t border-white/[0.08]">
        <div className="text-center">
          <div className="text-2xl font-extrabold text-white font-mono">
            ${monthlyRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Client MRR</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold text-brand-400 font-mono">
            ${commission.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Your monthly cut</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            ${annualCommission.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Annual passive</div>
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
    partnerType: "referral",
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
    <div className="bg-[#07070b] min-h-screen relative">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.15] pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 40% at 50% 60%, rgba(218,119,86,0.12) 0%, transparent 70%)",
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
              Partner Program · C3PAOs · MSPs · Compliance Consultants
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-editorial text-[clamp(36px,6vw,72px)] font-bold leading-[1.05] tracking-[-1px] max-w-[900px] mx-auto mb-6 text-white"
          >
            Every Client You Assess<br className="hidden sm:block" />
            Could Be Paying You{" "}
            <span className="italic bg-gradient-to-r from-brand-400 via-accent to-brand-400 bg-clip-text text-transparent">
              Forever
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[clamp(16px,2vw,20px)] text-slate-400 max-w-[620px] mx-auto mb-4 leading-relaxed"
          >
            Refer your CMMC clients to HoundShield. Earn 20% of their subscription — every month — for as long as they stay. No cap. No expiry.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-sm font-mono text-brand-400/80 mb-10"
          >
            10 referrals × $499/mo Growth plan = <span className="text-brand-400 font-bold">$998/mo passive</span>
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
              Calculate my commission <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Why C3PAOs Partner ──────────────────── */}
      <section className="py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
              Built for C3PAOs First
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white max-w-2xl mx-auto">
              Make your assessments faster — and earn when they succeed
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-14">
            {C3PAO_VALUE_PROPS.map((prop, i) => (
              <FadeIn key={prop.title} delay={i * 0.08}>
                <div className="glass-card rounded-xl p-7 h-full">
                  <div className="w-10 h-10 rounded-xl bg-brand-400/10 flex items-center justify-center mb-4">
                    <prop.icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{prop.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{prop.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* MSP math */}
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-xl p-8">
                <div className="w-12 h-12 rounded-xl bg-brand-400/10 flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">For MSPs</h3>
                <ul className="flex flex-col gap-3">
                  {[
                    "Manage 10–100 clients from one dashboard",
                    "Your logo. Your pricing. Your relationships.",
                    "20% recurring commission on every referral",
                    "Or white-label at $2,499/mo flat — keep 100% of margin",
                    "CMMC + HIPAA + SOC 2 in one platform",
                    "Automated evidence collection per client",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card rounded-xl p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">For C3PAOs</h3>
                <ul className="flex flex-col gap-3">
                  {[
                    "Give clients a self-assessment head start before fieldwork",
                    "Pre-populated SPRS estimates reduce scoping friction",
                    "Practice 3.13.1/3.13.2/3.13.8 auto-documented",
                    "Blockchain-verified audit trail for DCSA submissions",
                    "20% recurring on every client you refer — no limit",
                    "Early access to CMMC 2.0 Level 3 pattern updates",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Commission Calculator ─────────────── */}
      <section id="calculator" className="py-24 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
              See Your Numbers
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-editorial font-bold tracking-tight leading-[1.1] text-white">
              What&apos;s your practice worth?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <CommissionCalculator />
          </FadeIn>
          <FadeIn delay={0.2} className="mt-5 text-center">
            <p className="text-xs text-slate-500 font-mono">
              Commissions paid on the 1st of each month · 60-day attribution window · no cap on earnings
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Partner Tiers ─────────────────────── */}
      <section id="reseller" className="py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
              Partner Tiers
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white">
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
                      : "bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15]"
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                      {tier.highlight}
                    </div>
                  )}
                  <tier.icon className="w-8 h-8 text-brand-400 mb-4" />
                  <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    {tier.name}
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-white mb-1">
                    {tier.price}
                  </div>
                  <div className="text-xs font-mono text-brand-400/80 mb-5">{tier.commission}</div>

                  <ul className="flex flex-col gap-2 mb-5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="text-[11px] text-slate-500 font-mono mb-4 border-t border-white/[0.06] pt-4">
                    Best for: {tier.bestFor}
                  </div>

                  <a
                    href="#apply"
                    onClick={() => setFormState((s) => ({ ...s, partnerType: tier.type }))}
                    className={`block w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${
                      tier.highlight
                        ? "bg-brand-600 hover:bg-brand-700 text-white"
                        : "bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1]"
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
      <section className="py-16 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-brand-400 text-brand-400" />
              ))}
            </div>
            <p className="text-sm text-slate-500">Trusted by compliance consultants across the DIB</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                quote: "I referred 6 clients in my first month. The referral dashboard is clean and payouts hit on the 1st without chasing anyone.",
                author: "C3PAO assessor, mid-Atlantic",
                stars: 5,
              },
              {
                quote: "The pre-collected evidence cut my assessment fieldwork by a full day on my last Level 2 engagement. That's real money.",
                author: "Independent CMMC consultant",
                stars: 5,
              },
              {
                quote: "White-label was live in 2 hours. My clients see my brand; I keep the margin. This is the model MSPs have been waiting for.",
                author: "MSP, 40+ DoD clients",
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
                  <p className="text-sm text-slate-300 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                  <p className="text-xs text-slate-500 font-mono">{t.author}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ──────────────────── */}
      <section id="apply" className="py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-400/20 bg-brand-400/[0.08] text-brand-400 text-xs font-semibold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              48-hour response time
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
              Apply for Partner Program
            </h2>
            <p className="text-slate-400">
              Tell us about your practice. We respond within 48 hours with your referral link and onboarding materials.
            </p>
          </FadeIn>

          {submitted ? (
            <FadeIn>
              <div className="glass-card rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Application received
                </h3>
                <p className="text-slate-400 mb-5">
                  We&apos;ll review your application and get back to you within 48 hours at{" "}
                  <span className="text-white">{formState.email}</span>.
                </p>
                <p className="text-xs text-slate-500 font-mono">
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
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 transition"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Company *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.company}
                      onChange={(e) => setFormState((s) => ({ ...s, company: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 transition"
                      placeholder="Acme Compliance LLC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 transition"
                    placeholder="jane@acme.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      DoD clients (approx.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formState.clientCount}
                      onChange={(e) => setFormState((s) => ({ ...s, clientCount: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 transition"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Partner Type
                    </label>
                    <select
                      value={formState.partnerType}
                      onChange={(e) => setFormState((s) => ({ ...s, partnerType: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-white/[0.1] text-white focus:outline-none focus:border-brand-400/50 transition"
                    >
                      <option value="referral">Referral Partner (free)</option>
                      <option value="reseller">Reseller Partner ($2,499/mo)</option>
                      <option value="technology">Technology Partner (custom)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Tell us about your practice
                  </label>
                  <textarea
                    rows={3}
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 transition resize-none"
                    placeholder="How many DoD contractors do you work with? Are you a C3PAO, MSP, or independent consultant?"
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

                <p className="text-xs text-center text-slate-600">
                  By applying you agree to the{" "}
                  <Link href="/terms" className="text-slate-500 hover:text-slate-400 underline">
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
      <section className="py-16 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <DollarSign className="w-10 h-10 mx-auto text-brand-400 mb-4" />
            <p className="text-2xl md:text-3xl font-bold text-white mb-2">
              3 C3PAOs × 10 referrals × $499/mo ={" "}
              <span className="text-brand-400">$2,994/mo</span>
            </p>
            <p className="text-sm text-slate-400 mb-6">
              In passive commissions. Before a single direct sale.
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

      <LandingFooter />
    </div>
  );
}
