import type { Metadata } from "next";

import { SITE_URL } from "@/lib/site-url";

const BASE_URL = SITE_URL;
export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create your HoundShield account for the CMMC self-assessment, live SPRS score, and local-only AI prompt firewall.",
  alternates: { canonical: `${BASE_URL}/signup` },
  // Conversion page, not an SEO surface — keep it out of the index.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Create your account | HoundShield",
    description:
      "The CMMC self-assessment, live SPRS score, and local-only AI prompt firewall.",
    url: `${BASE_URL}/signup`,
    type: "website",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
