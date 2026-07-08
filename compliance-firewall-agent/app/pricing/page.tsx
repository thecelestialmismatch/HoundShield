'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { ReportCheckoutButton } from '@/components/ReportCheckoutButton'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { FaqAccordion } from '@/components/ui/FaqAccordion'
import { JsonLd } from '@/components/seo/JsonLd'
import { faqPageSchema } from '@/lib/seo/structured-data'
import { pricingFaqs } from '@/lib/seo/faqs'

/* ─────────────────────────────────────────────────────────────────
 * /pricing — verbatim port of the HERMES demo pricing view
 * (Direction A): billing toggle, 4 price cards (Pro featured),
 * agency note, compliance compare table. Amounts match the pricing
 * single source of truth (lib/pricing/plans).
 * One deliberate addition: the $499 one-time CMMC AI Risk Assessment
 * Report note (Stage-1 lead product — CLAUDE.md pricing doctrine).
 * ───────────────────────────────────────────────────────────────── */

type Billing = 'm' | 'a'

interface PriceCard {
  tier: string
  who: string
  m: string
  a: string
  annualNote: { m: string; a: string }
  cta: { label: string; href: string; primary?: boolean }
  featured?: boolean
  feats: string[]
}

const CARDS: PriceCard[] = [
  {
    tier: 'Free',
    who: 'Self-assessment for a single team',
    m: '$0', a: '$0',
    annualNote: { m: 'No card required', a: 'No card required' },
    cta: { label: 'Start free', href: '/signup' },
    feats: [
      'CMMC assessment (read-only)',
      '110-control gap analysis',
      'Live SPRS calculator',
      'Up to 1,000 prompts/mo',
      'Community support',
    ],
  },
  {
    tier: 'Pro',
    who: 'AI gateway + full CMMC suite for defense contractors',
    m: '$199', a: '$159',
    annualNote: { m: 'billed monthly', a: '$1,910 billed annually' },
    cta: { label: 'Start 7-day trial', href: '/signup?plan=pro', primary: true },
    featured: true,
    feats: [
      'AI gateway — 50,000 scans/mo',
      'Editable assessment + roadmap',
      'SSP & POA&M generation',
      'JSON compliance reports',
      '10 seats · email & Slack alerts',
    ],
  },
  {
    tier: 'Growth',
    who: 'PDF reports + C3PAO coordination for growing primes',
    m: '$499', a: '$399',
    annualNote: { m: 'billed monthly', a: '$4,790 billed annually' },
    cta: { label: 'Start 7-day trial', href: '/signup?plan=growth' },
    feats: [
      'Everything in Pro',
      'Unlimited scans · 25 seats',
      'PDF compliance reports',
      'C3PAO assessment coordination',
      'Audit-trail export · SSO & RBAC',
    ],
  },
  {
    tier: 'Enterprise',
    who: 'On-prem & air-gapped for large primes',
    m: '$999', a: '$799',
    annualNote: { m: 'billed monthly', a: '$9,590 billed annually' },
    cta: { label: 'Contact sales', href: '/contact' },
    feats: [
      'Everything in Growth',
      'On-prem / air-gapped deploy',
      'Unlimited seats · white-label PDF',
      'HITL quarantine review',
      'Custom SLA 99.99% · CSM',
    ],
  },
]

const COMPARE: Array<{ label: string; cells: Array<string | boolean> }> = [
  { label: 'CMMC self-assessment', cells: ['Read-only', true, true, true] },
  { label: 'SPRS score calculator', cells: [true, true, true, true] },
  { label: 'AI gateway scans', cells: ['—', '50k/mo', 'Unlimited', 'Unlimited'] },
  { label: 'PDF compliance reports', cells: ['—', '—', true, 'White-label'] },
  { label: 'C3PAO coordination', cells: ['—', '—', true, true] },
  { label: 'On-prem / air-gapped', cells: ['—', '—', '—', true] },
  { label: 'Team seats', cells: ['1', '10', '25', 'Unlimited'] },
]

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('m')

  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />

      <main className="page">
        <div className="section">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">Pricing</div>
              <h1 className="display">Simple, transparent pricing</h1>
              <p>
                Every framework — CMMC, HIPAA, SOC 2 — included in every paid plan. Start free,
                scale when you&apos;re ready.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div className="bill-toggle">
                <button type="button" className={billing === 'm' ? 'on' : undefined} onClick={() => setBilling('m')}>
                  Monthly
                </button>
                <button type="button" className={billing === 'a' ? 'on' : undefined} onClick={() => setBilling('a')}>
                  Annual <span className="save">save 20%</span>
                </button>
              </div>
            </div>

            <div className="pricing-grid">
              {CARDS.map((c) => (
                <div className={`price-card${c.featured ? ' featured' : ''}`} key={c.tier}>
                  <div className="tier">{c.tier}</div>
                  <div className="who">{c.who}</div>
                  <div className="price">
                    {billing === 'm' ? c.m : c.a}
                    <small>/mo</small>
                  </div>
                  <div className="annual">{c.annualNote[billing]}</div>
                  <Link className={`btn ${c.cta.primary ? 'btn-primary' : 'btn-ghost'}`} href={c.cta.href}>
                    {c.cta.label}
                  </Link>
                  <ul className="feat">
                    {c.feats.map((f) => (
                      <li key={f}><Check /> {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="center muted" style={{ marginTop: 18, fontSize: '.86rem' }}>
              Managing multiple contractors? The <b>Agency</b> plan ($2,499/mo) adds a multi-tenant
              dashboard, unlimited client accounts and a partner revenue share.{' '}
              <Link href="/partners" style={{ color: 'var(--brand)', fontWeight: 600 }}>See partner program →</Link>
            </p>

            <p className="center muted" style={{ marginTop: 8, fontSize: '.86rem' }}>
              Need audit-ready evidence without a subscription? The <b>$499 one-time CMMC AI Risk
              Assessment Report</b> scores 14 days of real AI traffic against NIST 800-171.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <ReportCheckoutButton label="Request the report" />
            </div>

            <div className="compare">
              <table>
                <thead>
                  <tr>
                    <th>Compliance</th>
                    <th>Free</th>
                    <th>Pro</th>
                    <th>Growth</th>
                    <th>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      {row.cells.map((cell, i) =>
                        cell === true
                          ? <td key={i}><Check /></td>
                          : <td key={i} className={cell === '—' ? 'dash' : undefined}>{cell}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="center muted" style={{ marginTop: 18, fontSize: '.82rem' }}>
              Annual plans save up to 20%. Every paid plan includes a 30-day money-back guarantee.
            </p>
          </div>
        </div>

        {/* FAQ — visible Q&A + FAQPage JSON-LD (AEO). Hermes section styling
            matches the rest of the page. */}
        <div className="section alt">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">FAQ</div>
              <h2 className="display">Pricing questions, answered</h2>
            </div>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <JsonLd schema={faqPageSchema(pricingFaqs)} />
              <FaqAccordion items={pricingFaqs} />
            </div>
          </div>
        </div>
      </main>

      <FooterV3 />
    </div>
  )
}
