import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Users, Award } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { HeroSection } from "@/components/marketing/HeroSection";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";

export const metadata: Metadata = {
  title: "Partners — RPOs, MSPs, and C3PAOs",
  description:
    "HoundShield partners with RPOs, MSPs, and CMMC-focused security firms. 40–50% revenue share. White-label reports. Co-branded deployment.",
};

const TIERS = [
  {
    icon: <Building2 className="w-6 h-6" />,
    title: "Registered Practitioner Organizations",
    body: "RPOs guiding contractors through CMMC L2 prep get HoundShield wholesale at $299 per assessment. White-label PDF reports under your firm's brand.",
    cta: "Become an RPO partner",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Managed Service Providers",
    body: "MSPs supporting DoD subs deploy HoundShield as part of their compliance stack. 40% recurring revenue share. Dedicated partner portal.",
    cta: "Become an MSP partner",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "CMMC-focused Consultants",
    body: "Boutique compliance firms refer contractors with a 50% first-year revenue share. We never compete on consulting — only software.",
    cta: "Become a consulting partner",
  },
];

const PARTNERS = [
  "Summit 7",
  "MAD Security",
  "CyberSheath",
  "CompliancePoint",
  "BEMO",
  "Steel Root",
  "Etactics",
];

export default function PartnersPage() {
  return (
    <PublicShell>
      <HeroSection
        eyebrow="Partner Program"
        headline={
          <>
            Refer the contractor.
            <br />
            We ship the firewall.
          </>
        }
        sub="HoundShield never replaces the consultant — we ship the local proxy your clients need to prove CMMC, HIPAA, or SOC 2 readiness. 40–50% revenue share, white-label reports, co-branded deployment."
        primaryCta={{ label: "Apply to partner", href: "/contact" }}
        secondaryCta={{ label: "View partner deck", href: "/docs" }}
      />

      <section className="spotlight" style={{ position: "relative", padding: "96px 24px", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <SectionEyebrow>Partner tracks</SectionEyebrow>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(28px,3.6vw,44px)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              color: "var(--hs-ink)",
              margin: "12px 0 48px",
            }}
          >
            Three ways to partner.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {TIERS.map((t) => (
              <div
                key={t.title}
                className="glass-card"
                style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "var(--hs-mist-md)",
                    color: "var(--hs-steel-dark)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {t.icon}
                </div>
                <h3
                  className="font-display"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: "var(--hs-ink)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t.title}
                </h3>
                <p style={{ fontSize: 14.5, color: "var(--hs-ink-secondary)", lineHeight: 1.6, flex: 1 }}>{t.body}</p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 font-semibold"
                  style={{ color: "var(--hs-steel-dark)", fontSize: 14 }}
                >
                  {t.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="spotlight" style={{ position: "relative", padding: "96px 24px", background: "var(--hs-surface-1)", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <SectionEyebrow>Compatible with</SectionEyebrow>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(28px,3.6vw,40px)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              color: "var(--hs-ink)",
              margin: "12px 0 32px",
            }}
          >
            We work with the firms your clients trust.
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {PARTNERS.map((p) => (
              <span
                key={p}
                style={{
                  padding: "10px 18px",
                  borderRadius: 9999,
                  border: "1px solid var(--hs-border-subtle)",
                  background: "#fff",
                  color: "var(--hs-ink)",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {p}
              </span>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: "var(--hs-ink-tertiary)" }}>
            HoundShield is software-only — we never compete with consulting partners. C3PAOs cannot endorse products under 32 CFR Part 170; we partner exclusively with RPOs and MSPs.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
