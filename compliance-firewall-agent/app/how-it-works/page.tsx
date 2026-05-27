import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ArchitecturalProblem } from "@/components/marketing/ArchitecturalProblem";
import { Faq } from "@/components/marketing/Faq";
import { StatsRow } from "@/components/marketing/StatsRow";

export const metadata: Metadata = {
  title: "How it works — Live in ten minutes",
  description:
    "Three steps: change one URL, every prompt scanned locally, audit PDF on demand. <10ms latency, SHA-256 hash chain.",
};

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <HeroSection
        eyebrow="Deployment"
        headline={
          <>
            Live in ten minutes.
            <br />
            Audited in ten seconds.
          </>
        }
        sub="Set your AI tool's base URL to your HoundShield proxy. Sixteen detection engines scan every prompt locally — block the bad ones, forward the rest, log everything to a tamper-proof chain."
        primaryCta={{ label: "Read the quickstart", href: "/docs/quickstart" }}
        secondaryCta={{ label: "See it scan", href: "#how-it-works" }}
      />
      <StatsRow />
      <HowItWorks />
      <ArchitecturalProblem />
      <Faq />
    </PublicShell>
  );
}
