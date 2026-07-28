import { BUILTIN_PATTERNS } from '@/lib/classifier/patterns'
import { CMMC_PATTERNS } from '@/lib/classifier/cmmc-patterns'
import { HIPAA_PATTERNS } from '@/lib/classifier/hipaa-patterns'

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

/** Number of shipped regex patterns implementing those families. Currently 90. */
export const PATTERN_COUNT =
  BUILTIN_PATTERNS.length + CMMC_PATTERNS.length + HIPAA_PATTERNS.length
