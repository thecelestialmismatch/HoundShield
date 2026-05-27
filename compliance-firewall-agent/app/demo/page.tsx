import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { Faq } from "@/components/marketing/Faq";

export const metadata: Metadata = {
  title: "Live demo — Watch HoundShield scan in real time",
  description: "Live scan log with synthetic CUI/PHI/PII patterns matched against 16 detection engines. Sub-10ms latency.",
};

export default function DemoPage() {
  return (
    <PublicShell>
      <section className="spotlight" style={{ position: "relative", padding: "128px 24px 96px", overflow: "hidden" }}>
        <div
          className="hs-demo-grid"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <SectionEyebrow>Live demo</SectionEyebrow>
            <h1
              className="font-display"
              style={{
                fontSize: "clamp(36px,5vw,56px)",
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--hs-ink)",
                margin: "16px 0 24px",
              }}
            >
              See it block CUI in &lt;10ms.
            </h1>
            <p style={{ fontSize: 18, color: "var(--hs-ink-secondary)", marginBottom: 28 }}>
              Synthetic prompts flow through HoundShield's 16 detection engines. BLOCKED rows = CUI/PHI/PII intercepted. PASSED rows = safe content forwarded. Real proxy. Real latency.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/signup"
                className="text-white inline-flex items-center gap-2"
                style={{
                  padding: "11px 18px",
                  borderRadius: 10,
                  fontWeight: 600,
                  background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))",
                  boxShadow: "0 4px 12px rgba(90,134,168,0.25)",
                }}
              >
                Run on your prompts <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center gap-2"
                style={{ color: "var(--hs-ink-secondary)", padding: "11px 4px", fontWeight: 500 }}
              >
                Self-host in 10 min <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div>
            <DashboardPreview />
          </div>
        </div>
        <style>{`
          @media (max-width: 900px) {
            .hs-demo-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>
      <Faq />
    </PublicShell>
  );
}
