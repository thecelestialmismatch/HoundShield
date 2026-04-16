import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlobalChat } from "@/components/GlobalChat";
import { ClientShell } from "@/components/ClientShell";

// ---------------------------------------------------------------------------
// JSON-LD structured data constants
// Static strings — no user input, no XSS risk.
// React 19 + Next.js 15 accept string children on <script> tags directly.
// ---------------------------------------------------------------------------

const SOFTWARE_APP_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Kaelus",
  url: "https://kaelus.online",
  description:
    "AI compliance firewall for regulated industries. Enforces CMMC Level 2, HIPAA, and SOC 2 simultaneously — scanning every AI prompt for PII, PHI, CUI, and secrets in under 10ms.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  offers: [
    { "@type": "Offer", name: "Free",       price: "0",   priceCurrency: "USD" },
    { "@type": "Offer", name: "Pro",        price: "199", priceCurrency: "USD" },
    { "@type": "Offer", name: "Growth",     price: "499", priceCurrency: "USD" },
    { "@type": "Offer", name: "Enterprise", price: "999", priceCurrency: "USD" },
  ],
  featureList: [
    "CMMC Level 2 compliance enforcement",
    "HIPAA PHI detection (18 identifiers)",
    "SOC 2 access control monitoring",
    "Real-time AI prompt scanning under 10ms",
    "Blockchain-anchored audit trails",
    "SAML 2.0 SSO (Okta, Azure AD)",
    "SIEM integration (Splunk, Sentinel, Elastic)",
  ],
  creator: { "@type": "Organization", name: "Kaelus", url: "https://kaelus.online" },
});

const ORGANIZATION_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Kaelus",
  url: "https://kaelus.online",
  logo: "https://kaelus.online/icon.svg",
  contactPoint: { "@type": "ContactPoint", contactType: "sales", url: "https://kaelus.online/contact" },
});

export const viewport: Viewport = {
  themeColor: "#07070b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Kaelus.online | AI Compliance Firewall for Regulated Industries",
    template: "%s | Kaelus.online",
  },
  description:
    "The AI compliance firewall for defense, healthcare, and technology. CMMC Level 2, HIPAA, SOC 2 — real-time AI traffic scanning, tamper-proof audit trails, and automated compliance. Start free.",
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
    "blockchain compliance",
  ],
  authors: [{ name: "Kaelus.online" }],
  creator: "Kaelus.online",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kaelus.online"),
  openGraph: {
    title: "Kaelus.online | AI Compliance Firewall for Regulated Industries",
    description:
      "AI compliance firewall for defense, healthcare, and technology. CMMC, HIPAA, SOC 2 — real-time AI scanning, tamper-proof audit trails, blockchain-anchored evidence. Free tier available.",
    type: "website",
    siteName: "Kaelus.online",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaelus.online | AI Compliance Firewall",
    description:
      "AI compliance firewall for regulated industries. CMMC, HIPAA, SOC 2 — real-time AI scanning, blockchain-anchored audit trails. Free tier available.",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>️</text></svg>"
        />
        {/* JSON-LD: SoftwareApplication — enables Google rich results */}
        <script type="application/ld+json">{SOFTWARE_APP_JSONLD}</script>
        <script type="application/ld+json">{ORGANIZATION_JSONLD}</script>
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
