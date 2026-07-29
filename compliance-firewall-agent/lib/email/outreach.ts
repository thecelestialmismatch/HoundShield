/**
 * Founder outreach drafts — the human-written emails the founder sends to buyers
 * and partners, plus the plain-English "test it yourself" guide every buyer-facing
 * draft carries.
 *
 * WHY THESE LIVE IN CODE, NOT ONLY IN A MARKDOWN DOC
 * `docs/OUTREACH-HEALTHCARE.md` held these as prose. Prose cannot be tested, so
 * nothing stopped a draft from claiming a suspended deadline, quoting a deleted
 * pricing tier, or shipping with `[First name]` still in it. Here the drafts are
 * data: the guards in `__tests__/outreach.test.ts` assert every claim that could
 * embarrass us is absent, and `render()` THROWS on an unfilled placeholder rather
 * than sending template residue to a real buyer.
 *
 * HONESTY CONSTRAINTS ENCODED HERE (all from tasks/lessons.md + CLAUDE.md)
 *  - Never sell against the November 2026 CMMC gate: Phase 2 was SUSPENDED
 *    2026-07-13. The defense draft sells FCA liability instead, which is real.
 *  - Never name a subscription tier. The only purchasable offer is the $499
 *    one-time report.
 *  - Never claim SOC 2 — it is not started.
 *  - Never claim the hosted site is CUI-safe. Mode B (Docker, customer infra) is.
 *  - Every statistic carries its source inline, because buyers verify everything.
 *
 * Plain text only, deliberately. A founder-to-buyer email rendered in HTML with
 * a logo reads as marketing and gets filtered; the whole advantage of being a
 * solo founder is sounding like a person.
 */

import { founderAddress, founderFrom, founderSignature } from './identity';

/** A single step in the non-technical test guide. */
export interface TestStep {
  /** 1-based position, rendered as "1." in the email. */
  n: number;
  /** Imperative, jargon-free instruction — one sentence a non-IT reader can act on. */
  text: string;
}

/**
 * The sample-scenario buttons that exist on /demo, and which audience each one
 * speaks to.
 *
 * Pointing a reader at a button by name only works if the button is there, and
 * only lands if it is the one they care about — telling a DoD security manager
 * to click "Patient Record" reads as a mail-merge. `outreach.test.ts` asserts
 * every name here is really present in `app/demo/page.tsx`, so renaming a
 * sample button fails the suite instead of quietly breaking the emails.
 */
export const DEMO_SAMPLES = {
  healthcare: 'Patient Record',
  technical: 'AWS Config',
  defense: 'Network Scan',
} as const;

/**
 * "Try it yourself" — written for a Privacy Officer, compliance lead or office
 * manager with no technical background. No install, no account, no IT ticket.
 *
 * Every step describes what the live /demo page ACTUALLY does (verified against
 * production 2026-07-29): the sample-scenario buttons, the Scan action, the
 * per-finding severity + remediation, and the in-browser guarantee.
 *
 * Step 5 is the point of the whole guide: it lets a non-technical person PROVE
 * the local-only claim themselves by pulling their network connection. A claim
 * the buyer can verify without trusting us is worth more than any assurance we
 * could write.
 *
 * Steps 1, 3, 4 and 5 are audience-independent; step 2 names a sample button and
 * is swapped per audience by `renderTestGuide`.
 */
export const TEST_IT_YOURSELF_STEPS: readonly TestStep[] = [
  {
    n: 1,
    text: 'Open houndshield.com/demo in any web browser. There is nothing to install, no account to create, and no login.',
  },
  {
    n: 2,
    text: `Click one of the four sample buttons (try "${DEMO_SAMPLES.healthcare}") — or paste in a message of the kind your staff would actually send to ChatGPT. Made-up details are fine; you do not need real patient information to see how this works.`,
  },
  {
    n: 3,
    text: 'Click "Scan for Threats". Your results appear in under a second.',
  },
  {
    n: 4,
    text: 'Read each finding: it names what was detected, how serious it is, and what to do about it.',
  },
  {
    n: 5,
    text: 'Here is the part worth doing — once the page has loaded, turn off your Wi-Fi and scan again. It still works, because the scan runs inside your own browser. Nothing was ever sent to us. That is the same reason the paid version can run inside your network.',
  },
] as const;

/**
 * The honest boundary between the free demo and the paid product. Required in
 * every buyer-facing draft: the snapshot is a preview, and saying so is what
 * makes the $499 report credible rather than an upsell.
 */
export const PREVIEW_CAVEAT =
  'To be straight with you: that free scan is a preview. The $499 report is 14 days of monitoring inside your own environment, mapped to the NIST 800-171 controls, in a signed PDF you can hand to an assessor.';

/**
 * Renders the guide as the plain-text block that goes into an email body.
 *
 * `sample` swaps the button named in step 2 for the one this reader actually
 * cares about. The healthcare wording is the default because that is the lead
 * buyer; the sentence about patient information is rewritten for the others,
 * since "you do not need real patient information" is nonsense to an MSP.
 */
export function renderTestGuide(sample: string = DEMO_SAMPLES.healthcare): string {
  const steps = TEST_IT_YOURSELF_STEPS.map((s) => {
    if (s.n !== 2 || sample === DEMO_SAMPLES.healthcare) return `${s.n}. ${s.text}`;
    return `${s.n}. Click one of the four sample buttons (try "${sample}") — or paste in a message of the kind your staff would actually send to ChatGPT. Made-up details are fine; you do not need to use anything sensitive to see how this works.`;
  }).join('\n\n');
  return `How to try it yourself (about two minutes, no IT help needed):\n\n${steps}\n\n${PREVIEW_CAVEAT}`;
}

/** The variables a draft needs before it can be sent to a real person. */
export interface OutreachVars {
  /** Recipient's first name, as they actually spell it. */
  firstName?: string;
  /** Recipient's organisation, as it actually appears on their website. */
  organization?: string;
  /** Only used by the AI-adoption variant: the tool they publicly announced. */
  aiTool?: string;
}

export interface OutreachDraft {
  /** Stable id used by the send tool's --template flag. */
  id: string;
  /** Who this is for, in one line. */
  audience: string;
  /** Subject line. Lowercase and specific — it reads as a person, not a campaign. */
  subject: (vars: OutreachVars) => string;
  /** Plain-text body. */
  body: (vars: OutreachVars) => string;
  /** Variables that MUST be supplied; render throws if any is missing. */
  required: readonly (keyof OutreachVars)[];
  /** Why this draft is shaped the way it is — kept next to the copy on purpose. */
  rationale: string;
}



/**
 * DRAFT 1 — Healthcare Privacy Officer. The lead buyer since the 2026-07-28
 * pivot: no deadline dependency, no FedRAMP blocker, 30–90 day cycle.
 *
 * The ask is a 15-minute conversation, not a sale. Under ~150 words before the
 * guide, because a Privacy Officer reads the first three lines and decides.
 */
export const healthcareOutreach: OutreachDraft = {
  id: 'healthcare',
  audience: 'Healthcare Privacy Officer / CISO, 50–300 person physician group or clinic',
  required: ['firstName', 'organization'],
  subject: (v) => `quick question about ChatGPT at ${v.organization}`,
  body: (v) => `Hi ${v.firstName},

I build a tool that shows a Privacy Officer exactly what patient information staff have pasted into ChatGPT — scanned on your own hardware, so nothing leaves your network.

Before I build more of it, I would rather find out whether this is a real problem for you or not. Netskope's 2025 data says 89% of healthcare policy violations involving generative AI touch regulated data, and 43% of healthcare workers use personal AI accounts at work — personal accounts being the ones a security team cannot see. But your reality is what matters, not their number.

Do you have 15 minutes this week? I am not selling anything on that call. I genuinely want to know if I am wrong about this.

${renderTestGuide()}

${founderSignature()}
${founderAddress()}`,
  rationale:
    'Names the specific role and the specific fear, cites a real source, asks for time rather than money, and gives a way to verify the core claim without talking to us. No calendar link, no deck, no P.S. — each addition makes it look less like a person wrote it.',
};

/**
 * DRAFT 2 — RPO / MSP partner. Channel #1 and the Stage-1 "≥1 signed referral
 * agreement" goal. Explicitly NOT for C3PAOs: 32 CFR Part 170 and ISO 17020
 * cooling-off bar an assessor from recommending tools to clients they assess,
 * so pitching them is a legal problem, not just an off-message one.
 */
export const partnerOutreach: OutreachDraft = {
  id: 'partner',
  audience: 'RPO / MSP principal or practice lead (never a C3PAO)',
  required: ['firstName', 'organization'],
  subject: (v) => `co-branded AI risk report for ${v.organization} clients`,
  body: (v) => `Hi ${v.firstName},

You already advise clients on NIST 800-171. I built the piece that is hard to evidence: what staff paste into ChatGPT and Copilot, scanned locally, mapped to the controls, in a signed PDF.

The offer for you is wholesale. You pay $299, your client pays $499–$999, you keep the margin and it carries your branding. No integration work — it runs in your client's environment as a Docker container, so their data never leaves their boundary.

I am looking for a small number of first partners, and I would rather have one real conversation than send fifty of these. Worth 15 minutes?

${renderTestGuide(DEMO_SAMPLES.technical)}

${founderSignature()}
${founderAddress()}`,
  rationale:
    'Leads with their economics, not our features. States the wholesale/retail split in actual numbers so a principal can decide without a follow-up. Mode B (Docker, in-client) is named because that is the only configuration that is genuinely CUI-safe.',
};

/**
 * DRAFT 3 — Defense contractor that has already self-attested.
 *
 * Sells LIABILITY, never a deadline. CMMC Phase 2 was suspended 2026-07-13, so
 * the November gate does not exist and citing it would be both false and easy
 * for the buyer to disprove. What survives is DFARS 7012, the 110 controls, and
 * annual SPRS self-attestation — and with no assessor in the loop, that score is
 * the contractor's own representation to the government.
 */
export const defenseSprsOutreach: OutreachDraft = {
  id: 'defense',
  audience: 'Defense IT / security manager at a DoD subcontractor with a filed SPRS score',
  required: ['firstName'],
  subject: () => 'your SPRS score after the Phase 2 suspension',
  body: (v) => `Hi ${v.firstName},

With CMMC Phase 2 suspended, your self-attested SPRS score is what the government sees — and it is your representation, with no assessor in between.

The Department of Justice has settled 15 False Claims Act cases on exactly that exposure. MORSECORP paid $4.6M over a score an assessment did not support. LOGZONE paid $507,144 for certifying a perfect 110 while controls were unimplemented.

So the question I would ask in your position: if someone asked you tomorrow to evidence the AI-related controls behind your score, could you? That gap is what I built for.

15 minutes?

${renderTestGuide(DEMO_SAMPLES.defense)}

${founderSignature()}
${founderAddress()}`,
  rationale:
    'Every number is verifiable and named — that is the point of using them. Deliberately does not mention November 2026: selling against a suspended deadline gets you caught by any buyer who reads the news, and destroys the credibility the rest of the email depends on.',
};

/**
 * DRAFT 4 — Mailbox smoke test. Send this to an inbox you own BEFORE any buyer
 * sees a HoundShield email.
 *
 * Its checklist is deliberately non-technical too: it tells a non-engineer how to
 * confirm the three things that decide whether outreach lands — that it arrived
 * at all, that it arrived in the inbox rather than spam, and that hitting Reply
 * actually reaches the founder's mailbox rather than bouncing.
 */
export const mailboxSmokeTest: OutreachDraft = {
  id: 'smoke-test',
  audience: 'An inbox the founder controls — deliverability proof, not outreach',
  required: [],
  subject: () => 'HoundShield sender check',
  body: () => `This is a deliverability test for ${founderAddress()}.

Check these four things, in order:

1. It arrived. If this never showed up, the send failed — the domain is not verified for sending, or the API key is wrong.

2. It is in the inbox, not spam or promotions. If it landed in spam, the DNS records need attention before you send to a single buyer. One email to a real prospect from a domain in a bad state costs more than a day of setup.

3. The sender shows as "${founderFrom()}" and not a raw address or "via" some other domain. A "via" line tells the recipient this was machine-sent.

4. Hit Reply. The To: field must read ${founderAddress()}. Send that reply and confirm it arrives in the mailbox. Sending and receiving are two separate systems — this is the only step that proves the receiving side works.

If all four pass, the sender identity is real and outreach can go out.

${founderSignature()}
${founderAddress()}`,
  rationale:
    'Sending and receiving are different systems: Resend sends as @houndshield.com, the Hostinger mailbox receives. A send can succeed while replies bounce into nothing, which would silently lose every interested buyer. Step 4 is the only one that tests the receiving half.',
};

/** Every draft, keyed by id, for the send tool and the guards. */
export const OUTREACH_DRAFTS: readonly OutreachDraft[] = [
  mailboxSmokeTest,
  healthcareOutreach,
  partnerOutreach,
  defenseSprsOutreach,
] as const;

export function getDraft(id: string): OutreachDraft | undefined {
  return OUTREACH_DRAFTS.find((d) => d.id === id);
}

/**
 * Renders a draft for a specific recipient.
 *
 * THROWS when a required variable is missing or still looks like template
 * residue. This is the "no flukes" rule expressed as code: the failure mode we
 * are preventing is an email that reaches a real Privacy Officer opening with
 * "Hi [First name]". A thrown error costs a retry; that email costs the lead.
 */
export function render(
  draft: OutreachDraft,
  vars: OutreachVars,
): { from: string; replyTo: string; subject: string; text: string } {
  for (const key of draft.required) {
    const value = vars[key];
    if (!value || !value.trim()) {
      throw new Error(
        `outreach: draft "${draft.id}" requires ${key} — refusing to render with it empty`,
      );
    }
    if (/[[\]{}<>]|^(first ?name|your name|clinic|company|org)$/i.test(value.trim())) {
      throw new Error(
        `outreach: draft "${draft.id}" got placeholder text for ${key} ("${value}") — fill in the real value`,
      );
    }
  }

  const subject = draft.subject(vars);
  const text = draft.body(vars);

  // Belt and braces: even with vars validated, refuse to emit residue.
  const residue = /\[[A-Za-z ]+\]|\{\{|\}\}/.exec(`${subject}\n${text}`);
  if (residue) {
    throw new Error(
      `outreach: rendered draft "${draft.id}" still contains a placeholder (${residue[0]})`,
    );
  }

  return { from: founderFrom(), replyTo: founderAddress(), subject, text };
}
