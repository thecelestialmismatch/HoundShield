import type { Metadata } from "next";

import { SITE_URL } from "@/lib/site-url";

const BASE_URL = SITE_URL;
export const metadata: Metadata = {
  title: "Pricing | $499 AI Risk Assessment Report — HIPAA & NIST 800-171",
  description:
    "One price: a $499 one-time AI Risk Assessment Report. HoundShield scans your team's real AI prompts on your own hardware and delivers a signed PDF mapped to NIST 800-171. No subscription, no seats, no procurement review.",
  keywords: [
    "AI risk assessment report",
    "HIPAA AI compliance",
    "PHI in ChatGPT",
    "NIST 800-171 evidence",
    "SPRS self-assessment evidence",
    "local-only AI DLP",
  ],
  alternates: { canonical: `${BASE_URL}/pricing` },
  openGraph: {
    title: "HoundShield Pricing | $499 One-Time AI Risk Assessment Report",
    description:
      "$499 one-time. Scans AI prompts locally — your data never leaves your network — and produces a PDF mapped to NIST 800-171. No subscription.",
    url: `${BASE_URL}/pricing`,
    type: "website",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
