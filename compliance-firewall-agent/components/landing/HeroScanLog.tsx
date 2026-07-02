/**
 * Hero "terminal" card — verbatim port of the HERMES demo's `.term` block:
 *   1. the one-line proxy URL swap (api.openai.com -> proxy.houndshield.com)
 *   2. the demo's exact BLOCKED/PASSED scan rows (UPPERCASE verdicts,
 *      `label · ms` format)
 *
 * Static by design — the demo home terminal does not animate. All styling
 * comes from app/hermes.css (`.term`, `.term-bar`, `.term-row`, …).
 * Server component: no client JS shipped for this card.
 */

type Row = { verdict: 'BLOCKED' | 'PASSED'; detail: string }

// Demo Direction-A scan-log rows — exact copy, exact order.
const ROWS: readonly Row[] = [
  { verdict: 'BLOCKED', detail: 'CUI · CAGE 1ABC2 · 7ms' },
  { verdict: 'PASSED',  detail: 'clean · 11ms' },
  { verdict: 'BLOCKED', detail: 'PHI · MRN · 6ms' },
  { verdict: 'BLOCKED', detail: 'secret · sk-… · 5ms' },
  { verdict: 'PASSED',  detail: 'clean · 13ms' },
]

export function HeroScanLog() {
  return (
    <div className="term" aria-label="HoundShield scan demonstration">
      <div className="term-bar">
        <i style={{ background: '#ff5f56' }} />
        <i style={{ background: '#ffbd2e' }} />
        <i style={{ background: '#27c93f' }} />
        <span className="u">proxy-config.env</span>
      </div>
      <div className="term-body">
        <div className="cmt"># Before — sent straight to OpenAI</div>
        <div><span className="var">OPENAI_BASE_URL</span>=https://api.openai.com/v1</div>
        <div style={{ height: '.6rem' }} />
        <div className="cmt"># After — routed through HoundShield</div>
        <div><span className="var">OPENAI_BASE_URL</span>=<span className="str">https://proxy.houndshield.com/v1</span></div>
        <div style={{ height: '.9rem' }} />
        {ROWS.map((r, i) => (
          <div key={i} className="term-row">
            <span className={r.verdict === 'BLOCKED' ? 'tag-block' : 'tag-pass'}>● {r.verdict}</span>
            <span className="lat">{r.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
