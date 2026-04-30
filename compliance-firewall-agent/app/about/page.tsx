"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { TextLogo } from "@/components/TextLogo";
import { AnimatedSection, AnimatedCounter } from "@/components/landing/animated-section";
import { ScrollProgressBar } from "@/components/scroll-effects";
import {
    Shield, Lock, Bot, Eye, DollarSign, CheckCircle,
    ArrowRight, Quote, Calendar,
} from "lucide-react";

/* ===== DATA ===== */

const stats = [
    { value: 87000, suffix: "+", label: "Defense contractors need CMMC" },
    { value: 110, suffix: "", label: "NIST 800-171 controls mapped" },
    { value: 49, prefix: "$", suffix: "/mo", label: "Starting price" },
    { value: 14, suffix: "-day", label: "Free trial, no card required" },
];

const values = [
    { icon: Lock, title: "Security First", desc: "Zero-trust architecture from day one. Every layer encrypted, every access logged, every action auditable.", color: "text-brand-500", bg: "bg-brand-50 border-brand-200" },
    { icon: Shield, title: "Defense-Grade", desc: "Purpose-built for CMMC Level 2. We map all 110 controls so you don't have to decode 800-171 yourself.", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { icon: Bot, title: "AI-Powered", desc: "Automated gap analysis identifies exactly where you fall short and generates remediation plans in minutes.", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
    { icon: Eye, title: "Transparent", desc: "Open audit trails with SHA-256 integrity. Assessors see the evidence they need, nothing hidden.", color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
    { icon: DollarSign, title: "Affordable", desc: "$0 to start. Enterprise-grade compliance shouldn't bankrupt a small defense subcontractor.", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
    { icon: CheckCircle, title: "Compliant", desc: "SOC 2 and GDPR ready out of the box. We practice the compliance we preach.", color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
];

const testimonials = [
    { quote: "We went from zero documentation to assessment-ready in six weeks. Our C3PAO was genuinely impressed with the evidence packages Hound Shield generated.", name: "Sarah Mitchell", title: "VP of Cybersecurity", company: "Ridgeline Defense Systems" },
    { quote: "As a 30-person shop, we thought CMMC Level 2 was out of reach. Hound Shield made the 110 controls approachable and showed us exactly what to fix first.", name: "James Thornton", title: "CTO", company: "Apex Tactical Solutions" },
    { quote: "The AI gap analysis found policy gaps our internal audit missed. The automated POA&M tracking alone saves us 15 hours a week.", name: "Maria Chen", title: "Compliance Director", company: "Vanguard Aero Engineering" },
];

const timeline = [
    { date: "2024 Q3", title: "Founded", desc: "Hound Shield launched with a singular mission: make CMMC compliance accessible to every defense contractor." },
    { date: "2024 Q4", title: "First Beta", desc: "Early access program with 20 defense subcontractors. Validated core assessment engine." },
    { date: "2025 Q1", title: "NIST 800-171 Engine", desc: "Full mapping of all 110 security controls with automated evidence collection." },
    { date: "2025 Q3", title: "Public Launch", desc: "General availability with AI-powered gap analysis, remediation plans, and audit trail generation." },
    { date: "2026 Q1", title: "CMMC Level 2 Mapping", desc: "Complete alignment with CMMC 2.0 assessment objectives and C3PAO preparation workflows." },
    { date: "2026 Q3", title: "1,000+ Users", desc: "Trusted by over a thousand defense contractors from sole proprietors to mid-tier primes." },
];

/* ===== PAGE ===== */

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
            <ScrollProgressBar />
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <Navbar variant="dark" />

            {/* Hero */}
            <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
                <div className="absolute inset-0 bg-hero-glow" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <AnimatedSection>
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-semibold mb-4">About Hound Shield</p>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Building the Future of{" "}
                            <span className="text-gradient-brand">Defense Compliance</span>
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            87,000 defense contractors need CMMC certification. Most can't afford six-figure consulting fees.
                            We built Hound Shield to change that.
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Mission Panel */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <AnimatedSection>
                        <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-10 md:p-14 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-emerald-500/5 pointer-events-none" />
                            <div className="relative z-10">
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Our Mission</h2>
                                <p className="text-xl md:text-2xl font-medium text-slate-400 leading-relaxed max-w-2xl mx-auto">
                                    Democratize CMMC compliance for every defense contractor — from
                                    sole proprietors to mid-tier primes — so protecting national security
                                    is never gated by budget.
                                </p>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Numbers */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">By the Numbers</h2>
                    </AnimatedSection>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((s, i) => (
                            <AnimatedSection key={s.label} delay={i * 100}>
                                <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center">
                                    <p className="text-3xl md:text-4xl font-extrabold text-white mb-2 font-mono">
                                        <AnimatedCounter target={s.value} prefix={s.prefix || ""} suffix={s.suffix} />
                                    </p>
                                    <p className="text-sm text-slate-400">{s.label}</p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">What We Stand For</h2>
                    </AnimatedSection>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.map((v, i) => {
                            const Icon = v.icon;
                            return (
                                <AnimatedSection key={v.title} delay={i * 80}>
                                    <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-7 h-full">
                                        <div className={`w-11 h-11 rounded-xl ${v.bg} border flex items-center justify-center mb-4`}>
                                            <Icon className={`w-5 h-5 ${v.color}`} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{v.title}</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">{v.desc}</p>
                                    </div>
                                </AnimatedSection>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 px-6 bg-[#0a0a0f]">
                <div className="max-w-5xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">Trusted by Defense Contractors</h2>
                    </AnimatedSection>
                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <AnimatedSection key={t.name} delay={i * 100}>
                                <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-7 h-full flex flex-col">
                                    <Quote className="w-5 h-5 text-brand-500/40 mb-4 flex-shrink-0" />
                                    <p className="text-sm text-slate-400 leading-relaxed flex-1 mb-6">
                                        {t.quote}
                                    </p>
                                    <div className="border-t border-white/10 pt-4">
                                        <p className="text-sm font-semibold text-white">{t.name}</p>
                                        <p className="text-xs text-slate-400">{t.title}, {t.company}</p>
                                    </div>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">Our Journey</h2>
                    </AnimatedSection>
                    <div className="space-y-0">
                        {timeline.map((t, i) => (
                            <AnimatedSection key={i} delay={i * 80}>
                                <div className="flex gap-6">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-brand-500 flex-shrink-0 mt-1" />
                                        {i < timeline.length - 1 && (
                                            <div className="w-px flex-1 bg-gradient-to-b from-brand-500/30 to-transparent mt-2" />
                                        )}
                                    </div>
                                    <div className="pb-10">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-3 h-3 text-brand-500/60" />
                                            <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">{t.date}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-1">{t.title}</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">{t.desc}</p>
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
                        <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-10 md:p-14 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-emerald-500/5 pointer-events-none" />
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Join the Mission</h2>
                                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                    Start your CMMC compliance journey today. 14-day free trial, no credit card required.
                                </p>
                                <Link
                                    href="/signup"
                                    className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-500 text-slate-900 font-semibold px-8 py-3.5 rounded-xl transition-colors cursor-pointer"
                                >
                                    Get Started Free <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer">
                        <TextLogo variant="dark" />
                    </Link>
                    <p className="text-xs text-slate-500">&copy; 2026 Hound Shield — All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
