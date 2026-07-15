import Link from 'next/link'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { Shield, Plug, FileText, Eye, ArrowRight } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'
import { FaqSection } from '@/components/seo/FaqSection'
import { installSteps, howItWorksFaqs } from '@/lib/seo/faqs'
import { howToSchema, breadcrumbSchema } from '@/lib/seo/structured-data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works — AI Compliance Firewall in 4 Steps',
  description:
    'Point your AI tool at the HoundShield proxy, scan every prompt locally in under 10ms across 16 detection engines, and export C3PAO-ready audit evidence. No agents, no installs.',
  alternates: { canonical: 'https://houndshield.com/how-it-works' },
}

/* Verbatim port of the HERMES demo "how" view (Direction A). */

const STEPS = [
  {
    number: '01',
    icon: Plug,
    title: 'Change one URL',
    body: 'Point any OpenAI-compatible client (ChatGPT, Copilot, Claude, Cursor) at your HoundShield proxy URL. No agents. No installs. Live in under five minutes.',
  },
  {
    number: '02',
    icon: Shield,
    title: 'Every prompt scanned locally',
    body: 'HoundShield intercepts each request on your own hardware. Sixteen CUI/PII/PHI engines run in under 10ms before the prompt reaches any AI provider. Your data never touches our servers.',
  },
  {
    number: '03',
    icon: Eye,
    title: 'Block, quarantine or pass',
    body: 'Clean prompts pass through untouched. Risky prompts are blocked or held for human-in-the-loop review — with the exact match (CAGE code, MRN, secret) highlighted.',
  },
  {
    number: '04',
    icon: FileText,
    title: 'Sign the evidence',
    body: 'Every decision is written to a SHA-256 tamper-evident audit log. Export a C3PAO-ready PDF mapped to all 110 NIST 800-171 controls whenever your assessor asks.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />

      <main className="page">
        <div className="section">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">How it works</div>
              <h2 className="display">Local-first compliance. Zero data exposure.</h2>
              <p>
                HoundShield sits between your team and every AI provider. Everything is scanned on
                your hardware — not ours. That&apos;s the only way to guarantee your CUI never
                becomes a DFARS 7012 spill.
              </p>
            </div>

            <div className="steps">
              {STEPS.map((step) => {
                const Icon = step.icon
                return (
                  <div className="step" key={step.number}>
                    <div className="num">{step.number}</div>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                    <div className="ic"><Icon /></div>
                  </div>
                )
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link className="btn btn-primary" href="/signup">
                Get started free <ArrowRight />
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ — visible Q&A + FAQPage JSON-LD (AEO), one shared component. */}
        <div className="section alt">
          <div className="container">
            <FaqSection
              items={howItWorksFaqs}
              title="Deployment questions, answered"
              className="!py-0"
            />
          </div>
        </div>
      </main>

      <JsonLd
        schema={[
          howToSchema({
            name: 'How to deploy HoundShield',
            description:
              'Deploy the local-only AI compliance firewall and start scanning AI prompts for CUI, PHI, and PII in under 15 minutes.',
            steps: installSteps,
            totalTime: 'PT15M',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'How it works', path: '/how-it-works' },
          ]),
        ]}
      />

      <FooterV3 />
    </div>
  )
}
