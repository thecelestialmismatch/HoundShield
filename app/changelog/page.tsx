import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield, Cpu, CreditCard, LayoutDashboard, KeyRound, Blocks,
  Calendar, Rocket, FolderSearch, Users, ClipboardCheck, Smartphone, ArrowRight,
} from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { BRAND } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Changelog | HoundShield",
  description: "Every HoundShield improvement, shipped fast — CMMC mapping, SPRS scoring, C3PAO export, and what's coming next.",
  alternates: { canonical: `${BRAND.url}/changelog` },
};

const badgeStyles: Record<string, string> = {
  Feature: "bg-[var(--hs-success-bg)] text-[var(--hs-success)] border-[var(--hs-border)]",
  Improvement: "bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] border-[var(--hs-border)]",
  Fix: "bg-[var(--hs-warn-bg)] text-[var(--hs-warn)] border-[var(--hs-border)]",
};

type Item = { tag: keyof typeof badgeStyles; text: string };
type Release = { version: string; date: string; title: string; icon: typeof Shield; items: Item[] };

const releases: Release[] = [
  { version: "2.5.0", date: "March 2026", title: "CMMC Level 2 Full Mapping", icon: Shield, items: [
    { tag: "Feature", text: "Complete 110-control CMMC Level 2 mapping with practice-level detail" },
    { tag: "Feature", text: "SPRS score calculator with real-time gap weighting" },
    { tag: "Feature", text: "C3PAO-ready report export (PDF + JSON)" },
    { tag: "Improvement", text: "Assessment engine refactored for sub-200ms scoring" },
  ]},
  { version: "2.4.0", date: "February 2026", title: "AI Agent Workspace", icon: Cpu, items: [
    { tag: "Feature", text: "ReAct reasoning loop with chain-of-thought tracing" },
    { tag: "Feature", text: "12 integrated tools for compliance automation" },
    { tag: "Feature", text: "Multi-model support via the OpenRouter gateway" },
    { tag: "Improvement", text: "Agent templates for common compliance workflows" },
  ]},
  { version: "2.3.0", date: "January 2026", title: "Stripe Integration & Pricing", icon: CreditCard, items: [
    { tag: "Feature", text: "Five-tier pricing: Free, Pro, Growth, Enterprise, Agency/MSP" },
    { tag: "Feature", text: "14-day trial with automatic downgrade" },
    { tag: "Feature", text: "Promo code engine with usage-based metering" },
    { tag: "Fix", text: "Webhook idempotency for duplicate Stripe events" },
  ]},
  { version: "2.2.0", date: "December 2025", title: "Command Center V2", icon: LayoutDashboard, items: [
    { tag: "Feature", text: "Unified dashboard with real-time threat feed" },
    { tag: "Feature", text: "Compliance metrics panel with trend sparklines" },
    { tag: "Improvement", text: "Pipeline view for scan lifecycle tracking" },
    { tag: "Fix", text: "WebSocket reconnection reliability on flaky networks" },
  ]},
  { version: "2.1.0", date: "November 2025", title: "OAuth & Multi-Provider Auth", icon: KeyRound, items: [
    { tag: "Feature", text: "Google, GitHub, and Microsoft SSO providers" },
    { tag: "Feature", text: "Magic link passwordless authentication" },
    { tag: "Improvement", text: "Session management with secure HTTP-only cookies" },
  ]},
  { version: "2.0.0", date: "October 2025", title: "Complete Platform Rebuild", icon: Blocks, items: [
    { tag: "Feature", text: "Full rewrite on Next.js 15, React 19, Tailwind CSS" },
    { tag: "Feature", text: "Zero-copy stream scanning engine" },
    { tag: "Improvement", text: "Sub-50ms P99 scan latency" },
  ]},
];

const roadmap = [
  { q: "Q2 2026", title: "Evidence Collection Automation", desc: "Auto-gather artifacts and screenshots mapped to CMMC controls.", icon: FolderSearch },
  { q: "Q2 2026", title: "Multi-Organization Support", desc: "Manage multiple subsidiaries under a single parent account.", icon: Users },
  { q: "Q3 2026", title: "C3PAO Assessment Prep Wizard", desc: "Guided walkthrough to prepare for third-party CMMC assessments.", icon: ClipboardCheck },
  { q: "Q3 2026", title: "Mobile App (iOS / Android)", desc: "Review alerts and track compliance on the go.", icon: Smartphone },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      <section className="spotlight relative pt-28 pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-4 font-[var(--font-body)]">Changelog</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[var(--hs-ink)] tracking-tight mb-5" style={{ fontFamily: "var(--font-display)" }}>
            What&apos;s new in <span className="text-gradient-brand">HoundShield</span>
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] max-w-xl mx-auto font-[var(--font-body)]">Every improvement, shipped fast.</p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {releases.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={r.version} className="glass-card p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)]"><Icon className="w-4 h-4" /></span>
                  <span className={`font-[var(--font-mono)] text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${i === 0 ? "bg-[var(--hs-success-bg)] text-[var(--hs-success)] border-[var(--hs-border)]" : "bg-white text-[var(--hs-ink-secondary)] border-[var(--hs-border)]"}`}>v{r.version}</span>
                  <span className="text-xs text-[var(--hs-ink-tertiary)] flex items-center gap-1.5 font-[var(--font-body)]"><Calendar className="w-3.5 h-3.5" />{r.date}</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--hs-ink)] mb-4 font-[var(--font-body)]">{r.title}</h3>
                <ul className="space-y-2.5">
                  {r.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-[var(--hs-ink-secondary)] font-[var(--font-body)]">
                      <span className={`shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border font-[var(--font-mono)] ${badgeStyles[item.tag]}`}>{item.tag}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--hs-surface-1)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--hs-border)] bg-white mb-4">
              <Rocket className="w-4 h-4 text-[var(--hs-steel-dark)]" />
              <span className="text-xs font-semibold text-[var(--hs-steel-dark)] uppercase tracking-wider font-[var(--font-body)]">Roadmap</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)]" style={{ fontFamily: "var(--font-display)" }}>Coming next</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {roadmap.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5 text-[var(--hs-steel-dark)]" />
                    <span className="text-[10px] uppercase tracking-wider text-[var(--hs-steel-dark)] font-bold font-[var(--font-mono)]">{item.q}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--hs-ink)] mb-2 font-[var(--font-body)]">{item.title}</h3>
                  <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed font-[var(--font-body)]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center glass-card py-14 px-8">
          <h3 className="text-2xl font-semibold text-[var(--hs-ink)] mb-3" style={{ fontFamily: "var(--font-display)" }}>Ship with confidence</h3>
          <p className="text-sm text-[var(--hs-ink-secondary)] mb-6 max-w-md mx-auto font-[var(--font-body)]">Start protecting your AI pipeline today. Free tier, no credit card required.</p>
          <Link href="/signup" className="btn-primary text-sm inline-flex">Get started <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
