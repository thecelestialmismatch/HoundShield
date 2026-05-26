'use client'

import { useEffect, useState } from 'react'

const DEADLINE = new Date('2026-11-10T00:00:00Z')

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, DEADLINE.getTime() - Date.now())
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function CountdownTimer() {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft)

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(t)
  }, [])

  const blocks = [
    { value: pad(time.days),    label: 'DD' },
    { value: pad(time.hours),   label: 'HH' },
    { value: pad(time.minutes), label: 'MM' },
    { value: pad(time.seconds), label: 'SS', testId: 'countdown-seconds' },
  ]

  return (
    <div data-testid="countdown" className="flex items-center gap-2">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div
              {...(b.testId ? { 'data-testid': b.testId } : {})}
              className="font-[var(--font-mono)] text-2xl font-semibold text-[var(--hs-ink)] tabular-nums min-w-[2.5rem] text-center"
            >
              {b.value}
            </div>
            <div className="text-[9px] font-semibold tracking-widest text-[var(--hs-ink-tertiary)] font-[var(--font-body)] mt-0.5">
              {b.label}
            </div>
          </div>
          {i < 3 && (
            <span className="font-[var(--font-mono)] text-xl text-[var(--hs-ink-tertiary)] mb-3 select-none">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
