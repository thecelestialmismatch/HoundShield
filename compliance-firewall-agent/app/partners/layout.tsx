import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "Partner Program | RPO & MSP CMMC AI Compliance Partnership",
  description:
    "Join the HoundShield partner program. RPOs, MSPs, and CMMC consultants co-brand the $499 CMMC AI Risk Assessment Report for their clients. Revenue share, co-marketing, and dedicated support. (C3PAOs cannot refer tools they assess — 32 CFR Part 170.)",
  keywords: [
    "RPO partner program",
    "CMMC compliance partner",
    "MSP CMMC compliance",
    "CMMC AI risk assessment report",
    "CMMC consultant tools",
    "defense contractor MSP",
  ],
  alternates: { canonical: `${BASE_URL}/partners` },
  openGraph: {
    title: "Partner Program | HoundShield",
    description:
      "RPOs, MSPs, and CMMC consultants co-brand HoundShield's $499 CMMC AI Risk Assessment Report for defense contractors. Revenue share, co-marketing, dedicated support.",
    url: `${BASE_URL}/partners`,
    type: "website",
  },
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
