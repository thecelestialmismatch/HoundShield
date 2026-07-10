import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import type { NISTControl } from "@/lib/shieldready/types";
import {
  CONTROL_SLUGS,
  getControlBySlug,
  controlSlug,
  relatedControls,
  aiRelevance,
  aiRelevanceCopy,
  controlMetaTitle,
  controlMetaDescription,
} from "../_meta";

export function generateStaticParams() {
  return CONTROL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const control = getControlBySlug(slug);
  if (!control) return { title: "NIST 800-171 Controls | HoundShield" };
  const url = `https://houndshield.com/controls/${slug}`;
  const title = controlMetaTitle(control);
  const description = controlMetaDescription(control);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

function faqJsonLd(control: NISTControl) {
  const ai = aiRelevanceCopy(control);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What does ${control.id} require?`,
        acceptedAnswer: { "@type": "Answer", text: control.officialDescription },
      },
      {
        "@type": "Question",
        name: `How do I assess ${control.id}?`,
        acceptedAnswer: { "@type": "Answer", text: control.assessmentQuestion },
      },
      {
        "@type": "Question",
        name: `Does AI prompt monitoring help with ${control.id}?`,
        acceptedAnswer: { "@type": "Answer", text: ai.body },
      },
    ],
  };
}

function articleJsonLd(control: NISTControl, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${control.id} — ${control.title}`,
    description: controlMetaDescription(control),
    author: { "@type": "Organization", name: "HoundShield" },
    publisher: { "@type": "Organization", name: "HoundShield" },
    mainEntityOfPage: `https://houndshield.com/controls/${slug}`,
  };
}

function breadcrumbJsonLd(control: NISTControl, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "NIST 800-171 Controls", item: "https://houndshield.com/controls" },
      { "@type": "ListItem", position: 2, name: control.id, item: `https://houndshield.com/controls/${slug}` },
    ],
  };
}

const RISK_STYLES: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-600 border-red-500/20",
  High: "bg-[rgba(194,120,3,0.1)] text-[#a16207] border-[rgba(194,120,3,0.25)]",
  Medium: "bg-[rgba(129,166,198,0.15)] text-[var(--hs-steel-dark)] border-[rgba(129,166,198,0.3)]",
  Low: "bg-[rgba(5,150,105,0.1)] text-[var(--hs-success)] border-[rgba(5,150,105,0.2)]",
};

export default async function ControlPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const control = getControlBySlug(slug);
  if (!control) notFound();

  const ai = aiRelevanceCopy(control);
  const verdict = aiRelevance(control.id);
  const related = relatedControls(control);

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)]">
      <NavV3 />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(control)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(control, slug)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(control, slug)) }}
      />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--hs-steel-dark)] font-[var(--font-mono)]">
          <Link href="/controls" className="hover:underline">
            NIST 800-171 Controls
          </Link>{" "}
          · {control.familyName}
        </p>
        <h1 className="mt-4 font-[var(--font-display)] text-3xl md:text-4xl font-semibold leading-tight text-[var(--hs-ink)]">
          {control.id} — {control.title}
        </h1>

        {/* Facts row */}
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-[var(--hs-border)] bg-[var(--hs-surface-1)] px-3 py-1.5 text-[var(--hs-ink-secondary)]">
            CMMC Level {control.cmmcLevel}
          </span>
          <span className="rounded-full border border-[var(--hs-border)] bg-[var(--hs-surface-1)] px-3 py-1.5 text-[var(--hs-ink-secondary)]">
            SPRS if unmet: {control.sprsDeduction}
          </span>
          <span
            className={`rounded-full border px-3 py-1.5 ${RISK_STYLES[control.riskPriority] ?? RISK_STYLES.Medium}`}
          >
            {control.riskPriority} priority
          </span>
          <span className="rounded-full border border-[var(--hs-border)] bg-[var(--hs-surface-1)] px-3 py-1.5 text-[var(--hs-ink-secondary)]">
            ~{control.estimatedHours}h to implement
          </span>
        </div>

        {/* Official requirement — answer-first, quotable */}
        <p className="answer-lead mt-6 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-6 text-lg leading-relaxed text-[var(--hs-ink)]">
          {control.officialDescription}
        </p>

        <section className="mt-10">
          <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
            What {control.id} means in plain English
          </h2>
          <p className="mt-3 text-[var(--hs-ink-secondary)] leading-relaxed">{control.plainEnglish}</p>
        </section>

        <section className="mt-10">
          <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
            The assessment question
          </h2>
          <p className="mt-3 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-5 text-[var(--hs-ink-secondary)] leading-relaxed italic">
            “{control.assessmentQuestion}”
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
            How to implement {control.id}
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[var(--hs-ink-secondary)] leading-relaxed">
            {control.remediationSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
            Evidence your assessor will ask for
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--hs-ink-secondary)] leading-relaxed">
            {control.evidenceRequired.map((ev, i) => (
              <li key={i}>{ev}</li>
            ))}
          </ul>
        </section>

        {/* Honest AI relevance */}
        <section
          className={`mt-10 rounded-2xl border p-6 ${
            verdict === "direct"
              ? "border-[rgba(5,150,105,0.25)] bg-[rgba(5,150,105,0.05)]"
              : "border-[var(--hs-border)] bg-[var(--hs-surface-1)]"
          }`}
        >
          <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--hs-ink)]">
            {ai.heading}
          </h2>
          <p className="mt-3 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{ai.body}</p>
          <p className="mt-3 text-sm">
            <Link
              href="/blog/nist-800-171-controls-that-map-to-ai-prompt-monitoring"
              className="font-semibold text-[var(--hs-steel-dark)] hover:underline"
            >
              Full mapping: which 800-171 controls AI prompt monitoring evidences →
            </Link>
          </p>
        </section>

        {/* Related controls */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
              More {control.familyName} controls
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/controls/${controlSlug(r.id)}`}
                  className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-4 transition hover:border-[var(--hs-steel)]"
                >
                  <span className="text-xs font-semibold text-[var(--hs-steel-dark)] font-[var(--font-mono)]">
                    {r.id}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-[var(--hs-ink)]">{r.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-3xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-8 text-center">
          <h2 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--hs-ink)]">
            Score yourself against all 110 controls
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[var(--hs-ink-secondary)]">
            The free ShieldReady assessment walks every NIST 800-171 requirement, computes your SPRS
            score, and shows exactly which gaps cost the most points.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--hs-steel-dark)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--hs-steel)]"
            >
              Start the free assessment <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--hs-border)] px-6 py-3 text-sm font-semibold text-[var(--hs-ink)] transition hover:border-[var(--hs-steel)]"
            >
              $499 AI risk assessment
            </Link>
          </div>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
