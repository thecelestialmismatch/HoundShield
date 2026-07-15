import { Geist, Geist_Mono } from 'next/font/google'

/**
 * Brand typeface: Geist (OFL) — the founder-approved geometric grotesque
 * (2026-07-15, "use this font everywhere"). It fills BOTH type roles, so
 * display and body are two instances of the same family; next/font
 * content-hashes the underlying woff2 files, so the browser downloads the
 * font once. Keep the CSS variable names stable — hermes.css, globals.css,
 * tailwind.config.js and lccStyles.ts all consume --font-display/--font-body,
 * and an undefined var() silently regresses every page to Times.
 */
export const displayFont = Geist({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: 'variable',
})

export const bodyFont = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: 'variable',
})

/**
 * Metrics/code face: Geist Mono — same family as the brand sans, self-hosted
 * like the others. This replaced a runtime CSS @import of the previous mono
 * from a third-party font CDN (an external request on every visit — wrong for
 * a zero-data-exfiltration brand, and slower: CSS import chains block render).
 */
export const monoFont = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: 'variable',
})
