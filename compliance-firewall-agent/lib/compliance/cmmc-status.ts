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

/** ISO date the Department of War suspended CMMC Phase 2. */
export const PHASE2_SUSPENDED_ON = "2026-07-13";

/** The date that WOULD have applied. Only ever quoted alongside the suspension. */
export const PHASE2_SUSPENDED_DEADLINE = "10 November 2026";

export const CMMC_STATUS = {
  suspendedOn: PHASE2_SUSPENDED_ON,
  suspendedDeadline: PHASE2_SUSPENDED_DEADLINE,

  /** One sentence. Use where space is tight (email banners, chat prompts). */
  headline:
    "CMMC Phase 2 was suspended on 13 July 2026 — there is no third-party certification deadline right now.",

  /** What survived the suspension. This is the part that still sells. */
  stillInForce: [
    "DFARS 252.204-7012 still applies",
    "all 110 NIST SP 800-171 Rev 2 controls must still be implemented",
    "the annual SPRS self-assessment score is still mandatory",
  ] as const,

  /** The replacement forcing function: prosecution, not certification. */
  liveRisk:
    "Self-attestation is now the only gate, and DOJ prosecutes it. Under the Civil Cyber-Fraud Initiative it has settled fifteen False Claims Act cases — MORSECORP paid $4.6M over an inflated SPRS score, LOGZONE $507,144 for certifying a perfect 110 with controls unimplemented.",

  /** Reusable paragraph — drop into prose, prompts, or email bodies verbatim. */
  blurb:
    "On 13 July 2026 the Department of War suspended CMMC Phase 2, which would have made third-party (C3PAO) certification a condition of award from 10 November 2026; Phases 3 and 4 are frozen pending a 60-day review. What did NOT change: DFARS 252.204-7012 still applies, all 110 NIST SP 800-171 Rev 2 controls must still be implemented, and the annual SPRS self-assessment score is still mandatory. The certificate was paused. The obligation was not — and self-attestation is the gate DOJ prosecutes.",
} as const;

/**
 * The line to put in front of a defense buyer now that the deadline is gone.
 * Fear of a prosecutor outlasts a date that can be cancelled by memo.
 */
export const FCA_PITCH =
  "You personally attested an SPRS score. With no assessor in the loop, that score is your own representation to the government — and DOJ has settled fifteen False Claims Act cases over exactly that. Can you evidence yours?";
