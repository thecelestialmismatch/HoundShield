import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { heroPromotion } from '@/lib/product/upcoming'

/**
 * The hero slot for an imminent feature — currently rendering nothing.
 *
 * Founder direction 7 Aug 2026: when a feature is close, promote it into the
 * hero so a visitor sees the product moving. This is that slot, built now so
 * flipping it later is one boolean rather than a hero rewrite under time
 * pressure.
 *
 * It is OFF for everything today, and that is the correct default rather than
 * an unfinished state. The hero is the highest-value real estate on the site
 * and it belongs to the thing we sell NOW — a $499 report a visitor can buy
 * today beats a feature they cannot use at any price. Promote one item only
 * when it is close enough that "coming soon" changes what a visitor does.
 *
 * `heroPromotion()` returns at most one item however many are flagged, so this
 * can never quietly become a carousel of things that do not exist.
 *
 * Renders null when nothing is promoted — no empty container, no reserved
 * space, no layout shift on the page that matters most.
 */
export function UpcomingHeroBanner() {
  const feature = heroPromotion()
  if (!feature) return null

  return (
    <Link
      href="/changelog"
      className="mb-6 inline-flex max-w-full items-center gap-3 rounded-full border border-brand-500/25 bg-brand-500/[0.07] px-4 py-2 text-left transition-colors hover:bg-brand-500/[0.12]"
    >
      <Sparkles className="h-4 w-4 flex-shrink-0 text-brand-700" aria-hidden />
      <span className="min-w-0 text-[13px] leading-snug">
        <b className="font-semibold">{feature.title}</b>
        <span className="text-[var(--hs-ink-secondary)]"> — {feature.blurb}</span>
        {/* A window phrase, never a date. See lib/product/upcoming.ts. */}
        <span className="ml-1.5 font-mono text-[11px] tracking-wide text-brand-700 uppercase">
          {feature.window}
        </span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-brand-700" aria-hidden />
    </Link>
  )
}
