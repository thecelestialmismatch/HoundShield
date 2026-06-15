import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Eye, Users, Zap, Plug, ShieldCheck, FileText } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import {
  INDUSTRIES,
  getIndustry,
  type ControlStatus,
  type Industry,
} from "../_industries";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ industry: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const { industry } = await params;
  const data = getIndustry(industry);
  if (!data) return { title: "Product | HoundShield" };
  const url = `https://houndshield.com/products/${data.slug}`;
  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url,
      type: "website",
    },
  };
}

const STATUS_STYLE: Record<ControlStatus, string> = {
  Enforced: "text-[var(--hs-success)] bg-[var(--hs-success-bg)] border-[var(--hs-success)]/30",
  Live: "text-[var(--hs-success)] bg-[var(--hs-success-bg)] border-[var(--hs-success)]/30",
  Logged: "text-[var(--hs-steel-dark)] bg-[var(--hs-mist-md)] border-[var(--hs-border)]",
  Alerted: "text-[var(--hs-warn)] bg-[var(--hs-warn-bg)] border-[var(--hs-warn)]/30",
  Roadmap: "text-[var(--hs-ink-tertiary)] bg-[var(--hs-surface-1)] border-[var(--hs-border)]",
};

const STEP_ICONS = [Plug, ShieldCheck, FileText];

function faqJsonLd(data: Industry) {
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

function speakableJsonLd(data: Industry) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.metaTitle,
    url: `https://houndshield.com/products/${data.slug}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".answer-lead", "h1"],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  const data = getIndustry(industry);
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd(data)) }}
      />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Hero */}
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[var(--hs-steel-dark)] font-[var(--font-mono)]">
          {data.eyebrow}
          {data.comingSoon && (
            <span className="rounded-full bg-[var(--hs-surface-2)] px-2 py-0.5 text-[10px] text-[var(--hs-ink-secondary)]">
              Public-sector edition · roadmap
            </span>
          )}
        </p>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl font-semibold leading-tight text-[var(--hs-ink)]">
          {data.h1}
        </h1>
        <p className="answer-lead mt-5 max-w-3xl text-lg text-[var(--hs-ink-secondary)] leading-relaxed">
          {data.sub}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={data.primaryCtaHref}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--hs-steel-dark)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--hs-steel)]"
          >
            {data.comingSoon ? "Join the waitlist" : "Start free"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--hs-border)] px-5 py-3 text-sm font-semibold text-[var(--hs-ink)] transition hover:border-[var(--hs-steel)]"
          >
            See pricing
          </Link>
        </div>

        {/* What / Who / How */}
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {[
            { icon: Eye, h: "What it is", b: data.whatItIs },
            { icon: Users, h: "Who it's for", b: data.whoFor },
            { icon: Zap, h: "How you use it", b: data.howUse },
          ].map(({ icon: Icon, h, b }) => (
            <div
              key={h}
              className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-[var(--hs-ink)]">{h}</h3>
              <p className="mt-2 text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{b}</p>
            </div>
          ))}
        </div>

        {/* Detects */}
        <h2 className="mt-20 font-[var(--font-display)] text-2xl font-semibold text-[var(--hs-ink)]">
          What it detects for you
        </h2>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {data.detects.map((d) => (
            <span
              key={d}
              className="rounded-lg border border-[var(--hs-border)] bg-[var(--hs-surface-1)] px-3.5 py-2 text-sm font-medium text-[var(--hs-ink-secondary)] font-[var(--font-mono)]"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Steps */}
        <h2 className="mt-20 font-[var(--font-display)] text-2xl font-semibold text-[var(--hs-ink)]">
          How it works
        </h2>
        <ol className="mt-6 space-y-4">
          {data.steps.map((s, i) => {
            const Icon = STEP_ICONS[i] ?? Plug;
            return (
              <li
                key={s.title}
                className="flex items-start gap-4 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-5"
              >
                <span className="font-[var(--font-mono)] text-sm font-bold text-[var(--hs-steel-dark)]">
                  0{i + 1}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-[var(--hs-ink)]">{s.title}</h3>
                  <p className="mt-1 text-sm text-[var(--hs-ink-secondary)]">{s.body}</p>
                </div>
                <Icon className="mt-1 h-5 w-5 text-[var(--hs-ink-tertiary)]" />
              </li>
            );
          })}
        </ol>

        {/* Framework mapping table */}
        <h2 className="mt-20 font-[var(--font-display)] text-2xl font-semibold text-[var(--hs-ink)]">
          {data.frameworkTitle}
        </h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--hs-border)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[var(--hs-surface-1)] text-[var(--hs-ink-tertiary)]">
                <th className="px-5 py-3 font-semibold">Control / requirement</th>
                <th className="px-5 py-3 font-semibold">How HoundShield maps to it</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.framework.map((row) => (
                <tr key={row.control} className="border-t border-[var(--hs-border)]">
                  <td className="px-5 py-4 font-semibold text-[var(--hs-ink)]">{row.control}</td>
                  <td className="px-5 py-4 text-[var(--hs-ink-secondary)]">{row.detail}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-md border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <h2 className="mt-20 font-[var(--font-display)] text-2xl font-semibold text-[var(--hs-ink)]">
          Common questions
        </h2>
        <div className="mt-6 space-y-3">
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

        {/* CTA band */}
        <div className="mt-20 rounded-3xl border border-[var(--hs-border)] bg-[var(--hs-surface-2)] p-10 text-center">
          <h2 className="font-[var(--font-display)] text-2xl md:text-3xl font-semibold text-[var(--hs-ink)]">
            {data.cta.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--hs-ink-secondary)]">{data.cta.body}</p>
          <Link
            href={data.cta.href}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--hs-steel-dark)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--hs-steel)]"
          >
            {data.cta.button}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
