import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlobalChat } from "@/components/GlobalChat";
import { ClientShell } from "@/components/ClientShell";

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
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>"
        />
      </head>
      <body className="bg-[#07070b] text-white min-h-screen font-sans antialiased relative">
        <ClientShell>
          {children}
          <GlobalChat />
        </ClientShell>
      </body>
    </html>
  );
}
