import { describe, it, expect } from 'vitest'
import { readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { GET } from '../route'
import { GATEWAY_BASE_URL } from '@/lib/gateway/base-url'

/**
 * The gateway base URL must answer for itself.
 *
 * `GATEWAY_BASE_URL` is printed in Settings next to a copy button, in the docs,
 * in the day-3 onboarding email and by Brain AI. Pasting it into a browser —
 * the first thing anyone does to check a URL is alive — returned the branded
 * 404 page until this route existed.
 */

const V1_DIR = path.join(__dirname, '..')

async function payload() {
  return (await GET().json()) as Record<string, unknown>
}

describe('GET /api/v1', () => {
  it('answers 200, not the 404 page', async () => {
    expect(GET().status).toBe(200)
  })

  it('reports the same base URL every other surface hands out', async () => {
    expect((await payload()).base_url).toBe(GATEWAY_BASE_URL)
  })

  it('tells an integrator how to authenticate', async () => {
    const auth = (await payload()).authentication as Record<string, string>
    expect(auth.scheme).toBe('Bearer')
    expect(auth.header).toMatch(/Authorization/)
    // The key is created in the product, not by emailing support.
    expect(auth.create_key_at).toBe('/command-center/settings')
  })

  it('states the Mode-A CUI boundary in the payload, not in a footnote', async () => {
    const mode = (await payload()).deployment_mode as Record<string, unknown>

    // CLAUDE.md NEVER-DO: never claim the hosted Vercel endpoint is CUI-safe.
    expect(mode.cui_safe).toBe(false)
    expect(String(mode.notice)).toMatch(/NOT FedRAMP-authorized/i)
    expect(String(mode.notice)).toMatch(/Mode B/)
  })

  it('is not indexable — it is an API document, not a page', () => {
    expect(GET().headers.get('X-Robots-Tag')).toBe('noindex')
  })

  /**
   * The descriptor's whole value is being true. A route added under /api/v1
   * without a line here would make this document quietly wrong, which is worse
   * than the 404 it replaced.
   */
  it('lists every endpoint that actually exists under /api/v1', async () => {
    const documented = new Set(
      Object.keys((await payload()).endpoints as Record<string, string>).map((k) =>
        k.replace(/^[A-Z]+\s+/, ''),
      ),
    )

    const onDisk: string[] = []
    const walk = (dir: string, prefix: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        if (entry.name === '__tests__') continue
        const next = path.join(dir, entry.name)
        // Dynamic segments ([id]) are covered by their parent collection route.
        const seg = entry.name.startsWith('[') ? null : `${prefix}/${entry.name}`
        if (seg && existsSync(path.join(next, 'route.ts'))) onDisk.push(seg)
        if (seg) walk(next, seg)
      }
    }
    walk(V1_DIR, '')

    expect(onDisk.length).toBeGreaterThan(0)
    for (const route of onDisk) {
      expect(documented, `${route} exists on disk but is missing from the /api/v1 descriptor`).toContain(route)
    }
  })
})
