import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Check, Minus, ShieldCheck, ThumbsUp } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { ScrollProgressBar } from "@/components/scroll-effects";
import { ModeBNotice } from "@/components/ModeBNotice";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import {
  COMPARISON_SLUGS,
  getComparison,
  type Advantage,
  type Comparison,
} from "@/lib/comparisons/competitors";

interface PageParams {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return COMPARISON_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return { title: "Comparison not found | HoundShield" };
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `https://houndshield.com/compare/${c.slug}` },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url: `https://houndshield.com/compare/${c.slug}`,
      type: "article",
    },
  };
}

/** Cell tint by who wins the row — honest, never all-green. */
function advantageStyle(advantage: Advantage, isHoundshieldColumn: boolean): string {
  const winner =
    (advantage === "houndshield" && isHoundshieldColumn) ||
    (advantage === "competitor" && !isHoundshieldColumn);
  if (winner) return "text-[var(--hs-ink)] font-semibold";
  return "text-[var(--hs-ink-secondary)]";
}

function AdvantageIcon({ advantage, isHoundshieldColumn }: { advantage: Advantage; isHoundshieldColumn: boolean }) {
  const winner =
    (advantage === "houndshield" && isHoundshieldColumn) ||
    (advantage === "competitor" && !isHoundshieldColumn);
  if (advantage === "even") {
    return <Minus className="w-4 h-4 text-[var(--hs-ink-tertiary)] shrink-0 mt-0.5" aria-hidden />;
  }
  return winner ? (
    <Check className="w-4 h-4 text-[var(--hs-success)] shrink-0 mt-0.5" aria-hidden />
  ) : (
    <Minus className="w-4 h-4 text-[var(--hs-ink-tertiary)] shrink-0 mt-0.5" aria-hidden />
  );
}

function Matrix({ c }: { c: Comparison }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--hs-border)]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[var(--hs-surface-1)]">
            <th className="text-left font-semibold text-[var(--hs-ink-tertiary)] px-4 py-3 w-[34%]">
              Dimension
            </th>
            <th className="text-left font-semibold text-[var(--hs-steel-dark)] px-4 py-3">
              HoundShield
            </th>
            <th className="text-left font-semibold text-[var(--hs-ink-secondary)] px-4 py-3">
              {c.competitorShort}
            </th>
          </tr>
        </thead>
        <tbody>
          {c.matrix.map((row, i) => (
            <tr
              key={row.dimension}
              className={i % 2 === 1 ? "bg-[var(--hs-surface-0)]" : "bg-[var(--hs-white)]"}
            >
              <td className="align-top px-4 py-3 text-[var(--hs-ink)] font-medium border-t border-[var(--hs-border-subtle)]">
                {row.dimension}
              </td>
              <td className={`align-top px-4 py-3 border-t border-[var(--hs-border-subtle)] ${advantageStyle(row.advantage, true)}`}>
                <span className="flex gap-2">
                  <AdvantageIcon advantage={row.advantage} isHoundshieldColumn />
                  <span>{row.houndshield}</span>
                </span>
              </td>
              <td className={`align-top px-4 py-3 border-t border-[var(--hs-border-subtle)] ${advantageStyle(row.advantage, false)}`}>
                <span className="flex gap-2">
                  <AdvantageIcon advantage={row.advantage} isHoundshieldColumn={false} />
                  <span>{row.competitor}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ComparisonPage({ params }: PageParams) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  const breadcrumb = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
    { name: `vs ${c.competitorShort}`, path: `/compare/${c.slug}` },
  ]);

  const faqItems = c.faqs.map((f) => ({ question: f.q, answer: f.a }));

  return (
    <div className="bg-[var(--hs-surface-0)] min-h-screen relative section-stripe">
      <ScrollProgressBar />
      <JsonLd schema={breadcrumb} />
      <NavV3 />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-16 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.15] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <nav className="text-xs text-[var(--hs-ink-tertiary)] mb-6" aria-label="Breadcrumb">
            <Link href="/compare" className="hover:text-[var(--hs-steel)]">Compare</Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--hs-ink-secondary)]">vs {c.competitorShort}</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface-1)] text-[var(--hs-ink-secondary)] text-xs font-semibold uppercase tracking-widest mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--hs-steel)]" />
            {c.category}
          </div>
          <h1 className="font-editorial text-[clamp(30px,5vw,56px)] font-bold leading-[1.07] tracking-[-1px] text-[var(--hs-ink)] mb-6">
            HoundShield vs{" "}
            <span className="italic bg-gradient-to-r from-[var(--hs-steel-dark)] via-[var(--hs-steel)] to-[var(--hs-sky)] bg-clip-text text-transparent">
              {c.competitorShort}
            </span>
          </h1>
          <p className="text-[var(--hs-ink-secondary)] text-lg leading-relaxed max-w-[720px]">
            {c.summary}
          </p>
        </div>
      </section>

      {/* ── Matrix ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-6">
        <h2 className="font-editorial text-2xl font-bold text-[var(--hs-ink)] mb-5">
          Side by side
        </h2>
        <Matrix c={c} />
        <p className="text-xs text-[var(--hs-ink-tertiary)] mt-3">
          Comparison based on publicly available information, last reviewed {c.updated}.
          Competitor facts change — tell us if anything here is out of date.
        </p>
      </section>

      {/* ── Their approach + honest strengths ────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[var(--hs-ink)] mb-3">
              How {c.competitorShort} works
            </h2>
            <p className="text-[var(--hs-ink-secondary)] leading-relaxed">{c.theirApproach}</p>
          </div>
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[var(--hs-ink)] mb-3">
              Where {c.competitorShort} is strong
            </h2>
            <ul className="space-y-2">
              {c.theirStrengths.map((s) => (
                <li key={s} className="flex gap-2 text-[var(--hs-ink-secondary)]">
                  <ThumbsUp className="w-4 h-4 text-[var(--hs-steel)] shrink-0 mt-1" aria-hidden />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── HoundShield edge ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="font-editorial text-[clamp(24px,4vw,38px)] font-bold text-[var(--hs-ink)] mb-8 text-center">
          Where HoundShield pulls ahead
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {c.ourEdge.map((e) => (
            <div
              key={e.title}
              className="rounded-xl border border-[var(--hs-border)] bg-[var(--hs-white)] p-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--hs-success-bg)] flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-[var(--hs-success)]" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--hs-ink)] mb-1.5">{e.title}</h3>
                  <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">{e.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Honest verdict ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-white)] p-8">
          <p className="text-sm text-[var(--hs-ink-secondary)] mb-6">
            <span className="font-semibold text-[var(--hs-ink)]">Who this matters most for: </span>
            {c.buyerFit}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-[var(--hs-ink)] mb-3">
                Choose {c.competitorShort} when
              </h3>
              <ul className="space-y-2">
                {c.chooseThemWhen.map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-[var(--hs-ink-secondary)]">
                    <Minus className="w-4 h-4 text-[var(--hs-ink-tertiary)] shrink-0 mt-0.5" aria-hidden />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--hs-ink)] mb-3">Choose HoundShield when</h3>
              <ul className="space-y-2">
                {c.chooseUsWhen.map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-[var(--hs-ink)]">
                    <Check className="w-4 h-4 text-[var(--hs-success)] shrink-0 mt-0.5" aria-hidden />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deployment honesty ───────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-6">
        <ModeBNotice variant="full" />
      </section>

      {/* ── FAQ (renders FAQPage JSON-LD) ────────────────── */}
      <FaqSection items={faqItems} eyebrow={`HoundShield vs ${c.competitorShort}`} />

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-[var(--hs-border-strong)] bg-[var(--hs-surface-1)] p-10 text-center">
          <h2 className="font-editorial text-[clamp(24px,4vw,36px)] font-bold text-[var(--hs-ink)] mb-3">
            Prove it on your own traffic
          </h2>
          <p className="text-[var(--hs-ink-secondary)] max-w-[540px] mx-auto mb-8">
            Run HoundShield locally for 14 days and get a $499 CMMC AI Risk Assessment PDF —
            no prompt content ever leaves your network.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--hs-steel-dark)] text-[var(--hs-white)] font-semibold transition-colors hover:bg-[var(--hs-navy)]"
            >
              Get the $499 assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--hs-border-strong)] text-[var(--hs-ink)] font-semibold transition-colors hover:bg-[var(--hs-surface-2)]"
            >
              All comparisons
            </Link>
          </div>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
