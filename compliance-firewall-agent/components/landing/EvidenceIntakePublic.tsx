'use client'

import { useState, type CSSProperties } from 'react'
import { Check, FileCheck2, LockKeyhole, ScanText, ShieldCheck } from 'lucide-react'
import { EvidenceReadiness } from '@/components/dashboard/operator/EvidenceReadiness'
import { LCC_CSS } from '@/components/dashboard/lccStyles'
import { consoleThemeVars, getThemeById } from '@/lib/dashboard/design-themes'

const STEPS = [
  ['Choose locally', 'Select a text-based PDF from your browser. It is never uploaded by this page.'],
  ['Review with context', 'Read proposed evidence fields with page references and choose accept or reject yourself.'],
  ['Keep a local record', 'Download a redacted local manifest with source hash and review decisions when you are ready.'],
] as const

/** Public product experience for local Evidence Intake. Document processing remains browser-local. */
export function EvidenceIntakePublic() {
  const [notice, setNotice] = useState<string | null>(null)
  const theme = getThemeById('aurora')

  return (
    <>
      <section className="hero" style={{ paddingBottom: 42 }}>
        <div className="container hero-grid">
          <div>
            <div className="pill"><i className="live-dot" /> Browser-local evidence review · human approval required</div>
            <h1 className="display">Review evidence without <span className="accent">handing it to a cloud.</span></h1>
            <p className="sub">Evidence Intake helps operators inspect selected text-based PDFs, propose reviewable fields with page references, and retain a local provenance record. Raw document bytes, extracted text, and decisions remain in the current browser session.</p>
            <div className="hero-badges">
              <span><LockKeyhole aria-hidden /> No document upload route</span>
              <span><ScanText aria-hidden /> Local text extraction</span>
              <span><ShieldCheck aria-hidden /> Human review gate</span>
            </div>
          </div>
          <div className="hero-demo" style={{ alignSelf: 'center' }}>
            <div className="panel" style={{ padding: 22 }}>
              <div className="ph"><h3><FileCheck2 aria-hidden /> Deliberate first-release boundary</h3><span className="chip">Local-first</span></div>
              <div className="pad" style={{ paddingBottom: 0 }}>
                <p className="muted" style={{ marginBottom: 14 }}>This public workspace is a local review tool, not autonomous compliance scoring or an assessor decision.</p>
                <ul className="clean-list">
                  <li><Check aria-hidden /> PDFs only · 15 MB maximum · 80 pages maximum</li>
                  <li><Check aria-hidden /> Text-based PDFs only; no hidden cloud OCR fallback</li>
                  <li><Check aria-hidden /> No customer account, storage bucket, telemetry event, or AI-provider call</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="evidence-workflow-heading">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">A bounded workflow</span>
            <h2 id="evidence-workflow-heading">Source → review → local provenance.</h2>
            <p>The browser can suggest structure. A person decides what is accurate, relevant, and ready to use.</p>
          </div>
          <div className="card-grid three" style={{ marginBottom: 38 }}>
            {STEPS.map(([title, body], index) => (
              <article className="card" key={title}>
                <span className="num">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>

          <div className="hs-lcc" data-theme={theme.id} data-mode={theme.mode} style={{ ...consoleThemeVars(theme), borderRadius: 20, overflow: 'hidden' } as CSSProperties}>
            <style dangerouslySetInnerHTML={{ __html: LCC_CSS }} />
            <div style={{ padding: '28px 18px', maxWidth: 1120, margin: '0 auto' }}>
              <div className="op-banner" role="status" style={{ marginBottom: 16 }}>
                <ShieldCheck aria-hidden /> Try the browser-local workspace below with a non-sensitive, text-based PDF. The file stays in this browser session.
              </div>
              {notice && <div className="op-banner" role="status" style={{ marginBottom: 16 }}>{notice}</div>}
              <EvidenceReadiness onOpenSettings={() => setNotice('Account privacy settings are available in the signed-in dashboard. This public page does not create or store an account record.')} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
