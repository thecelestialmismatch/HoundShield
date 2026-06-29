import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "Contact | HoundShield Sales & Support",
  description:
    "Talk to the HoundShield team about CMMC Level 2 compliance, pricing, C3PAO partner program, or enterprise deployment. Get answers before your assessment.",
  keywords: [
    "HoundShield contact",
    "CMMC compliance sales",
    "AI compliance support",
    "C3PAO partner contact",
  ],
  alternates: { canonical: `${BASE_URL}/contact` },
  openGraph: {
    title: "Contact HoundShield | CMMC & AI Compliance",
    description:
      "Talk to our team about CMMC compliance, pricing, or the C3PAO partner program.",
    url: `${BASE_URL}/contact`,
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
