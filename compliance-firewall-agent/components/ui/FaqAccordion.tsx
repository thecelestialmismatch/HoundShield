'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqItem[]
  className?: string
}

/**
 * The one FAQ accordion for every marketing page (hermes and v3-light both
 * resolve the same steel --hs-* palette, so a single component serves both).
 * Card-per-question with a clear open state; answers stay in the DOM for
 * SEO/AEO parity with the FAQPage JSON-LD emitted alongside it.
 */
export function FaqAccordion({ items, className = '' }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(null)
  const baseId = useId()

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {items.map((item, i) => {
        const isOpen = open === i
        const panelId = `${baseId}-faq-panel-${i}`
        return (
          <div
            key={i}
            data-testid="faq-item"
            className={`rounded-2xl border bg-white transition-all duration-200 ${
              isOpen
                ? 'border-[var(--hs-border-strong)] shadow-[0_12px_32px_rgba(20,44,70,0.10)]'
                : 'border-[var(--hs-border)] hover:border-[var(--hs-border-strong)] hover:shadow-[0_6px_18px_rgba(20,44,70,0.06)]'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full flex items-start justify-between gap-4 px-5 py-5 sm:px-6 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-steel)] focus-visible:ring-offset-2 rounded-2xl"
            >
              <span className="text-base sm:text-[1.05rem] font-semibold leading-snug text-[var(--hs-ink)] font-[var(--font-body)]">
                {item.question}
              </span>
              <span
                aria-hidden
                className={`shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 ${
                  isOpen
                    ? 'rotate-180 border-transparent bg-[var(--hs-steel-dark)] text-white'
                    : 'border-[var(--hs-border)] bg-[var(--hs-surface-1)] text-[var(--hs-ink-tertiary)] group-hover:border-[var(--hs-border-strong)] group-hover:text-[var(--hs-ink-secondary)]'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </span>
            </button>

            <div
              id={panelId}
              data-testid="faq-answer"
              aria-hidden={!isOpen}
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows 300ms var(--ease-out)',
              }}
            >
              <div className="overflow-hidden">
                <p className="px-5 sm:px-6 pb-5 text-[15px] leading-[1.7] text-[var(--hs-ink-secondary)] font-[var(--font-body)]">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
