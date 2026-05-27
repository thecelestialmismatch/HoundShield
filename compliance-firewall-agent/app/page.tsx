import { PublicShell } from "@/components/layout/PublicShell";
import { HeroSection } from "@/components/marketing/HeroSection";
import { StatsRow } from "@/components/marketing/StatsRow";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { ArchitecturalProblem } from "@/components/marketing/ArchitecturalProblem";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { BuyerProfile } from "@/components/marketing/BuyerProfile";
import { PricingTable } from "@/components/marketing/PricingTable";
import { Faq } from "@/components/marketing/Faq";

export default function HomePage() {
  return (
    <PublicShell>
      <HeroSection />
      <StatsRow />
      <FeatureGrid />
      <ArchitecturalProblem />
      <HowItWorks />
      <BuyerProfile />
      <PricingTable />
      <Faq />
    </PublicShell>
  );
}
