"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  MonitorPlay,
  Activity,
  Zap,
  Brain,
  Radar,
  BarChart3,
  AlertTriangle,
  Lock,
  Shield,
  TrendingDown,
  DollarSign,
  Eye,
  Fingerprint,
  FileCheck,
  ShieldCheck,
  Globe,
  Scale,
  BadgeCheck,
  Heart,
  Hash,
  CreditCard,
  Key,
  Mail,
  Phone,
  Server,
  Landmark,
  DatabaseZap,
  Binary,
  AtSign,
  FileWarning,
  Network,
  Layers,
  Clock,
  Terminal,
  Workflow,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";
import { Navbar } from "@/components/Navbar";

// Existing Components
import { AnimatedSection, AnimatedCounter } from "@/components/landing/animated-section";
import { ChatWidget } from "@/components/landing/chat-widget";
import { PipelineSimulator } from "@/components/landing/pipeline-simulator";
import { ArchitectureDiagram } from "@/components/landing/architecture-diagram";
import { ReActLoop } from "@/components/landing/react-loop";
import { IntegrationCode } from "@/components/landing/integration-code";

// NEW Power-Up Components
import { ParticleHero } from "@/components/landing/particle-hero";
import { TrustedBy } from "@/components/landing/trusted-by";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ThreatGlobe } from "@/components/landing/threat-globe";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQSection } from "@/components/landing/faq-section";
import { NewsletterSignup } from "@/components/landing/newsletter-signup";

/* ===== DATA ===== */
const majorFeatures = [
  {
    icon: Zap,
    title: "Real-Time Interception",
    stat: "<50ms",
    statLabel: "Scan Latency",
    description:
      "Every LLM request passes through the Kaelus gateway before reaching any AI provider. Sub-50ms P99 latency with zero-copy stream scanning. No request goes unmonitored.",
    highlights: [
      "Inline proxy architecture",
      "Sub-50ms P99 latency",
      "Zero-copy stream scanning",
      "Supports OpenAI, Anthropic, Google, Meta",
    ],
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    glowColor: "rgba(245, 158, 11, 0.08)",
  },
  {
    icon: Lock,
    title: "Encrypted Quarantine",
    stat: "AES-256",
    statLabel: "Encryption Standard",
    description:
      "Flagged prompts are encrypted with AES-256-CBC and placed in a tamper-proof vault. No plaintext is ever stored. Automatic expiry and purge cycles for data minimization.",
    highlights: [
      "AES-256-CBC encryption at rest",
      "Zero plaintext storage policy",
      "Secure human review portal",
      "Automatic expiry & purge cycles",
    ],
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    glowColor: "rgba(16, 185, 129, 0.08)",
  },
  {
    icon: Eye,
    title: "Immutable Audit Trail",
    stat: "SHA-256",
    statLabel: "Hash Chain",
    description:
      "Every scan event, block, quarantine, and reviewer access is logged in a cryptographic hash chain — tamper-proof and verifiable. One-click integrity verification for auditors.",
    highlights: [
      "SHA-256 cryptographic hash chain",
      "Merkle root verification",
      "Tamper-evident log architecture",
      "One-click integrity verification",
    ],
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    glowColor: "rgba(59, 130, 246, 0.08)",
  },
  {
    icon: Radar,
    title: "16 Detection Patterns",
    stat: "16",
    statLabel: "Pattern Categories",
    description:
      "Covering PII, financial data, IP, medical records, strategic intelligence. Regex, NER models, and contextual analysis in parallel — the most comprehensive detection engine available.",
    highlights: [
      "PII: SSN, email, phone, address",
      "Financial: credit cards, bank accounts",
      "IP: API keys, source code, trade secrets",
      "Strategic: M&A data, internal metrics",
    ],
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    glowColor: "rgba(244, 63, 94, 0.08)",
  },
  {
    icon: FileCheck,
    title: "Compliance Reports",
    stat: "1-Click",
    statLabel: "Report Generation",
    description:
      "Generate board-ready and CFO-ready compliance reports with a single click. Reports include integrity proofs, violation summaries, trend analysis, and risk scoring.",
    highlights: [
      "CFO-ready PDF exports",
      "Integrity proof certificates",
      "Violation trend analysis",
      "Multi-framework compliance scoring",
    ],
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    glowColor: "rgba(139, 92, 246, 0.08)",
  },
  {
    icon: Fingerprint,
    title: "Zero Trust Architecture",
    stat: "Zero",
    statLabel: "Implicit Trust",
    description:
      "No request is inherently trusted. Continuous authentication, least-privilege access, and microsegmentation throughout. A breach in one layer cannot cascade.",
    highlights: [
      "Continuous verification model",
      "Least-privilege access controls",
      "Microsegmented data flows",
      "Multi-factor authentication",
    ],
    iconColor: "text-brand-400",
    iconBg: "bg-brand-500/10 border-brand-500/20",
    glowColor: "rgba(99, 102, 241, 0.08)",
  },
];

const detectionPatterns = [
  { icon: Hash, name: "Social Security Numbers", code: "SSN", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { icon: CreditCard, name: "Credit Card Numbers", code: "CCN", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: Key, name: "API Keys & Secrets", code: "API", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { icon: Mail, name: "Email Addresses", code: "EMAIL", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: Phone, name: "Phone Numbers", code: "PHONE", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { icon: Heart, name: "Medical Record IDs", code: "MED", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { icon: Server, name: "IP Addresses", code: "IP", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: Landmark, name: "M&A Strategic Data", code: "M&A", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { icon: DatabaseZap, name: "Database Credentials", code: "CRED", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { icon: Binary, name: "Source Code Snippets", code: "CODE", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  { icon: AtSign, name: "Internal Usernames", code: "USER", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { icon: FileWarning, name: "Legal Documents", code: "LEGAL", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { icon: Network, name: "Network Configurations", code: "NET", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  { icon: Brain, name: "Trade Secrets & IP", code: "IP/TS", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20" },
  { icon: AlertTriangle, name: "Financial Reports", code: "FIN", color: "text-lime-400", bg: "bg-lime-500/10 border-lime-500/20" },
  { icon: Shield, name: "Government IDs", code: "GOV", color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
];

const pipelineSteps = [
  { label: "Request", sublabel: "API Call Initiated", icon: Terminal, color: "text-white/60", bg: "bg-white/5 border-white/10" },
  { label: "Kaelus Gateway", sublabel: "Intercept & Route", icon: Shield, color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
  { label: "Scan", sublabel: "16 Pattern Engine", icon: Radar, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { label: "Classify", sublabel: "Risk Scoring", icon: Layers, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { label: "Decision", sublabel: "Block / Allow / Quarantine", icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { label: "Audit", sublabel: "SHA-256 Hash Chain", icon: Eye, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

const complianceStandards = [
  { name: "SOC 2", fullName: "SOC 2 Type II", description: "Service Organization Control reports validating security, availability, processing integrity, confidentiality, and privacy controls.", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", features: ["Trust Services Criteria", "Continuous monitoring", "Annual audit cycles"] },
  { name: "GDPR", fullName: "General Data Protection Regulation", description: "Full compliance with EU data protection rules including right to erasure, data portability, and breach notification within 72 hours.", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", features: ["Data minimization", "Right to erasure", "72-hour breach alerts"] },
  { name: "EU AI Act", fullName: "European Union AI Act", description: "Compliant with the world's first comprehensive AI regulation. Risk classification, transparency requirements, and human oversight built in.", icon: Scale, color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20", features: ["Risk classification", "Transparency logging", "Human oversight controls"] },
  { name: "HIPAA", fullName: "Health Insurance Portability & Accountability Act", description: "Protected Health Information (PHI) detection and safeguarding. BAA-ready architecture with encrypted data handling throughout.", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", features: ["PHI detection", "BAA-ready", "Encrypted data handling"] },
  { name: "ISO 27001", fullName: "Information Security Management System", description: "Systematic approach to managing sensitive information. Risk assessment, security controls, and continuous improvement.", icon: BadgeCheck, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", features: ["Risk assessment framework", "Security controls catalog", "Continuous improvement"] },
];

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <Navbar />

      {/* =============================================== */}
      {/* ===== HERO WITH PARTICLE ANIMATION ===== */}
      {/* =============================================== */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid animate-grid-fade" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-aurora" />
        <ParticleHero />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm mb-8 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide uppercase">Enterprise AI Security Platform</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-8">
              Enterprise-Grade
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-emerald-400 animate-gradient">
                AI Security
              </span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="text-xl md:text-2xl text-white/50 mb-10 leading-relaxed font-medium max-w-3xl mx-auto">
              Military-grade encryption. Cryptographic audit trails.{" "}
              <br className="hidden md:block" />
              Sub-50ms interception. Your data never reaches an AI provider{" "}
              <br className="hidden md:block" />
              without your explicit approval.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/auth"
                className="btn-primary text-base px-10 py-4 w-full sm:w-auto shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] transition-shadow"
              >
                Deploy Kaelus Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="btn-ghost text-base px-8 py-4 w-full sm:w-auto bg-white/[0.03]"
              >
                See How It Works <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimatedSection>

          {/* Trust Badges */}
          <AnimatedSection delay={400}>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {[
                { icon: ShieldCheck, label: "SOC 2", color: "text-emerald-400" },
                { icon: Globe, label: "GDPR", color: "text-blue-400" },
                { icon: Scale, label: "EU AI Act", color: "text-brand-400" },
                { icon: Heart, label: "HIPAA", color: "text-pink-400" },
                { icon: BadgeCheck, label: "ISO 27001", color: "text-amber-400" },
              ].map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className="flex items-center gap-1.5 text-xs text-white/30">
                    <Icon className={`w-4 h-4 ${badge.color}`} />
                    <span className="font-semibold">{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </AnimatedSection>

          {/* Hero Stat Counters */}
          <AnimatedSection delay={500} className="mt-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
              {[
                { icon: Zap, value: 50, suffix: "ms", prefix: "<", label: "Scan Speed", color: "text-amber-400" },
                { icon: Radar, value: 16, suffix: "", prefix: "", label: "Threat Patterns", color: "text-rose-400" },
                { icon: Brain, value: 13, suffix: "", prefix: "", label: "AI Agents", color: "text-purple-400" },
                { icon: Shield, value: 99, suffix: ".9%", prefix: "", label: "Accuracy", color: "text-emerald-400" },
                { icon: Lock, value: 256, suffix: "-bit", prefix: "", label: "Encryption", color: "text-blue-400" },
                { icon: BarChart3, value: 2847, suffix: "", prefix: "", label: "Threats Blocked", color: "text-brand-400" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="glass-card p-5 text-center group hover:border-brand-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                  >
                    <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                    <div className="text-2xl font-bold text-white mb-1">
                      {stat.prefix}
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </AnimatedSection>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0c0c10] to-transparent" />
      </section>

      {/* ===== TRUSTED BY ===== */}
      <TrustedBy />

      {/* ===== THE PROBLEM VS THE FIX ===== */}
      <section id="problem" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Why Do You Need This?</h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              Explaining it like you&apos;re 5: If your company is a school, AI is a field trip.
              We are the chaperone making sure kids don&apos;t take their passports with them.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <AnimatedSection delay={100}>
              <div className="glass-card-glow p-8 border-rose-500/30 shadow-[0_0_40px_-10px_rgba(244,63,94,0.15)] h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center border border-rose-500/50">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">The Problem</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-white/60">
                    <span className="text-rose-400 mt-1">1.</span>
                    A developer copies a chunk of code to ask ChatGPT to fix a bug.
                  </li>
                  <li className="flex gap-3 text-white/60">
                    <span className="text-rose-400 mt-1">2.</span>
                    They didn&apos;t notice the code contained your company&apos;s AWS Master Password.
                  </li>
                  <li className="flex gap-3 text-white/60">
                    <span className="text-rose-400 mt-1">3.</span>
                    That password goes to OpenAI servers. It becomes their training data. Your company is breached, and you don&apos;t even know it happened.
                  </li>
                </ul>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="glass-card-glow p-8 border-emerald-500/30 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">The Kaelus Fix</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-white/60">
                    <span className="text-emerald-400 mt-1">1.</span>
                    You route your AI traffic through Kaelus. (It takes 1 line of code).
                  </li>
                  <li className="flex gap-3 text-white/60">
                    <span className="text-emerald-400 mt-1">2.</span>
                    The developer tries to send the same code with the AWS password.
                  </li>
                  <li className="flex gap-3 text-white/60">
                    <span className="text-emerald-400 mt-1">3.</span>
                    In 0.05 seconds, Kaelus detects the password, blocks the request, encrypts the leak, and sends you a report. Disaster averted.
                  </li>
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* ===== 6 MAJOR FEATURE CARDS ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-mesh-gradient" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-widest text-brand-400 font-semibold mb-3">
                Core Platform
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Six Pillars of{" "}
                <span className="text-gradient-brand">AI Compliance</span>
              </h2>
              <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                Each capability is designed to work independently or as part of the unified Kaelus firewall pipeline.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {majorFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <AnimatedSection key={feature.title} delay={i * 100}>
                  <div className="glass-card-glow p-8 h-full group relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{ background: `radial-gradient(ellipse at 30% 20%, ${feature.glowColor}, transparent 70%)` }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-12 h-12 rounded-xl ${feature.iconBg} border flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">{feature.stat}</p>
                          <p className="text-[10px] uppercase tracking-wider text-white/30">{feature.statLabel}</p>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                      <p className="text-sm text-white/40 leading-relaxed mb-6">{feature.description}</p>
                      <div className="space-y-2">
                        {feature.highlights.map((h, j) => (
                          <div key={j} className="flex items-center gap-2.5">
                            <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${feature.iconColor}`} />
                            <span className="text-xs text-white/50">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== LIVE SIMULATOR ===== */}
      <section className="py-24 relative overflow-hidden bg-black/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <MonitorPlay className="w-6 h-6 text-brand-400" />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Live Firewall <span className="text-brand-400">Scanner</span>
              </h2>
            </div>
            <p className="text-white/50 text-lg">Watch Kaelus intercept and block real threats in an automated loop.</p>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <PipelineSimulator />
          </AnimatedSection>
        </div>
      </section>

      {/* ===== DETECTION PATTERNS ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-widest text-rose-400 font-semibold mb-3">Detection Engine</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="text-gradient-brand">16 Detection</span> Pattern Types
              </h2>
              <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                Every prompt is scanned against all 16 categories simultaneously. Regex, NER models, and contextual analysis work in parallel.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {detectionPatterns.map((pattern, i) => {
              const Icon = pattern.icon;
              return (
                <AnimatedSection key={pattern.code} delay={i * 50}>
                  <div className="glass-card p-5 group cursor-default">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-lg ${pattern.bg} border flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${pattern.color}`} />
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold ${pattern.color} opacity-60`}>
                        {pattern.code}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">
                      {pattern.name}
                    </p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Detection Stats */}
          <AnimatedSection delay={200}>
            <div className="mt-12 glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Radar className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">All 16 patterns scan in parallel</p>
                  <p className="text-xs text-white/30">Combined regex + NER + contextual analysis per prompt</p>
                </div>
              </div>
              <div className="flex items-center gap-8 text-center">
                <div>
                  <p className="text-lg font-bold text-white"><AnimatedCounter target={50} prefix="<" suffix="ms" /></p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Scan Time</p>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div>
                  <p className="text-lg font-bold text-white"><AnimatedCounter target={99} suffix=".9%" /></p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Detection Rate</p>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div>
                  <p className="text-lg font-bold text-white"><AnimatedCounter target={0} suffix=".01%" /></p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">False Positives</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== LIVE THREAT GLOBE ===== */}
      <ThreatGlobe />

      {/* ===== ARCHITECTURE PIPELINE ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-mesh-gradient" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-widest text-brand-400 font-semibold mb-3">Architecture</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Interception <span className="text-gradient-brand">Pipeline</span>
              </h2>
              <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                Every API request follows a deterministic path through the Kaelus gateway.
              </p>
            </div>
          </AnimatedSection>

          {/* Desktop Pipeline */}
          <div className="hidden lg:block">
            <div className="flex items-start justify-between relative">
              <div className="absolute top-10 left-[8%] right-[8%] h-px bg-gradient-to-r from-white/10 via-brand-500/30 to-white/10" />
              <div className="absolute top-[38px] left-[8%] right-[8%] h-[3px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent blur-sm" />
              {pipelineSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <AnimatedSection key={step.label} delay={i * 120} className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-20 h-20 rounded-2xl ${step.bg} border flex items-center justify-center mb-4 relative`}>
                      <Icon className={`w-8 h-8 ${step.color}`} />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0c0c10] border border-white/10 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-white/50">{i + 1}</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{step.label}</p>
                    <p className="text-[11px] text-white/30 max-w-[120px]">{step.sublabel}</p>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>

          {/* Mobile Pipeline */}
          <div className="lg:hidden space-y-1">
            {pipelineSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <AnimatedSection key={step.label} delay={i * 100}>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-14 h-14 rounded-xl ${step.bg} border flex items-center justify-center relative`}>
                        <Icon className={`w-6 h-6 ${step.color}`} />
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0c0c10] border border-white/10 flex items-center justify-center">
                          <span className="text-[9px] font-semibold text-white/50">{i + 1}</span>
                        </div>
                      </div>
                      {i < pipelineSteps.length - 1 && (
                        <div className="w-px h-6 bg-gradient-to-b from-brand-500/30 to-transparent mt-1" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{step.label}</p>
                      <p className="text-xs text-white/30">{step.sublabel}</p>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Pipeline outcome cards */}
          <AnimatedSection delay={300}>
            <div className="mt-16 grid sm:grid-cols-3 gap-4">
              <div className="glass-card p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Allow</p>
                <p className="text-xs text-white/30">Clean requests pass through with full audit logging.</p>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Block</p>
                <p className="text-xs text-white/30">High-risk requests are stopped immediately.</p>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Quarantine</p>
                <p className="text-xs text-white/30">Borderline cases are AES-256 encrypted for human review.</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== REACT AGENT LOOP (THE SECRET SAUCE) ===== */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mb-16 text-center">
            <div className="inline-block px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold tracking-wider mb-6">
              THE SECRET SAUCE
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              We Don&apos;t Just Scan.
              <br />
              We <span className="text-purple-400">Think.</span>
            </h2>
            <p className="text-lg text-white/40 max-w-3xl mx-auto">
              DLP tools break because they are dumb. They flag the word &ldquo;Apple&rdquo; as a company secret even when the prompt is a recipe for a pie. Kaelus uses 13 AI Agents to read the context and only block actual threats.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <ReActLoop />
          </AnimatedSection>
        </div>
      </section>

      {/* ===== ARCHITECTURE DEEP DIVE ===== */}
      <section className="py-24 relative bg-[#0a0a0f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">How The Machine Works</h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              From the employee to the vault. See exactly where Kaelus steps in to protect your business.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ArchitectureDiagram />
          </AnimatedSection>
        </div>
      </section>

      {/* ===== INTEGRATION ===== */}
      <section className="py-24 relative bg-black/40 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              1 Line of Code.
              <br />
              <span className="text-emerald-400">Total Security.</span>
            </h2>
            <p className="text-lg text-white/50 mb-8 leading-relaxed">
              We know engineers hate setting up complicated proxy servers. So we didn&apos;t build one.
              Just change the base URL of your OpenAI or Anthropic SDK to ours, and pass your corporate token.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Supports Python, Node.js, cURL
              </li>
              <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Works with LangChain
              </li>
              <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Zero noticeable latency (&lt;50ms)
              </li>
            </ul>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <IntegrationCode />
          </AnimatedSection>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <Testimonials />

      {/* ===== DASHBOARD DEMO / SERVICE PITCH ===== */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.03] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-bold tracking-wider mb-6">
              ⚠️ YOUR COMPANY RIGHT NOW
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">See What You&apos;re Leaking</h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              Here is a simulated snapshot of what the Kaelus Dashboard would surface for a typical enterprise.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={150} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-card-glow p-6 border-rose-500/20">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Critical Leaks (Last 30 Days)</span>
              </div>
              <div className="text-5xl font-black text-rose-400 mb-2"><AnimatedCounter target={247} /></div>
              <p className="text-sm text-white/40">API keys, passwords, and SSNs sent to external AI providers by your team.</p>
            </div>
            <div className="glass-card-glow p-6 border-amber-500/20">
              <div className="flex items-center gap-3 mb-4">
                <TrendingDown className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Compliance Risk Score</span>
              </div>
              <div className="text-5xl font-black text-amber-400 mb-2">87<span className="text-2xl">/100</span></div>
              <p className="text-sm text-white/40">Your company fails SOC 2 and GDPR audits due to unmonitored AI traffic.</p>
            </div>
            <div className="glass-card-glow p-6 border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Estimated Savings w/ Kaelus</span>
              </div>
              <div className="text-5xl font-black text-emerald-400 mb-2">$<AnimatedCounter target={450} />K</div>
              <p className="text-sm text-white/40">Average cost saved by blocking data breaches before they reach external AI.</p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="glass-card-glow p-8 md:p-10 border-brand-500/20">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Why Only <span className="text-brand-400">Kaelus Pro</span> Can Fix This</h3>
                  <p className="text-white/50 mb-6 leading-relaxed">Free DLP scanners flag safe content and miss actual threats. Our commercial service provides the full stack that enterprises need.</p>
                  <ul className="space-y-3">
                    {[
                      "13-Model Agentic Vault (avoid false positives)",
                      "HITL Queue (human review for borderline payloads)",
                      "SHA-256 Hash Chain Audit Trail (tamper-proof logs)",
                      "1-Click Compliance Reports (SOC 2, GDPR, HIPAA)",
                      "24/7 Threat Monitoring & Alerting",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                        <span className="text-white/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-4">
                  <Link href="/auth" className="btn-primary w-full text-center !py-4 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                    Start Free Trial — See Your Real Data <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/pricing" className="btn-ghost w-full text-center !py-4 bg-white/[0.03]">
                    Compare Plans <ChevronRight className="w-5 h-5" />
                  </Link>
                  <p className="text-xs text-white/30 text-center">No credit card required • Free tier available forever</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== COMPLIANCE STANDARDS ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-aurora" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-3">Compliance & Certifications</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Built for <span className="text-gradient-brand">Every Standard</span>
              </h2>
              <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                Kaelus is designed from the ground up to meet the strictest global regulatory and security frameworks.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceStandards.map((std, i) => {
              const Icon = std.icon;
              return (
                <AnimatedSection key={std.name} delay={i * 100}>
                  <div className="glass-card-glow p-7 h-full group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl ${std.bg} border flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${std.color}`} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{std.name}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">{std.fullName}</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed mb-5">{std.description}</p>
                    <div className="space-y-2">
                      {std.features.map((f, j) => (
                        <div key={j} className="flex items-center gap-2.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${std.color}`} />
                          <span className="text-xs text-white/50">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Standards banner */}
          <AnimatedSection delay={200}>
            <div className="mt-12 glass-card p-6 flex flex-wrap items-center justify-center gap-8">
              {complianceStandards.map((std) => {
                const Icon = std.icon;
                return (
                  <div key={std.name} className="flex items-center gap-2 text-white/30">
                    <Icon className={`w-4 h-4 ${std.color}`} />
                    <span className="text-xs font-semibold">{std.name}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 text-white/30">
                <Shield className="w-4 h-4 text-white/30" />
                <span className="text-xs font-semibold">PCI DSS</span>
              </div>
              <div className="flex items-center gap-2 text-white/30">
                <Lock className="w-4 h-4 text-white/30" />
                <span className="text-xs font-semibold">CCPA</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== FAQ ===== */}
      <FAQSection />

      {/* ===== NEWSLETTER ===== */}
      <NewsletterSignup />

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <div className="glass-card-glow p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5 rounded-2xl" />
              <div className="relative z-10">
                <Logo className="w-12 h-12 mb-6 mx-auto" />
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  Ready to Secure Your <span className="text-gradient-brand">AI Pipeline?</span>
                </h2>
                <p className="text-white/40 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
                  Deploy Kaelus in under 15 minutes. No infrastructure changes required. Start with our free tier and scale as your compliance needs grow.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/auth" className="btn-primary px-8 py-3.5 text-base">
                    Start Protecting Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard" className="btn-ghost px-8 py-3.5 text-base">
                    <Workflow className="w-4 h-4" /> View Live Dashboard
                  </Link>
                </div>
                <div className="mt-8 flex items-center justify-center gap-6 text-xs text-white/30">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>SOC 2 Ready</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-brand-400" />
                    <span>EU AI Act Compliant</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>GDPR Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== Floating Chat ===== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <ChatWidget />
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4 group cursor-pointer inline-flex">
                <Logo className="w-8 h-8 group-hover:scale-105 transition-transform" />
                <TextLogo className="group-hover:scale-105" />
              </div>
              <p className="text-sm text-white/30 leading-relaxed">
                AI-powered compliance firewall protecting enterprise data from LLM leaks.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">Product</p>
              <div className="space-y-2.5">
                <Link href="/features" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Features</Link>
                <Link href="/pricing" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Pricing</Link>
                <Link href="/dashboard" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Dashboard</Link>
                <Link href="/changelog" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Changelog</Link>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">Compliance</p>
              <div className="space-y-2.5">
                <span className="block text-sm text-white/30">SOC 2</span>
                <span className="block text-sm text-white/30">GDPR</span>
                <span className="block text-sm text-white/30">EU AI Act</span>
                <span className="block text-sm text-white/30">HIPAA</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">Company</p>
              <div className="space-y-2.5">
                <Link href="/about" className="block text-sm text-white/30 hover:text-white/60 transition-colors">About</Link>
                <Link href="/docs" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Documentation</Link>
                <Link href="/contact" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Contact</Link>
                <Link href="/auth" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Get Started</Link>
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
