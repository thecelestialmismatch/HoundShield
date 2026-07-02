import Link from 'next/link'
import { ArrowRight, Shield, Users, Plug, DollarSign } from 'lucide-react'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'

/* ─────────────────────────────────────────────────────────────────
 * /partners — verbatim port of the HERMES demo partners view
 * (Direction A), with ONE deliberate wording change the demo gets
 * legally wrong: the highlight card is RPO/MSP-framed. C3PAOs are
 * barred from referring/endorsing tools for clients they assess
 * (32 CFR Part 170 / ISO 17020) — NEVER-DO list, guard-tested.
 * Layout, classes and structure are the demo's, 1:1.
 * ───────────────────────────────────────────────────────────────── */

export default function PartnersPage() {
  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />

      <main className="page">
        <div className="section">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">Partner program</div>
              <h2 className="display">Build &amp; grow with HoundShield</h2>
              <p>
                The fastest path to CMMC compliance for 80,000 contractors runs through the people
                they already trust — their RPOs and MSPs.
              </p>
            </div>

            {/* Highlight card — demo layout, RPO/MSP channel (not C3PAO) */}
            <div
              className="card"
              style={{ borderColor: 'var(--brand)', marginBottom: 22, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center' }}
              id="reseller"
            >
              <div className="ic" style={{ margin: 0, width: 54, height: 54 }}>
                <Shield style={{ width: 26, height: 26 }} />
              </div>
              <div>
                <span className="chip" style={{ position: 'static', display: 'inline-block', marginBottom: '.4rem' }}>Highest leverage</span>
                <h3 style={{ fontSize: '1.3rem' }}>RPO / MSP Referral Partner — co-brand the $499 report</h3>
                <p>
                  Registered Provider Organizations and MSPs each serve dozens of clients who all
                  need this. One partner is worth fifty cold emails. Co-branded compliance reports
                  at $299 wholesale, margin-first pricing, dedicated enablement.
                  (C3PAOs are excluded — assessors can&apos;t refer tools to clients they assess.)
                </p>
              </div>
              <Link className="btn btn-primary" href="/contact">
                Become a partner <ArrowRight />
              </Link>
            </div>

            <div className="grid-3">
              <div className="card">
                <div className="ic"><Users /></div>
                <h3>MSP / Agency</h3>
                <p>
                  20% revenue share · white-label option. Manage every client&apos;s CMMC posture
                  from one multi-tenant dashboard.
                </p>
              </div>
              <div className="card">
                <div className="ic"><Plug /></div>
                <h3>Integrations</h3>
                <p>
                  Drop-in proxy for ChatGPT, Copilot, Claude, Gemini and Llama. Ship a compliant AI
                  gateway inside your own product.
                </p>
              </div>
              <div className="card">
                <div className="ic"><DollarSign /></div>
                <h3>Reseller</h3>
                <p>
                  Margin-first pricing and co-branded compliance reports (C3PAO-ready). Sell
                  HoundShield as part of your compliance practice.
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link className="btn btn-primary" href="/contact">
                Apply to partner program <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <FooterV3 />
    </div>
  )
}
