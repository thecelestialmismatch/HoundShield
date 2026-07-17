'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Link2, Check, ArrowUpRight } from 'lucide-react'
import { faqSlug, type FaqItem } from '@/lib/seo/faqs'

// Re-exported so long-standing consumers (`import { FaqItem } from
// '@/components/ui/FaqAccordion'`) keep resolving after the type moved to the
// data layer.
export type { FaqItem }

interface FaqAccordionProps {
  items: FaqItem[]
  className?: string
}

/**
 * The one FAQ accordion for every marketing page (hermes and v3-light both
 * resolve the same steel --hs-* palette, so a single component serves both).
 *
 * Card-per-question with a clear open state; answers stay in the DOM for
 * SEO/AEO parity with the FAQPage JSON-LD emitted alongside it. Each answer is
 * deep-linkable (`/pricing#faq-<slug>`): opening a matching hash expands and
 * scrolls to it, and every open answer carries a one-click "Copy link" so a
 * seller — or an AI agent — can share the exact answer without losing context.
 * Optional per-item `links` render as actionable "learn more" chips.
 */
export function FaqAccordion({ items, className = '' }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const baseId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  // Open + scroll to a deep-linked answer, on first load and on in-page hash
  // changes (e.g. a "Copy link" URL opened in a new tab, or a jump-nav click).
  useEffect(() => {
    const openFromHash = () => {
      const hash = window.location.hash.replace(/^#/, '')
      const idx = hash ? items.findIndex((it) => faqSlug(it.question) === hash) : -1
      // Sync open-state to the current item list: a matching hash opens (and
      // scrolls to) its answer; anything else — no hash, or a hash that no
      // longer matches after a search filter changed `items` — collapses back
      // so a stale index can never leave an unrelated answer expanded.
      setOpen(idx >= 0 ? idx : null)
      if (idx < 0) return
      // Scope the scroll to THIS accordion's own DOM. A global getElementById
      // can resolve to React's hidden streaming buffer (`<div hidden id="S:…">`)
      // on server-streamed pages, where the same ids exist twice — scrolling to
      // the invisible copy. querySelector on the live root always hits the
      // rendered node.
      const scrollToAnswer = () =>
        rootRef.current
          ?.querySelector(`[id="${hash}"]`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      // On a cold hard-load the browser's native anchor jump and Next's
      // streaming-buffer reconciliation both settle AFTER the first frame and
      // would clobber an early scroll, so retry once the layout stabilises.
      window.requestAnimationFrame(scrollToAnswer)
      window.setTimeout(scrollToAnswer, 250)
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [items])

  const copyLink = async (slug: string, i: number) => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${slug}`
      await navigator.clipboard?.writeText(url)
      // Reflect the anchor in the address bar without a scroll jump.
      window.history.replaceState(null, '', `#${slug}`)
      setCopied(i)
      window.setTimeout(() => setCopied((c) => (c === i ? null : c)), 2000)
    } catch {
      /* clipboard unavailable (insecure context / denied) — silent no-op */
    }
  }

  return (
    <div ref={rootRef} className={`w-full space-y-3 ${className}`}>
      {items.map((item, i) => {
        const isOpen = open === i
        const slug = faqSlug(item.question)
        const panelId = `${baseId}-faq-panel-${i}`
        return (
          <div
            key={i}
            id={slug}
            data-testid="faq-item"
            className={`scroll-mt-28 rounded-2xl border bg-white transition-all duration-200 ${
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
                className={`shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 motion-reduce:transition-none ${
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
              className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-out,ease-out)] motion-reduce:transition-none"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="px-5 sm:px-6 text-[15px] leading-[1.7] text-[var(--hs-ink-secondary)] font-[var(--font-body)]">
                  {item.answer}
                </p>

                <div className="mt-4 px-5 sm:px-6 pb-5 flex flex-wrap items-center gap-2">
                  {item.links?.map((l) => (
                    <Link
                      key={l.href + l.label}
                      href={l.href}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--hs-border)] bg-[var(--hs-surface-1)] px-3 py-1.5 text-[13px] font-semibold text-[var(--hs-steel-dark)] hover:border-[var(--hs-border-strong)] hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-steel)] focus-visible:ring-offset-1"
                    >
                      {l.label}
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                    </Link>
                  ))}

                  <button
                    type="button"
                    onClick={() => copyLink(slug, i)}
                    // Only reachable when the panel is open (collapsed panel is
                    // aria-hidden and out of the layout).
                    tabIndex={isOpen ? 0 : -1}
                    aria-label={
                      copied === i
                        ? `Link to "${item.question}" copied`
                        : `Copy a shareable link to "${item.question}"`
                    }
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-[var(--hs-ink-tertiary)] hover:text-[var(--hs-steel-dark)] hover:bg-[var(--hs-surface-1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-steel)] focus-visible:ring-offset-1"
                  >
                    {copied === i ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[var(--ok-text,#15803d)]" aria-hidden />
                        <span aria-live="polite">Link copied</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" aria-hidden />
                        Copy link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
