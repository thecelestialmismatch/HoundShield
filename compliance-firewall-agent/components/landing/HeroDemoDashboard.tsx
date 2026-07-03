'use client'

/**
 * Hero "live demo dashboard" — an auto-playing, light cream/steel product
 * window that mirrors what a customer sees after login (LiveCommandCenter).
 * Purely a demo: the scan feed cycles through a fixed script and the counters
 * tick on a timer — no network, no real data. Styling lives in app/hermes.css
 * (`.demo-dash`, `.demo-row`, …). The window carries the HoundShield mark in
 * its title bar and a "Live demo" badge so it's never mistaken for live data.
 */

import { useEffect, useState } from 'react'
import { Logo } from '@/components/Logo'

type Feed = { verdict: 'BLOCKED' | 'PASSED'; label: string; detail: string; lat: string }

// Fixed demo script — cycles forever. Mirrors the real detection categories.
const SCRIPT: readonly Feed[] = [
  { verdict: 'BLOCKED', label: 'CUI',    detail: 'CAGE 1ABC2',        lat: '7ms' },
  { verdict: 'PASSED',  label: 'clean',  detail: 'quarterly metrics',  lat: '11ms' },
  { verdict: 'BLOCKED', label: 'PHI',    detail: 'MRN 4471902',        lat: '6ms' },
  { verdict: 'BLOCKED', label: 'secret', detail: 'sk-live-…a91',       lat: '5ms' },
  { verdict: 'PASSED',  label: 'clean',  detail: 'meeting summary',     lat: '13ms' },
  { verdict: 'BLOCKED', label: 'ITAR',   detail: 'export-control ref',  lat: '8ms' },
  { verdict: 'PASSED',  label: 'clean',  detail: 'code review',         lat: '9ms' },
  { verdict: 'BLOCKED', label: 'PII',    detail: 'SSN ***-**-1180',     lat: '6ms' },
]

const VISIBLE = 5

export function HeroDemoDashboard() {
  const [cursor, setCursor] = useState(VISIBLE)
  const [scans, setScans] = useState(1204)
  const [blocked, setBlocked] = useState(37)
  const [sprs, setSprs] = useState(84)

  useEffect(() => {
    // The hero demo always advances — it's the product showcase. Reduced-motion
    // is respected for the CSS transforms (row slide-in / ping) via the media
    // query in hermes.css; a ticking counter is not vestibular motion, so we do
    // not freeze the data here (freezing made the demo look broken).
    const id = setInterval(() => {
      setCursor((c) => c + 1)
      setScans((s) => s + Math.floor(1 + Math.random() * 3))
      setBlocked((b) => (Math.random() > 0.5 ? b + 1 : b))
      setSprs((v) => {
        // Drift gently within a believable 82–92 band.
        const next = v + (Math.random() > 0.5 ? 1 : -1)
        return Math.max(82, Math.min(92, next))
      })
    }, 1900)
    return () => clearInterval(id)
  }, [])

  // Build the visible window of the feed from the rolling cursor.
  const rows: Feed[] = Array.from({ length: VISIBLE }, (_, i) => {
    const idx = (((cursor - i) % SCRIPT.length) + SCRIPT.length) % SCRIPT.length
    return SCRIPT[idx]
  })

  const sprsPct = Math.round((sprs / 110) * 100 + 12) // visual fill, capped below

  return (
    <div className="demo-dash" aria-label="HoundShield live dashboard demonstration">
      <div className="demo-dash-bar">
        <div className="dots">
          <i style={{ background: '#ff5f56' }} />
          <i style={{ background: '#ffbd2e' }} />
          <i style={{ background: '#27c93f' }} />
        </div>
        <div className="demo-dash-brand group/brand">
          <Logo size={20} />
          <span>Hound<b>Shield</b></span>
        </div>
        <span className="demo-live"><i /> Live demo</span>
      </div>

      <div className="demo-dash-body">
        {/* Stat tiles */}
        <div className="demo-stats">
          <div className="demo-stat">
            <div className="k">Scans today</div>
            <div className="v steel">{scans.toLocaleString()}</div>
            <div className="d">across your team</div>
          </div>
          <div className="demo-stat">
            <div className="k">Blocked</div>
            <div className="v orange">{blocked}</div>
            <div className="d">CUI · PHI · secrets</div>
          </div>
          <div className="demo-stat">
            <div className="k">SPRS</div>
            <div className="v">{sprs}</div>
            <div className="d">NIST 800-171</div>
          </div>
        </div>

        {/* Compliance gauge */}
        <div className="demo-gauge">
          <div className="demo-gauge-top">
            <span className="lab">CMMC Level 2 coverage</span>
            <span className="val">{Math.min(99, sprsPct)}%</span>
          </div>
          <div className="demo-gauge-track">
            <div className="demo-gauge-fill" style={{ width: `${Math.min(99, sprsPct)}%` }} />
          </div>
        </div>

        {/* Live scan feed */}
        <div className="demo-feed-head">
          <span className="t">Live prompt scans</span>
          <span className="t">latency</span>
        </div>
        <div className="demo-feed">
          {rows.map((r, i) => (
            <div className="demo-row" key={`${cursor}-${i}`}>
              <div className="left">
                <span className={`verdict ${r.verdict === 'BLOCKED' ? 'block' : 'pass'}`}>
                  <span className="d" />
                  {r.verdict}
                </span>
                <span className="detail">{r.label} · {r.detail}</span>
              </div>
              <span className="lat">{r.lat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
