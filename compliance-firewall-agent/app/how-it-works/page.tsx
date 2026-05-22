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
    <div className="min-h-screen bg-white">
      <NavV3 />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-3">
            HOW IT WORKS
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-5">
            Local-first compliance.<br />Zero data exposure.
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
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
                className="flex gap-8 items-start border border-slate-100 rounded-2xl p-8 bg-slate-50"
              >
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <span className="text-4xl font-black text-slate-200 font-mono leading-none">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-[var(--hs-mist)] border border-[var(--hs-border)] flex items-center justify-center text-[var(--hs-steel-dark)]">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    {step.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
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
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to protect your CUI?
          </h2>
          <p className="text-slate-600 mb-8">
            No credit card required. Assess all 110 controls and see your SPRS score in under 30 minutes.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      <FooterV3 />
    </div>
  )
}
