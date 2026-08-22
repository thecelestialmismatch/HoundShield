import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye, Clock, FileText, Shield, Brain, ArrowRight } from 'lucide-react'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { FaqSection } from '@/components/seo/FaqSection'
import { featuresFaqs } from '@/lib/seo/faqs'
import { ENGINES, ENGINE_COUNT, PATTERN_COUNT } from '@/lib/detection/engines'

/* ─────────────────────────────────────────────────────────────────
 * /features — 3 capability cards → the detection-engines panel →
 * 3 chip cards → pricing CTA. Styling in app/hermes.css.
 * Engine list and counts come from lib/detection/engines — never
 * retype the number here, it drifts.
 * ───────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: 'Features — Everything Inside the Firewall Engine',
  // Interpolated, not retyped. This description shipped "90 shipped patterns"
  // — the double-counted figure engines.ts exists to kill — in the same file
  // whose header comment says never to retype the number.
  description:
    `${ENGINE_COUNT} detection engines built from ${PATTERN_COUNT} shipped patterns, 110 mapped NIST 800-171 controls and tamper-evident evidence — all running on your hardware in under 10ms.`,
  alternates: { canonical: 'https://houndshield.com/features' },
}

export default function FeaturesPage() {
  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />

      <main className="page">
        <div className="section">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">Capabilities</div>
              <h2 className="display">Everything inside the firewall engine</h2>
              <p>
                Sixteen detection engines, 110 mapped controls and tamper-evident evidence — all
                running on your hardware in under 10ms.
              </p>
            </div>

            <div className="grid-3" style={{ marginBottom: 22 }} id="interception">
              <div className="card">
                <div className="ic"><Eye /></div>
                <h3>AI Prompt Interception</h3>
                <p>
                  An OpenAI-compatible proxy in front of every model. Inspects each request before
                  a single byte leaves your perimeter.
                </p>
              </div>
              <div className="card">
                <div className="ic"><Clock /></div>
                <h3>&lt;10ms Latency</h3>
                <p>
                  Median scan time is sub-10ms. Transparent to every employee — they never know
                  it&apos;s there until it stops a spill.
                </p>
              </div>
              <div className="card" id="audit">
                <div className="ic"><FileText /></div>
                <h3>Immutable Audit Trail</h3>
                <p>
                  Every decision is hashed into a SHA-256 tamper-evident log. Export as assessor-reviewable
                  evidence on demand.
                </p>
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 40 }} id="engines">
              <div className="panel-h">
                <h3>The {ENGINE_COUNT} detection engines</h3>
                <span className="mono">{PATTERN_COUNT} patterns · CUI · PII · IP · PHI</span>
              </div>
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {ENGINES.map((e) => (
                  <div className="gateway-box" style={{ borderStyle: 'solid' }} key={e}>{e}</div>
                ))}
              </div>
            </div>

            <div className="grid-3">
              <div className="card">
                <span className="chip">110 controls</span>
                <div className="ic"><Shield /></div>
                <h3>CMMC Self-Assessment</h3>
                <p>Walk all 110 NIST 800-171 practices with guided questions. Live SPRS scoring.</p>
              </div>
              <div className="card">
                <span className="chip">AI</span>
                <div className="ic"><Brain /></div>
                <h3>Gap Analysis</h3>
                <p>Brain AI ranks unmet controls by risk and cost and drafts your remediation roadmap.</p>
              </div>
              <div className="card">
                <span className="chip">Export</span>
                <div className="ic"><FileText /></div>
                <h3>SSP &amp; POA&amp;M</h3>
                <p>Auto-generate the documents your C3PAO asks for, signed and timestamped.</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link className="btn btn-primary" href="/pricing">
                See pricing <ArrowRight />
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ — visible Q&A + FAQPage JSON-LD (AEO), one shared component. */}
        <div className="section alt">
          <div className="container">
            <FaqSection
              items={featuresFaqs}
              title="Feature questions, answered"
              className="!py-0"
            />
          </div>
        </div>
      </main>

      <FooterV3 />
    </div>
  )
}
