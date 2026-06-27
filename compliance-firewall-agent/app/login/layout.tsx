import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "Sign In | HoundShield",
  description:
    "Sign in to your HoundShield command center to review your SPRS posture, AI gateway activity, and CMMC assessment.",
  alternates: { canonical: `${BASE_URL}/login` },
  // Auth page, not an SEO surface — keep it out of the index.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sign In | HoundShield",
    description: "Access your HoundShield command center.",
    url: `${BASE_URL}/login`,
    type: "website",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
