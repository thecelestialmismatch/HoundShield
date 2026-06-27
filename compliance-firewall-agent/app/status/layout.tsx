import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "System Status | HoundShield Live Service Health",
  description:
    "Real-time operational status for the HoundShield gateway, scanning engines, dashboard, and API. Live health checks, refreshed continuously.",
  keywords: [
    "HoundShield status",
    "HoundShield uptime",
    "AI compliance firewall status",
    "service health",
  ],
  alternates: { canonical: `${BASE_URL}/status` },
  openGraph: {
    title: "System Status | HoundShield",
    description:
      "Live operational status for the HoundShield gateway, scanning engines, and API.",
    url: `${BASE_URL}/status`,
    type: "website",
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
