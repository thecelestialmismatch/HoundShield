import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const APP_ROOT = resolve(process.cwd())
const SOURCE_ROOTS = ['app', 'components', 'lib/seo']
const SOURCE_SUFFIXES = new Set(['.ts', '.tsx', '.js', '.jsx'])
const SKIPPED_SEGMENTS = new Set(['__tests__', 'node_modules', '.next'])

function publicSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (SKIPPED_SEGMENTS.has(entry.name)) return []
    if (entry.isDirectory()) return publicSourceFiles(path)
    return SOURCE_SUFFIXES.has(entry.name.slice(entry.name.lastIndexOf('.'))) ? [path] : []
  })
}

describe('public claim boundary', () => {
  it('does not publish unsupported readiness, automatic-compliance, or hosted-FedRAMP claims', () => {
    const forbidden = [
      /C3PAO-ready/i,
      /C3PAO accepts/i,
      /full compliance/i,
      /HIPAA-compliant audit/i,
      /hosted on FedRAMP-authorized/i,
    ]

    const violations = SOURCE_ROOTS.flatMap((sourceRoot) =>
      publicSourceFiles(join(APP_ROOT, sourceRoot)).flatMap((file) => {
        const source = readFileSync(file, 'utf8')
        return forbidden
          .filter((pattern) => pattern.test(source))
          .map((pattern) => `${relative(APP_ROOT, file)}: ${pattern}`)
      }),
    )

    expect(
      violations,
      'Public pages, shared chrome, and SEO metadata must remain scoped to the actual deployment and human-review boundary.',
    ).toEqual([])
  })
})
