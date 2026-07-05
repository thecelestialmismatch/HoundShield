/**
 * Status-intent detection + consent-gated answer composition for Brain AI.
 *
 * When a signed-in customer asks Brain AI "where do I stand / what's my next
 * step / where did I go wrong", we answer from THEIR OWN status — but only after
 * they've explicitly granted Brain AI access to their account data (migration
 * 022). The answer is built deterministically by lib/customer/status; no customer
 * data is ever sent to the commercial LLM, and only the caller's own data is used.
 */

import { z } from 'zod';
import { buildStatusAnswer, type CustomerStatus } from '@/lib/customer/status';

/**
 * The "ask permission" reply. Shown when a customer asks a status question but
 * hasn't granted Brain AI access to their account data (or isn't signed in).
 * Clean prose, no markdown — matches the GlobalChat rendering contract.
 */
export const CONSENT_REQUIRED_MESSAGE =
  "I can tell you exactly where you stand — your SPRS score, what's left, where the gaps are, and your single next step. " +
  "Before I look at your account data, I need your permission. Open Settings and turn on 'Brain AI data access', " +
  "then ask me again. You can withdraw it anytime, and I only ever use your own data — never anyone else's.";

const firstPerson =
  /\b(my|mine|i['’]?m|i am|i've|i have|am i|do i|did i|can i|will i|should i|me|our|we|us)\b/i;
const statusMarker =
  /\b(stand|standing|status|progress|next|score|sprs|ready|readiness|gap|gaps|wrong|mistak|fix|remediat|need|needed|left|remaining|report|order|compliance|posture|where do|how am i|how.?m i doing|on track)\b/i;

/**
 * True when the text is a personalized status question ("where do I stand",
 * "what's my next step", "where did I go wrong", "am I ready"). Requires both a
 * first-person marker and a status marker so it never hijacks general product
 * questions like "what is SPRS" (which the FAQ layer should answer).
 */
export function isStatusQuestion(text: string): boolean {
  const t = (text ?? '').trim();
  if (t.length < 3) return false;
  // A couple of unambiguous phrasings that may omit an explicit pronoun.
  if (/\b(where do i stand|what.?s my next step|am i cmmc ready|how am i doing)\b/i.test(t)) {
    return true;
  }
  return firstPerson.test(t) && statusMarker.test(t);
}

/**
 * Validator for the client-supplied SPRS slice. The client (the user's own
 * browser) computes it from local assessment data and passes it in; the server
 * merges it with the account slice it reads from the user's OWN rows. Assessment
 * data therefore never has to be persisted server-side. Anything malformed is
 * ignored, and the server falls back to an account-only status.
 */
export const sprsInputSchema = z.object({
  score: z.number(),
  completionPercent: z.number(),
  totalControls: z.number(),
  metCount: z.number(),
  partialCount: z.number(),
  unmetCount: z.number(),
  assessedCount: z.number(),
  topGaps: z.array(
    z.object({
      controlId: z.string(),
      title: z.string(),
      status: z.string(),
      deduction: z.number(),
      fix: z.string(),
      hours: z.number(),
    }),
  ),
});

/**
 * Compose the answer to a status question. Returns the permission-request
 * message unless consent is granted AND a status is available; otherwise returns
 * the deterministic status answer.
 */
export function statusAnswerFromConsent(opts: {
  consent: boolean;
  status: CustomerStatus | null;
}): string {
  if (!opts.consent || !opts.status) return CONSENT_REQUIRED_MESSAGE;
  return buildStatusAnswer(opts.status);
}
