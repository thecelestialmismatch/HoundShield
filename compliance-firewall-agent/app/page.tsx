"use client";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedMarquee } from "@/components/landing/TrustedMarquee";
import { WhyKaelus } from "@/components/landing/WhyKaelus";
import { PlatformDashboard } from "@/components/landing/PlatformDashboard";
import { SetupSteps } from "@/components/landing/SetupSteps";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ScrollReveal, ScrollProgressBar } from "@/components/scroll-effects";

export default function LandingPage() {
  return (
    <div className="bg-[#07070b] min-h-screen relative">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      {/* Above the fold: tight hero with live counter */}
      <HeroSection />

      {/* Social proof: logo marquee */}
      <ScrollReveal direction="up" delay={0}>
        <TrustedMarquee />
      </ScrollReveal>

      {/* Why Kaelus: 3 differentiators vs. alternatives */}
      <ScrollReveal direction="up" delay={0}>
        <WhyKaelus />
      </ScrollReveal>

      {/* Platform Dashboard: all 3 frameworks live */}
      <ScrollReveal direction="up" delay={0}>
        <PlatformDashboard />
      </ScrollReveal>

      {/* How it works: 3 steps */}
      <ScrollReveal direction="up" delay={0}>
        <SetupSteps />
      </ScrollReveal>

      {/* Social proof: testimonials */}
      <ScrollReveal direction="up" delay={0}>
        <Testimonials />
      </ScrollReveal>

      {/* The gate: pricing */}
      <ScrollReveal direction="up" delay={0}>
        <PricingSection />
      </ScrollReveal>

      {/* Final CTA */}
      <ScrollReveal direction="up" delay={0}>
        <CTASection />
      </ScrollReveal>

      <LandingFooter />
    </div>
  );
}
