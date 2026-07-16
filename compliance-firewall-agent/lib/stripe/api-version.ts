import type Stripe from 'stripe';

/**
 * The ONE place the Stripe API version is pinned.
 *
 * Typed against the SDK's own LatestApiVersion literal, so when the stripe
 * package major-bumps its pinned version, tsc fails HERE — in exactly one
 * file — instead of in every route that instantiates a client. (The stripe
 * 20→22 bump broke five separately hardcoded literals at once.)
 */
export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2026-06-24.dahlia';
