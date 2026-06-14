import type { Metadata } from 'next'
import Link from 'next/link'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { Brain, ShieldCheck, GaugeCircle, FileCheck2 } from 'lucide-react'
import { FaqSection } from '@/components/seo/FaqSection'
import { JsonLd } from '@/components/seo/JsonLd'
import { brainAiFaqs } from '@/lib/seo/faqs'
import { breadcrumbSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: 'Brain AI — Autonomous Compliance Copilot',
  description:
    'Brain AI is HoundShield’s built-in compliance copilot. It scores all 110 NIST 800-171 controls, explains your SPRS score, drafts remediation, and assembles C3PAO-ready evidence — all inside your local-only boundary, safe for CUI.',
  alternates: { canonical: '/brain-ai' },
}

const CAPABILITIES = [
  {
    icon: GaugeCircle,
    title: 'Always-on SPRS scoring',
    body: 'Brain AI continuously scores your environment against all 110 NIST 800-171 Rev 2 controls, tracks which are met or missing, and shows your SPRS number trending toward the threshold you need to file.',
  },
  {
    icon: FileCheck2,
    title: 'Drafts your evidence',
    body: 'It turns raw scan results into remediation steps and assembles C3PAO-ready PDF evidence. The repetitive assessment and documentation work happens automatically so your team closes real gaps instead of formatting reports.',
  },
  {
    icon: ShieldCheck,
    title: 'Local-only, CUI-safe',
    body: 'Brain AI reasons inside HoundShield’s control boundary. In self-hosted and air-gapped modes nothing leaves your network — so it stays usable for the CUI workloads that cloud assistants legally cannot touch.',
  },
]

const PILLARS = [
  { stat: '110', label: 'NIST 800-171 controls tracked' },
  { stat: '<10ms', label: 'per-prompt risk scan' },
  { stat: '0', label: 'prompts that leave your network' },
]

export default function BrainAiPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--hs-border)] bg-[var(--hs-mist)] text-[var(--hs-steel-dark)] mb-5">
            <Brain className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-widest uppercase">Brain AI</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--hs-ink)] tracking-tight mb-5">
            The compliance work that<br />runs while you sleep.
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] max-w-2xl mx-auto leading-relaxed">
            Brain AI is the autonomous compliance copilot inside HoundShield. It scores
            your controls, explains your SPRS gaps, drafts remediation, and builds your
            audit evidence &mdash; continuously, and entirely inside your own network.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary">
              Start free
            </Link>
            <Link href="/how-it-works" className="btn-ghost px-6 py-3">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-6 pb-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <div
              key={p.label}
              className="text-center border border-[var(--hs-border-subtle)] rounded-2xl p-6 bg-[var(--hs-surface-1)]"
            >
              <div className="text-3xl font-black text-[var(--hs-steel-dark)] font-mono leading-none mb-2">
                {p.stat}
              </div>
              <div className="text-sm text-[var(--hs-ink-secondary)]">{p.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon
            return (
              <div
                key={cap.title}
                className="flex gap-6 items-start border border-[var(--hs-border-subtle)] rounded-2xl p-8 bg-[var(--hs-surface-1)]"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--hs-mist)] border border-[var(--hs-border)] flex items-center justify-center text-[var(--hs-steel-dark)]">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--hs-ink)] mb-2">{cap.title}</h2>
                  <p className="text-[var(--hs-ink-secondary)] leading-relaxed">{cap.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Keyless note */}
      <section className="px-6 pb-8">
        <div className="max-w-3xl mx-auto border border-[var(--hs-border)] bg-[var(--hs-mist)] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[var(--hs-ink)] mb-2">
            Works even with no API key
          </h2>
          <p className="text-[var(--hs-ink-secondary)] leading-relaxed">
            Brain AI ships with a local compliance knowledge layer, so the core CMMC,
            HIPAA, and product answers respond instantly even when no external model is
            configured or reachable. Add a provider key for deeper reasoning &mdash; the
            essentials never depend on the cloud being up.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto border border-[var(--hs-border)] bg-[var(--hs-surface-1)] rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-4">
            Let Brain AI run your assessment
          </h2>
          <p className="text-[var(--hs-ink-secondary)] mb-8">
            No credit card required. See your SPRS score across all 110 controls in under
            30 minutes.
          </p>
          <Link href="/signup" className="btn-primary">
            Get started free
          </Link>
        </div>
      </section>

      <FaqSection items={brainAiFaqs} title="Brain AI: frequently asked questions" />

      <JsonLd
        schema={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Brain AI', path: '/brain-ai' },
        ])}
      />

      <FooterV3 />
    </div>
  )
}
