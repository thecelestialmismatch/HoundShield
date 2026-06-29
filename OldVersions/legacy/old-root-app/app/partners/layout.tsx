import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "Partner Program | C3PAO & MSP AI Compliance Partnership",
  description:
    "Join the HoundShield partner program. C3PAOs and MSPs use Kaelus to deliver CMMC Level 2 AI compliance for their clients. Revenue share, co-marketing, and dedicated support.",
  keywords: [
    "C3PAO partner",
    "CMMC compliance partner",
    "MSP CMMC compliance",
    "AI compliance reseller",
    "CMMC consultant tools",
    "defense contractor MSP",
  ],
  alternates: { canonical: `${BASE_URL}/partners` },
  openGraph: {
    title: "Partner Program | HoundShield",
    description:
      "C3PAOs and MSPs partner with Kaelus to deliver CMMC AI compliance to defense contractors. Revenue share, co-marketing, dedicated support.",
    url: `${BASE_URL}/partners`,
    type: "website",
  },
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
