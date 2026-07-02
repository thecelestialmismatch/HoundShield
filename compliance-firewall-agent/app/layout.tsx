import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./hermes.css";
import { displayFont, bodyFont } from "./fonts";
import { GlobalChat } from "@/components/GlobalChat";
import { ClientShell } from "@/components/ClientShell";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  softwareApplicationSchema,
  organizationSchema,
} from "@/lib/seo/structured-data";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const viewport: Viewport = {
  themeColor: "#FAFCFF",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "HoundShield | AI Compliance Firewall for CMMC, HIPAA & SOC 2",
    template: "%s | HoundShield",
  },
  description:
    "The local-only AI compliance firewall for defense contractors, healthcare, and technology. CMMC Level 2, HIPAA, SOC 2 — real-time AI prompt scanning, tamper-proof audit trails, and C3PAO-ready PDF evidence. Start free.",
  keywords: [
    "AI compliance firewall",
    "CMMC compliance",
    "CMMC Level 2",
    "HIPAA compliance",
    "HIPAA PHI protection",
    "SOC 2 compliance",
    "NIST 800-171",
    "SPRS score calculator",
    "defense contractor compliance",
    "healthcare AI compliance",
    "AI data leak prevention",
    "LLM firewall",
    "CUI protection",
    "PHI detection",
    "PII detection",
    "compliance automation",
    "AI security",
    "audit trail",
    "C3PAO assessment",
    "local AI proxy",
  ],
  authors: [{ name: "HoundShield" }],
  creator: "HoundShield",
  publisher: "HoundShield",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "HoundShield | AI Compliance Firewall for CMMC, HIPAA & SOC 2",
    description:
      "The local-only AI compliance firewall for defense contractors and regulated industries. CMMC Level 2, HIPAA, SOC 2 — real-time AI scanning, tamper-proof audit trails, C3PAO-ready PDF evidence.",
    type: "website",
    url: BASE_URL,
    siteName: "HoundShield",
    locale: "en_US",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "HoundShield — AI Compliance Firewall",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HoundShield | AI Compliance Firewall",
    description:
      "Local-only AI compliance firewall for CMMC Level 2, HIPAA, and SOC 2. Real-time prompt scanning, tamper-proof audit trails, C3PAO-ready evidence.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@houndshield",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  },
};

// ── Global JSON-LD: site-wide product + organization entities ─────────────────
// FAQPage schema is intentionally page-scoped (rendered per page via
// <FaqSection>), so the visible Q&A always matches the structured data.
const globalJsonLd = [softwareApplicationSchema(), organizationSchema()];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${displayFont.variable} ${bodyFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="canonical" href={BASE_URL} />
        {/* JetBrains Mono preconnect — loaded via CSS @import */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Global JSON-LD: product + organization (FAQ schema is page-scoped) */}
        <JsonLd schema={globalJsonLd} />
      </head>
      <body className="min-h-screen font-sans antialiased relative">
        <ClientShell>
          {children}
          <GlobalChat />
        </ClientShell>
      </body>
    </html>
  );
}
