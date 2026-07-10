import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { CONTROL_FAMILIES } from "@/lib/shieldready/controls/families";
import { getControlsByFamily } from "@/lib/shieldready/controls";
import { controlSlug, aiRelevance } from "./_meta";

const TITLE = "All 110 NIST 800-171 Rev 2 Controls, Explained | HoundShield";
const DESCRIPTION =
  "Every NIST 800-171 Rev 2 control in plain English — official text, SPRS deduction, remediation steps, assessor evidence, and whether AI prompt monitoring helps. Free reference for CMMC Level 2.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://houndshield.com/controls" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://houndshield.com/controls",
    type: "website",
  },
};

export default function ControlsIndexPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)]">
      <NavV3 />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--hs-steel-dark)] font-[var(--font-mono)]">
          Reference · NIST 800-171 Rev 2 / CMMC Level 2
        </p>
        <h1 className="mt-4 font-[var(--font-display)] text-3xl md:text-4xl font-semibold leading-tight text-[var(--hs-ink)]">
          All 110 NIST 800-171 controls, explained
        </h1>
        <p className="answer-lead mt-6 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-6 text-lg leading-relaxed text-[var(--hs-ink)]">
          CMMC Level 2 maps to all 110 security requirements in NIST SP 800-171 Rev 2, organized into
          14 families. Each control page below gives the official requirement, a plain-English
          explanation, the SPRS deduction if unmet, step-by-step remediation, the evidence a C3PAO
          assessor asks for — and an honest verdict on whether AI prompt monitoring helps with it.
        </p>

        {CONTROL_FAMILIES.map((family) => {
          const controls = getControlsByFamily(family.code);
          return (
            <section key={family.code} className="mt-12">
              <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
                {family.code} — {family.name}
                <span className="ml-2 text-sm font-normal text-[var(--hs-ink-tertiary)]">
                  {controls.length} controls
                </span>
              </h2>
              <p className="mt-1 text-sm text-[var(--hs-ink-secondary)]">{family.description}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {controls.map((c) => (
                  <Link
                    key={c.id}
                    href={`/controls/${controlSlug(c.id)}`}
                    className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-4 transition hover:border-[var(--hs-steel)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--hs-steel-dark)] font-[var(--font-mono)]">
                        {c.id}
                      </span>
                      {aiRelevance(c.id) !== "none" && (
                        <span className="rounded-full bg-[rgba(5,150,105,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[var(--hs-success)]">
                          AI-relevant
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[var(--hs-ink)]">{c.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <div className="mt-14 rounded-3xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-8 text-center">
          <h2 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--hs-ink)]">
            Turn this list into your SPRS score
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[var(--hs-ink-secondary)]">
            The free ShieldReady assessment walks all 110 controls and computes your score as you go.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--hs-steel-dark)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--hs-steel)]"
            >
              Start the free assessment <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
