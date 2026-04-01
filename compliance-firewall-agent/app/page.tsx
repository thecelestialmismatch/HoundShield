"use client";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedMarquee } from "@/components/landing/TrustedMarquee";
import { WhyKaelus } from "@/components/landing/WhyKaelus";
import { SetupSteps } from "@/components/landing/SetupSteps";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ScrollReveal, ScrollProgressBar } from "@/components/scroll-effects";
import { SectionSpotlight } from "@/components/SectionSpotlight";

export default function LandingPage() {
  return (
    <div className="bg-[#07070b] min-h-screen relative">
      <ScrollProgressBar />
      <Navbar variant="dark" />

      {/* Above the fold: tight hero with live counter + 3D dashboard */}
      <SectionSpotlight as="div" color="rgba(245,200,66,0.06)" radius={700}>
        <HeroSection />
      </SectionSpotlight>

      {/* Social proof: dual-direction logo marquee */}
      <ScrollReveal direction="up" delay={0}>
        <TrustedMarquee />
      </ScrollReveal>

      {/* Why Kaelus: 3 differentiators vs. alternatives */}
      <ScrollReveal direction="up" delay={0}>
        <SectionSpotlight color="rgba(99,102,241,0.07)" radius={600}>
          <WhyKaelus />
        </SectionSpotlight>
      </ScrollReveal>

      {/* How it works: 3 steps with animated connectors */}
      <ScrollReveal direction="up" delay={0}>
        <SectionSpotlight color="rgba(16,185,129,0.06)" radius={600}>
          <SetupSteps />
        </SectionSpotlight>
      </ScrollReveal>

      {/* Social proof: testimonials */}
      <ScrollReveal direction="up" delay={0}>
        <SectionSpotlight color="rgba(99,102,241,0.06)" radius={550}>
          <Testimonials />
        </SectionSpotlight>
      </ScrollReveal>

      {/* The gate: pricing */}
      <ScrollReveal direction="up" delay={0}>
        <PricingSection />
      </ScrollReveal>

      {/* Final CTA */}
      <ScrollReveal direction="up" delay={0}>
        <SectionSpotlight color="rgba(245,200,66,0.08)" radius={700}>
          <CTASection />
        </SectionSpotlight>
      </ScrollReveal>

      <LandingFooter />
    </div>
  );
}
