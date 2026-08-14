import type { Metadata } from "next";

import { SITE_URL } from "@/lib/site-url";

const BASE_URL = SITE_URL;
export const metadata: Metadata = {
  title: "Start Free | HoundShield",
  description:
    "Create your HoundShield account. Free CMMC self-assessment, SPRS score, and local-only AI prompt firewall — no credit card required.",
  alternates: { canonical: `${BASE_URL}/signup` },
  // Conversion page, not an SEO surface — keep it out of the index.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Start Free | HoundShield",
    description:
      "Free CMMC self-assessment, SPRS score, and local-only AI prompt firewall. No credit card required.",
    url: `${BASE_URL}/signup`,
    type: "website",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
