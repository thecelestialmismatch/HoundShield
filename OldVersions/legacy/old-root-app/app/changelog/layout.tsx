import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

export const metadata: Metadata = {
  title: "Changelog | HoundShield Release Notes",
  description:
    "HoundShield release notes and changelog. New CMMC controls, scanning improvements, PDF evidence enhancements, and bug fixes. Stay current with compliance updates.",
  keywords: ["HoundShield changelog", "AI compliance updates", "CMMC software releases"],
  alternates: { canonical: `${BASE_URL}/changelog` },
  openGraph: {
    title: "Changelog | HoundShield",
    description: "Release notes, new features, and compliance updates for HoundShield.",
    url: `${BASE_URL}/changelog`,
    type: "website",
  },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
