import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";
import { SectionEyebrow } from "./SectionEyebrow";

interface HeroSectionProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  sub?: React.ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function HeroSection({
  eyebrow = "Local AI compliance firewall",
  headline = (
    <>
      Stop CUI from leaking into ChatGPT.
      <br />
      Before it leaves your network.
    </>
  ),
  sub = "16 detection engines. NIST 800-171 Rev 2. SHA-256 tamper-proof audit log. C3PAO-ready PDF on demand. Live in ten minutes.",
  primaryCta = { label: "Start free", href: "/signup" },
  secondaryCta = { label: "See it scan", href: "#how-it-works" },
}: HeroSectionProps) {
  return (
    <section className="spotlight" style={{ position: "relative", padding: "128px 24px 96px", overflow: "hidden" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 48,
          alignItems: "center",
        }}
        className="hs-hero-grid"
      >
        <div>
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h1
            className="font-display"
            style={{
              fontWeight: 600,
              fontSize: "clamp(36px,5vw,64px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--hs-ink)",
              margin: "16px 0 24px",
            }}
          >
            {headline}
          </h1>
          <p style={{ fontSize: 18, color: "var(--hs-ink-secondary)", maxWidth: 560 }}>{sub}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            <Link
              href={primaryCta.href}
              className="text-white inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold"
              style={{
                background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))",
                boxShadow: "0 4px 12px rgba(90,134,168,0.25)",
                transition: "transform .15s, box-shadow .15s",
              }}
            >
              {primaryCta.label} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={secondaryCta.href}
              className="inline-flex items-center gap-2 px-2 py-2.5 font-medium"
              style={{ color: "var(--hs-ink-secondary)" }}
            >
              {secondaryCta.label} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div>
          <DashboardPreview />
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hs-hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
