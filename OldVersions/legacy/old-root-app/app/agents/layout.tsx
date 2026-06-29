import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "AI Compliance Agents | CMMC-Aware AI Workforce",
  description:
    "CMMC-aware AI agents that understand compliance boundaries before they act. HoundShield compliance agents work within NIST 800-171 guardrails so your AI workforce doesn't create audit findings.",
  keywords: [
    "CMMC AI agents",
    "compliance-aware AI",
    "NIST 800-171 AI agents",
    "defense contractor AI automation",
    "HIPAA AI agents",
    "CUI-safe AI agents",
  ],
  alternates: { canonical: `${BASE_URL}/agents` },
  openGraph: {
    title: "AI Compliance Agents | HoundShield",
    description:
      "AI agents that operate within CMMC Level 2 and HIPAA boundaries. Automate compliance workflows without creating audit findings.",
    url: `${BASE_URL}/agents`,
    type: "website",
  },
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
