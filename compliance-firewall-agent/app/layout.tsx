import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Kaelus | AI Compliance Firewall",
  description:
    "Enterprise-grade compliance firewall that prevents sensitive data leaks to external LLM providers. Real-time interception, encrypted quarantine, and immutable audit trails.",
  keywords: [
    "AI compliance",
    "LLM firewall",
    "data leak prevention",
    "enterprise security",
    "ChatGPT compliance",
    "AI data protection",
    "PII detection",
    "audit trail",
    "EU AI Act",
  ],
  authors: [{ name: "Kaelus" }],
  creator: "Kaelus",
  openGraph: {
    title: "Kaelus | AI Compliance Firewall",
    description:
      "Protect sensitive data from AI leaks. Real-time interception with encrypted quarantine and immutable audit trails.",
    type: "website",
    siteName: "Kaelus",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaelus | AI Compliance Firewall",
    description:
      "Protect your enterprise data from unauthorized AI exposure. Real-time detection, encrypted quarantine, immutable audit trails.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>"
        />
      </head>
      <body className="bg-surface text-white/85 min-h-screen font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
