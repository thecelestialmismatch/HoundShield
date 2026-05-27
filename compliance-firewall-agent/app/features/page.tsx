import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { ArchitecturalProblem } from "@/components/marketing/ArchitecturalProblem";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Faq } from "@/components/marketing/Faq";

export const metadata: Metadata = {
  title: "Features — Local AI compliance firewall",
  description:
    "16 detection engines. NIST 800-171 Rev 2 controls. SHA-256 tamper-proof audit log. C3PAO-ready PDF. Live in ten minutes.",
};

export default function FeaturesPage() {
  return (
    <PublicShell>
      <HeroSection
        eyebrow="Product"
        headline={
          <>
            Every feature maps to
            <br />
            an audit control.
          </>
        }
        sub="HoundShield ships the 16 detection engines, the tamper-proof audit log, and the C3PAO-ready PDF — every feature designed for the assessor your contract depends on."
      />
      <FeatureGrid />
      <ArchitecturalProblem />
      <HowItWorks />
      <Faq />
    </PublicShell>
  );
}
