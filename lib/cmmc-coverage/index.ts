/**
 * HoundShield CMMC Coverage — Public API
 *
 * Utility functions for querying and aggregating coverage data.
 * All functions are pure and return new objects (immutable pattern).
 */

import { ALL_CONTROLS } from '../shieldready/controls/index';
import type { NISTControl } from '../shieldready/types';
import { COVERAGE_DATA, type ControlCoverage, type CoverageStatus } from './coverage-data';

// ─── Lookup map (built once at module load) ───────────────────────────────────

const COVERAGE_BY_ID: ReadonlyMap<string, ControlCoverage> = new Map(
  COVERAGE_DATA.map((c) => [c.controlId, c]),
);

const CONTROLS_BY_ID: ReadonlyMap<string, NISTControl> = new Map(
  ALL_CONTROLS.map((c) => [c.id, c]),
);

// ─── Enriched type ────────────────────────────────────────────────────────────

export interface EnrichedControlCoverage extends ControlCoverage {
  /** Full NIST control metadata from shieldready */
  control: NISTControl;
}

// ─── Family summary ───────────────────────────────────────────────────────────

export interface FamilyCoverageSummary {
  family: string;
  familyName: string;
  totalControls: number;
  enforced: number;
  monitored: number;
  partial: number;
  outOfScope: number;
  /** Total SPRS points HoundShield protects in this family */
  totalSprsProtected: number;
  /** Maximum possible SPRS deduction in this family */
  totalSprsAtRisk: number;
}

// ─── Aggregate summary ────────────────────────────────────────────────────────

export interface CoverageSummary {
  totalControls: number;
  enforced: number;
  monitored: number;
  partial: number;
  outOfScope: number;
  /** Controls with any active coverage (ENFORCED | MONITORED | PARTIAL) */
  covered: number;
  /** Total SPRS points HoundShield protects across all controls */
  totalSprsProtected: number;
  /** Coverage percentage (covered / totalControls × 100) */
  coveragePercent: number;
  byFamily: FamilyCoverageSummary[];
}

// ─── Core queries ─────────────────────────────────────────────────────────────

/** All 110 controls with their coverage status, enriched with NIST metadata. */
export function getAllCoverage(): EnrichedControlCoverage[] {
  return COVERAGE_DATA.map((coverage) => ({
    ...coverage,
    control: CONTROLS_BY_ID.get(coverage.controlId)!,
  }));
}

/** Coverage for a single control by ID. Returns undefined if ID is unknown. */
export function getCoverageById(controlId: string): EnrichedControlCoverage | undefined {
  const coverage = COVERAGE_BY_ID.get(controlId);
  if (!coverage) return undefined;
  const control = CONTROLS_BY_ID.get(controlId);
  if (!control) return undefined;
  return { ...coverage, control };
}

/** All controls in a specific family (e.g., 'AC', 'AU', 'SC'). */
export function getCoverageByFamily(family: string): EnrichedControlCoverage[] {
  return getAllCoverage().filter((c) => c.control.family === family);
}

/** Controls matching a specific coverage status. */
export function getCoverageByStatus(status: CoverageStatus): EnrichedControlCoverage[] {
  return getAllCoverage().filter((c) => c.status === status);
}

/** Controls HoundShield actively enforces (ENFORCED only). */
export function getEnforcedControls(): EnrichedControlCoverage[] {
  return getCoverageByStatus('ENFORCED');
}

/** Controls where HoundShield generates monitoring/audit evidence. */
export function getMonitoredControls(): EnrichedControlCoverage[] {
  return getCoverageByStatus('MONITORED');
}

/** Controls where HoundShield contributes partial coverage. */
export function getPartialControls(): EnrichedControlCoverage[] {
  return getCoverageByStatus('PARTIAL');
}

/** All controls with any active HoundShield coverage (non-OUT_OF_SCOPE). */
export function getCoveredControls(): EnrichedControlCoverage[] {
  return getAllCoverage().filter((c) => c.status !== 'OUT_OF_SCOPE');
}

// ─── SPRS calculations ────────────────────────────────────────────────────────

/** Total SPRS points HoundShield protects across all 110 controls. */
export function getTotalSprsProtected(): number {
  return COVERAGE_DATA.reduce((sum, c) => sum + c.sprsProtected, 0);
}

/** SPRS points protected within a single family. */
export function getFamilySprsProtected(family: string): number {
  return getCoverageByFamily(family).reduce((sum, c) => sum + c.sprsProtected, 0);
}

// ─── Aggregate summary ────────────────────────────────────────────────────────

/** Full aggregate summary with per-family breakdown. */
export function getCoverageSummary(): CoverageSummary {
  const all = getAllCoverage();

  const counts = { enforced: 0, monitored: 0, partial: 0, outOfScope: 0, covered: 0 };
  let totalSprsProtected = 0;

  for (const c of all) {
    if (c.status === 'ENFORCED') counts.enforced++;
    else if (c.status === 'MONITORED') counts.monitored++;
    else if (c.status === 'PARTIAL') counts.partial++;
    else counts.outOfScope++;

    if (c.status !== 'OUT_OF_SCOPE') counts.covered++;
    totalSprsProtected += c.sprsProtected;
  }

  // Build per-family summaries
  const familyMap = new Map<string, FamilyCoverageSummary>();

  for (const c of all) {
    const { family, familyName } = c.control;
    const existing = familyMap.get(family);
    const sprsAtRisk = Math.abs(c.control.sprsDeduction);

    if (!existing) {
      familyMap.set(family, {
        family,
        familyName,
        totalControls: 1,
        enforced: c.status === 'ENFORCED' ? 1 : 0,
        monitored: c.status === 'MONITORED' ? 1 : 0,
        partial: c.status === 'PARTIAL' ? 1 : 0,
        outOfScope: c.status === 'OUT_OF_SCOPE' ? 1 : 0,
        totalSprsProtected: c.sprsProtected,
        totalSprsAtRisk: sprsAtRisk,
      });
    } else {
      familyMap.set(family, {
        ...existing,
        totalControls: existing.totalControls + 1,
        enforced: existing.enforced + (c.status === 'ENFORCED' ? 1 : 0),
        monitored: existing.monitored + (c.status === 'MONITORED' ? 1 : 0),
        partial: existing.partial + (c.status === 'PARTIAL' ? 1 : 0),
        outOfScope: existing.outOfScope + (c.status === 'OUT_OF_SCOPE' ? 1 : 0),
        totalSprsProtected: existing.totalSprsProtected + c.sprsProtected,
        totalSprsAtRisk: existing.totalSprsAtRisk + sprsAtRisk,
      });
    }
  }

  return {
    totalControls: all.length,
    ...counts,
    totalSprsProtected,
    coveragePercent: Math.round((counts.covered / all.length) * 100),
    byFamily: Array.from(familyMap.values()),
  };
}

// ─── Status display helpers ───────────────────────────────────────────────────

export const STATUS_LABELS: Record<CoverageStatus, string> = {
  ENFORCED: 'Enforced',
  MONITORED: 'Monitored',
  PARTIAL: 'Partial',
  OUT_OF_SCOPE: 'Out of Scope',
};

export const STATUS_COLORS: Record<CoverageStatus, string> = {
  ENFORCED: '#22c55e',   // green-500
  MONITORED: '#3b82f6',  // blue-500
  PARTIAL: '#f59e0b',    // amber-500
  OUT_OF_SCOPE: '#6b7280', // gray-500
};

/** Tailwind CSS class for a coverage status badge background. */
export function getStatusBadgeClass(status: CoverageStatus): string {
  const map: Record<CoverageStatus, string> = {
    ENFORCED: 'bg-green-500/20 text-green-400 border-green-500/30',
    MONITORED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PARTIAL: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    OUT_OF_SCOPE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return map[status];
}

export type { CoverageStatus, ControlCoverage } from './coverage-data';
