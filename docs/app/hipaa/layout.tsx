import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "HIPAA Compliance | AI Firewall for Healthcare PHI Protection",
  description:
    "HIPAA-compliant AI usage for healthcare organizations. HoundShield detects PHI in AI prompts before they reach cloud services, generates BAA-supporting audit trails, and ensures your AI tools don't create HIPAA violations.",
  keywords: [
    "HIPAA AI compliance",
    "PHI protection AI",
    "HIPAA compliant ChatGPT",
    "healthcare AI security",
    "PHI detection",
    "HIPAA AI firewall",
    "medical AI compliance",
    "AI DLP healthcare",
  ],
  alternates: { canonical: `${BASE_URL}/hipaa` },
  openGraph: {
    title: "HIPAA Compliance | HoundShield AI Firewall",
    description:
      "Stop PHI from reaching cloud AI services. Local-only PHI detection, HIPAA audit trails, and BAA-supporting compliance documentation for healthcare organizations.",
    url: `${BASE_URL}/hipaa`,
    type: "website",
  },
};

export default function HipaaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
