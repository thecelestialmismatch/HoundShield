import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlobalChat } from "@/components/GlobalChat";
import { ClientShell } from "@/components/ClientShell";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const viewport: Viewport = {
  themeColor: "#07070b",
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

// ── Global JSON-LD (SoftwareApplication + Organization + FAQPage) ─────────────
const globalJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HoundShield",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Docker, Linux, macOS, Windows Server",
    description:
      "Local-only AI compliance firewall for CMMC Level 2, HIPAA, and SOC 2. Intercepts AI prompts before they leave your network, scans for CUI/PHI/PII, generates tamper-proof audit logs, and produces C3PAO-ready PDF compliance reports.",
    url: BASE_URL,
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier — AI prompt scanning, basic compliance reports",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "69",
        priceCurrency: "USD",
        description: "Pro — advanced scanning, PDF evidence export, CMMC controls",
      },
      {
        "@type": "Offer",
        name: "Growth",
        price: "199",
        priceCurrency: "USD",
        description: "Growth — multi-user, gateway mode, SPRS score tracking",
      },
      {
        "@type": "Offer",
        name: "Enterprise",
        price: "499",
        priceCurrency: "USD",
        description: "Enterprise — C3PAO-ready reports, dedicated support",
      },
    ],
    featureList: [
      "Sub-10ms AI prompt scanning",
      "CUI detection and blocking",
      "PHI and PII detection",
      "CMMC Level 2 control mapping",
      "HIPAA-compliant audit trails",
      "SOC 2 compliance monitoring",
      "Tamper-evident audit logs",
      "C3PAO-ready PDF evidence",
      "Local-only deployment (data never leaves your network)",
      "NIST 800-171 assessment support",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HoundShield",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
    },
    description:
      "AI compliance security company building local-only AI firewalls for defense contractors and regulated industries.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Sales",
      url: `${BASE_URL}/contact`,
    },
    sameAs: [],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is HoundShield CMMC Level 2 compliant?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. HoundShield is local-only — all AI prompt scanning happens on your infrastructure. No CUI ever leaves your control boundary, which satisfies NIST 800-171 control 3.13.1 and supports CMMC Level 2 certification. We generate PDF evidence reports that C3PAO assessors can review on-site.",
        },
      },
      {
        "@type": "Question",
        name: "Can my employees still use ChatGPT with HoundShield?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. HoundShield works as a transparent proxy. Employees point their AI tools at your Kaelus endpoint instead of directly at the AI API. Prompts that don't contain CUI/PHI/PII pass through normally. Flagged content is blocked and logged with a tamper-evident record.",
        },
      },
      {
        "@type": "Question",
        name: "How long does HoundShield take to set up?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Under 10 minutes for most organizations. It's a single URL change — point your AI tools at your Kaelus endpoint instead of the cloud AI API. Docker deployment takes 3 commands. No agent installation on individual machines required.",
        },
      },
      {
        "@type": "Question",
        name: "Does HoundShield work with ChatGPT, Claude, and other AI tools?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. HoundShield works with any AI tool that uses an OpenAI-compatible API — including ChatGPT, Claude, Gemini, Copilot, and open-source models. It acts as a drop-in proxy at the network level.",
        },
      },
    ],
  },
];

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
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>"
        />
        <link rel="canonical" href={BASE_URL} />
        {/* Preconnect to key external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Global JSON-LD: SoftwareApplication + Organization + FAQPage */}
        {globalJsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
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
