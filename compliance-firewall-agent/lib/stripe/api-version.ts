/**
 * The ONE place the Stripe API version is pinned.
 *
 * Every server-side Stripe client constructs with this constant. When a
 * stripe SDK major bump changes `Stripe.LatestApiVersion`, tsc fails HERE —
 * in exactly one file — instead of in every route that hardcoded the string
 * (the 2026-07-16 dependabot breakage hit five routes at once).
 *
 * The contract test (api-version-contract.test.ts) rejects any quoted
 * apiVersion literal outside this file.
 */
import type Stripe from 'stripe';

export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2026-06-24.dahlia';
