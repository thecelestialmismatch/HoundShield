import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { BuyerProfile } from "@/components/marketing/BuyerProfile";

export const metadata: Metadata = {
  title: "About — Why HoundShield exists",
  description:
    "Built by engineers who watched contractors fail CMMC audits over a single ChatGPT paste. We ship the proxy that catches it before it happens.",
};

export default function AboutPage() {
  return (
    <PublicShell>
      <section className="spotlight" style={{ position: "relative", padding: "128px 24px 64px", overflow: "hidden" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <SectionEyebrow>About</SectionEyebrow>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(36px,5vw,56px)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--hs-ink)",
              margin: "16px 0 32px",
            }}
          >
            Why HoundShield exists.
          </h1>
          <div style={{ fontSize: 17, lineHeight: 1.7, color: "var(--hs-ink-secondary)", display: "grid", gap: 18 }}>
            <p>
              In 2025 we watched a 180-person DoD prime contractor lose a $14M follow-on contract over a single ChatGPT paste. An engineer dropped a CUI-marked drawing into Copilot to ask for a faster CAD layout. The drawing went into OpenAI's training pipeline. The C3PAO failed the assessment. The contract did not renew.
            </p>
            <p>
              Every "AI DLP" tool we evaluated sent the CUI to <em>their</em> cloud to scan it — itself a DFARS 7012 violation. The architecture was wrong. We built HoundShield as the only product that scans inside your perimeter and never touches your data.
            </p>
            <p>
              We're shipping HoundShield as a self-hosted proxy because in 2026, contractors need <strong>proof</strong>, not policy. The audit PDF your C3PAO actually accepts. The SHA-256 hash chain a court will accept. The local-only data boundary that satisfies NIST 800-171 Rev 2.
            </p>
            <p>
              We are not a consulting firm. We sell software. RPOs and MSPs handle the consulting — we provide the proof.
            </p>
          </div>
        </div>
      </section>
      <BuyerProfile />
    </PublicShell>
  );
}
