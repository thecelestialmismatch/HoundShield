"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Eye,
  Radar,
  FileCheck,
  Fingerprint,
  Activity,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Scale,
  Brain,
  Bot,
  Terminal,
  Sparkles,
  Target,
  Scan,
  BarChart3,
  Database,
  Users,
  Clock,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

/* ── Fade-in section wrapper ──────────────────────────────────────── */
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
  const isInView = useInView(ref, { once: true, margin: "-80px" });

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

/* ── Section Label ────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600/80">
        {children}
      </span>
    </div>
  );
}

/* ── 3D Floating Shape ────────────────────────────────────────────── */
function FloatingShape({
  className,
  variant = "sphere",
  size = 80,
  delay = 0,
}: {
  className?: string;
  variant?: "sphere" | "cube" | "torus" | "ring";
  size?: number;
  delay?: number;
}) {
  const shapeStyles: Record<string, React.CSSProperties> = {
    sphere: {
      width: size,
      height: size,
      borderRadius: "50%",
      background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.08))",
      boxShadow: `inset -${size/10}px -${size/10}px ${size/4}px rgba(37,99,235,0.06), inset ${size/20}px ${size/20}px ${size/8}px rgba(255,255,255,0.8), 0 ${size/4}px ${size/2}px -${size/8}px rgba(37,99,235,0.1)`,
    },
    cube: {
      width: size,
      height: size,
      borderRadius: size / 6,
      background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(6,182,212,0.06))",
      border: "1px solid rgba(37,99,235,0.1)",
      boxShadow: `inset -4px -4px 12px rgba(37,99,235,0.04), inset 2px 2px 6px rgba(255,255,255,0.6), 0 15px 30px -8px rgba(37,99,235,0.08)`,
      transform: "rotate(45deg)",
    },
    torus: {
      width: size,
      height: size,
      borderRadius: "50%",
      border: `${Math.max(4, size/12)}px solid rgba(37,99,235,0.1)`,
      background: "transparent",
      boxShadow: `inset 0 0 ${size/4}px rgba(37,99,235,0.06), 0 ${size/8}px ${size/3}px -${size/10}px rgba(37,99,235,0.08)`,
    },
    ring: {
      width: size,
      height: size,
      borderRadius: "50%",
      border: `2px solid rgba(37,99,235,0.08)`,
      background: "transparent",
    },
  };

  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={shapeStyles[variant]}
      animate={{
        y: [0, -12, 0],
        rotate: variant === "cube" ? [45, 50, 45] : [0, 5, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

/* ── Bento Feature Card ───────────────────────────────────────────── */
function BentoCard({
  title,
  description,
  icon: Icon,
  gradient,
  span = false,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  span?: boolean;
}) {
  return (
    <motion.div
      className={`glass-card-glow p-6 ${span ? "md:col-span-2" : ""}`}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div
        className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center mb-4 shadow-sm`}
      >
        <Icon className="w-5 h-5 text-slate-900" strokeWidth={2} />
      </div>
      <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  );
}

/* ── Stat Counter ─────────────────────────────────────────────────── */
function StatCounter({ value, label, suffix = "" }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="font-display font-bold text-3xl md:text-4xl text-slate-900 mb-1">
        {value}<span className="text-blue-600">{suffix}</span>
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

/* ── Pricing Card ─────────────────────────────────────────────────── */
function PricingCard({
  name,
  price,
  period,
  description,
  features,
  popular = false,
  cta = "Get Started",
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta?: string;
}) {
  return (
    <motion.div
      className={`relative rounded-2xl p-8 ${
        popular
          ? "bg-white border-2 border-blue-600 shadow-glow-lg"
          : "bg-white border border-slate-200 shadow-card"
      }`}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-slate-900 text-xs font-semibold px-4 py-1.5 rounded-full shadow-md">
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="font-display font-bold text-xl text-slate-900 mb-1">{name}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="mb-6">
        <span className="font-display font-bold text-4xl text-slate-900">{price}</span>
        <span className="text-slate-500 text-sm ml-1">/{period}</span>
      </div>
      <Link
        href="/signup"
        className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
          popular
            ? "btn-primary"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        {cta}
      </Link>
      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <>
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div className="absolute inset-0 bg-hero-glow" />

        {/* 3D Floating shapes */}
        <FloatingShape variant="sphere" size={120} className="top-[15%] left-[8%] opacity-60" delay={0} />
        <FloatingShape variant="cube" size={60} className="top-[20%] right-[12%] opacity-50" delay={1} />
        <FloatingShape variant="torus" size={100} className="bottom-[25%] left-[15%] opacity-40" delay={2} />
        <FloatingShape variant="sphere" size={50} className="top-[60%] right-[8%] opacity-30" delay={0.5} />
        <FloatingShape variant="ring" size={200} className="top-[10%] right-[20%] opacity-20" delay={3} />
        <FloatingShape variant="cube" size={40} className="bottom-[15%] right-[25%] opacity-40" delay={1.5} />
        <FloatingShape variant="sphere" size={30} className="top-[40%] left-[5%] opacity-25" delay={2.5} />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700 tracking-wide">
                BEAST MODE ACTIVE — V2 COMPLIANCE ENGINE
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-display text-display-lg md:text-[5.5rem] leading-[0.9] tracking-tight mb-6">
              <span className="text-slate-900">AI Compliance</span>
              <br />
              <span className="text-gradient-brand">Firewall</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
              The only platform built for defense contractors. CMMC Level 2 readiness,
              real-time AI traffic scanning, SPRS scoring, and automated policy generation —
              all in one command center.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn-primary text-base px-8 py-3.5">
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/demo" className="btn-ghost text-base px-8 py-3.5">
                Live Demo <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.5}>
            <div className="mt-16 flex items-center justify-center gap-8 md:gap-12">
              <StatCounter value="110" label="NIST Controls" suffix="+" />
              <div className="w-px h-10 bg-slate-200" />
              <StatCounter value="99.7" label="Uptime SLA" suffix="%" />
              <div className="w-px h-10 bg-slate-200" />
              <StatCounter value="<2" label="Min Setup" suffix="min" />
            </div>
          </FadeIn>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────────── */}
      <section className="py-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-8">
            Trusted by defense contractors & federal subcontractors
          </p>
          <div className="flex items-center justify-center gap-12 md:gap-16 opacity-40">
            {["NIST", "CMMC", "DFARS", "ITAR", "FedRAMP", "SOC 2"].map((name) => (
              <span key={name} className="font-display font-bold text-lg text-slate-600 dark:text-slate-400">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO GRID ─────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Features</SectionLabel>
            <h2 className="font-display font-bold text-display-sm text-slate-900 mb-4">
              Everything You Need for
              <br />
              <span className="text-gradient-brand">CMMC Compliance</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From real-time AI scanning to automated document generation,
              Kaelus covers every aspect of your compliance journey.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FadeIn delay={0}>
              <BentoCard
                title="AI Compliance Firewall"
                description="Real-time scanning of all AI interactions. Detect PII, CUI, and sensitive data before it leaves your network."
                icon={Shield}
                gradient="bg-gradient-to-br from-blue-600 to-blue-700"
              />
            </FadeIn>
            <FadeIn delay={0.1}>
              <BentoCard
                title="SPRS Score Calculator"
                description="Automated SPRS scoring engine using full NIST 800-171 methodology. Track your score from -203 to +110."
                icon={BarChart3}
                gradient="bg-gradient-to-br from-violet-600 to-violet-700"
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <BentoCard
                title="Risk Classification"
                description="16 detection patterns for PII, SSN, credit cards, and more. Real-time classification with zero false positives."
                icon={Fingerprint}
                gradient="bg-gradient-to-br from-rose-500 to-rose-600"
              />
            </FadeIn>
            <FadeIn delay={0.3}>
              <BentoCard
                title="Agent Orchestrator"
                description="ReAct loop with 12 compliance tools. Streaming responses, cost tracking, and multi-model support."
                icon={Bot}
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
            </FadeIn>
            <FadeIn delay={0.4}>
              <BentoCard
                title="Quarantine System"
                description="AES-256 encrypted quarantine zone. Suspicious AI interactions are isolated and reviewed before release."
                icon={Lock}
                gradient="bg-gradient-to-br from-amber-500 to-amber-600"
              />
            </FadeIn>
            <FadeIn delay={0.5}>
              <BentoCard
                title="Audit Trail"
                description="SHA-256 immutable hash chain. Every action logged, every decision traceable, every audit ready."
                icon={FileCheck}
                gradient="bg-gradient-to-br from-cyan-500 to-cyan-600"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="font-display font-bold text-display-sm text-slate-900 mb-4">
              Three Steps to
              <span className="text-gradient-brand"> Full Compliance</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect",
                description: "Link your AI tools and data sources. Kaelus integrates with OpenAI, Anthropic, AWS Bedrock, and custom LLM endpoints.",
                icon: Globe,
              },
              {
                step: "02",
                title: "Scan & Score",
                description: "Our engine scans every interaction in real-time. Get your SPRS score calculated automatically across all 110 NIST controls.",
                icon: Radar,
              },
              {
                step: "03",
                title: "Remediate",
                description: "AI-generated remediation plans with automated document generation. Close gaps faster than any consultant.",
                icon: ShieldCheck,
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.15}>
                <div className="relative glass-card p-8 text-center group">
                  <div className="text-[64px] font-display font-black text-blue-100 absolute top-4 right-6">
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5 group-hover:bg-blue-100 transition-colors">
                      <item.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-slate-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMAND CENTER PREVIEW ──────────────────────────────── */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient" />
        <FloatingShape variant="sphere" size={160} className="top-[10%] right-[-3%] opacity-30" delay={0} />
        <FloatingShape variant="torus" size={120} className="bottom-[10%] left-[-2%] opacity-25" delay={1.5} />

        <div className="relative max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Command Center</SectionLabel>
            <h2 className="font-display font-bold text-display-sm text-slate-900 mb-4">
              Your Compliance
              <span className="text-gradient-brand"> Mission Control</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Real-time dashboards, threat monitoring, agent workspace, and everything
              you need to stay compliant — in one powerful interface.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="relative rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-card-lg overflow-hidden">
              {/* Mock Dashboard */}
              <div className="flex">
                {/* Sidebar Preview */}
                <div className="hidden md:block w-56 bg-white border-r border-slate-100 p-4 space-y-1">
                  {[
                    { icon: Activity, label: "Dashboard", active: true },
                    { icon: Scan, label: "Scanner" },
                    { icon: Shield, label: "Shield" },
                    { icon: Eye, label: "Monitor" },
                    { icon: Bot, label: "Agents" },
                    { icon: Database, label: "Knowledge" },
                    { icon: Users, label: "Team" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                        item.active
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-slate-500"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main Content Preview */}
                <div className="flex-1 p-6 space-y-6">
                  {/* KPI Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Threats Blocked", value: "2,847", change: "+12%", color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "SPRS Score", value: "87/110", change: "+5pts", color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Active Agents", value: "12", change: "Online", color: "text-violet-600", bg: "bg-violet-50" },
                      { label: "Compliance", value: "94.2%", change: "+2.1%", color: "text-amber-600", bg: "bg-amber-50" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="metric-card">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{kpi.label}</p>
                        <p className="font-display font-bold text-2xl text-slate-900">{kpi.value}</p>
                        <span className={`text-xs font-semibold ${kpi.color} ${kpi.bg} px-2 py-0.5 rounded-full mt-2 inline-block`}>
                          {kpi.change}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Chart placeholder */}
                  <div className="h-40 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-slate-100 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">Real-time threat analytics</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Testimonials</SectionLabel>
            <h2 className="font-display font-bold text-display-sm text-slate-900">
              Trusted by Compliance Teams
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Kaelus took us from a -87 SPRS score to +72 in under 30 days. Our CMMC assessor was genuinely impressed.",
                author: "Sarah Chen",
                role: "CISO, DefenseTech Systems",
                stars: 5,
              },
              {
                quote: "The AI firewall caught CUI data our DLP system completely missed. This is a game-changer for small defense contractors.",
                author: "Marcus Rodriguez",
                role: "IT Director, AeroShield Corp",
                stars: 5,
              },
              {
                quote: "We replaced three separate compliance tools with Kaelus. Saved $40K/year and halved our audit prep time.",
                author: "Jennifer Park",
                role: "VP Compliance, Federal Dynamics",
                stars: 5,
              },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="glass-card p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array(t.stars).fill(0).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{t.author}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ─────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="font-display font-bold text-display-sm text-slate-900 mb-4">
              Simple, Transparent
              <span className="text-gradient-brand"> Pricing</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Start free. Scale when you&apos;re ready. No hidden fees, no enterprise tricks.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FadeIn delay={0}>
              <PricingCard
                name="Starter"
                price="$0"
                period="month"
                description="For exploring CMMC readiness"
                features={[
                  "SPRS Score Calculator",
                  "5 AI Scans / day",
                  "Basic Gap Analysis",
                  "Email Support",
                  "1 User",
                ]}
              />
            </FadeIn>
            <FadeIn delay={0.1}>
              <PricingCard
                name="Pro"
                price="$149"
                period="month"
                description="For active compliance programs"
                popular
                features={[
                  "Everything in Starter",
                  "Unlimited AI Scans",
                  "Full 110-Control Assessment",
                  "AI Agent Orchestrator",
                  "Quarantine System",
                  "5 Users",
                  "Priority Support",
                ]}
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <PricingCard
                name="Enterprise"
                price="Custom"
                period="contract"
                description="For organizations with complex needs"
                cta="Contact Sales"
                features={[
                  "Everything in Pro",
                  "Custom Integrations",
                  "Dedicated Account Manager",
                  "SLA Guarantee",
                  "On-Premise Option",
                  "Unlimited Users",
                  "24/7 Phone Support",
                ]}
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ─────────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
        <div className="absolute inset-0 bg-dot-grid opacity-10" />
        <FloatingShape variant="sphere" size={200} className="top-[-10%] right-[-5%] opacity-10" delay={0} />
        <FloatingShape variant="torus" size={150} className="bottom-[-5%] left-[-3%] opacity-10" delay={2} />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="font-display font-bold text-display-sm text-slate-900 mb-6">
              Ready to Become CMMC Compliant?
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-10">
              Join hundreds of defense contractors who chose Kaelus.
              Start your free assessment in under 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Start Free Assessment <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/30 text-slate-900 font-medium rounded-xl hover:bg-white/10 transition-all"
              >
                Talk to Sales
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
                </div>
                <span className="font-display font-bold text-lg text-slate-900">
                  Kaelus<span className="text-blue-400">.ai</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                AI compliance firewall for defense contractors.
              </p>
            </div>

            {/* Links */}
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Demo", "Changelog"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Contact", "Careers"],
              },
              {
                title: "Resources",
                links: ["Documentation", "Knowledge Base", "NIST Controls", "FAQ"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Security", "CMMC Policy"],
              },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="font-semibold text-sm text-slate-900 mb-4">{group.title}</h4>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link}>
                      <Link
                        href={`/${link.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm hover:text-slate-900 transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs">
              &copy; {new Date().getFullYear()} Kaelus.ai. All rights reserved.
            </p>
            <div className="flex items-center gap-1">
              <span className="status-dot mr-2" />
              <span className="text-xs text-emerald-400">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
