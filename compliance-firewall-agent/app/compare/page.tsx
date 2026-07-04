import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, CloudOff, FileText, Server, Radar } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { ScrollProgressBar } from "@/components/scroll-effects";
import { ModeBNotice } from "@/components/ModeBNotice";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { COMPARISONS, CORE_MOAT } from "@/lib/comparisons/competitors";

export const metadata: Metadata = {
  title: "HoundShield vs Nightfall, Prompt Security, Purview & Polymer | AI DLP Compared",
  description:
    "Honest comparisons of HoundShield against the AI DLP field. Every cloud tool routes your prompts to its servers to scan them; HoundShield scans locally (Mode B) so CUI/PHI never leaves your network, with a $499 NIST 800-171 evidence PDF.",
  alternates: { canonical: "https://houndshield.com/compare" },
  openGraph: {
    title: "HoundShield vs the cloud-routed AI DLP field",
    description:
      "Local scanning vs cloud-routed inspection. See how HoundShield compares to Nightfall, Prompt Security, Microsoft Purview + GCC High, and Polymer.",
    url: "https://houndshield.com/compare",
    type: "website",
  },
};

const WHY_LOCAL = [
  {
    icon: CloudOff,
    title: "Nothing leaves your network",
    body: "The scanner runs inside your boundary (Mode B). Prompt content — CUI, PHI, PII — is inspected on-premise and never transmitted to a vendor cloud.",
  },
  {
    icon: FileText,
    title: "Evidence, not just alerts",
    body: "A $499 one-time CMMC AI Risk Assessment PDF mapped to NIST 800-171 Rev 2 — the artifact a C3PAO accepts. Dashboards don't pass assessments.",
  },
  {
    icon: Radar,
    title: "Any AI tool, one proxy",
    body: "A single OpenAI-compatible proxy covers ChatGPT, Copilot, Claude and any endpoint — not a per-app browser plugin locked to one vendor.",
  },
  {
    icon: Server,
    title: "Air-gapped when you need it",
    body: "Mode C runs fully offline for IL-5+ and isolated networks — a place cloud-native DLP simply cannot go.",
  },
];

export default function CompareHubPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
  ]);

  return (
    <div className="bg-[var(--hs-surface-0)] min-h-screen relative section-stripe">
      <ScrollProgressBar />
      <JsonLd schema={breadcrumb} />
      <NavV3 />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-16 pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.15] pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface-1)] text-[var(--hs-ink-secondary)] text-xs font-semibold uppercase tracking-widest mb-8">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--hs-steel)]" />
            AI DLP Comparison · Local vs Cloud-Routed
          </div>
          <h1 className="font-editorial text-[clamp(34px,5.5vw,64px)] font-bold leading-[1.06] tracking-[-1px] text-[var(--hs-ink)] max-w-[900px] mx-auto mb-6">
            HoundShield vs the{" "}
            <span className="italic bg-gradient-to-r from-[var(--hs-steel-dark)] via-[var(--hs-steel)] to-[var(--hs-sky)] bg-clip-text text-transparent">
              cloud-routed field
            </span>
          </h1>
          <p className="text-[var(--hs-ink-secondary)] text-lg leading-relaxed max-w-[720px] mx-auto">
            {CORE_MOAT}
          </p>
        </div>
      </section>

      {/* ── Comparison cards ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group block rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-white)] p-6 shadow-sm transition-all hover:border-[var(--hs-border-strong)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--hs-ink-tertiary)]">
                  {c.category}
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--hs-steel)] transition-transform group-hover:translate-x-1" />
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[var(--hs-ink)] mb-2">
                HoundShield vs {c.competitorShort}
              </h2>
              <p className="text-[var(--hs-ink-secondary)] text-sm leading-relaxed">
                {c.summary}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--hs-steel-dark)]">
                See the full comparison
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why local wins ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-editorial text-[clamp(26px,4vw,40px)] font-bold tracking-tight text-[var(--hs-ink)] text-center mb-10">
          Why local scanning wins for regulated data
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_LOCAL.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[var(--hs-border)] bg-[var(--hs-white)] p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--hs-surface-1)] flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[var(--hs-steel)]" />
              </div>
              <h3 className="font-semibold text-[var(--hs-ink)] mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Deployment-mode honesty ──────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <ModeBNotice variant="full" />
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-[var(--hs-border-strong)] bg-[var(--hs-surface-1)] p-10 text-center">
          <h2 className="font-editorial text-[clamp(24px,4vw,38px)] font-bold text-[var(--hs-ink)] mb-3">
            See it on your own AI traffic
          </h2>
          <p className="text-[var(--hs-ink-secondary)] max-w-[560px] mx-auto mb-8">
            Run the proxy for 14 days in your environment and get a $499 CMMC AI Risk
            Assessment PDF mapped to NIST 800-171 — locally scanned, nothing leaving your network.
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
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--hs-border-strong)] text-[var(--hs-ink)] font-semibold transition-colors hover:bg-[var(--hs-surface-2)]"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <FooterV3 />
    </div>
  );
}
