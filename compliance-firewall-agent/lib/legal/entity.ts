/**
 * The legal identity behind every published policy — one constant, one place.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * On 2026-08-13 `/privacy`, `/terms` and `/dpa` were all live in production
 * containing the literal strings `[COMPANY LEGAL NAME]` and `[MAILING ADDRESS]`.
 * Three separate pages, three separate copies, all unfilled. The DPA one is the
 * serious one: a DPA is a contract, and GDPR Art. 28(3) requires it to identify
 * the parties, so an unfilled DPA is arguably unexecutable.
 *
 * Duplicated legal boilerplate is how that happens. Fill it here once and every
 * document changes together, or miss one forever.
 *
 * CURRENT STATUS: NOT INCORPORATED
 * --------------------------------
 * Confirmed by the founder 2026-08-13. `name` and `address` are therefore null,
 * and the policy pages render an explicit interim disclosure instead of a
 * fabricated entity. That is a deliberate choice: a wrong company name in a
 * privacy policy is a misrepresentation, and an unfilled placeholder is a
 * visible defect a buyer will find during diligence. Neither is acceptable, so
 * the pages say what is actually true.
 *
 * This is NOT a compliant end state. GDPR Art. 13(1)(a) and CCPA both require a
 * named, contactable controller. See LAUNCH_BLOCKER below.
 */

import { LEGAL_INBOX } from "@/lib/email/identity";

export interface LegalEntity {
  /** Registered legal name, e.g. "HoundShield, Inc.". Null until incorporated. */
  readonly name: string | null;
  /** Registered mailing address for legal and privacy notices. Null until incorporated. */
  readonly address: string | null;
  /** Jurisdiction of incorporation, e.g. "Delaware, USA". Null until incorporated. */
  readonly jurisdiction: string | null;
  /** Mailbox for privacy, DPA and legal requests. Live today. */
  readonly legalEmail: string;
  /** Trading name used in prose throughout the site. */
  readonly tradingName: string;
}

export const LEGAL_ENTITY: LegalEntity = {
  name: null,
  address: null,
  jurisdiction: null,
  legalEmail: LEGAL_INBOX,
  tradingName: "HoundShield",
};

/** True once the entity is named and contactable, which is what the law asks for. */
export function isEntityEstablished(): boolean {
  return Boolean(LEGAL_ENTITY.name && LEGAL_ENTITY.address);
}

/**
 * What the policy pages print where the controller's identity belongs.
 *
 * Deliberately does not invent a company, and deliberately does not print the
 * founder's personal name and home address. Publishing an individual's home
 * address on a public marketing site is a real and permanent privacy exposure
 * for that person, and this repository is public, so it would land in git
 * history too. Naming a sole proprietor is a decision only the founder can make.
 */
export function controllerDisclosure(): string {
  if (isEntityEstablished()) {
    return `${LEGAL_ENTITY.name}, ${LEGAL_ENTITY.address}`;
  }
  return (
    `${LEGAL_ENTITY.tradingName} is operated by an independent sole proprietor. ` +
    `A registered legal entity and postal address will be published here before ` +
    `general availability. For any privacy, data-protection or legal request in ` +
    `the meantime, contact ${LEGAL_ENTITY.legalEmail} — requests are answered ` +
    `within the statutory time limits regardless of entity status.`
  );
}

/**
 * Pre-launch legal blockers, in the order they must be cleared.
 *
 * Surfaced as data rather than prose so `__tests__/legal-contract.test.ts` can
 * assert the list is honest, and so nothing here can be quietly forgotten.
 *
 * `blocking: false` means DONE or genuinely optional — never "deprioritised".
 * Closed items stay in the list with the evidence that closed them, because a
 * launch-blocker list that only ever grows is one nobody reads, and one that
 * still flags finished work is the same defect as a health check that cries
 * wolf: the next reader stops believing any of it.
 *
 * On the first item: incorporation is not paperwork hygiene. Selling compliance
 * software to DoD subcontractors and healthcare providers as an unincorporated
 * individual means personal, unlimited liability — the DPA is enforceable
 * against the individual, an FCA claim lands on the individual, and HIPAA civil
 * penalties (up to ~$2.1M per violation category per year) do too. No document
 * in this repository fixes that; only incorporation does.
 */
export const LAUNCH_BLOCKERS = [
  {
    id: "incorporate",
    blocking: true,
    summary: "Incorporate, then set name/address/jurisdiction above",
    why: "GDPR Art. 13(1)(a) and CCPA require a named controller. Until then the founder is personally liable without limit.",
  },
  {
    id: "hipaa-posture",
    blocking: false,
    summary: "DONE — /hipaa states the Mode B-only position for live PHI",
    why: "Closed. app/hipaa/page.tsx:161 says the hosted trial 'is not covered by a BAA' and that live PHI must run self-hosted (Mode B). Under 45 CFR 160.103 that is the distinction that decides Business Associate status, and the site now states it rather than implying the safe posture while offering the unsafe one.",
  },
  {
    id: "webhook-allowlist",
    blocking: false,
    summary: "DONE — proxy/webhook.ts enforces the metadata-only contract (audit finding 14)",
    why: "Closed by PR #286. The webhook is the only channel that can carry customer content out of a Mode B deployment, so it decides Business Associate status. It now strips to an enumerated field list with zod at enqueue, and the finding-14 test asserts containment instead of the leak.",
  },
  {
    id: "subprocessors",
    blocking: false,
    summary: "Keep /subprocessors as the single disclosed list",
    why: "GDPR Art. 28(2). /privacy and /dpa previously named different, incomplete sets.",
  },
] as const;
