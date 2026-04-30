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
  name: "Hound Shield",
  url: "https://houndshield.com",
  description:
    "Local-only AI data loss prevention proxy. Intercepts every AI prompt before it leaves your network — scanning for CUI, PII, PHI, and secrets in under 10ms. CMMC Level 2, HIPAA, and SOC 2 enforced simultaneously.",
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
    "Local-only — prompts never leave your infrastructure",
    "SAML 2.0 SSO (Okta, Azure AD)",
    "SIEM integration (Splunk, Sentinel, Elastic)",
  ],
  creator: { "@type": "Organization", name: "Hound Shield", url: "https://houndshield.com" },
});

const ORGANIZATION_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hound Shield",
  url: "https://houndshield.com",
  logo: "https://houndshield.com/icon.svg",
  contactPoint: { "@type": "ContactPoint", contactType: "sales", url: "https://houndshield.com/contact" },
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Hound Shield | Stop AI Data Leaks. CMMC Level 2 Compliant.",
    template: "%s | Hound Shield",
  },
  description:
    "Local-only AI proxy that blocks CUI, PHI, and secrets before they reach ChatGPT, Copilot, or Claude. One URL change. CMMC Level 2, HIPAA, and SOC 2 enforced simultaneously. Start free.",
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
    "AI data loss prevention",
    "AI DLP proxy",
    "local AI proxy",
    "CUI protection",
    "PHI detection",
    "PII detection",
    "AI security",
    "audit trail",
    "houndshield",
  ],
  authors: [{ name: "Hound Shield" }],
  creator: "Hound Shield",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://houndshield.com"),
  openGraph: {
    title: "Hound Shield | Stop AI Data Leaks. CMMC Level 2 Compliant.",
    description:
      "Local-only AI proxy that blocks CUI, PHI, and secrets before they reach any AI provider. One URL change. CMMC, HIPAA, SOC 2 enforced simultaneously.",
    type: "website",
    siteName: "Hound Shield",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hound Shield | Stop AI Data Leaks",
    description:
      "Local-only AI proxy. Blocks CUI, PHI, and secrets before they reach ChatGPT or Copilot. CMMC Level 2 compliant. Start free.",
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
