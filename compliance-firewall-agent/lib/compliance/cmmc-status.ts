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

/**
 * Scale of the enforcement trend, for surfaces that want a number rather than a
 * case list. Sourced 2026-08-21: DOJ's cyber-specific False Claims Act
 * settlements reached $51.8M in 2025, a 233% year-over-year rise, inside record
 * overall FCA recoveries of $6.8B (Fluet; PreVeil; Mintz FCA year-in-review).
 *
 * Prefer this over the raw case count when arguing the trend is ACCELERATING —
 * "fifteen settlements" sounds static, "+233% in a year" does not.
 */
export const FCA_SCALE = {
  cyberSettlementsUsd2025: "$51.8M",
  cyberSettlementsYoyPct: 233,
  totalFcaRecoveries2025: "$6.8B",
  blurb:
    "DOJ's cyber-specific False Claims Act settlements reached $51.8M in 2025 — a 233% increase year over year, inside record overall FCA recoveries of $6.8B. The pause removed the assessor, not the prosecutor.",
} as const;

/**
 * THE STATUTORY AI MANDATE — the part of this story a memo cannot pause.
 *
 * WHY THIS BLOCK EXISTS
 * ---------------------
 * Market research on 2026-08-21 found the site leaning entirely on a
 * certification date that the 13 July memo removed, while ignoring the fact
 * that Congress had ALREADY written AI requirements for defense contractors
 * into law in the FY2026 NDAA. A memo from the Department of War can pause its
 * own certification programme; it cannot repeal a statute. That asymmetry is
 * the strongest honest argument HoundShield has after the pause, and it was
 * nowhere on the property.
 *
 * PRECISION MATTERS MORE THAN PUNCH HERE
 * --------------------------------------
 * Both provisions are easy to overstate, and overstating a regulation to a
 * compliance buyer is the fastest way to lose one. The exact scope:
 *
 *   § 1513 — directs DoW to DEVELOP a physical and cybersecurity framework for
 *     AI/ML systems and to incorporate it into the DFARS and CMMC. It is a
 *     direction to build a framework, NOT a control set that binds a contractor
 *     today, and Crowell confirms it carries NO implementation deadline. Say
 *     "Congress has already pointed the AI requirement at CMMC"; never say
 *     "AI controls are required now."
 *
 *   § 1532 — prohibits DoD and its contractors from using "covered artificial
 *     intelligence" on DoD work. "Covered AI" means AI from covered (adversary-
 *     linked) AI companies. It is NOT a restriction on ChatGPT, Claude or
 *     Copilot, and any copy implying that is false. The honest and still-strong
 *     consequence: a prohibition you cannot evidence compliance with is a
 *     prohibition you are exposed on — and no contractor can show which AI
 *     their staff used without a record of AI usage. That record is the
 *     product. Sell the evidence gap, never a fake ban.
 *
 * Guard: `__tests__/cmmc-status.test.ts` pins the scope wording so a future
 * edit cannot quietly promote either provision into a live control set.
 */
export const NDAA_AI = {
  act: "FY2026 National Defense Authorization Act",

  framework: {
    section: "§ 1513",
    /** What it actually does — a direction to build, not a control set. */
    summary:
      "Directs the Department of War to develop a physical and cybersecurity framework for AI and machine-learning systems, and to incorporate it into both the DFARS and CMMC.",
    /** Stated plainly so no surface invents one. */
    implementationDeadline: null,
    deadlineNote:
      "Section 1513 sets no implementation deadline; it directs a plan with timelines and milestones.",
  },

  prohibition: {
    section: "§ 1532",
    summary:
      "Prohibits the Department of War and its contractors from using “covered artificial intelligence” — AI from covered, adversary-linked AI companies — in the performance of defense contracts.",
    /** The scope correction that keeps this claim honest. */
    scopeCaveat:
      "This is not a restriction on mainstream commercial assistants such as ChatGPT, Claude or Copilot. It is a prohibition on a defined class of AI, and the practical exposure is evidentiary: demonstrating compliance requires knowing which AI tools your people actually used.",
  },

  /** One sentence for tight spaces. */
  headline:
    "Congress has already written AI requirements for defense contractors into law — the FY2026 NDAA directs an AI security framework into the DFARS and CMMC, and the Phase 2 pause does not touch a statute.",

  /** Reusable paragraph — drop into prose, prompts or email bodies verbatim. */
  blurb:
    "While CMMC Phase 2 enforcement sits paused, the statutory direction did not move. Section 1513 of the FY2026 NDAA directs the Department of War to build a cybersecurity framework for AI and machine-learning systems and to incorporate it into the DFARS and CMMC — no implementation deadline is set, but the direction is law, and a departmental memo cannot repeal it. Section 1532 separately bars contractors from using covered, adversary-linked AI on defense work; it does not restrict mainstream commercial assistants, but demonstrating compliance with it requires knowing which AI tools your people actually used. Both point at the same missing artifact: a record of AI usage.",
} as const;
