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
    default: "Kaelus.online | AI Compliance Firewall & CMMC Readiness Platform",
    template: "%s | Kaelus.online",
  },
  description:
    "The only AI compliance firewall built for defense contractors. CMMC Level 2 readiness, real-time AI traffic scanning, SPRS scoring, and automated policy generation. Start free.",
  keywords: [
    "AI compliance firewall",
    "CMMC compliance",
    "CMMC Level 2",
    "NIST 800-171",
    "SPRS score calculator",
    "defense contractor compliance",
    "AI data leak prevention",
    "LLM firewall",
    "CUI protection",
    "compliance automation",
    "AI security",
    "PII detection",
    "audit trail",
  ],
  authors: [{ name: "Kaelus.online" }],
  creator: "Kaelus.online",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kaelus.online"),
  openGraph: {
    title: "Kaelus.online | AI Compliance Firewall & CMMC Readiness",
    description:
      "Affordable CMMC compliance for defense contractors. AI-powered gap analysis, SPRS scoring, and automated document generation. Free tier available.",
    type: "website",
    siteName: "Kaelus.online",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaelus.online | AI Compliance Firewall",
    description:
      "The affordable CMMC compliance platform for defense contractors. Free SPRS calculator, AI-powered remediation, and automated policy generation.",
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
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
