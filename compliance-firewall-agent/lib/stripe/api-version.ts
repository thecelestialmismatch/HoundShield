import Stripe from 'stripe';

/**
 * The ONE place the Stripe API version is pinned.
 *
 * Every server-side Stripe client constructs with this constant, so a version
 * lives in exactly one file instead of in every route that hardcoded the string
 * (the 2026-07-16 dependabot breakage hit five routes at once). The contract
 * test (api-version-contract.test.ts) rejects any quoted apiVersion literal
 * outside this file.
 *
 * WHY IT IS DERIVED AND NOT A LITERAL.
 * `Stripe.LatestApiVersion` is a single string-literal type — the SDK admits
 * exactly one value — so a hand-written literal here fails tsc the moment the
 * SDK bumps. It did, repeatedly: #262 (a MINOR 22.3.2 → 22.4.0), and again on
 * PR #324, where a routine group bump died on
 * `TS2322: Type '"2026-07-29.dahlia"' is not assignable to type
 * '"2026-08-26.dahlia"'` — one unreadable line at the bottom of a build log,
 * blocking a batch that included a Next.js patch and a Sentry update.
 *
 * The literal was never protecting anything at RUNTIME. stripe-node already
 * defaults `apiVersion` to its own pinned `Stripe.API_VERSION`
 * (`version: props.apiVersion || DEFAULT_API_VERSION` in stripe.core.js), so
 * passing a matching literal changes nothing on the wire — it exists purely as
 * a tripwire. Deriving the value keeps the wire behaviour identical, keeps the
 * single-source property, and makes it impossible for a bump to break the
 * build.
 *
 * The tripwire itself is NOT removed, only moved somewhere a human can act on
 * it: `REVIEWED_API_VERSION` below records the version a person has actually
 * read the changelog for, and `api-version-contract.test.ts` fails with an
 * actionable message when the SDK moves past it. Same gate, legible failure.
 */
export const STRIPE_API_VERSION: Stripe.LatestApiVersion = Stripe.API_VERSION;

/**
 * The API version a human has reviewed against Stripe's changelog.
 *
 * When a stripe SDK bump moves `Stripe.API_VERSION` past this, the contract
 * test goes red with instructions. To clear it: read
 * https://docs.stripe.com/changelog for the versions in between, confirm
 * nothing this integration reads has moved (the `invoice.subscription` →
 * `invoice.parent.subscription_details.subscription` relocation in
 * `2025-04-30.basil` is the cautionary example — see the webhook route), then
 * update this one string.
 *
 * Typed as `string`, deliberately: it must be comparable to a DIFFERENT
 * version than the SDK's, which is the whole point of a review marker.
 */
export const REVIEWED_API_VERSION: string = '2026-07-29.dahlia';
