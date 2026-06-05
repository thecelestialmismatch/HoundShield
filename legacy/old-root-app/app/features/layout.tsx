import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "Features | AI Compliance Firewall for CMMC Level 2, HIPAA & SOC 2",
  description:
    "Full feature breakdown: sub-10ms AI prompt scanning, CUI/PHI/PII detection, CMMC Level 2 control mapping, tamper-proof audit logs, C3PAO PDF evidence, local-only deployment.",
  keywords: [
    "AI compliance firewall features",
    "CMMC Level 2 features",
    "CUI detection",
    "PHI detection",
    "AI DLP features",
    "local AI proxy",
    "NIST 800-171 controls",
    "C3PAO evidence",
  ],
  alternates: { canonical: `${BASE_URL}/features` },
  openGraph: {
    title: "HoundShield Features | AI Compliance Firewall",
    description:
      "Sub-10ms scanning. 200+ CUI/PHI/PII patterns. CMMC Level 2 control mapping. Tamper-proof PDF evidence for C3PAO assessors. Local-only — data never leaves your network.",
    url: `${BASE_URL}/features`,
    type: "website",
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
