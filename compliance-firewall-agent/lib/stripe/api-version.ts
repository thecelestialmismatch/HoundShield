/**
 * The ONE place the Stripe API version is pinned.
 *
 * Every server-side Stripe client constructs with this constant. When a
 * stripe SDK bump changes `Stripe.LatestApiVersion`, tsc fails HERE — in
 * exactly one file — instead of in every route that hardcoded the string
 * (the 2026-07-16 dependabot breakage hit five routes at once).
 *
 * `Stripe.LatestApiVersion` is a single string-literal type, so the SDK admits
 * exactly one value: this constant is not a choice, it tracks the installed
 * SDK. A bump that changes it must be followed through here in the same PR, or
 * `main` goes red — a MINOR bump is enough (22.3.2 → 22.4.0 in #262 moved it
 * from 2026-06-24.dahlia, which is why this line was updated out of band).
 *
 * The contract test (api-version-contract.test.ts) rejects any quoted
 * apiVersion literal outside this file.
 */
import type Stripe from 'stripe';

export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2026-07-29.dahlia';
