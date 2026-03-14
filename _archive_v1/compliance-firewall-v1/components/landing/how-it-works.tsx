"use client";

import { Terminal, Shield, Lock, ArrowRight } from "lucide-react";
import { AnimatedSection } from "./animated-section";

const steps = [
    {
        number: "01",
        icon: Terminal,
        title: "Install in 1 Line",
        description:
            "Point your AI SDK to our gateway endpoint. No infrastructure changes, no config files, no agents to deploy. Works with OpenAI, Anthropic, Google, and Meta SDKs out of the box.",
        code: 'baseURL: "https://gateway.kaelus.ai/v1"',
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    },
    {
        number: "02",
        icon: Shield,
        title: "We Intercept Everything",
        description:
            "Every prompt passes through 16 detection engines in parallel. PII, credentials, source code, financial data — scanned in under 50ms. Zero latency felt by the end user.",
        code: "Scanned: 16 patterns | Latency: <50ms",
        color: "text-brand-400",
        bg: "bg-brand-500/10 border-brand-500/20",
        glow: "shadow-[0_0_30px_rgba(99,102,241,0.15)]",
    },
    {
        number: "03",
        icon: Lock,
        title: "Threats Neutralised",
        description:
            "Sensitive data is blocked, quarantined with AES-256 encryption, or redacted — depending on your policy. Every event is logged in an immutable SHA-256 hash chain. You're audit-ready from day one.",
        code: "Result: BLOCKED → Quarantined → Audit Logged",
        color: "text-rose-400",
        bg: "bg-rose-500/10 border-rose-500/20",
        glow: "shadow-[0_0_30px_rgba(244,63,94,0.15)]",
    },
];

export function HowItWorks() {
    return (
        <section className="py-28 relative">
            <div className="absolute inset-0 bg-mesh-gradient" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <AnimatedSection className="text-center mb-20">
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-400 font-semibold mb-3">
                        Dead Simple Setup
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Three Steps to{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-brand-400 to-rose-400">
                            Total Security
                        </span>
                    </h2>
                    <p className="text-lg text-white/40 max-w-2xl mx-auto">
                        No complicated setup. No learning curve. If you can change a URL, you can deploy Kaelus.
                    </p>
                </AnimatedSection>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <AnimatedSection key={step.number} delay={i * 150}>
                                <div
                                    className={`glass-card-glow p-8 h-full relative overflow-hidden group ${step.glow}`}
                                >
                                    {/* Step number watermark */}
                                    <span className="absolute top-4 right-6 text-[80px] font-black text-white/[0.02] leading-none select-none">
                                        {step.number}
                                    </span>

                                    <div className="relative z-10">
                                        <div
                                            className={`w-14 h-14 rounded-2xl ${step.bg} border flex items-center justify-center mb-6`}
                                        >
                                            <Icon className={`w-7 h-7 ${step.color}`} />
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-3">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-white/40 leading-relaxed mb-6">
                                            {step.description}
                                        </p>

                                        {/* Code snippet */}
                                        <div className="bg-black/40 rounded-lg p-3 border border-white/[0.06]">
                                            <code className="text-xs text-white/50 font-mono">
                                                <span className={step.color}>→</span> {step.code}
                                            </code>
                                        </div>
                                    </div>

                                    {/* Arrow connector (desktop) */}
                                    {i < steps.length - 1 && (
                                        <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-20">
                                            <ArrowRight className="w-5 h-5 text-brand-500/30" />
                                        </div>
                                    )}
                                </div>
                            </AnimatedSection>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
