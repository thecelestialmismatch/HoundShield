import type { Metadata } from 'next'
import { Check, ShieldAlert } from 'lucide-react'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { CopyText } from './CopyText'
import { ApiReference } from './ApiReference'
import { DOC_NAV, GATEWAY_BASE } from './api-data'

/* ─────────────────────────────────────────────────────────────────
 * /docs — the real developer reference. Quickstart + Authentication +
 * "what gets detected" + a live, tabbed (cURL/JS/Python) API reference
 * for every proxy endpoint, each with a WORKING sidebar anchor and a
 * copy button (the old page pointed every sidebar link at one #sdk
 * anchor and shipped a single JS snippet).
 * ───────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: 'API Documentation — CMMC Gateway in 60 Seconds',
  description:
    'HoundShield is an OpenAI-compatible proxy: change one baseURL and every AI query from your team is scanned for CUI, CAGE codes, contract numbers, PHI and secrets before it leaves your perimeter. Full API reference with cURL, JavaScript and Python examples.',
  alternates: { canonical: 'https://houndshield.com/docs' },
}

const QUICKSTART_STEPS = [
  { n: '1', title: 'Get your keys', body: 'Sign up, then copy your gateway license + admin token from Dashboard → Settings → API Keys.' },
  { n: '2', title: 'Point your SDK at HoundShield', body: 'Change the baseURL in any OpenAI-compatible client to the gateway. Zero behavior change for your team.' },
  { n: '3', title: 'Every query is now CMMC-monitored', body: 'CUI, CAGE codes, contract numbers, PHI and secrets are flagged and blocked in <10ms — before anything leaves your perimeter.' },
]

const DETECTED = [
  { k: 'CUI', d: 'FOUO markings, CAGE codes, DoD contract numbers, clearance/ITAR language.' },
  { k: 'PHI', d: 'All 18 HIPAA identifiers — MRN, DOB, SSN, insurance IDs, diagnoses.' },
  { k: 'PII', d: 'SSN, addresses, phone, email, financial account numbers.' },
  { k: 'Secrets', d: 'API keys, cloud credentials, tokens, private keys in prompt bodies.' },
  { k: 'Source & IP', d: 'Proprietary source code and internal identifiers.' },
]

export default function DocsPage() {
  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />

      <main className="page">
        <div className="section">
          <div className="container docs-wrap">
            <aside className="docs-side">
              {DOC_NAV.map((g) => (
                <div key={g.group} style={{ display: 'contents' }}>
                  <div className="gh">{g.group}</div>
                  {g.items.map((it) => (
                    <a key={it.href + it.label} href={it.href}>
                      {it.label}
                    </a>
                  ))}
                </div>
              ))}
            </aside>

            <div>
              {/* ── Quickstart ─────────────────────────────── */}
              <div className="eyebrow" style={{ color: 'var(--ok)' }} id="quickstart">⚡ Quickstart</div>
              <h1 className="display" style={{ margin: '.4rem 0 1rem', fontSize: 'clamp(2rem,3.6vw,3rem)' }}>
                CMMC gateway in 60 seconds
              </h1>
              <p className="muted" style={{ maxWidth: 640 }}>
                HoundShield is an OpenAI-compatible proxy. Every AI query from your team passes
                through it first. CUI, CAGE codes, contract numbers, PHI and secrets are detected
                and blocked before they reach any provider.
              </p>

              <div className="steps" style={{ margin: '24px 0' }}>
                {QUICKSTART_STEPS.map((s) => (
                  <div className="step" key={s.n}>
                    <div className="num">{s.n}</div>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mono" style={{ fontSize: '.72rem', color: 'var(--text-3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Your gateway URL
              </div>
              <div className="gateway-box" style={{ margin: '.5rem 0 1.2rem' }}>
                <span>{GATEWAY_BASE}/v1</span>
                <CopyText text={`${GATEWAY_BASE}/v1`} />
              </div>

              {/* ── Authentication ─────────────────────────── */}
              <section id="authentication" style={{ scrollMarginTop: 90, padding: '20px 0', borderTop: '1px solid var(--line)' }}>
                <div className="eyebrow">Authentication</div>
                <h2 className="display" style={{ fontSize: 'clamp(1.5rem,2.4vw,2rem)', margin: '.4rem 0 .6rem' }}>Two keys, two scopes</h2>
                <p className="muted" style={{ maxWidth: 660, lineHeight: 1.65 }}>
                  The gateway endpoint uses your normal provider key as a Bearer token — you keep
                  using ChatGPT/Copilot/Claude exactly as before. The management endpoints (audit
                  log, quarantine, policy) require an <b>admin token</b> sent as the{' '}
                  <code style={{ fontFamily: 'var(--f-mono)', color: 'var(--brand)' }}>x-admin-token</code> header, so
                  no one with mere network reach can release quarantined CUI or weaken your policy.
                </p>
                <div className="callout" style={{ marginTop: '1rem' }}>
                  <ShieldAlert style={{ width: 18, height: 18, color: 'var(--ok)', flexShrink: 0 }} />
                  <div>
                    <b>Mode B for CUI.</b> The hosted gateway ({GATEWAY_BASE}) is for demos and
                    non-CUI evaluation. For CUI workloads run the identical API on your own Docker
                    host — the base URL is the only change, and prompt content never leaves your
                    boundary.
                  </div>
                </div>
              </section>

              {/* ── What gets detected ─────────────────────── */}
              <section id="detected" style={{ scrollMarginTop: 90, padding: '20px 0', borderTop: '1px solid var(--line)' }}>
                <div className="eyebrow">Detection</div>
                <h2 className="display" style={{ fontSize: 'clamp(1.5rem,2.4vw,2rem)', margin: '.4rem 0 .8rem' }}>What gets detected</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {DETECTED.map((d) => (
                    <div key={d.k} style={{ display: 'flex', gap: '.8rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--brand)', minWidth: 96 }}>{d.k}</span>
                      <span className="muted" style={{ flex: 1, minWidth: 220 }}>{d.d}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── API reference (live, tabbed) ───────────── */}
              <div className="eyebrow" style={{ marginTop: '2rem' }}>Reference</div>
              <h2 className="display" style={{ fontSize: 'clamp(1.5rem,2.4vw,2rem)', margin: '.4rem 0 1rem' }}>API reference</h2>
              <ApiReference />

              <div className="callout" style={{ marginTop: '1.5rem' }}>
                <Check style={{ width: 18, height: 18, color: 'var(--ok)', flexShrink: 0 }} />
                <div>
                  <b>No infrastructure change required.</b> Your employees keep using ChatGPT,
                  Copilot or Claude — HoundShield sits in the middle, transparently, on your
                  hardware.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterV3 />
    </div>
  )
}
