import type { Metadata } from "next";
import Link from "next/link";
import { Percent, Timer, ShieldCheck, HandshakeIcon } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { PartnerApplyForm } from "./PartnerApplyForm";

const TITLE = "Apply to the HoundShield Partner Program — RPO / MSP Co-Sell | HoundShield";
const DESCRIPTION =
  "Apply to co-brand and resell the $499 CMMC AI Risk Assessment. $299 wholesale, you set the retail, no exclusivity. For RPOs, MSPs, MSSPs & compliance consultancies.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://houndshield.com/partners/apply" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://houndshield.com/partners/apply",
    type: "website",
  },
};

const PROOF = [
  { icon: Percent, stat: "$299", label: "wholesale per report — you set the retail" },
  { icon: Timer, stat: "14 days", label: "from deployment to a signed PDF in the client’s hands" },
  { icon: HandshakeIcon, stat: "No exclusivity", label: "keep your clients, your brand, your margin" },
  { icon: ShieldCheck, stat: "Local-only", label: "client CUI never leaves their network — referring us is safe" },
];

export default function PartnerApplyPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)]">
      <NavV3 />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24">
        <p className="font-[var(--font-mono)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--hs-steel-dark)]">
          Partner Program · RPOs, MSPs &amp; Compliance Consultancies
        </p>
        <h1 className="mt-4 font-[var(--font-display)] text-3xl font-semibold leading-tight text-[var(--hs-ink)] md:text-4xl">
          Add an AI-risk deliverable to your compliance practice
        </h1>
        <p className="answer-lead mt-6 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-6 text-lg leading-relaxed text-[var(--hs-ink)]">
          Your clients&rsquo; employees are pasting sensitive data into ChatGPT today, and their next
          CMMC assessment will ask about it. Co-brand the 14-day, locally run AI risk assessment and
          hand them a signed PDF mapped to NIST 800-171 — under your brand, at $299 wholesale.
          Apply below and we&rsquo;ll send the kit, the wholesale agreement, and a sample report the
          same week.
        </p>

        {/* Proof strip */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {PROOF.map((p) => (
            <div key={p.label} className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-5">
              <p.icon className="h-5 w-5 text-[var(--hs-steel-dark)]" />
              <p className="mt-2 text-xl font-bold text-[var(--hs-ink)]">{p.stat}</p>
              <p className="text-sm text-[var(--hs-ink-secondary)]">{p.label}</p>
            </div>
          ))}
        </div>

        {/* The application form */}
        <div className="mt-10">
          <PartnerApplyForm />
        </div>

        {/* What happens next */}
        <section className="mt-10 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-6">
          <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--hs-ink)]">
            What happens after you apply
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-[var(--hs-ink-secondary)]">
            <li><strong className="text-[var(--hs-ink)]">1.</strong> You get an instant confirmation email acknowledging your application.</li>
            <li><strong className="text-[var(--hs-ink)]">2.</strong> We review fit and reach out within two business days to talk commercials.</li>
            <li><strong className="text-[var(--hs-ink)]">3.</strong> You receive the co-branded report kit, the wholesale referral agreement, and a sample report.</li>
          </ol>
          <p className="mt-4 text-sm text-[var(--hs-ink-secondary)]">
            Want the full details first?{" "}
            <Link href="/partners/kit" className="font-semibold text-[var(--hs-steel-dark)] hover:underline">
              Read the complete partner kit
            </Link>{" "}
            or{" "}
            <Link href="/partners" className="font-semibold text-[var(--hs-steel-dark)] hover:underline">
              review the program overview
            </Link>
            .
          </p>
        </section>
      </main>
      <FooterV3 />
    </div>
  );
}
