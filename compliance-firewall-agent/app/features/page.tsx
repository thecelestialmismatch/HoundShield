"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ShieldCheck,
  Brain,
  FileText,
  Radar,
  Lock,
  Bot,
  ArrowRight,
  Check,
  Minus,
  Cloud,
  MessageSquare,
  GitBranch,
  LayoutGrid,
  ShieldHalf,
  Server,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { TextLogo } from "@/components/TextLogo";

/* ── Fade-in wrapper ─────────────────────────────────────────────── */
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
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────── */
const bentoFeatures = [
  {
    title: "CMMC Self-Assessment",
    desc: "Walk through all 110 NIST SP 800-171 controls with guided questionnaires. Your SPRS score updates in real time as you complete each practice.",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    stat: "110 Controls",
    wide: true,
  },
  {
    title: "AI-Powered Gap Analysis",
    desc: "Our AI engine identifies unmet controls and generates a prioritized remediation roadmap ranked by risk severity and cost.",
    icon: Brain,
    color: "text-brand-500",
    bg: "bg-brand-50 border-brand-200",
    stat: "Prioritized",
    wide: false,
  },
  {
    title: "SSP & POA&M Generation",
    desc: "Auto-generate your System Security Plan and Plan of Action & Milestones documents ready for C3PAO review.",
    icon: FileText,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    stat: "1-Click",
    wide: false,
  },
  {
    title: "Real-Time Compliance Scanning",
    desc: "An API firewall that intercepts every LLM call, classifies risk in under 50ms, and blocks non-compliant data flows.",
    icon: Radar,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    stat: "<50ms",
    wide: false,
  },
  {
    title: "Encrypted Audit Trail",
    desc: "Every action is logged in a tamper-proof SHA-256 hash chain. One-click integrity verification for auditors.",
    icon: Lock,
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/20",
    stat: "SHA-256",
    wide: false,
  },
  {
    title: "AI Agent Workspace",
    desc: "A ReAct-loop agent with 12 integrated tools: policy lookup, control mapping, evidence collection, remediation planning, and more.",
    icon: Bot,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    stat: "12 Tools",
    wide: true,
  },
];

const plans = [
  { name: "Free", features: [true, true, false, "100/mo", false, false, "Community", "7 days"] },
  { name: "Pro", features: [true, true, true, "Unlimited", true, true, "Priority", "1 year"] },
  { name: "Enterprise", features: [true, true, true, "Unlimited", true, true, "Dedicated", "Unlimited"] },
  { name: "Agency", features: [true, true, true, "Unlimited", true, true, "White-glove", "Unlimited"] },
];

const comparisonRows = [
  "CMMC Self-Assessment (110 controls)",
  "Live SPRS Score",
  "SSP & POA&M Generation",
  "API Compliance Scanning",
  "AI Gap Analysis",
  "Agent Workspace (12 tools)",
  "Support",
  "Audit Log Retention",
];

const integrations = [
  { name: "AWS GovCloud", icon: Cloud },
  { name: "Azure Government", icon: Server },
  { name: "Microsoft 365 GCC", icon: ShieldHalf },
  { name: "Slack", icon: MessageSquare },
  { name: "Jira", icon: LayoutGrid },
  { name: "GitHub", icon: GitBranch },
];

/* ── Page ─────────────────────────────────────────────────────────── */
export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#07070b] text-white relative overflow-hidden">
      <Navbar variant="dark" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-400/[0.06] to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-4">
              Platform Features
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Everything you need for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">
                CMMC Level 2
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Map, assess, and close gaps across all 110 NIST SP 800-171 controls.
              AI-driven remediation, auto-generated documentation, and a real-time
              SPRS score — in one platform built for defense contractors.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Bento Grid ────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {bentoFeatures.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeIn
                key={f.title}
                delay={i * 0.08}
                className={f.wide ? "sm:col-span-2" : ""}
              >
                <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-6 h-full transition-all duration-200 hover:border-brand-400/20 hover:bg-white/[0.08] group">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl ${f.bg} border flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white/10 px-2.5 py-1 rounded-md">
                      {f.stat}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors duration-200">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ── Comparison Table ───────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-3">
              Compare Plans
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Pick the plan that fits your mission
            </h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-sm text-slate-400 font-medium py-4 pr-4 w-[40%]">
                      Feature
                    </th>
                    {plans.map((p) => (
                      <th
                        key={p.name}
                        className="text-center text-sm font-semibold py-4 px-3"
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, ri) => (
                    <tr
                      key={row}
                      className="border-b border-white/10 last:border-0"
                    >
                      <td className="text-sm text-slate-400 py-3.5 pr-4">{row}</td>
                      {plans.map((p) => {
                        const v = p.features[ri];
                        return (
                          <td key={p.name} className="text-center py-3.5 px-3">
                            {v === true ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : v === false ? (
                              <Minus className="w-4 h-4 text-slate-400 mx-auto" />
                            ) : (
                              <span className="text-sm text-slate-400 font-mono">
                                {v}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-400 transition-colors cursor-pointer"
            >
              View full pricing details <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Integrations ──────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-3">
              Integrations
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Works with your stack
            </h2>
            <p className="text-slate-400 mt-3 max-w-lg mx-auto">
              Connect to the platforms your team already uses. FedRAMP and GCC-compatible
              out of the box.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {integrations.map((int, i) => {
              const Icon = int.icon;
              return (
                <FadeIn key={int.name} delay={i * 0.06}>
                  <div className="border border-white/10 bg-white/5 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 hover:border-brand-400/20 hover:bg-white/[0.08] cursor-pointer">
                    <Icon className="w-7 h-7 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400 text-center leading-tight">
                      {int.name}
                    </span>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-10 md:p-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Start your free CMMC assessment today
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              No credit card required. Assess all 110 controls, get your SPRS score,
              and see exactly where you stand in under 30 minutes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-400 hover:to-emerald-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <TextLogo variant="dark" />
          </Link>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/" className="hover:text-white transition-colors cursor-pointer">Home</Link>
            <Link href="/pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</Link>
            <Link href="/command-center" className="hover:text-white transition-colors cursor-pointer">Dashboard</Link>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Kaelus.online — All rights reserved.
        </div>
      </footer>
    </div>
  );
}
