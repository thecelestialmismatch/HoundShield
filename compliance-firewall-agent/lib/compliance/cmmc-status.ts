/**
 * Canonical CMMC regulatory posture — one source of truth.
 *
 * Why this file exists: on 2026-07-13 the Department of War suspended CMMC
 * Phase 2, deleting the 10 November 2026 date on which third-party (C3PAO)
 * certification would have become a condition of award. Thirteen separate
 * surfaces — the site-wide chat system prompt, Brain AI's keyword FAQ and
 * knowledge graph, three lifecycle emails, the roadmap page and two blog
 * posts — each carried their own hardcoded copy of the old deadline and kept
 * asserting it as live long after it was gone. A defense buyer who is told a
 * cancelled deadline stops believing everything else on the page.
 *
 * Every surface that discusses the deadline now reads from here, and
 * `__tests__/cmmc-status.test.ts` fails the build if any source file mentions
 * November 2026 without also naming the suspension.
 *
 * NEVER-DO (CLAUDE.md): sell the November 10 deadline. It does not exist.
 *
 * ── WHEN PHASE 2 COMES BACK ─────────────────────────────────────────────────
 * Re-checked 2026-08-07 (Federal News Network, Breaking Defense, war.gov,
 * Arnold & Porter, Holland & Knight, Cyber AB town hall): STILL SUSPENDED. The
 * Reform Task Force RFI closed 12:00 ET on 2026-08-14 and the 60-day review
 * reports after that, so a new memo is likely and a reinstatement — probably
 * with a different date and scope — is a live possibility, not a fantasy.
 *
 * That is why this file exists as one constant rather than thirteen hardcoded
 * strings. Reinstating is a SMALL, MECHANICAL change, and doing it correctly
 * means doing it here and nowhere else:
 *
 *   1. Update `headline`, `blurb` and the exported dates to the new memo.
 *   2. Run `npm test`. `__tests__/cmmc-status.test.ts` fails the build if any
 *      source file names a CMMC date without also naming its current status,
 *      so it will point at every surface that needs to follow.
 *   3. Regenerate the pitch decks: `node docs/decks/render-html.mjs &&
 *      node docs/decks/render-pptx.mjs`. They read SOURCES from content.mjs.
 *
 * Do NOT reinstate the deadline ahead of the memo. A defense buyer checks this
 * in one search, and a vendor caught quoting a cancelled requirement to create
 * urgency loses the deal and the reference. The pitch that works today is
 * liability (DOJ prosecutes self-attestation under the False Claims Act), and
 * it keeps working whether or not certification returns.
 */

/** ISO date DoW paused Phase 2 enforcement pending the Reform Task Force review. */
export const PHASE2_PAUSED_ON = "2026-07-13";

/**
 * Back-compat alias. Several surfaces and one guard still import the old name.
 * @deprecated use PHASE2_PAUSED_ON
 */
export const PHASE2_SUSPENDED_ON = PHASE2_PAUSED_ON;

/**
 * THE DATE WE PREPARE TO. Founder decision, 7 Aug 2026: HoundShield continues
 * to work to 10 November 2026.
 *
 * It has not been replaced. The 13 July memo paused enforcement pending a
 * 60-day review; it did not issue a new date, and it did not touch the
 * underlying obligation. So November remains the only date on the table, and
 * preparing to it is the only assumption that is safe in both directions — a
 * contractor ready in November is fine whether it resumes on time, slips, or
 * returns in a different shape. A contractor who treated the pause as a
 * cancellation is not.
 */
export const PHASE2_TARGET_DATE = "10 November 2026";

/** ISO form of the target, for countdowns and date math. */
export const PHASE2_TARGET_ISO = "2026-11-10";

/** @deprecated use PHASE2_TARGET_DATE */
export const PHASE2_SUSPENDED_DEADLINE = PHASE2_TARGET_DATE;

/** Whole days from `now` to the target. Negative once it has passed. */
export function daysToPhase2(now: Date = new Date()): number {
  const target = Date.parse(`${PHASE2_TARGET_ISO}T00:00:00Z`);
  return Math.ceil((target - now.getTime()) / 86_400_000);
}

export const CMMC_STATUS = {
  pausedOn: PHASE2_PAUSED_ON,
  targetDate: PHASE2_TARGET_DATE,
  targetIso: PHASE2_TARGET_ISO,
  suspendedOn: PHASE2_PAUSED_ON,
  suspendedDeadline: PHASE2_TARGET_DATE,

  /** One sentence. Use where space is tight (email banners, chat prompts). */
  headline:
    "CMMC Phase 2 enforcement is paused pending the DoW Reform Task Force review — 10 November 2026 has not been replaced, and it is still the date to be ready for.",

  /** What the pause never touched. This is what makes November the safe bet. */
  stillInForce: [
    "DFARS 252.204-7012 still applies",
    "all 110 NIST SP 800-171 Rev 2 controls must still be implemented",
    "the annual SPRS self-assessment score is still mandatory",
  ] as const,

  /** The forcing function that is live TODAY, review or no review. */
  liveRisk:
    "Self-attestation is the gate right now, and DOJ prosecutes it. Under the Civil Cyber-Fraud Initiative it has settled fifteen False Claims Act cases — MORSECORP paid $4.6M over an inflated SPRS score, LOGZONE $507,144 for certifying a perfect 110 with controls unimplemented.",

  /** Reusable paragraph — drop into prose, prompts, or email bodies verbatim. */
  blurb:
    "CMMC Phase 2 remains the plan of record for 10 November 2026. On 13 July 2026 the Department of War paused enforcement pending a 60-day Reform Task Force review (RFI closed 14 August 2026); no replacement date has been issued and Phase 2 has not been cancelled. Nothing underneath it moved: DFARS 252.204-7012 still applies, all 110 NIST SP 800-171 Rev 2 controls must still be implemented, and the annual SPRS self-assessment score is still mandatory — a score DOJ prosecutes under the False Claims Act. Preparing to November is the only assumption that is safe whether enforcement resumes on schedule, slips, or returns in a different shape.",
} as const;

/**
 * The line to put in front of a defense buyer.
 *
 * Deliberately NOT a countdown. The date is the deadline; the prosecutor is the
 * reason to move this quarter, and a prosecutor outlasts any date that can be
 * moved by memo. Lead with liability, close with November.
 */
export const FCA_PITCH =
  "You personally attested an SPRS score. With no assessor in the loop, that score is your own representation to the government — and DOJ has settled fifteen False Claims Act cases over exactly that. Can you evidence yours before November?";
