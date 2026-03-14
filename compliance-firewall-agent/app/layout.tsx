import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlobalChat } from "@/components/GlobalChat";

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Kaelus.ai | AI Compliance Firewall & CMMC Readiness Platform",
    template: "%s | Kaelus.ai",
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
  authors: [{ name: "Kaelus.ai" }],
  creator: "Kaelus.ai",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kaelus.ai"),
  openGraph: {
    title: "Kaelus.ai | AI Compliance Firewall & CMMC Readiness",
    description:
      "Affordable CMMC compliance for defense contractors. AI-powered gap analysis, SPRS scoring, and automated document generation. Free tier available.",
    type: "website",
    siteName: "Kaelus.ai",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaelus.ai | AI Compliance Firewall",
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
      <body className="bg-surface text-slate-800 min-h-screen font-sans antialiased relative">
        {/* Subtle ambient background orbs */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full bg-blue-400/[0.04] blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[-15%] right-[-5%] w-[40%] h-[40%] rounded-full bg-violet-400/[0.03] blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[50%] left-[60%] w-[25%] h-[25%] rounded-full bg-cyan-400/[0.03] blur-[80px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>
        {children}
        <GlobalChat />
      </body>
    </html>
  );
}
