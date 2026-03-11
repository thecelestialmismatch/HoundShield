"use client";

import { TextLogo } from "@/components/TextLogo";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AnimatedSection } from "@/components/landing/animated-section";
import { Shield, Target, Rocket, Users, Globe, Heart, ArrowRight } from "lucide-react";

const values = [
    { icon: Shield, title: "Security First", desc: "Every architectural decision starts with security. We don't bolt it on — we build it in.", color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
    { icon: Target, title: "Zero Compromises", desc: "99.9% detection, <50ms latency, 0.01% false positives. We don't trade accuracy for speed.", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    { icon: Rocket, title: "Developer-First", desc: "1 line of code to integrate. If you can change a URL, you can deploy enterprise security.", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { icon: Users, title: "Transparency", desc: "Open architecture. Immutable audit trails. You can verify everything we do.", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { icon: Globe, title: "Global Standards", desc: "SOC 2, GDPR, HIPAA, EU AI Act, ISO 27001 — compliant by default, not by accident.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: Heart, title: "Built with Care", desc: "Every feature is crafted to make security teams' lives easier, not harder.", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
];

const timeline = [
    { year: "2024", title: "The Problem Discovered", desc: "Identified that 78% of enterprises have zero visibility into data flowing to AI providers." },
    { year: "2024", title: "First Prototype", desc: "Built the first gateway proxy that could intercept and scan LLM traffic in real-time." },
    { year: "2025", title: "16 Pattern Engine", desc: "Expanded detection to 16 categories covering PII, financial data, IP, and strategic intel." },
    { year: "2025", title: "13-Agent ReAct Loop", desc: "Replaced regex-only detection with contextual AI agents that understand intent." },
    { year: "2025", title: "Enterprise Launch", desc: "First enterprise deployments. SHA-256 audit chain. SOC 2 compliance reports." },
    { year: "2026", title: "Global Expansion", desc: "Multi-region deployment, EU AI Act compliance, and sub-50ms P99 latency globally." },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <Navbar />

            {/* Hero */}
            <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
                <div className="absolute inset-0 bg-hero-glow" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <AnimatedSection>
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-400 font-semibold mb-4">Our Story</p>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Building the <span className="text-gradient-brand">AI Security</span> Standard
                        </h1>
                        <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
                            We started Kaelus because we saw a massive blind spot: enterprises were adopting AI at breakneck speed, but nobody was watching what data was flowing out the door.
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Mission */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <AnimatedSection>
                        <div className="glass-card-glow p-10 md:p-14 text-center">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Our Mission</h2>
                            <p className="text-lg text-white/50 leading-relaxed max-w-2xl mx-auto">
                                To make it impossible for sensitive data to leak through AI tools — without slowing anyone down. We believe enterprise security and developer experience are not at odds. They should be the same thing.
                            </p>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">What We Believe</h2>
                    </AnimatedSection>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.map((v, i) => {
                            const Icon = v.icon;
                            return (
                                <AnimatedSection key={v.title} delay={i * 80}>
                                    <div className="glass-card p-7 h-full">
                                        <div className={`w-11 h-11 rounded-xl ${v.bg} border flex items-center justify-center mb-4`}>
                                            <Icon className={`w-5 h-5 ${v.color}`} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{v.title}</h3>
                                        <p className="text-sm text-white/40 leading-relaxed">{v.desc}</p>
                                    </div>
                                </AnimatedSection>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 px-6 bg-[#0a0a0f]">
                <div className="max-w-3xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">Our Journey</h2>
                    </AnimatedSection>
                    <div className="space-y-8">
                        {timeline.map((t, i) => (
                            <AnimatedSection key={i} delay={i * 80}>
                                <div className="flex gap-6">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-brand-500/30 to-transparent mt-2" />}
                                    </div>
                                    <div className="pb-8">
                                        <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">{t.year}</span>
                                        <h3 className="text-lg font-semibold text-white mt-1 mb-2">{t.title}</h3>
                                        <p className="text-sm text-white/40 leading-relaxed">{t.desc}</p>
                                    </div>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <AnimatedSection>
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Join Us</h2>
                        <p className="text-white/40 mb-8">See what Kaelus can do for your organization.</p>
                        <Link href="/auth" className="btn-primary px-8 py-3.5">
                            Get Started Free <ArrowRight className="w-4 h-4" />
                        </Link>
                    </AnimatedSection>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.06] py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <TextLogo />
                    </Link>
                    <p className="text-xs text-white/20">&copy; 2026 Kaelus.ai — All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
