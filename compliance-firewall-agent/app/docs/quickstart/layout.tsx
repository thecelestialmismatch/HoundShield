import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

// The parent app/docs/layout.tsx canonicalises to /docs; this override gives
// the quickstart page its own title, description, and self-referencing
// canonical so it indexes as a distinct page.
export const metadata: Metadata = {
  title: "Quickstart | HoundShield Setup in 10 Minutes",
  description:
    "Get HoundShield running in under 10 minutes: change one proxy URL, deploy the Docker image on your own infrastructure, and start generating C3PAO-ready compliance evidence.",
  keywords: [
    "HoundShield quickstart",
    "AI compliance firewall setup",
    "Docker AI proxy deployment",
    "CMMC AI proxy quickstart",
  ],
  alternates: { canonical: `${BASE_URL}/docs/quickstart` },
  openGraph: {
    title: "Quickstart | HoundShield",
    description:
      "Change one URL, deploy Docker on your own infrastructure, and generate C3PAO-ready evidence in minutes.",
    url: `${BASE_URL}/docs/quickstart`,
    type: "website",
  },
};

export default function QuickstartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
