import type { Metadata } from "next";

import { SITE_URL } from "@/lib/site-url";

const BASE_URL = SITE_URL;
export const metadata: Metadata = {
  title: "About | HoundShield — AI Compliance Security",
  description:
    "HoundShield builds local-only AI compliance firewalls for healthcare, legal, and defense teams. Prove what staff pasted into ChatGPT and Copilot — scanned on your own hardware, mapped to NIST 800-171 Rev 2 and HIPAA.",
  keywords: [
    "HoundShield about",
    "AI compliance company",
    "CMMC compliance startup",
    "defense contractor security",
  ],
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: {
    title: "About HoundShield | AI Compliance Security",
    description:
      "Building local-only AI compliance firewalls for defense contractors and regulated industries. CMMC Level 2, HIPAA, SOC 2.",
    url: `${BASE_URL}/about`,
    type: "website",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
