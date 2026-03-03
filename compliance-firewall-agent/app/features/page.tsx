"use client";

import { Logo } from "@/components/Logo";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Shield,
  Zap,
  Lock,
  Eye,
  FileCheck,
  ArrowRight,
  Menu,
  X,
  Fingerprint,
  Radar,
  ShieldCheck,
  Globe,
  Activity,
  ChevronRight,
  CreditCard,
  Key,
  Mail,
  Phone,
  Heart,
  Server,
  Network,
  FileWarning,
  Hash,
  AtSign,
  Binary,
  AlertTriangle,
  DatabaseZap,
  Landmark,
  Brain,
  ArrowDown,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Clock,
  BadgeCheck,
  Scale,
  Workflow,
  Terminal,
} from "lucide-react";

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

/* ===== ANIMATED COUNTER ===== */
function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const duration = 1800;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [visible, target]);

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

/* ===== DATA ===== */
const majorFeatures = [
  {
    icon: Zap,
    title: "Real-Time Interception",
    stat: "<50ms",
    statLabel: "Scan Latency",
    description:
      "Every LLM request passes through the Kaelus gateway before reaching any AI provider. Our scanning engine analyzes prompts against 16 detection patterns in under 50 milliseconds -- zero perceptible delay for end users. Inline interception means no data leaves your perimeter without approval.",
    highlights: [
      "Inline proxy architecture",
      "Sub-50ms P99 latency",
      "Zero-copy stream scanning",
      "Supports OpenAI, Anthropic, Google, Meta",
    ],
    gradient: "from-amber-500/20 to-orange-500/20",
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
      "When a flagged prompt is intercepted, it is immediately encrypted with AES-256-CBC and placed in a tamper-proof quarantine vault. No plaintext is ever stored. Human reviewers decrypt content through a secure portal with full audit trails on every access event.",
    highlights: [
      "AES-256-CBC encryption at rest",
      "Zero plaintext storage policy",
      "Secure human review portal",
      "Automatic expiry & purge cycles",
    ],
    gradient: "from-emerald-500/20 to-green-500/20",
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
      "Every scan event, block decision, quarantine action, and reviewer access is logged in a cryptographic hash chain. Each record references the previous hash, creating a Merkle-tree-style chain where tampering with any single entry invalidates the entire trail.",
    highlights: [
      "SHA-256 cryptographic hash chain",
      "Merkle root verification",
      "Tamper-evident log architecture",
      "One-click integrity verification",
    ],
    gradient: "from-blue-500/20 to-cyan-500/20",
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
      "Our detection engine covers 16 distinct data categories spanning personally identifiable information, financial data, intellectual property, medical records, and strategic business intelligence. Each pattern uses a combination of regex, NER models, and contextual analysis.",
    highlights: [
      "PII: SSN, email, phone, address",
      "Financial: credit cards, bank accounts",
      "IP: API keys, source code, trade secrets",
      "Strategic: M&A data, internal metrics",
    ],
    gradient: "from-rose-500/20 to-pink-500/20",
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
      "Generate board-ready and CFO-ready compliance reports with a single click. Reports include integrity proofs, violation summaries, trend analysis, risk scoring, and compliance posture against SOC 2, GDPR, EU AI Act, and HIPAA frameworks.",
    highlights: [
      "CFO-ready PDF exports",
      "Integrity proof certificates",
      "Violation trend analysis",
      "Multi-framework compliance scoring",
    ],
    gradient: "from-purple-500/20 to-violet-500/20",
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
      "No request is inherently trusted. Every API call, every user session, and every data flow is verified independently. Continuous authentication, least-privilege access, and microsegmentation ensure that a breach in one layer cannot cascade across the system.",
    highlights: [
      "Continuous verification model",
      "Least-privilege access controls",
      "Microsegmented data flows",
      "Multi-factor authentication",
    ],
    gradient: "from-brand-500/20 to-indigo-500/20",
    iconColor: "text-brand-400",
    iconBg: "bg-brand-500/10 border-brand-500/20",
    glowColor: "rgba(99, 102, 241, 0.08)",
  },
];

const detectionPatterns = [
  {
    icon: Hash,
    name: "Social Security Numbers",
    code: "SSN",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: CreditCard,
    name: "Credit Card Numbers",
    code: "CCN",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Key,
    name: "API Keys & Secrets",
    code: "API",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    icon: Mail,
    name: "Email Addresses",
    code: "EMAIL",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Phone,
    name: "Phone Numbers",
    code: "PHONE",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Heart,
    name: "Medical Record IDs",
    code: "MED",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
  {
    icon: Server,
    name: "IP Addresses",
    code: "IP",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Landmark,
    name: "M&A Strategic Data",
    code: "M&A",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: DatabaseZap,
    name: "Database Credentials",
    code: "CRED",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  {
    icon: Binary,
    name: "Source Code Snippets",
    code: "CODE",
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  {
    icon: AtSign,
    name: "Internal Usernames",
    code: "USER",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: FileWarning,
    name: "Legal Documents",
    code: "LEGAL",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    icon: Network,
    name: "Network Configurations",
    code: "NET",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: Brain,
    name: "Trade Secrets & IP",
    code: "IP/TS",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10 border-fuchsia-500/20",
  },
  {
    icon: AlertTriangle,
    name: "Financial Reports",
    code: "FIN",
    color: "text-lime-400",
    bg: "bg-lime-500/10 border-lime-500/20",
  },
  {
    icon: Shield,
    name: "Government IDs",
    code: "GOV",
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/20",
  },
];

const pipelineSteps = [
  {
    label: "Request",
    sublabel: "API Call Initiated",
    icon: Terminal,
    color: "text-white/60",
    bg: "bg-white/5 border-white/10",
  },
  {
    label: "Kaelus Gateway",
    sublabel: "Intercept & Route",
    icon: Shield,
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/20",
  },
  {
    label: "Scan",
    sublabel: "16 Pattern Engine",
    icon: Radar,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    label: "Classify",
    sublabel: "Risk Scoring",
    icon: Layers,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    label: "Decision",
    sublabel: "Block / Allow / Quarantine",
    icon: ShieldAlert,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    label: "Audit",
    sublabel: "SHA-256 Hash Chain",
    icon: Eye,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

const complianceStandards = [
  {
    name: "SOC 2",
    fullName: "SOC 2 Type II",
    description:
      "Service Organization Control reports validating security, availability, processing integrity, confidentiality, and privacy controls.",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    features: [
      "Trust Services Criteria",
      "Continuous monitoring",
      "Annual audit cycles",
    ],
  },
  {
    name: "GDPR",
    fullName: "General Data Protection Regulation",
    description:
      "Full compliance with EU data protection rules including right to erasure, data portability, and breach notification within 72 hours.",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    features: [
      "Data minimization",
      "Right to erasure",
      "72-hour breach alerts",
    ],
  },
  {
    name: "EU AI Act",
    fullName: "European Union AI Act",
    description:
      "Compliant with the world's first comprehensive AI regulation. Risk classification, transparency requirements, and human oversight built in.",
    icon: Scale,
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/20",
    features: [
      "Risk classification",
      "Transparency logging",
      "Human oversight controls",
    ],
  },
  {
    name: "HIPAA",
    fullName: "Health Insurance Portability & Accountability Act",
    description:
      "Protected Health Information (PHI) detection and safeguarding. BAA-ready architecture with encrypted data handling throughout the pipeline.",
    icon: Heart,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    features: ["PHI detection", "BAA-ready", "Encrypted data handling"],
  },
  {
    name: "ISO 27001",
    fullName: "Information Security Management System",
    description:
      "Systematic approach to managing sensitive company information. Risk assessment, security controls, and continuous improvement processes.",
    icon: BadgeCheck,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    features: [
      "Risk assessment framework",
      "Security controls catalog",
      "Continuous improvement",
    ],
  },
];

/* ===== MAIN PAGE ===== */
export default function FeaturesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ===== NAV ===== */}
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid animate-grid-fade" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-aurora" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm mb-8">
              <Activity className="w-3.5 h-3.5" />
              <span>Platform Capabilities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-5xl sm:text-display font-bold tracking-tight leading-[1.05] mb-6">
              Enterprise-Grade
              <br />
              <span className="text-gradient-brand">AI Security</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
              Every feature in Kaelus is engineered for one purpose: ensuring
              your sensitive data never reaches an AI provider without your
              explicit approval. Military-grade encryption, cryptographic audit
              trails, and sub-50ms interception.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/auth"
                className="btn-primary px-8 py-3.5 text-base"
              >
                Start Protecting Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="btn-ghost px-8 py-3.5 text-base"
              >
                <Terminal className="w-4 h-4" /> Live Dashboard
              </Link>
            </div>
          </AnimatedSection>

          {/* Stats row */}
          <AnimatedSection delay={400}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {[
                { value: 50, prefix: "<", suffix: "ms", label: "Scan Latency" },
                { value: 16, prefix: "", suffix: "", label: "Detection Patterns" },
                { value: 256, prefix: "", suffix: "-bit", label: "Encryption" },
                { value: 99, prefix: "", suffix: ".9%", label: "Accuracy" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-white">
                    <AnimatedCounter
                      target={s.value}
                      prefix={s.prefix}
                      suffix={s.suffix}
                    />
                  </p>
                  <p className="text-xs text-white/30 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
      </section>

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
                Each capability is designed to work independently or as part of
                the unified Kaelus firewall pipeline.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {majorFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <AnimatedSection key={feature.title} delay={i * 100}>
                  <div className="glass-card-glow p-8 h-full group relative overflow-hidden">
                    {/* Subtle gradient overlay on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{
                        background: `radial-gradient(ellipse at 30% 20%, ${feature.glowColor}, transparent 70%)`,
                      }}
                    />
                    <div className="relative z-10">
                      {/* Top row: icon + stat */}
                      <div className="flex items-start justify-between mb-6">
                        <div
                          className={`w-12 h-12 rounded-xl ${feature.iconBg} border flex items-center justify-center`}
                        >
                          <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            {feature.stat}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-white/30">
                            {feature.statLabel}
                          </p>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-white/40 leading-relaxed mb-6">
                        {feature.description}
                      </p>

                      {/* Highlights */}
                      <div className="space-y-2">
                        {feature.highlights.map((h, j) => (
                          <div key={j} className="flex items-center gap-2.5">
                            <CheckCircle2
                              className={`w-3.5 h-3.5 flex-shrink-0 ${feature.iconColor}`}
                            />
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

      {/* ===== SECTION DIVIDER ===== */}
      <div className="section-divider" />

      {/* ===== DETECTION PATTERNS ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-widest text-rose-400 font-semibold mb-3">
                Detection Engine
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="text-gradient-brand">16 Detection</span>{" "}
                Pattern Types
              </h2>
              <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                Every prompt is scanned against all 16 categories
                simultaneously. Regex, NER models, and contextual analysis work
                in parallel.
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
                      <div
                        className={`w-9 h-9 rounded-lg ${pattern.bg} border flex items-center justify-center`}
                      >
                        <Icon className={`w-4 h-4 ${pattern.color}`} />
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-semibold ${pattern.color} opacity-60`}
                      >
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
                  <p className="text-sm font-semibold text-white">
                    All 16 patterns scan in parallel
                  </p>
                  <p className="text-xs text-white/30">
                    Combined regex + NER + contextual analysis per prompt
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8 text-center">
                <div>
                  <p className="text-lg font-bold text-white">
                    <AnimatedCounter target={50} prefix="<" suffix="ms" />
                  </p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">
                    Total Scan Time
                  </p>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div>
                  <p className="text-lg font-bold text-white">
                    <AnimatedCounter target={99} suffix=".9%" />
                  </p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">
                    Detection Rate
                  </p>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div>
                  <p className="text-lg font-bold text-white">
                    <AnimatedCounter target={0} suffix=".01%" />
                  </p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">
                    False Positives
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== SECTION DIVIDER ===== */}
      <div className="section-divider" />

      {/* ===== ARCHITECTURE PIPELINE ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-mesh-gradient" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-widest text-brand-400 font-semibold mb-3">
                Architecture
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Interception{" "}
                <span className="text-gradient-brand">Pipeline</span>
              </h2>
              <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                Every API request follows a deterministic path through the
                Kaelus gateway. Here is how your data stays protected.
              </p>
            </div>
          </AnimatedSection>

          {/* Pipeline Visual */}
          <div className="relative">
            {/* Desktop: Horizontal pipeline */}
            <div className="hidden lg:block">
              <div className="flex items-start justify-between relative">
                {/* Connecting line */}
                <div className="absolute top-10 left-[8%] right-[8%] h-px bg-gradient-to-r from-white/10 via-brand-500/30 to-white/10" />
                <div className="absolute top-[38px] left-[8%] right-[8%] h-[3px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent blur-sm" />

                {pipelineSteps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <AnimatedSection
                      key={step.label}
                      delay={i * 120}
                      className="flex flex-col items-center text-center relative z-10"
                    >
                      <div
                        className={`w-20 h-20 rounded-2xl ${step.bg} border flex items-center justify-center mb-4 relative`}
                      >
                        <Icon className={`w-8 h-8 ${step.color}`} />
                        {/* Step number */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface border border-white/10 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-white/50">
                            {i + 1}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-white mb-1">
                        {step.label}
                      </p>
                      <p className="text-[11px] text-white/30 max-w-[120px]">
                        {step.sublabel}
                      </p>
                    </AnimatedSection>
                  );
                })}
              </div>
            </div>

            {/* Mobile: Vertical pipeline */}
            <div className="lg:hidden space-y-1">
              {pipelineSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <AnimatedSection key={step.label} delay={i * 100}>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-14 h-14 rounded-xl ${step.bg} border flex items-center justify-center relative`}
                        >
                          <Icon className={`w-6 h-6 ${step.color}`} />
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface border border-white/10 flex items-center justify-center">
                            <span className="text-[9px] font-semibold text-white/50">
                              {i + 1}
                            </span>
                          </div>
                        </div>
                        {i < pipelineSteps.length - 1 && (
                          <div className="w-px h-6 bg-gradient-to-b from-brand-500/30 to-transparent mt-1" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {step.label}
                        </p>
                        <p className="text-xs text-white/30">
                          {step.sublabel}
                        </p>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>

          {/* Pipeline detail cards */}
          <AnimatedSection delay={300}>
            <div className="mt-16 grid sm:grid-cols-3 gap-4">
              <div className="glass-card p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Allow</p>
                <p className="text-xs text-white/30">
                  Clean requests pass through to the AI provider with full audit
                  logging.
                </p>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Block</p>
                <p className="text-xs text-white/30">
                  High-risk requests are stopped immediately. The user is
                  notified with a safe alternative.
                </p>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">
                  Quarantine
                </p>
                <p className="text-xs text-white/30">
                  Borderline cases are AES-256 encrypted and queued for human
                  review.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== SECTION DIVIDER ===== */}
      <div className="section-divider" />

      {/* ===== SECURITY STANDARDS ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-aurora" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-3">
                Compliance & Certifications
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Built for{" "}
                <span className="text-gradient-brand">Every Standard</span>
              </h2>
              <p className="text-white/35 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
                Kaelus is designed from the ground up to meet the strictest
                global regulatory and security frameworks.
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
                      <div
                        className={`w-11 h-11 rounded-xl ${std.bg} border flex items-center justify-center`}
                      >
                        <Icon className={`w-5 h-5 ${std.color}`} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">
                          {std.name}
                        </p>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">
                          {std.fullName}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed mb-5">
                      {std.description}
                    </p>
                    <div className="space-y-2">
                      {std.features.map((f, j) => (
                        <div key={j} className="flex items-center gap-2.5">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 flex-shrink-0 ${std.color}`}
                          />
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
                  <div
                    key={std.name}
                    className="flex items-center gap-2 text-white/30"
                  >
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

      {/* ===== SECTION DIVIDER ===== */}
      <div className="section-divider" />

      {/* ===== CTA ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <div className="glass-card-glow p-12 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5 rounded-2xl" />

              <div className="relative z-10">
                <Logo className="w-12 h-12 mb-6 mx-auto" />

                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  Ready to Secure Your{" "}
                  <span className="text-gradient-brand">AI Pipeline?</span>
                </h2>

                <p className="text-white/40 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
                  Deploy Kaelus in under 15 minutes. No infrastructure changes
                  required. Start with our free tier and scale as your compliance
                  needs grow.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/auth"
                    className="btn-primary px-8 py-3.5 text-base"
                  >
                    Start Protecting Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="btn-ghost px-8 py-3.5 text-base"
                  >
                    <Workflow className="w-4 h-4" /> View Live Dashboard
                  </Link>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 text-xs text-white/30">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <span>SOC 2 Ready</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-brand-400" />
                    <span>EU AI Act Compliant</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-warning" />
                    <span>GDPR Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
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
                  href="/features"
                  className="block text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/#pricing"
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
