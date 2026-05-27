import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { PricingTable } from "@/components/marketing/PricingTable";
import { Faq } from "@/components/marketing/Faq";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";

export const metadata: Metadata = {
  title: "Pricing — Start free. Pay when it saves your contract.",
  description:
    "Free, Pro, Growth, Enterprise, Agency tiers. All 16 detection engines on Free. Pay when CMMC saves your contract.",
};

export default function PricingPage() {
  return (
    <PublicShell>
      <section
        className="spotlight"
        style={{ position: "relative", padding: "128px 24px 32px", overflow: "hidden" }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(36px,5vw,64px)",
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--hs-ink)",
              margin: "16px auto 24px",
              maxWidth: 900,
            }}
          >
            Start free. Pay when it saves your contract.
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--hs-ink-secondary)",
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            All 16 detection engines on every tier. Volume and integration features scale up. No surprise overage charges.
          </p>
        </div>
      </section>
      <PricingTable />
      <Faq />
    </PublicShell>
  );
}
