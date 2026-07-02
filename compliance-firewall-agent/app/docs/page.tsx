import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { CopyText } from './CopyText'

/* ─────────────────────────────────────────────────────────────────
 * /docs — verbatim port of the HERMES demo docs view (Direction A):
 * sticky sidebar, quickstart steps, gateway box, JS SDK code block,
 * callout — under the standard NavV3/FooterV3 chrome (the previous
 * custom docs shell had its own nav, a static logo and no footer).
 * ───────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: 'Documentation — CMMC Gateway in 60 Seconds',
  description:
    'HoundShield is an OpenAI-compatible proxy: one baseURL change and every AI query from your team is scanned for CUI, CAGE codes, contract numbers and clearance data before it leaves your perimeter.',
  alternates: { canonical: 'https://houndshield.com/docs' },
}

const GATEWAY_URL = 'https://proxy.houndshield.com/v1'

const SIDEBAR: Array<{ group: string; items: Array<{ label: string; href: string; on?: boolean }> }> = [
  {
    group: 'Guide',
    items: [
      { label: 'Quickstart', href: '#quickstart', on: true },
      { label: 'What gets detected', href: '#detected' },
    ],
  },
  {
    group: 'Endpoints',
    items: [
      { label: 'Gateway Intercept', href: '#sdk' },
      { label: 'Scan Text', href: '#sdk' },
      { label: 'Compliance Events', href: '#sdk' },
      { label: 'Quarantine Review', href: '#sdk' },
      { label: 'Generate Reports', href: '#sdk' },
      { label: 'Health Check', href: '#sdk' },
    ],
  },
  {
    group: 'SDK examples',
    items: [
      { label: 'JavaScript', href: '#sdk' },
      { label: 'Python', href: '#sdk' },
      { label: 'cURL', href: '#sdk' },
    ],
  },
]

const QUICKSTART_STEPS = [
  { n: '1', title: 'Get your API key', body: 'Sign up and copy your key from Dashboard → Settings → API Keys.' },
  { n: '2', title: 'Point your SDK at HoundShield', body: 'Replace the baseURL in any OpenAI-compatible client. Zero behavior change for your team.' },
  { n: '3', title: 'Every query is now CMMC-monitored', body: 'CUI, CAGE codes and clearance data are flagged before leaving your perimeter.' },
]

export default function DocsPage() {
  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />

      <main className="page">
        <div className="section">
          <div className="container docs-wrap">
            <aside className="docs-side">
              {SIDEBAR.map((g) => (
                <div key={g.group} style={{ display: 'contents' }}>
                  <div className="gh">{g.group}</div>
                  {g.items.map((it) => (
                    <Link key={it.label} href={it.href} className={it.on ? 'on' : undefined}>
                      {it.label}
                    </Link>
                  ))}
                </div>
              ))}
            </aside>

            <div>
              <div className="eyebrow" style={{ color: 'var(--ok)' }} id="quickstart">⚡ Quickstart</div>
              <h2 className="display" style={{ margin: '.4rem 0 1rem' }}>CMMC gateway in 60 seconds</h2>
              <p className="muted" style={{ maxWidth: 640 }}>
                HoundShield is an OpenAI-compatible proxy. Every AI query from your team passes
                through it first. CUI, CAGE codes, contract numbers and clearance data are detected
                and blocked before they reach any provider.
              </p>

              <div className="steps" style={{ margin: '24px 0' }} id="detected">
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
                <span>{GATEWAY_URL}</span>
                <CopyText text={GATEWAY_URL} />
              </div>

              <div className="code" id="sdk">
                <div className="code-top"><span>JavaScript · OpenAI SDK</span><span>copy</span></div>
                <pre>
                  <span className="k">import</span> OpenAI <span className="k">from</span> <span className="s">&quot;openai&quot;</span>;{'\n'}
                  {'\n'}
                  <span className="c">{'// Drop-in replacement — just change baseURL'}</span>{'\n'}
                  <span className="k">const</span> client = <span className="k">new</span> OpenAI({'{'}{'\n'}
                  {'  '}baseURL: <span className="s">&quot;https://proxy.houndshield.com/v1&quot;</span>,{'\n'}
                  {'  '}apiKey: process.env.OPENAI_API_KEY,{'\n'}
                  {'  '}defaultHeaders: {'{'} <span className="s">&quot;X-HoundShield-Org&quot;</span>: <span className="s">&quot;acme-defense&quot;</span> {'}'},{'\n'}
                  {'}'});{'\n'}
                  {'\n'}
                  <span className="c">{'// Your existing code works unchanged'}</span>{'\n'}
                  <span className="k">const</span> res = <span className="k">await</span> client.chat.completions.create({'{'}{'\n'}
                  {'  '}model: <span className="s">&quot;gpt-4o&quot;</span>,{'\n'}
                  {'  '}messages: [{'{'} role: <span className="s">&quot;user&quot;</span>, content: <span className="s">&quot;Summarize our CAGE 1ABC2 contract&quot;</span> {'}'}],{'\n'}
                  {'}'});{'\n'}
                  <span className="c">{'// ↑ HoundShield detects the CAGE code and blocks it locally'}</span>{'\n'}
                  <span className="c">{'//   before the request ever reaches OpenAI.'}</span>
                </pre>
              </div>

              <div className="callout">
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
