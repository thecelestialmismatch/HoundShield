/**
 * The gateway base URL a customer points their OpenAI-compatible client at.
 *
 * ONE constant, because it was eight copies of a string that does not work —
 * spread across TWO different dead hosts, which is why fixing one of them
 * looked complete and was not.
 *
 * Every surface that hands out the gateway URL advertised a branded host:
 * Settings, the console settings tab, the public API docs and a marketing code
 * block said `proxy.houndshield.com`; five Brain AI answers, the chat system
 * prompt, the Brain AI runtime-modes table and the day-3 onboarding email said
 * `gateway.houndshield.com`. Both resolve — they point at Vercel edge IPs — and
 * then answer **404 DEPLOYMENT_NOT_FOUND**: the DNS is there, but no Vercel
 * project is attached. A customer following ANY of those surfaces, including
 * one that arrived in their inbox on day 3, got an error page, not the gateway.
 *
 * Verified 2026-08-05, against production:
 *
 *   POST https://proxy.houndshield.com/v1/chat/completions        → 404 (dead)
 *   POST https://proxy.houndshield.com/api/v1/chat/completions    → 404 (dead)
 *   POST https://gateway.houndshield.com/v1/chat/completions      → 404 (dead)
 *   POST https://gateway.houndshield.com/api/v1/chat/completions  → 404 (dead)
 *   POST https://www.houndshield.com/api/v1/chat/completions      → 401 Invalid API key
 *
 * The 401 is the correct answer and the one we want: the route is live, and
 * `resolveApiKey` reached the database, found no matching hash, and failed
 * closed. So this is the host that actually serves the product today.
 *
 * FOUNDER ACTION (not a code change): if either branded host is meant to be the
 * gateway, point it at this Vercel project in the Vercel dashboard — the DNS
 * already resolves there, only the project assignment is missing. Once it
 * serves the app, change this one constant and every surface follows. Until
 * then, shipping a branded host would be shipping a 404.
 *
 * Guarded by `app/__tests__/dashboard-data-rail.test.ts` ("link 0"), which
 * fails the build if either dead host reappears anywhere in app/ components/
 * lib/ outside this file.
 */
export const GATEWAY_BASE_URL = 'https://www.houndshield.com/api/v1';

/** Origin only — for copy that talks about the host rather than the API root. */
export const GATEWAY_ORIGIN = 'https://www.houndshield.com';

/** Everything under `/api`. Doc snippets compose `${root}/v1/...` and
 *  `${root}/health` off this, so it must be the API root, not the origin. */
export const GATEWAY_API_ROOT = `${GATEWAY_ORIGIN}/api`;

/** The full chat-completions endpoint, for curl snippets and SDK examples. */
export const GATEWAY_COMPLETIONS_URL = `${GATEWAY_BASE_URL}/chat/completions`;
