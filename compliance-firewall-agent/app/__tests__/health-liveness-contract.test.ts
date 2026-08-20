import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), 'utf8')

describe('health endpoint boundary', () => {
  it('keeps the public probe to a non-cacheable liveness response', () => {
    const source = read('app/api/health/route.ts')
    expect(source).toContain('{ status: "ok"')
    expect(source).toContain('Cache-Control')
    expect(source).not.toMatch(/process\.env/)
    expect(source).not.toMatch(/diagnostics\s*:/i)
  })

  it('gates coarse diagnostics behind server-side, fail-closed administrator checks', () => {
    const source = read('app/api/admin/health/route.ts')
    expect(source).toContain('getSessionUser')
    expect(source).toContain('isAdmin')
    expect(source).toContain("{ error: 'Not found' }")
    expect(source).toContain('status: 404')
    expect(source).not.toMatch(/process\.env/)
    expect(source).not.toMatch(/(?:secret|token|password|apiKey)\s*:/i)
  })
})
