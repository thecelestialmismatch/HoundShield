import type { Vertical } from "@/components/snapshot/types";

/** Which outreach audience a scenario is written for. */
export type SampleAudience = "defense" | "healthcare" | "legal" | "technical";

/**
 * One-click scenarios, each verified to trip the REAL engine — the counts in
 * the comments were measured by running `scanForSnapshot` over these exact
 * strings, not estimated. A sample that finds nothing would teach a visitor the
 * product does nothing, so coverage is a property worth pinning: see
 * `__tests__/sample-scenarios.test.ts`, which re-runs the engine over every
 * scenario and fails if any stops producing findings.
 *
 * They deliberately span the three verticals the industry selector offers, so
 * whichever a visitor is, one sample speaks their language.
 */
export const SAMPLE_SCENARIOS: ReadonlyArray<{
  name: string;
  /** Drives the industry selector, the PDF framing and the $499 CTA. */
  vertical: Vertical;
  /** Which cold-outreach email points a reader at this button. */
  audience: SampleAudience;
  text: string;
}> = [
  {
    // 5 finding types — CUI/ITAR/CAGE/contract + SSN + AWS key.
    name: "Defense · CUI leak",
    vertical: "defense",
    audience: "defense",
    text: `Draft a status email to the PM about our Navy contract N00024-25-C-1234.
Reference CAGE code 1ABC2 and note the SPRS score.

The subcontractor sent employee John Smith (SSN 123-45-6789) for the ITAR-controlled
avionics work. Our AWS deploy key is AKIA1234567890ABCD12 — put it in the runbook.

CUI//SP-CTI: the radar cross-section figures must not leave the enclave.`,
  },
  {
    // 6 finding types — the strongest PHI example.
    name: "Healthcare · patient record",
    vertical: "healthcare",
    audience: "healthcare",
    text: `Please summarize this patient record:
Patient: John Smith, SSN: 123-45-6789
DOB: 03/15/1985
Diagnosis: Type 2 Diabetes
Email: john.smith@acmecorp.com`,
  },
  {
    // 4 finding types — M&A + pricing strategy + contact PII.
    name: "Legal · M&A memo",
    vertical: "legal",
    audience: "legal",
    text: `Review this draft memo for the board:
We are acquiring Meridian Systems for $42.5M; the merger closes in Q3.
Our pricing strategy moves enterprise from $80k to $120k ARR next fiscal year.
Revenue for FY25 was $18.2 million. Roadmap: ship the compliance module before the acquisition.
Counterparty contact: dana.reyes@meridiansystems.com, direct 415-555-0142.`,
  },
  {
    // 3 finding types — live credentials in a config paste.
    name: "DevOps · config paste",
    vertical: "defense",
    audience: "technical",
    text: `Review this config for our production deploy:
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCY
DB_URL=postgres://admin:SuperSecret123@prod-db.internal:5432/maindb`,
  },
];

/**
 * Button name for a given outreach audience.
 *
 * `lib/email/outreach.ts` used to keep its OWN copy of these names, so renaming
 * a button here silently made every cold email point at a control that no
 * longer existed — caught only because a guard read the page source for
 * `name: "..."`. Both surfaces now read this module, so the name can only be
 * written once.
 */
export function sampleForAudience(audience: SampleAudience): string {
  const found = SAMPLE_SCENARIOS.find((s) => s.audience === audience);
  if (!found) throw new Error(`No sample scenario for audience "${audience}"`);
  return found.name;
}

/**
 * The user-visible control labels on the snapshot.
 *
 * Exported because `lib/email/outreach.ts` walks a buyer through the page by
 * naming these controls ("Click X"), and cold outreach that names a button
 * which does not exist is worse than outreach that names none. The old guide
 * said 'Click "Scan for Threats"' — a control on the canned demo scanner that
 * was deleted — so the email was already wrong at the moment the scanner went.
 *
 * Referenced by both the component and the email guide, and asserted by
 * `lib/email/__tests__/outreach.test.ts`.
 */
export const SNAPSHOT_CONTROLS = {
  scan: "Scan locally",
  generatePdf: "Generate my gap-report PDF",
} as const;
