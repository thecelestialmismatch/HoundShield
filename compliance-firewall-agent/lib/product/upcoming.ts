/**
 * What is coming next — ONE list, read by every surface that shows it.
 *
 * There were two, and they had already drifted: `/roadmap` had a shipped /
 * building / planned board, and `/changelog` had its own `roadmap` const with a
 * different set of items on quarter labels. A customer who read both got two
 * different answers about the same product.
 *
 * ── NO SHIP DATES. Founder direction, 7 Aug 2026 ─────────────────────────────
 * Items carry a `window` phrase ("Later this year"), never a date, a quarter, or
 * a month. This is not vagueness for its own sake — a roadmap date is a promise
 * a small team cannot keep, and a customer who is told November and gets January
 * trusts nothing else on the page. The window is deliberately loose enough to
 * be true and specific enough to be worth waiting for.
 *
 * Do not reintroduce "Q3 2026" style labels. `__tests__/upcoming.test.ts` fails
 * the build on any date, month or quarter in this file.
 *
 * Note the exception this rule does NOT cover: the CMMC Phase 2 date on
 * /cmmc-phase-2 is a REGULATORY date set by the Department of War, not a
 * HoundShield ship date. We do not get to be vague about that one.
 */

export interface UpcomingFeature {
  id: string
  title: string
  /** One line a customer can read in the dashboard without stopping. */
  blurb: string
  /** Loose timing phrase. Never a date. */
  window: string
  /**
   * Two or three lines showing what it will actually look like. This is the
   * "brief demo" — enough to make it concrete, short enough to skim.
   */
  demo: { before: string; after: string }
  /** Why the customer should care, in the register they care in. */
  why: string
  /**
   * Promote this into the marketing hero.
   *
   * Off for everything today by design: the hero is the highest-value real
   * estate on the site and belongs to the thing we sell NOW, not to something
   * unreleased. Flip one item when it is close enough that a visitor could act
   * on it — `heroPromotion()` returns at most one, so this cannot quietly
   * become a carousel.
   */
  promote: boolean
}

export const UPCOMING: UpcomingFeature[] = [
  {
    id: 'agent-runs',
    title: 'Agent run grouping',
    blurb:
      'Collapse the hundreds of prompts in one autonomous agent run into a single reviewable unit, with a named human owner.',
    window: 'Later this year',
    demo: {
      before: '412 separate events · sender "a process" · no owner',
      after: 'Run #1184 · Claude Code · 412 prompts · 3 blocked · owner: your engineer',
    },
    why:
      'NIST 800-171 3.3.2 wants every action traceable to an individual. An unattended run has no individual attached to any single call — this is the panel that gives it one.',
    promote: false,
  },
  {
    id: 'agent-policy',
    title: 'Per-agent policy',
    blurb:
      'Different rules for people and for agents. Hold an unattended run for review on patterns a human would only be warned about.',
    window: 'Later this year',
    demo: {
      before: 'One policy for every caller, human or not',
      after: 'Humans: warn on PII · Agents: quarantine on PII, no exceptions',
    },
    why:
      'A person who sees a warning stops. An agent in a loop does not, so the same rule produces a very different outcome depending on who is holding it.',
    promote: false,
  },
  {
    id: 'browser-extension',
    title: 'Browser extension',
    blurb:
      'Catch the AI tools that never touch the proxy — anything used straight in a browser tab.',
    window: 'Later this year',
    demo: {
      before: 'Gateway covers API and SDK traffic',
      after: 'Gateway + browser tab: chat.openai.com, claude.ai, Gemini, Copilot',
    },
    why:
      'The gateway sees everything routed through it. Staff pasting into a browser tab are the gap, and it is the gap most likely to contain the thing you least want pasted.',
    promote: false,
  },
]

/**
 * The single item allowed in the hero, or null.
 *
 * Returns at most one however many are flagged. A hero that lists three
 * upcoming features is not a hero, and the reason to promote one at all is that
 * it is imminent — which is true of one thing at a time.
 */
export function heroPromotion(items: UpcomingFeature[] = UPCOMING): UpcomingFeature | null {
  return items.find((f) => f.promote) ?? null
}

/** The one a dashboard should lead with — first in the list, promoted or not. */
export function headlineUpcoming(items: UpcomingFeature[] = UPCOMING): UpcomingFeature | null {
  return items[0] ?? null
}
