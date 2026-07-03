import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "HIPAA & AI | PHI Protection for Healthcare AI Usage",
  description:
    "Help your team use AI without exposing PHI. HoundShield detects PHI in AI prompts before they reach cloud services and generates audit trails to support your HIPAA program. Self-hosted (Mode B) deployment keeps PHI inside your boundary; a BAA is available for that mode.",
  keywords: [
    "HIPAA AI",
    "PHI protection AI",
    "ChatGPT PHI risk",
    "healthcare AI security",
    "PHI detection",
    "HIPAA AI firewall",
    "medical AI compliance",
    "AI DLP healthcare",
  ],
  alternates: { canonical: `${BASE_URL}/hipaa` },
  openGraph: {
    title: "HIPAA & AI | HoundShield",
    description:
      "Help prevent PHI from reaching cloud AI services. Local PHI detection, audit trails to support your HIPAA program, and a BAA available for self-hosted (Mode B) deployments.",
    url: `${BASE_URL}/hipaa`,
    type: "website",
  },
};

export default function HipaaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
