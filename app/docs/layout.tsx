import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "Documentation | HoundShield Setup & API Reference",
  description:
    "Complete setup guide for HoundShield AI compliance firewall. Docker deployment in under 10 minutes, proxy configuration for ChatGPT and other AI tools, CMMC evidence export, API reference.",
  keywords: [
    "HoundShield documentation",
    "CMMC AI firewall setup",
    "Docker AI compliance",
    "AI proxy configuration",
    "CMMC compliance setup guide",
    "CUI detection setup",
  ],
  alternates: { canonical: `${BASE_URL}/docs` },
  openGraph: {
    title: "Documentation | HoundShield",
    description:
      "Get HoundShield running in under 10 minutes. Docker setup, proxy configuration, CMMC evidence export, and full API reference.",
    url: `${BASE_URL}/docs`,
    type: "website",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
