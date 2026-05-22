'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type BillingCycle = 'monthly' | 'annual'

interface PricingToggleProps {
  onChange?: (cycle: BillingCycle) => void
}

export function PricingToggle({ onChange }: PricingToggleProps) {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  function toggle(next: BillingCycle) {
    setCycle(next)
    onChange?.(next)
  }

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => toggle('monthly')}
        className={`text-sm font-medium transition-colors font-[var(--font-body)] ${
          cycle === 'monthly' ? 'text-[var(--hs-ink)]' : 'text-[var(--hs-ink-tertiary)]'
        }`}
      >
        Monthly
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={cycle === 'annual'}
        onClick={() => toggle(cycle === 'monthly' ? 'annual' : 'monthly')}
        className="relative w-11 h-6 rounded-full border border-[var(--hs-border)] bg-[var(--hs-surface-1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-steel)]"
        style={{ background: cycle === 'annual' ? 'var(--hs-steel)' : undefined }}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
          style={{ x: cycle === 'annual' ? 20 : 0 }}
        />
      </button>

      <button
        type="button"
        onClick={() => toggle('annual')}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors font-[var(--font-body)] ${
          cycle === 'annual' ? 'text-[var(--hs-ink)]' : 'text-[var(--hs-ink-tertiary)]'
        }`}
      >
        Annual
        <AnimatePresence>
          {cycle === 'annual' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200"
            >
              −20%
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}
