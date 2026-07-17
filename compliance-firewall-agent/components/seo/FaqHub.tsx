'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { FaqAccordion } from '@/components/ui/FaqAccordion'
import type { FaqGroup } from '@/lib/seo/faqs'

interface FaqHubProps {
  groups: FaqGroup[]
}

/**
 * The searchable, category-jumping FAQ hub rendered on /faq.
 *
 * It reuses the same per-page FAQ datasets and the shared accordion (so deep
 * links, copy-link, and answer chips all work here too), but it deliberately
 * does NOT emit FAQPage JSON-LD — every Q&A already carries that schema on its
 * origin page, and re-emitting it here would duplicate structured data across
 * URLs. The hub's value is UX + internal linking, not a competing schema.
 */
export function FaqHub({ groups }: FaqHubProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return groups
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.question.toLowerCase().includes(q) ||
            it.answer.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, q])

  const totalMatches = filtered.reduce((n, g) => n + g.items.length, 0)
  const totalQuestions = useMemo(
    () => groups.reduce((n, g) => n + g.items.length, 0),
    [groups],
  )

  return (
    <div className="w-full">
      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--hs-ink-tertiary)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${totalQuestions} answers — pricing, HIPAA, deployment…`}
          aria-label="Search frequently asked questions"
          className="w-full rounded-2xl border border-[var(--hs-border)] bg-white py-4 pl-12 pr-12 text-[15px] text-[var(--hs-ink)] shadow-sm placeholder:text-[var(--hs-ink-tertiary)] focus:border-[var(--hs-border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--hs-steel)] focus:ring-offset-1"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--hs-ink-tertiary)] hover:bg-[var(--hs-surface-1)] hover:text-[var(--hs-ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-steel)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Category jump-nav — sticky under the main nav */}
      {!q ? (
        <nav
          aria-label="FAQ categories"
          className="sticky top-[68px] z-30 -mx-1 mb-8 overflow-x-auto rounded-2xl border border-[var(--hs-border)] bg-[color-mix(in_srgb,var(--hs-surface-0)_86%,transparent)] px-1 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--hs-surface-0)_72%,transparent)]"
        >
          <ul className="flex w-max items-center gap-1">
            {groups.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-[13px] font-medium text-[var(--hs-ink-secondary)] transition-colors hover:bg-[var(--hs-surface-1)] hover:text-[var(--hs-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-steel)]"
                >
                  {g.title}
                  <span className="text-[var(--hs-ink-tertiary)]">{g.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {/* Live result count for search */}
      <p aria-live="polite" className="sr-only">
        {q ? `${totalMatches} answers match ${query}` : ''}
      </p>

      {/* Groups */}
      {filtered.length > 0 ? (
        <div className="space-y-12">
          {filtered.map((g) => (
            <section key={g.id} id={g.id} className="scroll-mt-28">
              <div className="mb-4">
                <h2 className="text-[22px] sm:text-2xl font-editorial font-semibold tracking-tight text-[var(--hs-ink)]">
                  {g.title}
                </h2>
                <p className="mt-1 text-[15px] text-[var(--hs-ink-secondary)]">{g.blurb}</p>
              </div>
              <FaqAccordion items={g.items} />
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--hs-border)] bg-white px-6 py-14 text-center">
          <p className="text-[15px] text-[var(--hs-ink-secondary)]">
            No answers match <span className="font-semibold text-[var(--hs-ink)]">“{query}”</span>.
            Try fewer or different words.
          </p>
          <p className="mt-3 text-[15px]">
            <Link
              href="/contact"
              className="font-semibold text-[var(--hs-steel-dark)] underline underline-offset-4 decoration-[var(--hs-border-strong)] hover:decoration-[var(--hs-steel-dark)]"
            >
              Ask a compliance engineer
            </Link>{' '}
            — we respond within 4 business hours.
          </p>
        </div>
      )}
    </div>
  )
}
