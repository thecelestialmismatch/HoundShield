import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileCheck2, Route, ShieldCheck } from 'lucide-react'

/**
 * A static explanation of the evidence workflow. It is deliberately not a
 * product-status dashboard: it names the deployment boundary and asks the buyer
 * to validate the path against their own environment and assessment process.
 */
export function EvidenceReadinessPath() {
  const stages = [
    {
      Icon: Route,
      label: 'Route',
      title: 'Choose the boundary deliberately',
      body: 'Start with the AI traffic and supporting documents you intentionally place inside your deployment and review process.',
    },
    {
      Icon: CheckCircle2,
      label: 'Verify',
      title: 'Keep a human in the decision loop',
      body: 'Review configured control outcomes and proposed evidence fields before relying on them for an internal assessment or customer response.',
    },
    {
      Icon: FileCheck2,
      label: 'Evidence',
      title: 'Build a reviewable record',
      body: 'Organise source-linked decision and document evidence for your own assessment, SSP, POA&M, or customer-review workflow.',
    },
  ]

  return (
    <section className="section tight" aria-labelledby="evidence-readiness-heading">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">Evidence readiness path</div>
          <h2 id="evidence-readiness-heading" className="display">From control boundary to reviewable evidence.</h2>
          <p>HoundShield helps you make the path explicit. Your deployment, configuration, reviewers, and assessment scope determine the result.</p>
        </div>

        <div className="grid-3">
          {stages.map(({ Icon, label, title, body }, index) => (
            <div className="card" key={label}>
              <span className="chip">{String(index + 1).padStart(2, '0')} · {label}</span>
              <div className="ic"><Icon aria-hidden /></div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>

        <div className="cta-band" style={{ marginTop: 22 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--brand-2)' }}><ShieldCheck style={{ width: 14, height: 14, verticalAlign: -2, marginRight: 5 }} /> Deployment boundary</div>
            <h2 className="display" style={{ fontSize: 'clamp(1.45rem, 2.5vw, 2.1rem)', marginTop: 8 }}>Evidence supports review. It does not replace it.</h2>
            <p>Browser-local document review keeps selected files on the operator&apos;s device. Validate every deployment, retention decision, and control mapping for your actual contract and environment.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link className="btn btn-primary" href="/demo#snapshot">Explore the control boundary <ArrowRight /></Link>
            <Link className="btn btn-ghost" href="/docs">Read the deployment guidance</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
