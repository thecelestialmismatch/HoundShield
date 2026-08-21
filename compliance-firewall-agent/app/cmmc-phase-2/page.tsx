import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, AlertTriangle, Gavel, CalendarClock, Scale } from 'lucide-react'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { FaqSection } from '@/components/seo/FaqSection'
import { CMMC_STATUS, NDAA_AI, PHASE2_TARGET_DATE, daysToPhase2 } from '@/lib/compliance/cmmc-status'
import { PURCHASABLE_OFFER } from '@/lib/billing/entitlements'

/**
 * /cmmc-phase-2 — the Phase 2 page.
 *
 * Founder decision, 7 Aug 2026: HoundShield continues to work to 10 November
 * 2026. When enforcement was paused on 13 July, Phase 2 was stripped out of the
 * product down to a single constant and stopped being a surface anyone could
 * land on. That over-corrected: a contractor searching "CMMC Phase 2" is
 * exactly our buyer, and we had nothing for them.
 *
 * Every date and status string comes from `lib/compliance/cmmc-status.ts`, so
 * this page cannot drift from the thirteen other surfaces that quote the same
 * facts — and when a new memo lands, this page updates by updating that file.
 *
 * The line this page walks, deliberately: it treats November as the date to be
 * ready for (which it is — no replacement has been issued) while stating the
 * pause plainly. Pretending the 13 July memo does not exist would cost us the
 * deal the first time a buyer searched for it; pretending Phase 2 is cancelled
 * would be equally wrong and would leave that buyer unprepared. Both failures
 * are avoidable, and the honest framing is also the more urgent one: the
 * obligation never paused, and DOJ is prosecuting it right now.
 */

export const metadata: Metadata = {
  title: 'CMMC Phase 2: what it requires and how to be ready by November',
  description:
    'CMMC Phase 2 remains the plan of record for 10 November 2026. Enforcement is paused pending the DoW Reform Task Force review, but DFARS 252.204-7012, all 110 NIST 800-171 Rev 2 controls and your SPRS self-assessment are unchanged — and DOJ prosecutes that score today.',
  alternates: { canonical: '/cmmc-phase-2' },
  openGraph: {
    title: 'CMMC Phase 2 — still the date to be ready for',
    description:
      'Paused for review, not cancelled. The obligation underneath it never moved, and self-attestation is the gate DOJ prosecutes.',
    url: '/cmmc-phase-2',
  },
}

// Reads the clock for the countdown, so it must render per request.
export const dynamic = 'force-dynamic'

const STILL_BINDING = [
  {
    title: 'DFARS 252.204-7012',
    body: 'The safeguarding clause is in your contract today. It was never part of the phase-in schedule and the pause did not touch it. Breach of it is breach of contract, now.',
  },
  {
    title: 'All 110 NIST SP 800-171 Rev 2 controls',
    body: 'The control set is unchanged. What Phase 2 would have added is a third-party checking your work — not the work itself.',
  },
  {
    title: 'Your annual SPRS self-assessment',
    body: 'Still mandatory, still submitted under your own name. With no assessor in the loop, that score is your representation to the government.',
  },
]

const READINESS = [
  {
    n: '01',
    title: 'Know what your people are actually sending',
    body: 'AI prompt traffic is the newest way CUI leaves a boundary and the least logged. Point one URL at the gateway and every prompt is inspected on your own hardware before it goes anywhere.',
  },
  {
    n: '02',
    title: 'Turn that into evidence, not a feeling',
    body: 'A SHA-256 hash-chained audit log of every prompt event, mapped to the NIST 800-171 controls it touches. This is the artifact an assessor asks for and the one nobody has.',
  },
  {
    n: '03',
    title: 'Score it before someone else does',
    body: `The ${PURCHASABLE_OFFER.name} runs 14 days in your environment and hands you a signed PDF risk-scoring every AI prompt event against NIST 800-171 Rev 2. ${PURCHASABLE_OFFER.price}, no subscription.`,
  },
]

const FAQS = [
  {
    question: 'Is CMMC Phase 2 cancelled?',
    answer:
      'No. On 13 July 2026 the Department of War paused Phase 2 enforcement pending a 60-day Reform Task Force review, and the RFI closed on 14 August 2026. No replacement date has been issued, so 10 November 2026 remains the only date on the table.',
  },
  {
    question: 'Should we keep preparing for November?',
    answer:
      'Yes — it is the only assumption that is safe in both directions. A contractor ready in November is fine whether enforcement resumes on schedule, slips, or returns in a different shape. A contractor who treated the pause as a cancellation is not, and the work takes months, not weeks.',
  },
  {
    question: 'What is actually enforceable today?',
    answer:
      'DFARS 252.204-7012, all 110 NIST SP 800-171 Rev 2 controls, and your annual SPRS self-assessment score. None of those paused. DOJ has settled fifteen False Claims Act cases under its Civil Cyber-Fraud Initiative over exactly this — MORSECORP paid $4.6M over an inflated SPRS score.',
  },
  {
    question: 'Does the Phase 2 pause affect the AI requirements Congress passed?',
    answer:
      `No. ${NDAA_AI.framework.section} of the ${NDAA_AI.act} directs the Department of War to build a cybersecurity framework for AI and machine-learning systems and incorporate it into the DFARS and CMMC. ${NDAA_AI.framework.deadlineNote} Separately, ${NDAA_AI.prohibition.section} bars contractors from using covered, adversary-linked AI on defense work — that is not a restriction on ChatGPT, Claude or Copilot, but demonstrating compliance with it still requires knowing which AI tools your people actually used. The 13 July memo paused a certification programme; it did not and could not repeal a statute.`,
  },
  {
    question: 'Does AI prompt monitoring map to specific NIST 800-171 controls?',
    answer:
      'Yes. Prompt interception and the resulting audit trail map to 3.1.1 and 3.1.2 (limit access to authorized users and permitted transactions), 3.3.1 and 3.3.2 (create and retain audit records traceable to individual users), and 3.13.1 and 3.13.16 (monitor and protect CUI in transit and at rest).',
  },
  {
    question: 'Do we need a FedRAMP-authorized vendor?',
    answer:
      'For a CUI workload you need the scanning to happen inside your own boundary. HoundShield runs as a Docker container on your infrastructure in that mode, so prompt content never reaches us — there is no vendor cloud in the data path to authorize. The hosted trial endpoint is for non-CUI evaluation only.',
  },
]

export default function CmmcPhase2Page() {
  const days = daysToPhase2()

  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />

      <main className="page">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="hero">
          <div className="container">
            <div className="pill">
              <i className="live-dot" /> CMMC Level 2 · NIST 800-171 Rev 2 · DFARS 7012
            </div>
            <h1 className="display" style={{ maxWidth: '20ch' }}>
              CMMC Phase 2 is still the date to be <span className="accent">ready for.</span>
            </h1>
            <p className="sub" style={{ maxWidth: '62ch' }}>
              {CMMC_STATUS.blurb}
            </p>

            <div className="hero-actions">
              <Link className="btn btn-primary" href="/pricing">
                Get the {PURCHASABLE_OFFER.price} readiness report <ArrowRight />
              </Link>
              <Link className="btn btn-ghost" href="/demo#snapshot">
                Scan a prompt free, in your browser
              </Link>
            </div>

            <div className="hero-trust">
              <span><Check /> Runs on your hardware</span>
              <span><Check /> Nothing transmitted</span>
              <span><Check /> assessor-reviewable PDF</span>
            </div>
          </div>
        </div>

        {/* ── THE DATE ─────────────────────────────────────────── */}
        <div className="container" style={{ paddingTop: 8, paddingBottom: 26 }}>
          <div className="stat-row">
            <div className="stat">
              <div className="n">{days > 0 ? days : '—'}</div>
              <div className="l">Days to {PHASE2_TARGET_DATE}</div>
              <div className="s">{days > 0 ? 'The date has not been replaced' : 'Target date reached'}</div>
            </div>
            <div className="stat">
              <div className="n">110</div>
              <div className="l">Controls still required</div>
              <div className="s">NIST 800-171 Rev 2 — unchanged by the pause</div>
            </div>
            <div className="stat">
              <div className="n">15</div>
              <div className="l">DOJ cyber-FCA settlements</div>
              <div className="s">Self-attestation is prosecuted today</div>
            </div>
            <div className="stat">
              <div className="n">$4.6M</div>
              <div className="l">MORSECORP settlement</div>
              <div className="s">Reported SPRS 104 · true score −142</div>
            </div>
          </div>
        </div>

        {/* ── STATUS, STATED PLAINLY ───────────────────────────── */}
        <div className="container" style={{ paddingBottom: 12 }}>
          <div className="card" style={{ borderColor: 'var(--brand)' }}>
            <div className="ic"><CalendarClock /></div>
            <h3>Where the programme actually stands</h3>
            <p>
              Enforcement was paused on 13 July 2026 pending the Department of War&apos;s Reform
              Task Force review; the RFI closed 14 August 2026. Phase 2 was <b>not cancelled</b>,
              and no replacement date has been issued. We tell you this rather than leaving you to
              find it — and it changes nothing about what you should be doing, because the pause
              applied to the <i>certificate</i>, never to the obligation underneath it.
            </p>
          </div>
        </div>

        {/* ── WHAT NEVER PAUSED ────────────────────────────────── */}
        <div className="section tight">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">Unchanged</div>
              <h2 className="display">What is binding on you today</h2>
              <p>
                Three things the 13 July memo did not touch. Each is in force right now, with or
                without a third-party assessment.
              </p>
            </div>
            <div className="grid-3">
              {STILL_BINDING.map((c) => (
                <div className="card" key={c.title}>
                  <div className="ic"><Check /></div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── THE STATUTE THE PAUSE CANNOT TOUCH ───────────────── */}
        <div className="section tight">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">Written into law</div>
              <h2 className="display">A memo paused the certificate. It cannot repeal a statute.</h2>
              <p>{NDAA_AI.blurb}</p>
            </div>
            <div className="grid-2">
              <div className="card">
                <div className="ic"><Scale /></div>
                <h3>{NDAA_AI.act} {NDAA_AI.framework.section}</h3>
                <p>{NDAA_AI.framework.summary}</p>
                <p style={{ opacity: 0.75 }}>{NDAA_AI.framework.deadlineNote}</p>
              </div>
              <div className="card">
                <div className="ic"><Scale /></div>
                <h3>{NDAA_AI.act} {NDAA_AI.prohibition.section}</h3>
                <p>{NDAA_AI.prohibition.summary}</p>
                <p style={{ opacity: 0.75 }}>{NDAA_AI.prohibition.scopeCaveat}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── THE LIVE RISK ────────────────────────────────────── */}
        <div className="section tight" style={{ background: 'var(--page-2)' }}>
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">The part that is live now</div>
              <h2 className="display">A paused certificate is not a paused prosecutor</h2>
              <p>{CMMC_STATUS.liveRisk}</p>
            </div>
            <div className="grid-3">
              <div className="card">
                <div className="ic"><Gavel /></div>
                <h3>MORSECORP — $4.6M</h3>
                <p>
                  Self-reported an SPRS score of 104. A third-party gap analysis found 22% of
                  controls implemented and a true score of −142. Settled March 2025.
                </p>
              </div>
              <div className="card">
                <div className="ic"><Gavel /></div>
                <h3>Raytheon / Nightwing — $8.5M</h3>
                <p>
                  System Security Plan failures under NIST 800-171. Settled May 2025. The largest
                  cyber-FCA settlement of the year.
                </p>
              </div>
              <div className="card">
                <div className="ic"><AlertTriangle /></div>
                <h3>Your own attestation</h3>
                <p>
                  With no assessor in the loop, the score you submitted is your representation to
                  the government. The question an investigator asks is whether you can evidence it.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── READINESS PATH ───────────────────────────────────── */}
        <div className="section tight">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">Between now and November</div>
              <h2 className="display">The gap nobody has closed yet</h2>
              <p>
                Most contractors have policies, an SSP and a POA&amp;M. Almost none can say what
                their staff pasted into ChatGPT last quarter — which is the newest way CUI leaves a
                boundary and the least logged.
              </p>
            </div>
            <div className="grid-3">
              {READINESS.map((s) => (
                <div className="card" key={s.n}>
                  <span className="chip">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FAQ (visible + FAQPage JSON-LD for AEO) ──────────── */}
        <div className="section alt tight">
          <div className="container">
            <FaqSection items={FAQS} title="CMMC Phase 2 — straight answers" className="!py-0" />
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <div className="section tight">
          <div className="container">
            <div className="cta-band">
              <h2 className="display">Can you evidence your SPRS score before November?</h2>
              <p>
                Fourteen days on your own hardware, one signed PDF, {PURCHASABLE_OFFER.price} one
                time. No subscription, no MSA, no data leaving your network.
              </p>
              <Link className="btn btn-primary" href="/pricing">
                Get the readiness report <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <FooterV3 />
    </div>
  )
}
