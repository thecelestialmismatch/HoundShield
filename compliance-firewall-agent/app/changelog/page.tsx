"use client";

import { TextLogo } from "@/components/TextLogo";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AnimatedSection } from "@/components/landing/animated-section";
import { Rocket, Zap, Shield, Bug, Star, ArrowRight, Calendar } from "lucide-react";

const releases = [
    {
        version: "2.4.0",
        date: "March 2026",
        tag: "Latest",
        tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        changes: [
            { type: "feature", text: "Live threat globe with real-time worldwide interception map" },
            { type: "feature", text: "Particle animation hero with mouse-reactive canvas" },
            { type: "feature", text: "FAQ section with JSON-LD schema for SEO" },
            { type: "feature", text: "Testimonial cards with mobile carousel" },
            { type: "improvement", text: "Landing page upgraded with 7 new sections" },
            { type: "improvement", text: "Enhanced CSS design system with new animations" },
        ],
    },
    {
        version: "2.3.0",
        date: "February 2026",
        tag: "Stable",
        tagColor: "bg-brand-500/20 text-brand-400 border-brand-500/30",
        changes: [
            { type: "feature", text: "13-agent ReAct reasoning loop for contextual analysis" },
            { type: "feature", text: "Memory DNA system for agent state management" },
            { type: "improvement", text: "Sub-50ms P99 scan latency optimization" },
            { type: "fix", text: "WebSocket reconnection reliability improved" },
        ],
    },
    {
        version: "2.2.0",
        date: "January 2026",
        tag: "Stable",
        tagColor: "bg-brand-500/20 text-brand-400 border-brand-500/30",
        changes: [
            { type: "feature", text: "HITL (Human-in-the-Loop) quarantine review portal" },
            { type: "feature", text: "SHA-256 cryptographic audit hash chain" },
            { type: "improvement", text: "Compliance report PDF generation" },
            { type: "fix", text: "Stream scanner edge case for multi-chunk payloads" },
        ],
    },
    {
        version: "2.1.0",
        date: "December 2025",
        tag: "",
        tagColor: "",
        changes: [
            { type: "feature", text: "16-pattern detection engine with parallel scanning" },
            { type: "feature", text: "AES-256-CBC encrypted quarantine vault" },
            { type: "improvement", text: "Provider support for Anthropic and Google AI" },
        ],
    },
    {
        version: "2.0.0",
        date: "November 2025",
        tag: "Major",
        tagColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        changes: [
            { type: "feature", text: "Complete architecture rewrite with Next.js 14" },
            { type: "feature", text: "Real-time WebSocket dashboard" },
            { type: "feature", text: "Multi-provider gateway (OpenAI, Anthropic, Google, Meta)" },
            { type: "feature", text: "Zero-copy stream scanning engine" },
        ],
    },
];

const roadmap = [
    { title: "GraphQL API", desc: "Full GraphQL API for programmatic access to all Kaelus data.", quarter: "Q2 2026" },
    { title: "Slack & Teams Integration", desc: "Real-time alerts and quarantine approvals from your messaging platform.", quarter: "Q2 2026" },
    { title: "Custom Detection Rules", desc: "Define your own regex and NER patterns for industry-specific data.", quarter: "Q3 2026" },
    { title: "Multi-tenant SSO", desc: "SAML and OIDC single sign-on for enterprise deployments.", quarter: "Q3 2026" },
];

const typeIcons: Record<string, { icon: typeof Zap; color: string }> = {
    feature: { icon: Star, color: "text-emerald-400" },
    improvement: { icon: Zap, color: "text-amber-400" },
    fix: { icon: Bug, color: "text-rose-400" },
};

export default function ChangelogPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="orb orb-1" />
            <Navbar />

            {/* Hero */}
            <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
                <div className="absolute inset-0 bg-hero-glow" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <AnimatedSection>
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-400 font-semibold mb-4">What&apos;s New</p>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                            Changelog & <span className="text-gradient-brand">Roadmap</span>
                        </h1>
                        <p className="text-lg text-white/40 max-w-xl mx-auto">
                            Every update, feature, and fix — tracked and transparent.
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Releases */}
            <section className="py-16 px-6">
                <div className="max-w-3xl mx-auto space-y-8">
                    {releases.map((release, i) => (
                        <AnimatedSection key={release.version} delay={i * 80}>
                            <div className="glass-card-glow p-8">
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <h3 className="text-xl font-bold text-white">v{release.version}</h3>
                                    {release.tag && (
                                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${release.tagColor}`}>
                                            {release.tag}
                                        </span>
                                    )}
                                    <span className="text-xs text-white/30 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> {release.date}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {release.changes.map((change, j) => {
                                        const typeInfo = typeIcons[change.type];
                                        const Icon = typeInfo.icon;
                                        return (
                                            <div key={j} className="flex items-start gap-3">
                                                <Icon className={`w-4 h-4 mt-0.5 ${typeInfo.color} shrink-0`} />
                                                <span className="text-sm text-white/60">{change.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </section>

            {/* Roadmap */}
            <section className="py-20 px-6 bg-[#0a0a0f]">
                <div className="max-w-3xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 mb-4">
                            <Rocket className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Coming Soon</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Roadmap</h2>
                    </AnimatedSection>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {roadmap.map((item, i) => (
                            <AnimatedSection key={item.title} delay={i * 80}>
                                <div className="glass-card p-6 h-full">
                                    <span className="text-[10px] uppercase tracking-wider text-brand-400 font-bold">{item.quarter}</span>
                                    <h3 className="text-lg font-semibold text-white mt-2 mb-2">{item.title}</h3>
                                    <p className="text-sm text-white/40">{item.desc}</p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
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
