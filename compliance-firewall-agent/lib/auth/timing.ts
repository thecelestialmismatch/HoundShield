/**
 * Response-latency equalization for the credential routes.
 *
 * THE ORACLE THIS CLOSES. GoTrue only runs bcrypt when the email resolves to a
 * user; an unknown address returns without hashing. The difference is tens to
 * hundreds of milliseconds and is measurable across the public internet, so
 * identical wording alone does not make a sign-in endpoint non-enumerating.
 * This was unreachable before the server routes existed — the browser talked
 * to GoTrue directly and the latency was never ours to shape.
 *
 * WHAT THIS ACTUALLY BUYS, stated honestly rather than optimistically:
 *
 *   A floor makes both paths cost the same as long as the real work finishes
 *   under it. It cannot help when the real work overruns the floor, and no
 *   fixed floor can, because we do not control GoTrue's tail latency.
 *
 *   So the floor is not the whole defence — it is the half that makes a
 *   SINGLE measurement uninformative. The other half is the rate limiter and
 *   the lockout: a statistical timing attack needs many samples of the same
 *   address, and ./lockout.ts caps that at LOCKOUT_THRESHOLD attempts before
 *   the address stops answering at all. Together those make the attack
 *   impractical. Either alone would not.
 *
 *   Jitter is deliberately added on top so repeated identical timings cannot
 *   be averaged out cheaply. It raises the sample count an attacker needs; it
 *   does not by itself hide anything.
 *
 * Do not "optimize" the floor away because a route feels slow. It is load-
 * bearing, and app/api/auth/__tests__ asserts it.
 */

/** Floor for every credential response. Above the observed bcrypt + round-trip cost. */
export const AUTH_MIN_RESPONSE_MS = 600;

/** Random extra delay, 0..AUTH_JITTER_MS, so timings do not stack into a clean signal. */
export const AUTH_JITTER_MS = 120;

/**
 * Milliseconds still owed before a response may be sent. Pure and injectable so
 * the floor can be asserted without a real clock.
 *
 * `jitter` is a caller-supplied 0..1 fraction (Math.random() in production),
 * which keeps this function deterministic under test.
 */
export function remainingDelayMs(
  startedAt: number,
  now: number,
  jitter: number,
  minMs: number = AUTH_MIN_RESPONSE_MS,
  jitterMs: number = AUTH_JITTER_MS,
): number {
  const elapsed = now - startedAt;
  // Clamp AND reject non-finite input: Math.max(0, NaN) is NaN, which would
  // propagate into setTimeout and silently drop the floor to zero — the one
  // failure mode that would quietly reopen the oracle.
  const fraction = Number.isFinite(jitter) ? Math.max(0, Math.min(1, jitter)) : 0;
  const target = minMs + Math.floor(fraction * jitterMs);
  return Math.max(0, target - elapsed);
}

/**
 * Hold the response until the floor is reached. Call immediately before
 * returning from a credential route, on EVERY path — success, failure,
 * lockout, and throttle alike. A path that skips it becomes the oracle.
 */
export async function settleAuthTiming(startedAt: number): Promise<void> {
  const delay = remainingDelayMs(startedAt, Date.now(), Math.random());
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
}
