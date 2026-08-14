import type { Metadata } from "next";

import { SITE_URL } from "@/lib/site-url";

const BASE_URL = SITE_URL;
export const metadata: Metadata = {
  title: "HIPAA & AI | PHI Protection for Healthcare AI Usage",
  description:
    "Help your team use AI without exposing PHI. HoundShield detects PHI in AI prompts before they reach cloud services and generates audit trails to support your HIPAA program. Self-hosted (Mode B) keeps PHI inside your boundary — it never reaches us, so no BAA with HoundShield is required.",
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
      "Help prevent PHI from reaching cloud AI services. Local PHI detection, and audit trails to support your HIPAA program. In self-hosted Mode B, PHI never reaches HoundShield, so no BAA with us is required.",
    url: `${BASE_URL}/hipaa`,
    type: "website",
  },
};

export default function HipaaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
