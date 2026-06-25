import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { DeploymentBoundaryNote } from "@/components/ui/DeploymentBoundaryNote";
import { Lock, ShieldCheck, FileLock2, Network, KeyRound, Bug } from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Trust | HoundShield",
  description:
    "How HoundShield protects your data: local-only scanning, AES-256 encryption, SHA-256 audit trails, TLS 1.3, and a published vulnerability disclosure policy. Nothing leaves your network.",
  alternates: { canonical: "https://houndshield.com/security" },
};

const PILLARS = [
  {
    icon: Network,
    title: "Local-only by design",
    body: "The scanning engine runs inside your network. Prompt content, CUI, PHI, and PII are inspected on-premise and never transmitted to our servers. This is the entire architecture — not a configuration option.",
  },
  {
    icon: Lock,
    title: "Encryption everywhere",
    body: "AES-256 for any quarantined content at rest, TLS 1.3 for all data in transit. Payment data is handled entirely by Stripe; we never store card numbers.",
  },
  {
    icon: FileLock2,
    title: "Tamper-evident audit trail",
    body: "Every compliance event is written to an append-only, SHA-256-hash-chained log — the evidence format a C3PAO assessor expects, and one that makes silent alteration detectable.",
  },
  {
    icon: KeyRound,
    title: "Tenant isolation",
    body: "Row-Level Security isolates each organization's metadata. Access follows least privilege; authentication is handled by Supabase with session-token verification on every protected route.",
  },
  {
    icon: ShieldCheck,
    title: "Hardened by default",
    body: "HSTS, CSP, X-Frame-Options DENY, nosniff, and a strict referrer policy ship on every response. API routes are rate-limited. Dependencies are scanned for known vulnerabilities.",
  },
  {
    icon: Bug,
    title: "Responsible disclosure",
    body: "We publish a security.txt (RFC 9116) and welcome good-faith research. Report a vulnerability and we will acknowledge it and work with you on a fix.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--hs-steel-dark)] mb-3">
          Security &amp; Trust
        </p>
        <h1 className="text-4xl font-bold text-[var(--hs-ink)] mb-4">
          The data that matters never leaves your network.
        </h1>
        <p className="max-w-2xl text-base text-[var(--hs-ink-secondary)] leading-relaxed">
          Every cloud-based AI DLP tool sends your CUI to its servers to scan it — that transfer is
          itself a potential CUI spill under DFARS 7012. HoundShield scans everything locally.
          Nothing leaves your network. That is the foundation of our security posture, and the one
          property a cloud competitor structurally cannot copy.
        </p>

        <DeploymentBoundaryNote className="mt-8" />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-[var(--hs-border)] bg-white p-6 shadow-sm"
            >
              <Icon className="h-6 w-6 text-[var(--hs-steel)] mb-3" aria-hidden />
              <h2 className="text-base font-semibold text-[var(--hs-ink)] mb-2">{title}</h2>
              <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-4">Compliance alignment</h2>
          <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed mb-4">
            HoundShield is a control engineered to help you satisfy specific obligations. It maps to
            all 110 NIST 800-171 Rev 2 controls for SPRS scoring and is built for the following frameworks:
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {["CMMC Level 2", "NIST 800-171", "DFARS 252.204-7012", "HIPAA", "SOC 2", "ISO 27001 (mapping)"].map((f) => (
              <li
                key={f}
                className="rounded-lg border border-[var(--hs-border-subtle)] bg-[var(--hs-surface-1)] px-3 py-2 text-[var(--hs-ink-secondary)]"
              >
                {f}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-8">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-3">Report a vulnerability</h2>
          <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed mb-4">
            Found something? Email{" "}
            <a href="mailto:security@houndshield.com" className="text-brand-700 hover:text-brand-700 font-medium">
              security@houndshield.com
            </a>{" "}
            or read our machine-readable policy at{" "}
            <a href="/.well-known/security.txt" className="text-brand-700 hover:text-brand-700 font-medium">
              /.well-known/security.txt
            </a>
            . Please give us a reasonable window to remediate before public disclosure. Good-faith
            research conducted under these terms will not be pursued as a violation of our{" "}
            <Link href="/acceptable-use" className="text-brand-700 hover:text-brand-700">Acceptable Use Policy</Link>.
          </p>
          <p className="text-sm text-[var(--hs-ink-tertiary)]">
            Live service status:{" "}
            <Link href="/status" className="text-brand-700 hover:text-brand-700">houndshield.com/status</Link>
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-[var(--hs-border-subtle)] flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="text-sm text-brand-700 hover:text-brand-700">Privacy Policy &rarr;</Link>
          <Link href="/dpa" className="text-sm text-brand-700 hover:text-brand-700">Data Processing Agreement &rarr;</Link>
          <Link href="/terms" className="text-sm text-brand-700 hover:text-brand-700">Terms of Service &rarr;</Link>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
