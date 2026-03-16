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
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { NewsletterSection } from "@/components/landing/NewsletterSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
export default function LandingPage() {
  return (
    <div className="bg-[#F7F5F0] min-h-screen relative">
      <Navbar variant="dark" />
      <HeroSection />
      <TickerSection />
      <TrustedMarquee />
      <CMMCSocialProof />
      <SetupSteps />
      <DetectionGrid />
      <ReActLoop />
      <ArchitectureAccordion />
      <CodeBlock />
      <PipelineSimulator />
      <DashboardMockup />
      <FeaturesGrid />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <NewsletterSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
