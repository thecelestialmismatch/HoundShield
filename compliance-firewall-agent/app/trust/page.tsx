import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import Link from "next/link";
import type { Metadata } from "next";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { ModeBNotice } from "@/components/ModeBNotice";
import { ShieldCheck, FileCheck2, Server, Clock3, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Trust Center | HoundShield",
  description:
    "HoundShield's Trust Center: compliance posture, framework alignment (CMMC L2, NIST 800-171, HIPAA), SOC 2 roadmap, subprocessors, and data handling. Honest about what's certified vs in progress.",
  alternates: { canonical: "https://houndshield.com/trust" },
};

// Honest status — NEVER claim a certification we don't hold.
type FrameworkStatus = "Built for" | "In progress" | "Planned";
const FRAMEWORKS: { name: string; status: FrameworkStatus; note: string }[] = [
  { name: "CMMC Level 2 / NIST 800-171 Rev 2", status: "Built for", note: "All 110 controls mapped for SPRS scoring; the product is engineered as a control for SC.3.177, AU.2.041, AC.L2-3.1.x." },
  { name: "HIPAA", status: "Built for", note: "Local PHI detection + audit trail. A BAA applies only to self-hosted (Mode B) deployments; the hosted trial is for non-PHI evaluation." },
  { name: "DFARS 252.204-7012", status: "Built for", note: "Local-only scanning keeps CUI inside the boundary — the asymmetric advantage over cloud DLP." },
  { name: "SOC 2 Type I", status: "In progress", note: "Audit planned via Vanta/Drata. We do NOT claim a SOC 2 report today — this page will link the attestation the moment it exists." },
  { name: "ISO 27001", status: "Planned", note: "Control mapping maintained; formal certification is a later-stage roadmap item." },
];

const STATUS_STYLE: Record<FrameworkStatus, string> = {
  "Built for": "bg-[var(--hs-surface-1)] text-[var(--hs-ink-secondary)] border-[var(--hs-border)]",
  "In progress": "bg-[var(--hs-surface-1)] text-[var(--hs-steel-dark)] border-[var(--hs-border)]",
  Planned: "bg-[var(--hs-surface-1)] text-[var(--hs-ink-tertiary)] border-[var(--hs-border-subtle)]",
};

const SUBPROCESSORS = [
  { name: "Supabase", purpose: "Authentication & metadata database (US region)" },
  { name: "Vercel", purpose: "Marketing/dashboard hosting & edge network" },
  { name: "Stripe", purpose: "Payment processing" },
  { name: "Resend", purpose: "Transactional email" },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--hs-steel-dark)] mb-3">
          Trust Center
        </p>
        <h1 className="text-4xl font-bold text-[var(--hs-ink)] mb-4">
          Everything an assessor — or a buyer's security team — asks for, in one place.
        </h1>
        <p className="max-w-2xl text-base text-[var(--hs-ink-secondary)] leading-relaxed">
          We are deliberate about the difference between what HoundShield is <em>built for</em> and what
          it is formally <em>certified</em> against. Below is the honest version: framework alignment,
          our SOC 2 roadmap, who processes data on our behalf, and how to reach our security team.
        </p>

        {/* Quick links */}
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            { href: "/security", label: "Security & how it works" },
            { href: "/dpa", label: "Data Processing Agreement" },
            { href: "/status", label: "Live system status" },
            { href: "/.well-known/security.txt", label: "security.txt" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--hs-border)] px-4 py-2 text-sm font-medium text-[var(--hs-ink-secondary)] transition-colors hover:bg-[var(--hs-surface-1)]"
            >
              {l.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ))}
        </div>

        {/* Framework alignment */}
        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[var(--hs-ink)] mb-5">
            <FileCheck2 className="h-6 w-6 text-[var(--hs-steel)]" aria-hidden /> Framework alignment
          </h2>
          <ul className="space-y-3">
            {FRAMEWORKS.map((f) => (
              <li key={f.name} className="rounded-2xl border border-[var(--hs-border)] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <h3 className="text-base font-semibold text-[var(--hs-ink)]">{f.name}</h3>
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${STATUS_STYLE[f.status]}`}>
                    {f.status}
                  </span>
                </div>
                <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{f.note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-sm text-[var(--hs-ink-tertiary)]">
            <Clock3 className="h-4 w-4" aria-hidden />
            &ldquo;Built for&rdquo; means engineered to satisfy the controls; it is not a third-party
            attestation. We will never publish a certification we do not hold.
          </p>
        </section>

        {/* Deployment / data boundary */}
        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[var(--hs-ink)] mb-5">
            <Server className="h-6 w-6 text-[var(--hs-steel)]" aria-hidden /> Where your data lives
          </h2>
          <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed mb-5 max-w-2xl">
            For regulated workloads, run Mode B — the proxy in your own infrastructure, where prompt
            content never crosses your boundary. The hosted trial is for non-CUI/non-PHI evaluation only.
          </p>
          <ModeBNotice variant="full" />
        </section>

        {/* Subprocessors */}
        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[var(--hs-ink)] mb-5">
            <ShieldCheck className="h-6 w-6 text-[var(--hs-steel)]" aria-hidden /> Subprocessors
          </h2>
          <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed mb-4 max-w-2xl">
            These vendors process control-plane data (account, billing, metadata) on our behalf. They
            never receive your prompt content, which is scanned locally in Mode B. Full terms are in the{" "}
            <Link href="/dpa" className="text-brand-700 hover:text-brand-700">DPA</Link>.
          </p>
          <ul className="divide-y divide-[var(--hs-border-subtle)] rounded-2xl border border-[var(--hs-border)] bg-white">
            {SUBPROCESSORS.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <span className="text-sm font-medium text-[var(--hs-ink)]">{s.name}</span>
                <span className="text-sm text-[var(--hs-ink-tertiary)] text-right">{s.purpose}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-8">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-3">Security questions or a vendor review?</h2>
          <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
            Email{" "}
            <a href="mailto:security@houndshield.com" className="text-brand-700 hover:text-brand-700 font-medium">
              security@houndshield.com
            </a>{" "}
            for our security questionnaire responses, or{" "}
            <a href="mailto:legal@houndshield.com" className="text-brand-700 hover:text-brand-700 font-medium">
              legal@houndshield.com
            </a>{" "}
            for a countersigned DPA. Want to see the evidence the product produces?{" "}
            <a href="/api/reports/sample" className="text-brand-700 hover:text-brand-700 font-medium">
              Download a sample report (PDF)
            </a>.
          </p>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
