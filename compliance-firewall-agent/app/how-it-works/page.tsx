import Link from 'next/link'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { ShieldCheck, Plug, FileText } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Plug,
    title: 'Change One URL',
    body: 'Point your AI tool (ChatGPT, Copilot, Claude, any OpenAI-compatible client) at your HoundShield proxy URL. No agents. No software installs. Live in under five minutes.',
  },
  {
    number: '02',
    icon: ShieldCheck,
    title: 'Every Prompt Scanned Locally',
    body: 'HoundShield intercepts each request on your own hardware. Sixteen CUI/PII/PHI detection patterns run in under 10ms before the prompt reaches any AI provider. Your data never touches our servers.',
  },
  {
    number: '03',
    icon: FileText,
    title: 'Audit-Ready in One Click',
    body: 'Every decision is logged in a tamper-proof hash chain. Generate your C3PAO-ready PDF report at any time — formatted for DIBCAC review, covering all 110 NIST SP 800-171 Rev 2 controls.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-3">
            HOW IT WORKS
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--hs-ink)] tracking-tight mb-5">
            Local-first compliance.<br />Zero data exposure.
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] max-w-2xl mx-auto leading-relaxed">
            HoundShield sits between your team and every AI provider. Everything is
            scanned on your hardware — not ours. That&apos;s the only way to guarantee
            your CUI never becomes a DFARS 7012 spill.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="flex gap-8 items-start border border-[var(--hs-border-subtle)] rounded-2xl p-8 bg-[var(--hs-surface-1)]"
              >
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <span className="text-4xl font-black text-[var(--hs-sand)] font-mono leading-none">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-[var(--hs-mist)] border border-[var(--hs-border)] flex items-center justify-center text-[var(--hs-steel-dark)]">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--hs-ink)] mb-2">
                    {step.title}
                  </h2>
                  <p className="text-[var(--hs-ink-secondary)] leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto border border-[var(--hs-border)] bg-[var(--hs-surface-1)] rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-4">
            Ready to protect your CUI?
          </h2>
          <p className="text-[var(--hs-ink-secondary)] mb-8">
            No credit card required. Assess all 110 controls and see your SPRS score in under 30 minutes.
          </p>
          <Link href="/signup" className="btn-primary">
            Get started free
          </Link>
        </div>
      </section>

      <FooterV3 />
    </div>
  )
}
