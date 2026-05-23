'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'

type ThreatStatus = 'BLOCKED' | 'PASSED' | 'FLAGGED'

interface ThreatItem {
  id: number
  status: ThreatStatus
  tool: string
  pattern: string
  ms: number
  time: string
}

const TOOLS = ['ChatGPT', 'Copilot', 'Claude', 'Gemini', 'Cursor', 'Codeium']
const PATTERNS = [
  'CUI: contract number',
  'PHI: patient name + DOB',
  'PII: SSN fragment',
  'IP: source code block',
  'ITAR: export control ref',
  'CUI: technical spec',
  'PHI: medical record ID',
  'PII: financial account',
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeItem(id: number): ThreatItem {
  const r = Math.random()
  const status: ThreatStatus = r < 0.55 ? 'BLOCKED' : r < 0.78 ? 'FLAGGED' : 'PASSED'
  return {
    id,
    status,
    tool: randomItem(TOOLS),
    pattern: status === 'PASSED' ? 'clean — no violations' : randomItem(PATTERNS),
    ms: Math.floor(Math.random() * 6) + 4,
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
  }
}

const INITIAL: ThreatItem[] = Array.from({ length: 5 }, (_, i) => makeItem(i))

const STATUS_CONFIG: Record<ThreatStatus, { label: string; bg: string; text: string; dot: string; Icon: typeof ShieldAlert }> = {
  BLOCKED: { label: 'BLOCKED', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', Icon: ShieldAlert },
  FLAGGED: { label: 'FLAGGED', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', Icon: AlertTriangle },
  PASSED:  { label: 'PASSED',  bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', Icon: ShieldCheck },
}

export function ThreatFeed() {
  const [items, setItems] = useState<ThreatItem[]>(INITIAL)
  const counterRef = useRef(INITIAL.length)

  useEffect(() => {
    const interval = setInterval(() => {
      counterRef.current += 1
      const next = makeItem(counterRef.current)
      setItems(prev => [next, ...prev].slice(0, 8))
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      data-testid="threat-feed"
      className="w-full rounded-[var(--radius-xl)] border border-[var(--hs-border)] bg-white overflow-hidden shadow-[var(--shadow-lg)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hs-border-subtle)] bg-[var(--hs-surface-1)]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-[var(--hs-ink)] font-[var(--font-body)]">
            Live intercept feed
          </span>
        </div>
        <span className="text-[10px] text-[var(--hs-ink-tertiary)] font-[var(--font-mono)]">
          {items.length} recent
        </span>
      </div>

      {/* Feed */}
      <div className="divide-y divide-[var(--hs-border-subtle)]">
        {items.map((item, idx) => {
          const cfg = STATUS_CONFIG[item.status]
          const Icon = cfg.Icon
          return (
            <div
              key={item.id}
              data-testid="threat-item"
              className="flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={{
                opacity: 1 - idx * 0.1,
                animation: idx === 0 ? 'slideInLeft 0.3s var(--ease-out) both' : undefined,
              }}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.text}`} />

              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide font-[var(--font-mono)] ${cfg.bg} ${cfg.text}`}
              >
                <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>

              <span className="text-xs text-[var(--hs-ink-secondary)] flex-1 truncate font-[var(--font-body)]">
                <span className="font-medium text-[var(--hs-ink)]">{item.tool}</span>
                {' — '}
                {item.pattern}
              </span>

              <span className="text-[10px] text-[var(--hs-ink-tertiary)] font-[var(--font-mono)] shrink-0">
                {item.ms}ms
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
