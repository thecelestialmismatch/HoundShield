'use client'

/**
 * Hero "live demo dashboard" — the floating product window on the marketing
 * hero. Redesigned 2026-07-18 (founder direction) into the soft AURORA skin:
 * a cool slate-blue → pale-sage gradient stage with glass "ghost" cards behind
 * a light, rounded product window — the same language as the after-login
 * console, so the hero and the real dashboard read as one family.
 *
 * Still a pure demo: every value (ticking KPIs, a live throughput LINE chart,
 * a pastel detection DONUT, per-engine + destination BARS, an SPRS coverage
 * gauge and a streaming scan feed) is driven by ONE timer — no network, no
 * real data. Styles are scoped under `.hs-demo` and injected inline so the
 * skin can't leak into or be overridden by the surrounding hero.
 *
 * Identity is never colour-alone: every bar/segment carries its own label and
 * number, and every panel has a plain-English caption. All data is simulated
 * and the window is explicitly badged "Live demo".
 */

import { useEffect, useState } from 'react'
import { Activity, Shield, Gauge, AlertTriangle, Search, Settings, Plus } from 'lucide-react'
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

// Engine bar chart — [label, colour, base value]. Pastel aurora accents.
const ENGINES: [string, string, number][] = [
  ['CUI', 'var(--a-lime)', 61],
  ['Secrets', 'var(--a-peach)', 48],
  ['PII', 'var(--a-peri)', 83],
  ['PHI', 'var(--a-green)', 27],
  ['Source/IP', 'var(--a-steel)', 35],
  ['CAGE', 'var(--a-lime-2)', 19],
]

// Where prompts go — [tool, colour, share %]. Sums to 100; identity is never
// colour-alone (each row carries its label + percentage).
const DESTS: [string, string, number][] = [
  ['ChatGPT', 'var(--a-peri)', 46],
  ['Copilot', 'var(--a-peach)', 31],
  ['Claude', 'var(--a-lime)', 18],
  ['Other', 'var(--a-steel)', 5],
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

  // ── Donut geometry (pastel aurora sweep) ──
  const mt = mix.reduce((a, b) => a + b, 0)
  const mp = mix.map((v) => (v / mt) * 100)
  const a0 = mp[0], a1 = a0 + mp[1], a2 = a1 + mp[2]
  const donut = `conic-gradient(var(--a-lime) 0 ${a0}%, var(--a-peach) ${a0}% ${a1}%, var(--a-peri) ${a1}% ${a2}%, var(--a-steel) ${a2}% 100%)`
  const legend = [
    ['CUI', 'var(--a-lime)', mp[0]],
    ['Secrets', 'var(--a-peach)', mp[1]],
    ['PII', 'var(--a-peri)', mp[2]],
    ['PHI', 'var(--a-steel)', mp[3]],
  ] as const
  const coverage = clamp(Math.round((sprs / 110) * 100 + 12), 60, 99)

  return (
    <div className="hs-demo" aria-label="HoundShield live dashboard demonstration">
      <style dangerouslySetInnerHTML={{ __html: DEMO_CSS }} />

      {/* Glass "ghost" cards stacked behind the window (aurora depth). */}
      <div className="hd-ghost g1" aria-hidden="true" />
      <div className="hd-ghost g2" aria-hidden="true" />

      <div className="hd-window">
        {/* Title bar */}
        <div className="hd-bar">
          <div className="hd-brand-row">
            <span className="hd-brand hd-badge group/brand"><Logo variant="dark" size={17} /></span>
            <span className="hd-name">Hound<b>Shield</b></span>
          </div>
          <div className="hd-bar-r">
            <span className="hd-live"><i /> Live demo</span>
            <button type="button" className="hd-icobtn" aria-label="Settings" tabIndex={-1}><Settings /></button>
            <button type="button" className="hd-icobtn" aria-label="Search" tabIndex={-1}><Search /></button>
            <span className="hd-avatar" aria-hidden="true">AD</span>
          </div>
        </div>

        <div className="hd-body">
          {/* Heading row — mirrors the reference's "My … + Add" band */}
          <div className="hd-head">
            <h3 className="hd-h">Live AI Monitor</h3>
            <button type="button" className="hd-add" tabIndex={-1}><Plus /> New scan</button>
          </div>

          {/* KPI tiles — circular icon badge + big number + green delta */}
          <div className="hd-kpis">
            <div className="hd-kpi">
              <span className="hd-kpi-ic lime"><Activity /></span>
              <div className="k">Scans 24h</div>
              <div className="v">{scans.toLocaleString()}</div>
              <div className="delta up">▲ ~46/min</div>
            </div>
            <div className="hd-kpi">
              <span className="hd-kpi-ic peach"><Shield /></span>
              <div className="k">Blocked</div>
              <div className="v">{blocked.toLocaleString()}</div>
              <div className="delta up">▲ CUI · PII · secrets</div>
            </div>
            <div className="hd-kpi">
              <span className="hd-kpi-ic peri"><Gauge /></span>
              <div className="k">SPRS</div>
              <div className="v">{sprs}</div>
              <div className="delta up">▲ NIST 800-171</div>
            </div>
            <div className="hd-kpi">
              <span className="hd-kpi-ic amber"><AlertTriangle /></span>
              <div className="k">Quarantine</div>
              <div className="v">{quar}</div>
              <div className="delta">awaiting review</div>
            </div>
          </div>

          {/* Line chart + donut */}
          <div className="hd-grid">
            <div className="hd-card">
              <div className="hd-ph"><span>Gateway throughput</span><span className="live"><i /> prompts/sec</span></div>
              <p className="hd-cap">Prompts flowing through the local gateway, scanned in &lt;10ms each.</p>
              <svg className="hd-line" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="throughput line chart">
                <defs>
                  <linearGradient id="hdStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--a-steel)" /><stop offset="55%" stopColor="var(--a-peri)" /><stop offset="100%" stopColor="var(--a-lime)" />
                  </linearGradient>
                  <linearGradient id="hdFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--a-steel)" stopOpacity="0.20" /><stop offset="100%" stopColor="var(--a-steel)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} className="hd-grid-l" />
                <line x1="0" y1={H * 0.8} x2={W} y2={H * 0.8} className="hd-grid-l" />
                <polygon points={area} fill="url(#hdFill)" />
                <polyline points={line} fill="none" stroke="url(#hdStroke)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={lx} cy={ly} r="3.4" fill="var(--a-lime)" />
                <circle cx={lx} cy={ly} r="6.5" fill="var(--a-lime)" opacity="0.28" />
              </svg>
            </div>

            <div className="hd-card">
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
            <div className="hd-card">
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
            <div className="hd-card">
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
    </div>
  )
}

const DEMO_CSS = `
.hs-demo{
  --a-stage: var(--hs-aurora-bg, linear-gradient(155deg,#C9D1DB 0%,#D3D8D5 44%,#DFE6D2 100%));
  --a-win:#EEF2F6; --a-bar:#F5F7F9; --a-card:#FFFFFF; --a-line:rgba(30,42,55,.08);
  --a-ink:#1E2A37; --a-mut:#5A6675; --a-mut2:#8A94A2;
  --a-steel: var(--hs-steel, #81A6C6); --a-lime: var(--hs-lime, #B6D94E); --a-lime-2: var(--hs-lime-soft, #D7EC95);
  --a-peach: var(--hs-peach, #F0B880); --a-peri: var(--hs-peri, #A9C7EE); --a-green:#37A05A;
  --a-action: var(--hs-action, #2F6BF0);
  --a-disp:var(--font-display),system-ui,sans-serif; --a-mono:var(--font-mono),ui-monospace,monospace;
  position:relative; padding:26px 20px 22px; border-radius:26px;
  background:var(--a-stage);
  box-shadow:0 40px 90px rgba(56,78,112,.28), inset 0 1px 0 rgba(255,255,255,.5);
  color:var(--a-ink); font-family:var(--font-body),system-ui,sans-serif;
}
.hs-demo *{box-sizing:border-box}

/* Glass ghost cards peeking above the window */
.hs-demo .hd-ghost{position:absolute;left:50%;transform:translateX(-50%);border-radius:20px;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.5);box-shadow:0 10px 30px rgba(56,78,112,.10)}
.hs-demo .hd-ghost.g1{top:8px;width:82%;height:60px}
.hs-demo .hd-ghost.g2{top:17px;width:91%;height:60px;background:rgba(255,255,255,.28)}

.hs-demo .hd-window{position:relative;border-radius:22px;overflow:hidden;background:var(--a-win);box-shadow:0 24px 60px rgba(56,78,112,.22), 0 2px 0 rgba(255,255,255,.6)}

/* Title bar */
.hs-demo .hd-bar{display:flex;align-items:center;gap:.6rem;padding:.8rem 1rem;background:var(--a-bar);border-bottom:1px solid var(--a-line)}
.hs-demo .hd-brand-row{display:flex;align-items:center;gap:.5rem}
.hs-demo .hd-badge{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#3F7BD6,#5A86A8);box-shadow:0 3px 8px rgba(63,123,214,.32)}
.hs-demo .hd-name{font-family:var(--a-disp);font-weight:700;font-size:1rem;letter-spacing:-.01em;color:var(--a-ink)}
.hs-demo .hd-name b{color:var(--a-steel);font-weight:700}
.hs-demo .hd-bar-r{margin-left:auto;display:flex;align-items:center;gap:.55rem}
.hs-demo .hd-live{display:inline-flex;align-items:center;gap:.4rem;font-family:var(--a-mono);font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#2E7D52;background:rgba(55,160,90,.14);border:1px solid rgba(55,160,90,.28);border-radius:99px;padding:.24rem .55rem;margin-right:.2rem}
.hs-demo .hd-live i{width:6px;height:6px;border-radius:50%;background:#37A05A;animation:hdPing 1.6s ease infinite}
@keyframes hdPing{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.6)}}
.hs-demo .hd-icobtn{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:#fff;border:1px solid var(--a-line);color:var(--a-mut);cursor:default}
.hs-demo .hd-icobtn svg{width:15px;height:15px}
.hs-demo .hd-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:.62rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#F0B880,#E07B39);box-shadow:0 2px 6px rgba(224,123,57,.32)}

.hs-demo .hd-body{padding:1rem 1.05rem 1.15rem}
.hs-demo .hd-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:.85rem}
.hs-demo .hd-h{font-family:var(--a-disp);font-weight:700;font-size:1.32rem;letter-spacing:-.01em;color:var(--a-ink)}
.hs-demo .hd-add{display:inline-flex;align-items:center;gap:.3rem;font-size:.74rem;font-weight:700;color:#fff;background:var(--a-action);border:none;border-radius:9px;padding:.45rem .7rem;cursor:default;box-shadow:0 6px 16px rgba(47,107,240,.28)}
.hs-demo .hd-add svg{width:14px;height:14px}

/* KPI tiles */
.hs-demo .hd-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-bottom:.75rem}
.hs-demo .hd-kpi{position:relative;background:var(--a-card);border:1px solid var(--a-line);border-radius:14px;padding:.7rem .75rem;box-shadow:0 2px 10px rgba(56,78,112,.06)}
.hs-demo .hd-kpi-ic{position:absolute;top:.6rem;right:.6rem;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;color:var(--a-ink)}
.hs-demo .hd-kpi-ic svg{width:14px;height:14px}
.hs-demo .hd-kpi-ic.lime{background:rgba(182,217,78,.30)} .hs-demo .hd-kpi-ic.peach{background:rgba(240,184,128,.34)} .hs-demo .hd-kpi-ic.peri{background:rgba(169,199,238,.42)} .hs-demo .hd-kpi-ic.amber{background:rgba(240,184,74,.30)}
.hs-demo .hd-kpi .k{font-size:.6rem;font-weight:600;letter-spacing:.02em;color:var(--a-mut2);text-transform:uppercase}
.hs-demo .hd-kpi .v{font-family:var(--a-disp);font-weight:700;font-size:1.42rem;line-height:1.15;margin-top:.15rem;color:var(--a-ink);font-variant-numeric:tabular-nums}
.hs-demo .hd-kpi .delta{font-size:.6rem;color:var(--a-mut2);margin-top:.15rem}
.hs-demo .hd-kpi .delta.up{color:var(--a-green);font-weight:600}

.hs-demo .hd-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:.6rem;margin-bottom:.75rem}
.hs-demo .hd-grid-even{grid-template-columns:1fr 1fr}
.hs-demo .hd-card{background:var(--a-card);border:1px solid var(--a-line);border-radius:16px;padding:.75rem .8rem;box-shadow:0 2px 10px rgba(56,78,112,.06)}
.hs-demo .hd-ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:.4rem;font-size:.72rem;font-weight:700;color:var(--a-ink)}
.hs-demo .hd-ph .mono{font-family:var(--a-mono);font-size:.58rem;font-weight:600;color:var(--a-mut2)}
.hs-demo .hd-ph .live{display:inline-flex;align-items:center;gap:.3rem;font-family:var(--a-mono);font-size:.56rem;font-weight:600;color:var(--a-green)}
.hs-demo .hd-ph .live i{width:6px;height:6px;border-radius:50%;background:var(--a-green);animation:hdPing 1.6s ease infinite}
.hs-demo .hd-cap{font-size:.6rem;line-height:1.45;color:var(--a-mut);margin:-.1rem 0 .5rem}
.hs-demo .hd-line{width:100%;height:80px;display:block}
.hs-demo .hd-grid-l{stroke:rgba(30,42,55,.06);stroke-width:1}

.hs-demo .hd-donut-wrap{display:flex;align-items:center;gap:.7rem}
.hs-demo .hd-donut{width:82px;height:82px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;transition:background .6s ease}
.hs-demo .hd-donut-c{width:52px;height:52px;border-radius:50%;background:var(--a-card);display:grid;place-items:center;text-align:center;box-shadow:inset 0 0 0 1px var(--a-line)}
.hs-demo .hd-donut-c b{font-family:var(--a-disp);font-size:.78rem;font-weight:700;color:var(--a-ink)}
.hs-demo .hd-donut-c span{font-size:.5rem;color:var(--a-mut2)}
.hs-demo .hd-legend{display:flex;flex-direction:column;gap:.28rem;font-size:.66rem;color:var(--a-mut)}
.hs-demo .hd-legend div{display:flex;align-items:center;gap:.4rem}
.hs-demo .hd-legend i{width:9px;height:9px;border-radius:3px}
.hs-demo .hd-legend b{margin-left:auto;font-family:var(--a-mono);color:var(--a-ink);font-weight:700}

.hs-demo .hd-bars{display:flex;flex-direction:column;gap:.36rem}
.hs-demo .hd-bar-row{display:grid;grid-template-columns:64px 1fr 26px;align-items:center;gap:.5rem}
.hs-demo .hd-bar-lab{font-size:.64rem;color:var(--a-mut)}
.hs-demo .hd-bar-track{height:8px;border-radius:99px;background:rgba(30,42,55,.06);overflow:hidden}
.hs-demo .hd-bar-track i{display:block;height:100%;border-radius:99px;transition:width .7s cubic-bezier(.22,.61,.36,1)}
.hs-demo .hd-bar-row b{font-family:var(--a-mono);font-size:.62rem;color:var(--a-ink);text-align:right;font-weight:700}

.hs-demo .hd-gauge{background:var(--a-card);border:1px solid var(--a-line);border-radius:16px;padding:.7rem .8rem;margin-bottom:.75rem;box-shadow:0 2px 10px rgba(56,78,112,.06)}
.hs-demo .hd-gauge-top{display:flex;justify-content:space-between;align-items:baseline;gap:.6rem;margin-bottom:.4rem;font-size:.64rem;color:var(--a-mut)}
.hs-demo .hd-gauge-top .val{font-family:var(--a-mono);font-size:.64rem;font-weight:700;color:var(--a-steel);flex-shrink:0}
.hs-demo .hd-gauge-track{height:9px;border-radius:99px;background:rgba(30,42,55,.06);overflow:hidden}
.hs-demo .hd-gauge-track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--a-peri),var(--a-lime));transition:width .8s ease}

.hs-demo .feed-h{margin-bottom:.45rem}
.hs-demo .hd-feed{display:flex;flex-direction:column;gap:.34rem}
.hs-demo .hd-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.55rem;padding:.42rem .55rem;border-radius:11px;background:var(--a-card);border:1px solid var(--a-line);box-shadow:0 1px 4px rgba(56,78,112,.05);animation:hdRowIn .4s cubic-bezier(.22,.61,.36,1)}
@keyframes hdRowIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.hs-demo .hd-tag{font-family:var(--a-mono);font-size:.55rem;font-weight:700;letter-spacing:.03em;padding:.14rem .42rem;border-radius:6px}
.hs-demo .hd-tag.blocked{color:#B3413A;background:rgba(224,123,57,.16)}
.hs-demo .hd-tag.passed{color:#2E7D52;background:rgba(55,160,90,.16)}
.hs-demo .hd-tag.quar{color:#8A5200;background:rgba(240,184,74,.20)}
.hs-demo .hd-detail{font-family:var(--a-mono);font-size:.62rem;color:var(--a-mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hs-demo .hd-lat{font-family:var(--a-mono);font-size:.58rem;color:var(--a-mut2)}

@media (max-width:560px){ .hs-demo{padding:20px 12px 14px} .hs-demo .hd-kpis{grid-template-columns:1fr 1fr} .hs-demo .hd-grid,.hs-demo .hd-grid-even{grid-template-columns:1fr} }
@media (prefers-reduced-motion:reduce){ .hs-demo .hd-live i,.hs-demo .hd-ph .live i,.hs-demo .hd-row{animation:none} }
`
