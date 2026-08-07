import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { LCC_CSS } from '../lccStyles'

const SRC = readFileSync(path.resolve(__dirname, '../lccStyles.ts'), 'utf8')

/**
 * `LCC_CSS` is one long template literal, and that makes it a trap.
 *
 * A backtick typed inside a CSS comment there — the natural way to quote a
 * property name, e.g. writing about minmax(0,1fr) — silently TERMINATES the
 * template literal. The rest of the stylesheet then parses as JavaScript and the
 * whole module fails to load, taking every dashboard panel with it.
 *
 * This happened three times on 2026-08-07 alone while editing this file. The
 * failure is loud (a parse error) but the cause is not obvious from the message,
 * which points at a line far below the real one. This guard names it directly.
 */
describe('lccStyles.ts stays a valid template literal', () => {
  it('has no backtick inside the CSS body', () => {
    // Backticks in the FILE HEADER above `export const LCC_CSS = ` are ordinary
    // prose and harmless. Only one between the delimiters is fatal, so scope the
    // check to that region rather than counting the whole file.
    const open = SRC.indexOf('export const LCC_CSS = `')
    expect(open, 'LCC_CSS declaration not found — did the export get renamed?').toBeGreaterThan(-1)
    const bodyStart = open + 'export const LCC_CSS = `'.length
    const body = SRC.slice(bodyStart)
    const end = body.indexOf('`')
    expect(end, 'LCC_CSS is never closed').toBeGreaterThan(-1)

    // Everything after the first backtick that follows the opener must be the
    // tail of the module, not more CSS. If CSS survives past it, a stray
    // backtick closed the literal early.
    const tail = body.slice(end + 1).trim()
    expect(
      tail.includes('.hs-lcc'),
      'a backtick inside the CSS (usually quoting a property in a comment) closed the template literal early',
    ).toBe(false)
  })

  it('exports CSS, not a truncated fragment', () => {
    // If a stray backtick ever closes the literal early, LCC_CSS still exports —
    // just missing everything after the break. Anchor on rules from the top,
    // middle and very bottom of the file so a truncation cannot pass.
    expect(LCC_CSS).toContain('.hs-lcc .panel')
    expect(LCC_CSS).toContain('.hs-lcc .op-actions')
    expect(LCC_CSS).toContain('.hs-lcc .op-index')
    expect(LCC_CSS.length).toBeGreaterThan(20000)
  })

  it('has balanced braces', () => {
    const open = (LCC_CSS.match(/\{/g) ?? []).length
    const close = (LCC_CSS.match(/\}/g) ?? []).length
    expect(open).toBe(close)
  })
})
