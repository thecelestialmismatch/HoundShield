import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "Live Demo | See CMMC AI Compliance Scanning in Action",
  description:
    "Watch HoundShield intercept AI prompts containing CUI, PHI, and PII in real time. Interactive demo with CMMC Level 2 threat detection, audit logging, and compliance reporting.",
  keywords: [
    "CMMC compliance demo",
    "AI firewall demo",
    "CUI detection demo",
    "AI compliance live demo",
    "CMMC Level 2 demo",
    "AI DLP demo",
  ],
  alternates: { canonical: `${BASE_URL}/demo` },
  openGraph: {
    title: "Live Demo | HoundShield AI Compliance Firewall",
    description:
      "See real-time AI prompt scanning, CUI/PHI detection, and C3PAO-ready compliance reporting. Interactive demo — no signup required.",
    url: `${BASE_URL}/demo`,
    type: "website",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
