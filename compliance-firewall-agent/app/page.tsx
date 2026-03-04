"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, CheckCircle2, ShieldAlert, MonitorPlay, Activity, Zap, Brain, Radar, BarChart3, AlertTriangle, Lock, Shield, TrendingDown, Users, DollarSign } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";

// Extracted Components
import { AnimatedSection, AnimatedCounter } from "@/components/landing/animated-section";
import { ChatWidget } from "@/components/landing/chat-widget";
import { PipelineSimulator } from "@/components/landing/pipeline-simulator";
import { ArchitectureDiagram } from "@/components/landing/architecture-diagram";
import { ReActLoop } from "@/components/landing/react-loop";
import { IntegrationCode } from "@/components/landing/integration-code";
import { DetectionGrid } from "@/components/landing/detection-grid";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-500/30 font-sans overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <main className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 mb-8 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <ShieldAlert className="w-4 h-4 text-brand-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-brand-300 uppercase">Stop AI Data Leaks instantly</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              The Security Guard For Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-emerald-400">AI Prompts</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/50 mb-10 leading-relaxed font-medium">
              Your employees are pasting secret company data into ChatGPT. <br className="hidden md:block" />
              We sit in the middle, check the data, and block the secrets.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth" className="btn-primary text-base px-8 py-4 w-full sm:w-auto shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#problem" className="btn-ghost text-base px-8 py-4 w-full sm:w-auto bg-white/[0.03]">
                See How It Works <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimatedSection>

          {/* Hero Stat Counters */}
          <AnimatedSection delay={300} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Zap, value: 50, suffix: "ms", prefix: "<", label: "Scan Speed", color: "text-amber-400" },
              { icon: Radar, value: 16, suffix: "", prefix: "", label: "Threat Patterns", color: "text-brand-400" },
              { icon: Brain, value: 13, suffix: "", prefix: "", label: "AI Models", color: "text-purple-400" },
              { icon: Shield, value: 99, suffix: "%", prefix: "", label: "Accuracy", color: "text-emerald-400" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card p-5 text-center group hover:border-brand-500/30 transition-all duration-300">
                  <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-3 group-hover:scale-110 transition-transform`} />
                  <div className="text-3xl font-bold text-white mb-1">
                    {stat.prefix}<AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-white/40 font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              );
            })}
          </AnimatedSection>
        </div>
      </main>

      <div className="section-divider border-t border-white/[0.04]" />

      {/* ===== THE PROBLEM VS THE FIX (DEMO DASHBOARD CONCEPT) ===== */}
      <section id="problem" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Why Do You Need This?</h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              Explaining it like you're 5: If your company is a school, AI is a field trip.
              We are the chaperone making sure kids don't take their passports with them.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* The Problem */}
            <AnimatedSection delay={100}>
              <div className="glass-card-glow p-8 border-rose-500/30 shadow-[0_0_40px_-10px_rgba(244,63,94,0.15)] h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center border border-rose-500/50">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">The Problem</h3>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex gap-3 text-white/60">
                    <span className="text-rose-400 mt-1">1.</span>
                    A developer copies a chunk of code to ask ChatGPT to fix a bug.
                  </li>
                  <li className="flex gap-3 text-white/60">
                    <span className="text-rose-400 mt-1">2.</span>
                    They didn't notice the code contained your company's AWS Master Password.
                  </li>
                  <li className="flex gap-3 text-white/60">
                    <span className="text-rose-400 mt-1">3.</span>
                    That password goes to OpenAI servers. It becomes their training data. Your company is breached, and you don't even know it happened.
                  </li>
                </ul>
              </div>
            </AnimatedSection>

            {/* The Fix */}
            <AnimatedSection delay={200}>
              <div className="glass-card-glow p-8 border-emerald-500/30 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">The Kaelus Fix</h3>
                </div>
                <ul className="space-y-4 mb-8">
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

      {/* ===== WHAT WE SCAN FOR ===== */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Zero Blind Spots</h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              We look for 16 specific patterns of sensitive data. If any of these are in the prompt, we lock it down.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <DetectionGrid />
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

      {/* ===== REACT AGENT LOOP (WHY WE ARE DIFFERENT) ===== */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mb-16 text-center">
            <div className="inline-block px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold tracking-wider mb-6">
              THE SECRET SAUCE
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">We Don't Just Scan.<br />We <span className="text-purple-400">Think.</span></h2>
            <p className="text-lg text-white/40 max-w-3xl mx-auto">
              DLP tools break because they are dumb. They flag the word "Apple" as a company secret even when the prompt is a recipe for a pie. Kaelus uses 13 AI Agents to read the context and only block actual threats.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <ReActLoop />
          </AnimatedSection>
        </div>
      </section>

      {/* ===== INTEGRATION ===== */}
      <section className="py-24 relative bg-black/40 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <h2 className="text-4xl font-bold tracking-tight mb-6">1 Line of Code.<br /><span className="text-emerald-400">Total Security.</span></h2>
            <p className="text-lg text-white/50 mb-8 leading-relaxed">
              We know engineers hate setting up complicated proxy servers. So we didn't build one.
              Just change the base URL of your OpenAI or Anthropic SDK to ours, and pass your corporate token. Everything else works exactly the same.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Supports Python, Node.js, cURL</li>
              <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Works with LangChain</li>
              <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Zero noticeable latency (&lt;50ms)</li>
            </ul>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <IntegrationCode />
          </AnimatedSection>
        </div>
      </section>

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
              Here is a simulated snapshot of what the Kaelus Dashboard would surface for a typical enterprise — and why you need our service package to fix it.
            </p>
          </AnimatedSection>

          {/* Fake Dashboard Metrics */}
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

          {/* Why ONLY our Service fixes this */}
          <AnimatedSection delay={300}>
            <div className="glass-card-glow p-8 md:p-10 border-brand-500/20">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Why Only <span className="text-brand-400">Kaelus Pro</span> Can Fix This</h3>
                  <p className="text-white/50 mb-6 leading-relaxed">Free DLP scanners flag safe content and miss actual threats. Our commercial service provides the full stack that enterprises need — from Human-in-the-Loop review to cryptographic audit chains that survive SOC 2 audits.</p>
                  <ul className="space-y-3">
                    {[
                      "13-Model Agentic Vault (avoid false positives)",
                      "HITL Queue (human review for borderline payloads)",
                      "SHA-256 Hash Chain Audit Trail (tamper-proof logs)",
                      "1-Click Compliance Reports (SOC 2, GDPR, HIPAA)",
                      "24/7 Threat Monitoring & Alerting",
                    ].map(item => (
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

      {/* ===== Final CTA ===== */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-500/20 border-2 border-brand-500/50 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(99,102,241,0.4)]">
              <Logo className="w-10 h-10" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Lock Down Your AI Today
            </h2>
            <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
              If your team uses ChatGPT, you are leaking data right now.
              Deploy Kaelus in 5 minutes and stop the bleeding.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth" className="btn-primary text-lg !py-4 !px-10 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                Start Free Trial
              </Link>
              <Link href="/pricing" className="btn-ghost text-lg !py-4 !px-10">
                View Pricing
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== Floating Chat ===== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <ChatWidget />
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] bg-[#050505] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <span className="text-xl font-bold tracking-tight">Kaelus<span className="text-brand-400">.ai</span></span>
            </Link>
            <div className="flex gap-6 text-sm text-white/40">
              <Link href="/features" className="hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Login</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-white/20">
            &copy; {new Date().getFullYear()} Kaelus.ai — All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
