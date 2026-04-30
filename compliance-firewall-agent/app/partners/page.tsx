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
    features: [
      "20% recurring commission",
      "Partner dashboard",
      "Co-marketing materials",
      "Dedicated partner manager",
    ],
    cta: "Apply Now",
    type: "referral",
  },
  {
    icon: Building2,
    name: "Reseller Partner",
    price: "$2,499/mo",
    features: [
      "White-label platform",
      "Unlimited client accounts",
      "Custom branding",
      "Bulk compliance reports",
      "Priority API access",
      "Dedicated onboarding",
    ],
    cta: "Apply for Reseller",
    type: "reseller",
    featured: true,
  },
  {
    icon: Zap,
    name: "Technology Partner",
    price: "Custom",
    features: [
      "Full API access",
      "Custom integrations",
      "SDK & documentation",
      "Joint go-to-market",
      "Revenue share model",
    ],
    cta: "Apply for Tech Partner",
    type: "technology",
  },
];

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
    <div className="bg-[#0a0a0a] min-h-screen relative">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.15] pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-400/20 bg-brand-400/[0.08] text-brand-400 text-xs font-semibold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Partner Program · MSPs · C3PAOs · Compliance Consultants
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-editorial text-[clamp(36px,6vw,72px)] font-bold leading-[1.05] tracking-[-1px] max-w-[900px] mx-auto mb-6 text-white"
          >
            White-Label AI Compliance for{" "}
            <span className="italic bg-gradient-to-r from-brand-400 via-accent to-brand-400 bg-clip-text text-transparent">
              Your Clients
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[clamp(16px,2vw,20px)] text-slate-400 max-w-[620px] mx-auto mb-10 leading-relaxed"
          >
            Add AI security monitoring to your compliance practice.
            Your brand. Our engine. Starting free for qualified partners.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <a
              href="#apply"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,125,62,0.35)] text-base"
            >
              Apply for Partner Program
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Value Props ──────────────────────────── */}
      <section id="msp" className="py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* MSP Value */}
            <FadeIn>
              <div className="glass-card rounded-xl p-8">
                <div className="w-12 h-12 rounded-xl bg-brand-400/10 flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">For MSPs</h3>
                <ul className="flex flex-col gap-3">
                  {[
                    "Manage 10–100 clients from one dashboard",
                    "Your logo. Your pricing. Your relationships.",
                    "Revenue share: 20% recurring on every client",
                    "Automated compliance reports per client",
                    "CMMC + HIPAA coverage in one platform",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* C3PAO Value */}
            <FadeIn delay={0.1}>
              <div className="glass-card rounded-xl p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">For C3PAOs</h3>
                <ul className="flex flex-col gap-3">
                  {[
                    "Give clients a self-assessment head start",
                    "Reduce assessment time with pre-collected evidence",
                    "Differentiate with AI security monitoring",
                    "Blockchain-verified compliance receipts",
                    "Tamper-proof audit trail for assessments",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>

          {/* Math callout */}
          <FadeIn delay={0.2} className="mt-12">
            <div className="glass-card-glow rounded-xl p-8 text-center">
              <DollarSign className="w-10 h-10 mx-auto text-accent mb-4" />
              <p className="text-2xl md:text-3xl font-bold text-white mb-2">
                3 MSPs &times; 15 clients &times; $199/mo ={" "}
                <span className="text-accent">$8,955 MRR</span>
              </p>
              <p className="text-sm text-slate-400">
                Before you touch a single direct sale.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Partner Tiers ─────────────────────────── */}
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
                  className={`relative p-7 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 ${
                    tier.featured
                      ? "bg-brand-400/[0.06] border border-brand-400/40 hover:border-brand-400/60"
                      : "bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15]"
                  }`}
                >
                  {tier.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                      RECOMMENDED
                    </div>
                  )}
                  <tier.icon className="w-8 h-8 text-brand-400 mb-4" />
                  <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    {tier.name}
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-white mb-5">
                    {tier.price}
                  </div>
                  <ul className="flex flex-col gap-2 mb-6">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#apply"
                    onClick={() => setFormState((s) => ({ ...s, partnerType: tier.type }))}
                    className={`block w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${
                      tier.featured
                        ? "bg-accent hover:bg-accent-dark text-white"
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

      {/* ── Application Form ──────────────────────── */}
      <section id="apply" className="py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <h2 className="text-[clamp(28px,4vw,40px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-4">
              Apply for Partner Program
            </h2>
            <p className="text-slate-400">
              Tell us about your practice. We respond within 48 hours.
            </p>
          </FadeIn>

          {submitted ? (
            <FadeIn>
              <div className="glass-card rounded-xl p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Application received
                </h3>
                <p className="text-slate-400">
                  We&apos;ll review your application and get back to you within 48 hours.
                  Check your email at <span className="text-white">{formState.email}</span>.
                </p>
              </div>
            </FadeIn>
          ) : (
            <FadeIn>
              <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 flex flex-col gap-5">
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Number of Clients
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formState.clientCount}
                    onChange={(e) => setFormState((s) => ({ ...s, clientCount: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 transition"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Partner Type
                  </label>
                  <select
                    value={formState.partnerType}
                    onChange={(e) => setFormState((s) => ({ ...s, partnerType: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white focus:outline-none focus:border-brand-400/50 transition"
                  >
                    <option value="referral" className="bg-[#0a0a0a]">Referral Partner</option>
                    <option value="reseller" className="bg-[#0a0a0a]">Reseller Partner</option>
                    <option value="technology" className="bg-[#0a0a0a]">Technology Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Message (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 transition resize-none"
                    placeholder="Tell us about your practice..."
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </FadeIn>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
