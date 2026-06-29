import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, DollarSign, Users, Building2, Award, FileCheck, Handshake } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { BRAND } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "C3PAO & MSP Partner Program | HoundShield",
  description:
    "Earn 30% recurring on every client. HoundShield is the local-only AI compliance firewall your CMMC clients need before their C3PAO assessment — co-sell it, resell it, or white-label it.",
  alternates: { canonical: `${BRAND.url}/partners` },
};

const WHY = [
  { icon: DollarSign, title: "30% recurring referral", body: "Every client you refer pays you 30% of their subscription, every month, for the life of the account. A handful of Growth-tier clients is real recurring revenue." },
  { icon: FileCheck, title: "Closes your AI gap", body: "AI prompt leakage is the #1 unaddressed control area in most CMMC assessments. HoundShield gives your clients the evidence package — and gives you a reason to call them." },
  { icon: Building2, title: "Local-only — no DFARS risk", body: "Unlike Nightfall, Strac, or Purview, HoundShield never sends CUI to the cloud. You can recommend it without creating a DFARS 7012 spill for your client." },
];

const TIERS = [
  { icon: Handshake, name: "Referral Partner", rev: "30% recurring", who: "Consultants & vCISOs", points: ["Send us a warm intro", "We handle the sale & onboarding", "Monthly payouts via Stripe"] },
  { icon: Award, name: "C3PAO Partner", rev: "30% + co-marketing", who: "Authorized C3PAOs", points: ["Pre-assessment evidence for clients", "Co-branded gap reports", "Priority assessment support"], highlight: true },
  { icon: Users, name: "MSP / Reseller", rev: "Wholesale margin", who: "Managed service providers", points: ["Multi-tenant Agency plan", "White-label option", "Full platform resale"] },
];

const STEPS = [
  { n: "01", title: "Apply", body: "Tell us about your client base. Authorized C3PAOs and CMMC consultants are fast-tracked." },
  { n: "02", title: "Onboard", body: "Get your referral link, co-branded assets, and a live demo environment in a day." },
  { n: "03", title: "Earn", body: "Refer clients, we close and support them, you collect 30% recurring — tracked transparently." },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      <section className="spotlight relative pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-4 font-[var(--font-body)]">Partner Program</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[var(--hs-ink)] leading-tight tracking-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Your clients need this. <span className="text-gradient-brand">Earn 30%.</span>
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] leading-relaxed max-w-2xl mx-auto font-[var(--font-body)]">
            ~80,000 defense contractors need CMMC Level 2 by November 2026, and almost none have addressed AI prompt leakage. HoundShield is the local-only fix — bring it to your clients and earn recurring revenue on every one.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/contact" className="btn-primary text-sm">Become a partner <ArrowRight className="w-4 h-4" /></Link>
            <a href={`mailto:${BRAND.email.sales}`} className="btn-ghost text-sm">Talk to partnerships</a>
          </div>
        </div>
      </section>

      <section className="py-14 border-y border-[var(--hs-border-subtle)] bg-[var(--hs-surface-2)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[["30%", "Recurring referral"], ["~80,000", "Contractors at risk"], ["80+", "Authorized C3PAOs"], ["Nov 2026", "CMMC deadline"]].map(([v, l]) => (
              <div key={l}>
                <div className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-1 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{v}</div>
                <div className="text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why partner */}
      <section className="spotlight py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-surface-1)]">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-4" style={{ fontFamily: "var(--font-display)" }}>Why partner with HoundShield</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY.map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.title} className="glass-card p-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] mb-4"><Icon className="w-5 h-5" /></div>
                  <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2 font-[var(--font-body)]">{w.title}</h3>
                  <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed font-[var(--font-body)]">{w.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-4" style={{ fontFamily: "var(--font-display)" }}>Three ways to partner</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.name} className={`rounded-[var(--radius-xl)] p-6 bg-white ${t.highlight ? "border-2 shadow-[var(--shadow-xl)]" : "border shadow-[var(--shadow-card)]"}`} style={{ borderColor: t.highlight ? "var(--hs-steel)" : "var(--hs-border)" }}>
                  {t.highlight && <div className="text-[10px] font-semibold text-[var(--hs-steel-dark)] uppercase tracking-widest mb-3 font-[var(--font-body)]">Most popular</div>}
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] mb-4"><Icon className="w-5 h-5" /></div>
                  <h3 className="text-lg font-semibold text-[var(--hs-ink)] mb-1 font-[var(--font-body)]">{t.name}</h3>
                  <div className="text-sm font-semibold text-[var(--hs-steel-dark)] mb-1 font-[var(--font-mono)]">{t.rev}</div>
                  <p className="text-xs text-[var(--hs-ink-tertiary)] mb-4 font-[var(--font-body)]">{t.who}</p>
                  <ul className="space-y-1.5">
                    {t.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-[var(--hs-ink-secondary)] font-[var(--font-body)]">
                        <span className="text-[var(--hs-steel)] mt-0.5">✓</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-surface-1)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-4" style={{ fontFamily: "var(--font-display)" }}>How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="glass-card p-6">
                <div className="text-xs font-semibold tracking-widest mb-3 font-[var(--font-mono)] text-[var(--hs-steel)]">{s.n}</div>
                <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2 font-[var(--font-body)]">{s.title}</h3>
                <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed font-[var(--font-body)]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--hs-navy)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-steel-dark)]/10 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>Bring it to your clients.</h2>
          <p className="text-base text-[var(--hs-sky)] mb-10 max-w-lg mx-auto font-[var(--font-body)]">Apply in two minutes. C3PAOs and CMMC consultants are fast-tracked.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--hs-navy)] bg-white rounded-[var(--radius-md)] hover:bg-[var(--hs-cream)] transition-colors font-[var(--font-body)]">Become a partner <ArrowRight className="w-4 h-4" /></Link>
            <a href={`mailto:${BRAND.email.sales}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-white/20 rounded-[var(--radius-md)] hover:bg-white/10 transition-colors font-[var(--font-body)]">{BRAND.email.sales}</a>
          </div>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
