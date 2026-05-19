import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "Pricing | AI Compliance Firewall for CMMC & HIPAA",
  description:
    "HoundShield pricing for defense contractors and regulated industries. Free starter, Pro at $69/mo, Growth at $199/mo, Enterprise at $499/mo. C3PAO-ready PDF evidence included.",
  keywords: [
    "CMMC compliance pricing",
    "AI compliance firewall cost",
    "CMMC software pricing",
    "defense contractor compliance tool",
    "HIPAA AI compliance pricing",
    "NIST 800-171 software",
  ],
  alternates: { canonical: `${BASE_URL}/pricing` },
  openGraph: {
    title: "HoundShield Pricing | CMMC & HIPAA AI Compliance",
    description:
      "Plans starting free. Pro $69/mo. Enterprise $499/mo with C3PAO-ready PDF reports, full CMMC Level 2 coverage, and local-only deployment.",
    url: `${BASE_URL}/pricing`,
    type: "website",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
