import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { ANSWERS, getAnswer, type Answer } from "../_answers";

export function generateStaticParams() {
  return ANSWERS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getAnswer(slug);
  if (!data) return { title: "Answers | HoundShield" };
  const url = `https://houndshield.com/answers/${data.slug}`;
  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url,
      type: "article",
    },
  };
}

function faqJsonLd(data: Answer) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function articleJsonLd(data: Answer) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.h1,
    description: data.metaDescription,
    author: { "@type": "Organization", name: "HoundShield" },
    publisher: { "@type": "Organization", name: "HoundShield" },
    mainEntityOfPage: `https://houndshield.com/answers/${data.slug}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".answer-lead", "h1"],
    },
  };
}

export default async function AnswerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getAnswer(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)]">
      <NavV3 />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(data)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(data)) }}
      />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--hs-steel-dark)] font-[var(--font-mono)]">
          Answers · CMMC &amp; AI compliance
        </p>
        <h1 className="mt-4 font-[var(--font-display)] text-3xl md:text-4xl font-semibold leading-tight text-[var(--hs-ink)]">
          {data.h1}
        </h1>

        {/* Answer-first lede — quotable by snippets / AI assistants */}
        <p className="answer-lead mt-6 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-6 text-lg leading-relaxed text-[var(--hs-ink)]">
          {data.lede}
        </p>

        {data.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
              {section.heading}
            </h2>
            {section.paragraphs?.map((p, i) => (
              <p key={i} className="mt-3 text-[var(--hs-ink-secondary)] leading-relaxed">
                {p}
              </p>
            ))}
            {section.ordered && (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[var(--hs-ink-secondary)] leading-relaxed">
                {section.ordered.map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ol>
            )}
            {section.table && (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--hs-border)]">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[var(--hs-surface-1)] text-[var(--hs-ink-tertiary)]">
                      {section.table.headers.map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-[var(--hs-border)]">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={
                              ci === 0
                                ? "px-4 py-3 font-semibold text-[var(--hs-ink)]"
                                : "px-4 py-3 text-[var(--hs-ink-secondary)]"
                            }
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        {/* FAQ */}
        <h2 className="mt-12 font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
          Frequently asked questions
        </h2>
        <div className="mt-5 space-y-3">
          {data.faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-[var(--hs-ink)]">
                {f.q}
                <span className="text-[var(--hs-steel-dark)] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-8 text-center">
          <h2 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--hs-ink)]">
            Use AI without leaking CUI
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[var(--hs-ink-secondary)]">
            HoundShield scans every AI prompt locally and blocks CUI before it leaves your network.
            One URL change. Under 10 minutes. C3PAO-ready.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--hs-steel-dark)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--hs-steel)]"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/products/defense"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--hs-border)] px-6 py-3 text-sm font-semibold text-[var(--hs-ink)] transition hover:border-[var(--hs-steel)]"
            >
              Defense overview
            </Link>
          </div>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
