'use client'

/**
 * Hero "live demo dashboard" — a self-contained DARK, colourful product window
 * that auto-plays on the (light) marketing hero so it pops. Mirrors what a
 * customer sees after login: ticking KPI tiles, a live throughput LINE chart,
 * a detection-mix DONUT/PIE, a per-engine BAR chart, and a streaming scan feed.
 * Purely a demo — everything is driven by one timer, no network, no real data.
 * Styles are scoped under `.hs-demo` and injected inline so the dark theme
 * never leaks into or is overridden by the light hero.
 */

import { useEffect, useState } from 'react'
import { Logo } from '@/components/Logo'

type Row = { verdict: 'BLOCKED' | 'PASSED' | 'QUAR'; label: string; detail: string; lat: string }

const SCRIPT: readonly Row[] = [
  { verdict: 'BLOCKED', label: 'CUI', detail: 'CAGE 1ABC2 + contract #', lat: '7ms' },
  { verdict: 'PASSED', label: 'clean', detail: 'weekly status email', lat: '11ms' },
  { verdict: 'BLOCKED', label: 'Secret', detail: 'sk-live-…a91 API key', lat: '5ms' },
  { verdict: 'QUAR', label: 'PHI', detail: 'patient MRN 4471902', lat: '8ms' },
  { verdict: 'PASSED', label: 'clean', detail: 'summarize public RFP', lat: '12ms' },
  { verdict: 'BLOCKED', label: 'PII', detail: 'SSN ***-**-1180', lat: '6ms' },
  { verdict: 'BLOCKED', label: 'ITAR', detail: 'export-control specs', lat: '8ms' },
  { verdict: 'PASSED', label: 'clean', detail: 'refactor python fn', lat: '9ms' },
  { verdict: 'QUAR', label: 'Cloud', detail: 'AWS AKIA… access key', lat: '6ms' },
  { verdict: 'BLOCKED', label: 'Clearance', detail: '"TS/SCI" + name', lat: '5ms' },
]

// Engine bar chart — [label, colour, base value]
const ENGINES: [string, string, number][] = [
  ['CUI', 'var(--d-steel)', 61],
  ['Secrets', 'var(--d-red)', 48],
  ['PII', 'var(--d-amber)', 83],
  ['PHI', 'var(--d-green)', 27],
  ['Source/IP', 'var(--d-violet)', 35],
  ['CAGE', 'var(--d-sky)', 19],
]

// Where prompts go — [tool, colour, share %]. Sums to 100; identity is never
// colour-alone (each row carries its label + percentage).
const DESTS: [string, string, number][] = [
  ['ChatGPT', 'var(--d-sky)', 46],
  ['Copilot', 'var(--d-orange)', 31],
  ['Claude', 'var(--d-green)', 18],
  ['Other', 'var(--d-violet)', 5],
]

const N = 40 // line-chart points
const FEED = 5
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const drift = (v: number, d: number, lo: number, hi: number) =>
  clamp(v + Math.round((Math.random() - 0.5) * d), lo, hi)

export function HeroDemoDashboard() {
  const [scans, setScans] = useState(142690)
  const [blocked, setBlocked] = useState(2218)
  const [quar, setQuar] = useState(14)
  const [sprs, setSprs] = useState(84)
  const [p50, setP50] = useState(7)
  const [series, setSeries] = useState<number[]>(() =>
    Array.from({ length: N }, () => 40 + Math.round(Math.random() * 34)),
  )
  const [mix, setMix] = useState<number[]>([34, 24, 27, 15]) // CUI · Secrets · PII · PHI
  const [bars, setBars] = useState<number[]>(ENGINES.map((e) => e[2]))
  const [feed, setFeed] = useState<Row[]>(() =>
    Array.from({ length: FEED }, (_, i) => SCRIPT[i % SCRIPT.length]),
  )

  useEffect(() => {
    let step = 0
    const id = setInterval(() => {
      step++
      setSeries((s) => [...s.slice(1), clamp(s[s.length - 1] + Math.round((Math.random() - 0.45) * 22), 12, 92)])
      setScans((v) => v + 2 + Math.floor(Math.random() * 12))
      setP50(() => 5 + Math.floor(Math.random() * 5))
      setBars((b) => b.map((v) => drift(v, 14, 8, 98)))
      setMix((m) => m.map((v) => drift(v, 3, 8, 45)))
      setSprs((v) => drift(v, 1, 82, 92))
      // every other tick, push a feed row + bump the matching KPI
      if (step % 2 === 0) {
        const r = SCRIPT[Math.floor(Math.random() * SCRIPT.length)]
        setFeed((f) => [r, ...f].slice(0, FEED))
        if (r.verdict === 'BLOCKED') setBlocked((v) => v + 1)
        if (r.verdict === 'QUAR') setQuar((v) => v + 1)
      }
    }, 1500)
    return () => clearInterval(id)
  }, [])

  // ── Line chart geometry ──
  const W = 300, H = 84, MAX = 100
  const pts = series.map((v, i) => [(i / (N - 1)) * W, H - (v / MAX) * (H - 6) - 3])
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `0,${H} ${line} ${W},${H}`
  const [lx, ly] = pts[pts.length - 1]

  // ── Donut geometry ──
  const mt = mix.reduce((a, b) => a + b, 0)
  const mp = mix.map((v) => (v / mt) * 100)
  const a0 = mp[0], a1 = a0 + mp[1], a2 = a1 + mp[2]
  const donut = `conic-gradient(var(--d-steel) 0 ${a0}%, var(--d-red) ${a0}% ${a1}%, var(--d-amber) ${a1}% ${a2}%, var(--d-green) ${a2}% 100%)`
  const legend = [
    ['CUI', 'var(--d-steel)', mp[0]],
    ['Secrets', 'var(--d-red)', mp[1]],
    ['PII', 'var(--d-amber)', mp[2]],
    ['PHI', 'var(--d-green)', mp[3]],
  ] as const
  const coverage = clamp(Math.round((sprs / 110) * 100 + 12), 60, 99)

  return (
    <div className="hs-demo" aria-label="HoundShield live dashboard demonstration">
      <style dangerouslySetInnerHTML={{ __html: DEMO_CSS }} />

      {/* Title bar */}
      <div className="hd-bar">
        <div className="hd-dots"><i style={{ background: '#ff5f56' }} /><i style={{ background: '#ffbd2e' }} /><i style={{ background: '#27c93f' }} /></div>
        <div className="hd-brand group/brand"><Logo variant="dark" size={18} /><span>Hound<b>Shield</b></span></div>
        <span className="hd-live"><i /> Live demo</span>
      </div>

      <div className="hd-body">
        {/* KPI tiles */}
        <div className="hd-kpis">
          <div className="hd-kpi"><div className="k">Scans 24h</div><div className="v steel">{scans.toLocaleString()}</div><div className="d">~46/min</div></div>
          <div className="hd-kpi"><div className="k">Blocked</div><div className="v red">{blocked.toLocaleString()}</div><div className="d">CUI · PII · secrets</div></div>
          <div className="hd-kpi"><div className="k">Quarantine</div><div className="v amber">{quar}</div><div className="d">awaiting review</div></div>
          <div className="hd-kpi"><div className="k">Gateway p50</div><div className="v green">{p50}ms</div><div className="d">fully local</div></div>
        </div>

        {/* Line chart + donut */}
        <div className="hd-grid">
          <div className="hd-panel">
            <div className="hd-ph"><span>Gateway throughput</span><span className="live"><i /> prompts/sec</span></div>
            <p className="hd-cap">Prompts flowing through the local gateway, scanned in &lt;10ms each.</p>
            <svg className="hd-line" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="throughput line chart">
              <defs>
                <linearGradient id="hdStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--d-steel)" /><stop offset="60%" stopColor="var(--d-sky)" /><stop offset="100%" stopColor="var(--d-orange)" />
                </linearGradient>
                <linearGradient id="hdFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--d-steel)" stopOpacity="0.28" /><stop offset="100%" stopColor="var(--d-steel)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} className="hd-grid-l" />
              <line x1="0" y1={H * 0.8} x2={W} y2={H * 0.8} className="hd-grid-l" />
              <polygon points={area} fill="url(#hdFill)" />
              <polyline points={line} fill="none" stroke="url(#hdStroke)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={lx} cy={ly} r="3.4" fill="var(--d-orange)" />
              <circle cx={lx} cy={ly} r="6.5" fill="var(--d-orange)" opacity="0.22" />
            </svg>
          </div>

          <div className="hd-panel">
            <div className="hd-ph"><span>Detection mix</span><span className="mono">today</span></div>
            <p className="hd-cap">What the blocks were — CUI, secrets, PII and PHI.</p>
            <div className="hd-donut-wrap">
              <div className="hd-donut" style={{ background: donut }}><div className="hd-donut-c"><b>{blocked.toLocaleString()}</b><span>blocked</span></div></div>
              <div className="hd-legend">
                {legend.map(([label, colour, v]) => (
                  <div key={label}><i style={{ background: colour }} /> {label} <b>{Math.round(v)}%</b></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Engine bars + AI destinations, side by side */}
        <div className="hd-grid hd-grid-even">
          <div className="hd-panel">
            <div className="hd-ph"><span>Detections by engine</span><span className="live"><i /> live</span></div>
            <p className="hd-cap">Which of the 16 detection engines are firing right now.</p>
            <div className="hd-bars">
              {ENGINES.map(([label, colour], i) => (
                <div className="hd-bar-row" key={label}>
                  <span className="hd-bar-lab">{label}</span>
                  <div className="hd-bar-track"><i style={{ width: `${bars[i]}%`, background: colour }} /></div>
                  <b>{bars[i]}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="hd-panel">
            <div className="hd-ph"><span>Where prompts go</span><span className="mono">24h</span></div>
            <p className="hd-cap">The AI tools your team uses — every prompt scanned locally first.</p>
            <div className="hd-bars">
              {DESTS.map(([label, colour, share]) => (
                <div className="hd-bar-row" key={label}>
                  <span className="hd-bar-lab">{label}</span>
                  <div className="hd-bar-track"><i style={{ width: `${share * 2}%`, background: colour }} /></div>
                  <b>{share}%</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SPRS coverage gauge */}
        <div className="hd-gauge">
          <div className="hd-gauge-top"><span>CMMC Level 2 coverage — DoD supplier score, live from the assessment</span><span className="val">SPRS {sprs} · {coverage}%</span></div>
          <div className="hd-gauge-track"><i style={{ width: `${coverage}%` }} /></div>
        </div>

        {/* Live feed */}
        <div className="hd-ph feed-h"><span>Live prompt scans</span><span className="mono">on-device</span></div>
        <div className="hd-feed">
          {feed.map((r, i) => (
            <div className="hd-row" key={`${r.label}-${i}-${scans}`}>
              <span className={`hd-tag ${r.verdict.toLowerCase()}`}>{r.verdict}</span>
              <span className="hd-detail">{r.label} · {r.detail}</span>
              <span className="hd-lat">{r.lat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const DEMO_CSS = `
.hs-demo{
  --d-bg:#0A1220; --d-panel:#0F1A2B; --d-panel2:#0C1524; --d-line:rgba(255,255,255,.08);
  --d-text:#E7EFF9; --d-mut:#93A7BE; --d-mut2:#5E7690;
  --d-steel:#7FB0D6; --d-sky:#A9D3E8; --d-orange:#F0894A; --d-green:#2FD08A;
  --d-red:#FF5C6C; --d-amber:#F0B84A; --d-violet:#A98BFF;
  --d-disp:var(--font-display),'Fraunces',serif; --d-mono:'JetBrains Mono',monospace;
  background:linear-gradient(180deg,#0B1322,#080E19);
  border:1px solid rgba(127,176,214,.22); border-radius:20px;
  box-shadow:0 30px 70px rgba(6,14,26,.5), 0 0 0 1px rgba(127,176,214,.06);
  overflow:hidden; color:var(--d-text); font-family:var(--font-body),system-ui,sans-serif;
}
.hs-demo *{box-sizing:border-box}
.hs-demo .hd-bar{display:flex;align-items:center;gap:.6rem;padding:.7rem .9rem;border-bottom:1px solid var(--d-line);background:rgba(255,255,255,.02)}
.hs-demo .hd-dots{display:flex;gap:.4rem}
.hs-demo .hd-dots i{width:11px;height:11px;border-radius:50%;display:block}
.hs-demo .hd-brand{display:flex;align-items:center;gap:.4rem;margin-left:.15rem}
.hs-demo .hd-brand span{font-family:var(--d-disp);font-weight:700;font-size:.9rem;letter-spacing:-.01em;color:#fff}
.hs-demo .hd-brand b{color:var(--d-sky)}
.hs-demo .hd-live{margin-left:auto;display:inline-flex;align-items:center;gap:.4rem;font-family:var(--d-mono);font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--d-green);background:rgba(47,208,138,.14);border:1px solid rgba(47,208,138,.3);border-radius:99px;padding:.22rem .55rem}
.hs-demo .hd-live i{width:7px;height:7px;border-radius:50%;background:var(--d-green);animation:hdPing 1.5s ease infinite}
@keyframes hdPing{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}

.hs-demo .hd-body{padding:.9rem .95rem 1.05rem}
.hs-demo .hd-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:.7rem}
.hs-demo .hd-kpi{background:var(--d-panel);border:1px solid var(--d-line);border-radius:11px;padding:.5rem .55rem}
.hs-demo .hd-kpi .k{font-family:var(--d-mono);font-size:.55rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--d-mut2)}
.hs-demo .hd-kpi .v{font-family:var(--d-disp);font-weight:700;font-size:1.28rem;line-height:1.15;margin-top:.12rem;font-variant-numeric:tabular-nums}
.hs-demo .hd-kpi .v.steel{color:var(--d-steel)} .hs-demo .hd-kpi .v.red{color:var(--d-red)} .hs-demo .hd-kpi .v.amber{color:var(--d-amber)} .hs-demo .hd-kpi .v.green{color:var(--d-green)}
.hs-demo .hd-kpi .d{font-size:.58rem;color:var(--d-mut2);margin-top:.02rem}

.hs-demo .hd-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:.55rem;margin-bottom:.7rem}
.hs-demo .hd-panel{background:var(--d-panel2);border:1px solid var(--d-line);border-radius:12px;padding:.6rem .65rem}
.hs-demo .hd-ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:.45rem;font-size:.66rem;font-weight:600;color:var(--d-mut)}
.hs-demo .hd-ph .mono{font-family:var(--d-mono);font-size:.58rem;color:var(--d-mut2)}
.hs-demo .hd-ph .live{display:inline-flex;align-items:center;gap:.3rem;font-family:var(--d-mono);font-size:.56rem;color:var(--d-green)}
.hs-demo .hd-ph .live i{width:6px;height:6px;border-radius:50%;background:var(--d-green);animation:hdPing 1.5s ease infinite}
.hs-demo .hd-cap{font-size:.58rem;line-height:1.4;color:var(--d-mut2);margin:-.2rem 0 .45rem}
.hs-demo .hd-grid-even{grid-template-columns:1fr 1fr;margin-bottom:.7rem}
.hs-demo .hd-line{width:100%;height:78px;display:block}
.hs-demo .hd-grid-l{stroke:rgba(255,255,255,.06);stroke-width:1}

.hs-demo .hd-donut-wrap{display:flex;align-items:center;gap:.6rem}
.hs-demo .hd-donut{width:76px;height:76px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;transition:background .6s ease}
.hs-demo .hd-donut-c{width:50px;height:50px;border-radius:50%;background:var(--d-panel2);display:grid;place-items:center;text-align:center}
.hs-demo .hd-donut-c b{font-family:var(--d-mono);font-size:.72rem;font-weight:700;color:#fff}
.hs-demo .hd-donut-c span{font-size:.5rem;color:var(--d-mut2)}
.hs-demo .hd-legend{display:flex;flex-direction:column;gap:.22rem;font-size:.64rem;color:var(--d-mut)}
.hs-demo .hd-legend div{display:flex;align-items:center;gap:.35rem}
.hs-demo .hd-legend i{width:8px;height:8px;border-radius:2px}
.hs-demo .hd-legend b{margin-left:auto;font-family:var(--d-mono);color:var(--d-text);font-weight:600}

.hs-demo .hd-bars-panel{margin-bottom:.7rem}
.hs-demo .hd-bars{display:flex;flex-direction:column;gap:.32rem}
.hs-demo .hd-bar-row{display:grid;grid-template-columns:64px 1fr 24px;align-items:center;gap:.5rem}
.hs-demo .hd-bar-lab{font-size:.62rem;color:var(--d-mut)}
.hs-demo .hd-bar-track{height:7px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden}
.hs-demo .hd-bar-track i{display:block;height:100%;border-radius:99px;transition:width .7s cubic-bezier(.22,.61,.36,1)}
.hs-demo .hd-bar-row b{font-family:var(--d-mono);font-size:.6rem;color:var(--d-text);text-align:right}

.hs-demo .hd-gauge{margin-bottom:.7rem}
.hs-demo .hd-gauge-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.3rem;font-size:.62rem;color:var(--d-mut)}
.hs-demo .hd-gauge-top .val{font-family:var(--d-mono);font-size:.62rem;color:var(--d-sky)}
.hs-demo .hd-gauge-track{height:8px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden}
.hs-demo .hd-gauge-track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--d-steel),var(--d-sky),var(--d-green));transition:width .8s ease}

.hs-demo .feed-h{margin-bottom:.4rem}
.hs-demo .hd-feed{display:flex;flex-direction:column;gap:.28rem}
.hs-demo .hd-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.55rem;padding:.38rem .5rem;border-radius:9px;background:rgba(255,255,255,.02);border:1px solid var(--d-line);animation:hdRowIn .4s cubic-bezier(.22,.61,.36,1)}
@keyframes hdRowIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.hs-demo .hd-tag{font-family:var(--d-mono);font-size:.55rem;font-weight:700;letter-spacing:.03em;padding:.12rem .4rem;border-radius:5px}
.hs-demo .hd-tag.blocked{color:var(--d-red);background:rgba(255,92,108,.14)}
.hs-demo .hd-tag.passed{color:var(--d-green);background:rgba(47,208,138,.14)}
.hs-demo .hd-tag.quar{color:var(--d-amber);background:rgba(240,184,74,.14)}
.hs-demo .hd-detail{font-family:var(--d-mono);font-size:.62rem;color:var(--d-mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hs-demo .hd-lat{font-family:var(--d-mono);font-size:.58rem;color:var(--d-mut2)}

@media (max-width:560px){ .hs-demo .hd-kpis{grid-template-columns:1fr 1fr} .hs-demo .hd-grid{grid-template-columns:1fr} }
@media (prefers-reduced-motion:reduce){ .hs-demo .hd-live i,.hs-demo .hd-ph .live i,.hs-demo .hd-row{animation:none} }
`
