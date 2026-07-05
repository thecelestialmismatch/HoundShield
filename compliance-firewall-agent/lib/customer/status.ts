/**
 * Customer status engine — "where you stand, what's next, what's wrong, how to fix it".
 *
 * This is the deterministic brain behind the after-login dashboard panel AND the
 * consent-gated answers Brain AI gives about a signed-in customer. It is a PURE
 * function: it receives only the current user's own data and returns a synthesized
 * status. It never reads a database, never calls an LLM, and has no knowledge of
 * any other customer — so by construction it cannot leak one customer's data to
 * another, and no compliance data is ever sent to a commercial AI endpoint.
 *
 * Privacy split (deliberate):
 *   - SPRS / assessment data lives in the browser (localStorage). The client
 *     computes `sprs` from it and passes it in. It never has to leave the device.
 *   - Account data (tier, the $499 report order) is server-visible and RLS-scoped
 *     to `auth.uid()`. The API builds the account-only view.
 *   - Both callers share this one engine, so the "next step" logic can never diverge.
 */

export type StandingLevel = 'critical' | 'poor' | 'fair' | 'good' | 'excellent' | 'unknown';

export type JourneyStage =
  | 'not_started'
  | 'assessing'
  | 'report_pending'
  | 'remediating'
  | 'report_delivered'
  | 'monitoring';

/** One remediation item: a control the customer got wrong + how to fix it. */
export interface StatusGap {
  controlId: string;
  title: string;
  status: string; // UNMET | PARTIAL | NOT_ASSESSED
  deduction: number; // negative SPRS points currently incurred
  fix: string; // first concrete remediation step
  hours: number; // estimated implementation hours
}

/** SPRS-derived slice, computed client-side from local assessment data. */
export interface SprsInput {
  score: number;
  completionPercent: number;
  totalControls: number;
  metCount: number;
  partialCount: number;
  unmetCount: number;
  assessedCount: number;
  topGaps: StatusGap[];
}

/** The signed-in customer's latest $499 report order, if any. */
export interface OrderSummary {
  reference: string;
  status: string; // paid | proxy_deployed | report_delivered
  statusLabel: string;
  reportDueDate: string | null;
  isDelivered: boolean;
}

export interface AccountInput {
  tier: string; // free | pro | enterprise | agency | growth ...
  latestOrder: OrderSummary | null;
}

export interface OrgInput {
  name?: string | null;
  handlesCUI?: boolean | null;
}

export interface CustomerStatusInput {
  /** Null when assessment data isn't available (e.g. server-side account-only view). */
  sprs: SprsInput | null;
  account: AccountInput;
  org?: OrgInput;
}

export interface NextStep {
  title: string;
  detail: string;
  action?: { label: string; href: string };
}

export interface CustomerStatus {
  stage: JourneyStage;
  stageLabel: string;
  standing: string;
  standingLevel: StandingLevel;
  sprsScore: number | null;
  sprsLabel: string;
  completionPercent: number | null;
  metCount: number | null;
  gapCount: number | null;
  nextStep: NextStep;
  needed: string[];
  topGaps: StatusGap[];
  order: OrderSummary | null;
  tier: string;
  /** True when SPRS data was available to compute the readiness view. */
  hasAssessment: boolean;
}

const ASSESSMENT_HREF = '/command-center/shield/assessment';
const REPORTS_HREF = '/command-center/shield/reports';
const DEPLOY_HREF = '/docs/quickstart';
const PRICING_HREF = '/pricing';

/** SPRS band → human standing level (mirrors scoring.getScoreLabel bands). */
export function standingLevelForScore(score: number): StandingLevel {
  if (!Number.isFinite(score)) return 'unknown';
  if (score >= 88) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 0) return 'fair';
  if (score >= -50) return 'poor';
  return 'critical';
}

function sprsLabelForScore(score: number): string {
  if (!Number.isFinite(score)) return 'Unknown';
  if (score >= 110) return 'Perfect';
  if (score >= 70) return 'Good';
  if (score >= 0) return 'Fair';
  if (score >= -50) return 'Poor';
  return 'Critical';
}

const STAGE_LABELS: Record<JourneyStage, string> = {
  not_started: 'Getting started',
  assessing: 'Self-assessment in progress',
  report_pending: 'Report engagement active',
  remediating: 'Closing control gaps',
  report_delivered: 'Evidence delivered',
  monitoring: 'Continuous monitoring',
};

/**
 * Synthesize the full customer status. Precedence for the single "next step":
 *   1. No assessment started       → start the self-assessment
 *   2. Assessment incomplete        → finish it
 *   3. Paid report not yet delivered→ deploy the proxy (unblocks their evidence)
 *   4. Open control gaps            → fix the highest-impact one
 *   5. Report delivered / all clear → monitor / maintain
 */
export function buildCustomerStatus(input: CustomerStatusInput): CustomerStatus {
  const { sprs, account } = input;
  const order = account.latestOrder;
  const tier = account.tier || 'free';
  const hasAssessment = !!sprs && sprs.assessedCount > 0;

  const sprsScore = sprs ? sprs.score : null;
  const completionPercent = sprs ? sprs.completionPercent : null;
  const metCount = sprs ? sprs.metCount : null;
  const gapCount = sprs ? sprs.unmetCount + sprs.partialCount : null;
  const topGaps = sprs ? sprs.topGaps : [];

  const standingLevel: StandingLevel =
    sprs && hasAssessment ? standingLevelForScore(sprs.score) : 'unknown';
  const sprsLabel = sprs ? sprsLabelForScore(sprs.score) : 'Not assessed';

  const needed: string[] = [];
  let stage: JourneyStage;
  let nextStep: NextStep;
  let standing: string;

  const reportPending = !!order && !order.isDelivered;

  if (!sprs) {
    // No assessment visibility (e.g. the server account-only view — SPRS data
    // lives in the browser). Drive the status from order state; never falsely
    // claim the customer hasn't started an assessment we simply can't see.
    if (reportPending) {
      stage = 'report_pending';
      standing = 'Your $499 report engagement is active.';
      nextStep = {
        title: 'Deploy the proxy (Mode B / Docker)',
        detail:
          'Run HoundShield in your own environment so it can observe AI prompt traffic for 14 days and produce your signed NIST 800-171 evidence PDF.',
        action: { label: 'Deploy the proxy', href: DEPLOY_HREF },
      };
      needed.push('Deploy the proxy in your environment (Mode B) to start the 14-day observation.');
    } else if (order && order.isDelivered) {
      stage = 'report_delivered';
      standing = 'Your evidence report is delivered.';
      nextStep = {
        title: 'Keep your evidence current',
        detail:
          'Move to continuous monitoring so your SPRS posture and audit trail stay assessment-ready as your AI usage changes.',
        action: { label: 'See monitoring plans', href: PRICING_HREF },
      };
    } else {
      stage = 'not_started';
      standing = 'Open the dashboard to run your CMMC self-assessment and see your SPRS score.';
      nextStep = {
        title: 'Start your CMMC self-assessment',
        detail:
          'Answer the 110 NIST 800-171 Rev 2 controls to get your live SPRS score and see exactly where you stand.',
        action: { label: 'Begin assessment', href: ASSESSMENT_HREF },
      };
      needed.push('Complete the 110-control self-assessment to generate a SPRS score.');
    }
  } else if (sprs.assessedCount === 0) {
    // 1. Not started
    stage = 'not_started';
    standing = "You haven't started your CMMC self-assessment yet.";
    nextStep = {
      title: 'Start your CMMC self-assessment',
      detail:
        'Answer the 110 NIST 800-171 Rev 2 controls to get your live SPRS score and see exactly where you stand.',
      action: { label: 'Begin assessment', href: ASSESSMENT_HREF },
    };
    needed.push('Complete the 110-control self-assessment to generate a SPRS score.');
    if (reportPending) needed.push(`Deploy the proxy to fulfill report ${order!.reference}.`);
  } else if (sprs.completionPercent < 100) {
    // 2. Assessment incomplete
    stage = 'assessing';
    const answered = Math.round((sprs.completionPercent / 100) * sprs.totalControls);
    standing = `You've assessed ${answered} of ${sprs.totalControls} controls — SPRS ${sprs.score} so far (${sprsLabel}).`;
    nextStep = {
      title: 'Finish your self-assessment',
      detail: `${sprs.totalControls - answered} controls still need a response. Completing them gives you an accurate SPRS score and a full gap list.`,
      action: { label: 'Continue assessment', href: ASSESSMENT_HREF },
    };
    needed.push(`Respond to the remaining ${sprs.totalControls - answered} controls.`);
    if (reportPending) needed.push(`Deploy the proxy to fulfill report ${order!.reference}.`);
  } else if (reportPending) {
    // 3. Assessment done, paid report not delivered → deploy to unblock evidence
    stage = 'report_pending';
    standing = `Assessment complete — SPRS ${sprs.score} (${sprsLabel}). Your report engagement is active.`;
    nextStep = {
      title: 'Deploy the proxy (Mode B / Docker)',
      detail:
        'Run HoundShield in your own environment so it can observe AI prompt traffic for 14 days and produce your signed NIST 800-171 evidence PDF.',
      action: { label: 'Deploy the proxy', href: DEPLOY_HREF },
    };
    needed.push('Deploy the proxy in your environment (Mode B) to start the 14-day observation.');
    if (gapCount && gapCount > 0)
      needed.push(`Remediate ${gapCount} open control gap${gapCount === 1 ? '' : 's'} to raise your SPRS score.`);
  } else if (sprs.unmetCount + sprs.partialCount > 0) {
    // 4. Remediating open gaps
    stage = 'remediating';
    const top = topGaps[0];
    standing = `SPRS ${sprs.score} (${sprsLabel}) with ${sprs.unmetCount + sprs.partialCount} open control gap${sprs.unmetCount + sprs.partialCount === 1 ? '' : 's'}.`;
    nextStep = top
      ? {
          title: `Fix ${top.controlId} — ${top.title}`,
          detail: `${top.fix} (~${top.hours}h). This is your highest-impact gap: it currently costs you ${Math.abs(top.deduction)} SPRS point${Math.abs(top.deduction) === 1 ? '' : 's'}.`,
          action: { label: 'Open remediation plan', href: REPORTS_HREF },
        }
      : {
          title: 'Review your remediation plan',
          detail: 'Work through your prioritized control gaps to raise your SPRS score.',
          action: { label: 'Open remediation plan', href: REPORTS_HREF },
        };
    needed.push(
      `Remediate ${sprs.unmetCount + sprs.partialCount} open control gap${sprs.unmetCount + sprs.partialCount === 1 ? '' : 's'}, highest-impact first.`,
    );
  } else if (order && order.isDelivered) {
    // 5a. Report delivered, no gaps
    stage = 'report_delivered';
    standing = `All 110 controls met — SPRS ${sprs.score} (${sprsLabel}). Your evidence report is delivered.`;
    nextStep = {
      title: 'Keep your evidence current',
      detail:
        'Move to continuous monitoring so your SPRS posture and audit trail stay assessment-ready as your AI usage changes.',
      action: { label: 'See monitoring plans', href: PRICING_HREF },
    };
  } else {
    // 5b. Clean assessment, no active order
    stage = 'monitoring';
    standing = `All 110 controls met — SPRS ${sprs.score} (${sprsLabel}). You're assessment-ready.`;
    nextStep = {
      title: 'Lock in your evidence',
      detail:
        'Order your $499 CMMC AI Risk Assessment Report, or move to continuous monitoring, so you have C3PAO-ready evidence on file.',
      action: { label: 'Get your evidence report', href: PRICING_HREF },
    };
  }

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    standing,
    standingLevel,
    sprsScore,
    sprsLabel,
    completionPercent,
    metCount,
    gapCount,
    nextStep,
    needed,
    topGaps: topGaps.slice(0, 5),
    order,
    tier,
    hasAssessment,
  };
}

/**
 * Render a CustomerStatus into a clean-prose Brain AI answer. Deterministic and
 * offline: this is what lets Brain AI be "customer-aware" WITHOUT sending any of
 * the customer's data to a commercial LLM. Uses `•` bullets (the GlobalChat
 * sanitizer's format) and never emits markdown emphasis.
 */
export function buildStatusAnswer(status: CustomerStatus): string {
  const lines: string[] = [];
  lines.push(`Here's exactly where you stand:`);
  lines.push('');
  lines.push(`• Stage: ${status.stageLabel}`);
  if (status.sprsScore !== null) {
    lines.push(`• SPRS score: ${status.sprsScore} (${status.sprsLabel})`);
  }
  if (status.completionPercent !== null) {
    lines.push(`• Assessment: ${status.completionPercent}% complete`);
  }
  if (status.gapCount !== null) {
    lines.push(`• Open control gaps: ${status.gapCount}`);
  }
  if (status.order) {
    lines.push(`• Report order ${status.order.reference}: ${status.order.statusLabel}`);
  }
  lines.push('');
  lines.push(`Your next step: ${status.nextStep.title}.`);
  lines.push(status.nextStep.detail);

  if (status.topGaps.length > 0) {
    lines.push('');
    lines.push('Where to focus (highest-impact gaps first):');
    for (const gap of status.topGaps.slice(0, 3)) {
      lines.push(`• ${gap.controlId} — ${gap.title}: ${gap.fix} (~${gap.hours}h)`);
    }
  }

  if (status.needed.length > 0) {
    lines.push('');
    lines.push('Still needed:');
    for (const item of status.needed) lines.push(`• ${item}`);
  }

  return lines.join('\n');
}
