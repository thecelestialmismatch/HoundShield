'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqItem[]
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="w-full divide-y divide-[var(--hs-border-subtle)]">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} data-testid="faq-item">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 py-5 text-left group focus-visible:outline-none"
            >
              <span className="text-sm font-medium text-[var(--hs-ink)] group-hover:text-[var(--hs-steel-dark)] transition-colors font-[var(--font-body)]">
                {item.question}
              </span>
              <span className="shrink-0 w-5 h-5 rounded-full border border-[var(--hs-border)] flex items-center justify-center text-[var(--hs-ink-tertiary)] group-hover:border-[var(--hs-border-strong)] transition-colors">
                {isOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              </span>
            </button>

            <div
              data-testid="faq-answer"
              aria-hidden={!isOpen}
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows 300ms var(--ease-out)',
              }}
            >
              <div className="overflow-hidden">
                <p className="pb-5 text-sm text-[var(--hs-ink-secondary)] leading-relaxed font-[var(--font-body)]">
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
