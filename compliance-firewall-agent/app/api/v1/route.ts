/**
 * GET /api/v1 — the gateway service descriptor.
 *
 * Why this route exists at all.
 *
 * `GATEWAY_BASE_URL` is `https://www.houndshield.com/api/v1`. Settings prints it
 * under "GATEWAY URL" next to a copy button, the docs print it, the day-3
 * onboarding email prints it, and Brain AI recites it. The very first thing a
 * new operator does with a URL they were told to paste into their SDK is paste
 * it into a browser to check it is alive — and until now that returned the
 * branded 404 page. The founder did exactly this on 2026-08-07.
 *
 * There was nothing wrong with the gateway. `/api/v1/chat/completions` answers
 * correctly (401 without a key, which is the fail-closed behaviour we want). But
 * a 404 at the root of the URL we hand out reads as "this product is broken",
 * and that is the wrong first impression to give the one person who has just
 * decided to integrate.
 *
 * So the base URL now answers for itself: what this is, which endpoints exist,
 * how to authenticate, and the deployment-mode boundary. Discovery only — no
 * auth required and nothing sensitive returned, exactly like the public
 * capability documents shipped by other OpenAI-compatible gateways.
 *
 * CUI BOUNDARY (CLAUDE.md, non-negotiable): this hosted endpoint is Mode A —
 * Vercel, not FedRAMP-authorized, non-CUI evaluation only. That is stated in the
 * payload rather than left for a sales conversation, because this response is
 * the first technical artifact a defense integrator reads and a silent omission
 * here is the exact mistake the NEVER-DO list exists to prevent.
 */

import { NextResponse } from 'next/server'
import { GATEWAY_BASE_URL } from '@/lib/gateway/base-url'
import { ENGINE_COUNT, PATTERN_COUNT } from '@/lib/detection/engines'

// Static payload, but the route is kept dynamic-safe: it must never be served
// as a stale prerender if the constants above change between deploys.
export const dynamic = 'force-static'
export const revalidate = 3600

export function GET() {
  return NextResponse.json(
    {
      service: 'houndshield-gateway',
      description:
        'OpenAI-compatible AI gateway. Every prompt is scanned locally against ' +
        `${ENGINE_COUNT} detection engines (${PATTERN_COUNT} patterns) for CUI, PHI, PII and ` +
        'secrets before it reaches the upstream model, and recorded in a ' +
        'SHA-256 hash-chained audit log.',
      base_url: GATEWAY_BASE_URL,
      // OpenAI-compatible clients take `base_url` and append the path themselves.
      endpoints: {
        'POST /chat/completions': 'Chat completions. Streaming and non-streaming.',
        'GET /patterns': 'List your organization\'s custom detection patterns.',
        'POST /patterns': 'Create a custom detection pattern.',
        'POST /advisor-classify': 'Classify a single text sample without proxying it upstream.',
      },
      authentication: {
        scheme: 'Bearer',
        header: 'Authorization: Bearer <your gateway API key>',
        create_key_at: '/command-center/settings',
      },
      deployment_mode: {
        mode: 'A',
        name: 'Hosted trial',
        cui_safe: false,
        // Stated plainly. A DoD integrator reading this file must not have to
        // infer it, and must not be able to claim later that we implied otherwise.
        notice:
          'This hosted endpoint runs on Vercel and is NOT FedRAMP-authorized. ' +
          'Use it for demos and non-CUI evaluation only. CUI, ITAR and covered ' +
          'defense information require Mode B (self-hosted Docker inside your ' +
          'own boundary), where prompt data never leaves your network.',
        self_host: '/docs',
      },
      docs: '/docs',
      status: '/api/health',
    },
    {
      status: 200,
      headers: {
        // Discovery document, safe to cache at the edge.
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        // Not a page. Keep it out of the index.
        'X-Robots-Tag': 'noindex',
      },
    },
  )
}
