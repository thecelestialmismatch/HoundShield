import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { ArchitecturalProblem } from "@/components/marketing/ArchitecturalProblem";
import { Faq } from "@/components/marketing/Faq";

const HIPAA_FEATURES = [
  {
    ic: "▦",
    title: "Local PHI Detection",
    body: "MRN, ICD-10, NPI, lab values, and free-text patient identifiers scanned locally. Nothing leaves your perimeter.",
  },
  {
    ic: "✓",
    title: "45 CFR Part 164 Mapping",
    body: "Every blocked event maps to the specific HIPAA Security Rule safeguard it satisfies. Audit-ready out of the box.",
  },
  {
    ic: "🔒",
    title: "BAA-Free Deployment",
    body: "No BAA needed — HoundShield is a self-hosted proxy. Your data never reaches our servers.",
  },
  {
    ic: "⚡",
    title: "10-Minute Setup",
    body: "Point your AI tools at your HoundShield proxy. Existing workflows continue, PHI is intercepted before it leaves.",
  },
  {
    ic: "📄",
    title: "OCR Audit PDF",
    body: "One-click report mapped to HIPAA Security Rule, with tamper-proof violation log. Hand it to an OCR auditor as-is.",
  },
  {
    ic: "∿",
    title: "Drift Detection",
    body: "OODA behavioral engine flags clinicians who repeatedly attempt to send PHI to AI — before it becomes a breach.",
  },
];

export const metadata: Metadata = {
  title: "HIPAA — PHI compliance for AI tools",
  description:
    "HoundShield blocks PHI from reaching ChatGPT, Claude, Copilot. 45 CFR Part 164 mapped. No BAA needed.",
};

export default function HipaaPage() {
  return (
    <PublicShell>
      <HeroSection
        eyebrow="HIPAA · 45 CFR Part 164"
        headline={
          <>
            PHI never leaves
            <br />
            your network.
          </>
        }
        sub="Clinicians use ChatGPT for documentation, billing, and triage. HoundShield blocks PHI before it leaves your perimeter — every prompt, every model, every time."
      />
      <FeatureGrid eyebrow="HIPAA features" headline={<>Built for the<br />Security Rule.</>} sub="Every feature maps to a 45 CFR Part 164 safeguard." features={HIPAA_FEATURES} />
      <ArchitecturalProblem />
      <Faq />
    </PublicShell>
  );
}
