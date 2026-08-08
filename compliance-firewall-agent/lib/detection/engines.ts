// BUILTIN_PATTERNS is the complete registry — it already contains every CMMC
// and HIPAA pattern. Importing those two separately here is what produced the
// double-counted PATTERN_COUNT; see the note on that constant below.
import { BUILTIN_PATTERNS } from '@/lib/classifier/patterns'

/**
 * Single source of truth for the detection numbers used in marketing copy.
 *
 * Why this file exists: "16 detection engines" was hardcoded as a string
 * literal in four places (homepage, /features, /agents, products data) while
 * the actual list lived in app/features/page.tsx. The claim was correct, but
 * nothing stopped it drifting from the list — add a 17th engine and three
 * pages silently lie. Marketing claims about the product must be computed
 * FROM the product.
 *
 * Two distinct numbers, do not conflate them:
 *   ENGINE_COUNT  — detection families a buyer recognises ("CAGE codes").
 *   PATTERN_COUNT — individual regexes implementing them. Always >= engines.
 *
 * Locked by lib/detection/__tests__/engines.test.ts.
 */

/** The detection families, in the order shown on /features. */
export const ENGINES = [
  'CUI markings', 'CAGE codes', 'Contract / DoDAAC #', 'Clearance levels',
  'ITAR / EAR terms', 'Export-control', 'SSN / PII', 'PHI · MRN',
  'ICD / diagnosis', 'API keys / secrets', 'AWS / cloud keys', 'JWT / tokens',
  'PCI / card data', 'Source code', 'Trade-secret IP', 'IP / network data',
] as const

/** Number of detection engine families. Currently 16. */
export const ENGINE_COUNT = ENGINES.length

/**
 * Number of shipped regex patterns implementing those families. Currently 53.
 *
 * This was `BUILTIN_PATTERNS.length + CMMC_PATTERNS.length + HIPAA_PATTERNS.length`,
 * which double-counted: BUILTIN_PATTERNS already CONTAINS every CMMC and HIPAA
 * pattern (verified — all 17 and all 20 appear in it by name). The sum returned
 * 90 for 53 real patterns, and the homepage published that number twice, in the
 * stat row and the detection-engines card.
 *
 * A 70% overstatement of the core product claim is exactly the failure mode
 * CLAUDE.md's NEVER-DO list names: buyers verify everything, and the pattern
 * list is MIT-licensed and sitting in the repo for anyone to count.
 *
 * Derived from the one array that holds them all, so it cannot drift again.
 */
export const PATTERN_COUNT = BUILTIN_PATTERNS.length
