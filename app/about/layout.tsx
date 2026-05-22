import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "About | HoundShield — AI Compliance Security",
  description:
    "HoundShield builds local-only AI compliance firewalls for defense contractors and regulated industries. Learn about our mission to make CMMC Level 2 compliance achievable before the November 2026 deadline.",
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
