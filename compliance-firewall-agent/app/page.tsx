"use client";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TickerSection } from "@/components/landing/TickerSection";
import { TrustedMarquee } from "@/components/landing/TrustedMarquee";
import { CMMCSocialProof } from "@/components/landing/CMMCSocialProof";
import { SetupSteps } from "@/components/landing/SetupSteps";
import { DetectionGrid } from "@/components/landing/DetectionGrid";
import { ReActLoop } from "@/components/landing/ReActLoop";
import { ArchitectureAccordion } from "@/components/landing/ArchitectureAccordion";
import { CodeBlock } from "@/components/landing/CodeBlock";
import { PipelineSimulator } from "@/components/landing/PipelineSimulator";
import { DashboardMockup } from "@/components/landing/DashboardMockup";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { Testimonials } from "@/components/landing/Testimonials";
import { AgencySection } from "@/components/landing/AgencySection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { NewsletterSection } from "@/components/landing/NewsletterSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ScrollReveal, ScrollProgressBar } from "@/components/scroll-effects";

export default function LandingPage() {
  return (
    <div className="bg-[#07070b] min-h-screen relative">
      <ScrollProgressBar />
      <Navbar variant="dark" />
      <HeroSection />
      <TickerSection />

      <ScrollReveal direction="up" delay={0}>
        <TrustedMarquee />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <CMMCSocialProof />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <SetupSteps />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <DetectionGrid />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <ReActLoop />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <ArchitectureAccordion />
      </ScrollReveal>

      <ScrollReveal direction="left" delay={0}>
        <CodeBlock />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <PipelineSimulator />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <DashboardMockup />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <FeaturesGrid />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <Testimonials />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <AgencySection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <PricingSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <FAQSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <NewsletterSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0}>
        <CTASection />
      </ScrollReveal>

      <LandingFooter />
    </div>
  );
}
