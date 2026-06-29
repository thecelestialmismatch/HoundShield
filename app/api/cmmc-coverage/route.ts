/**
 * GET /api/cmmc-coverage
 *
 * Returns the full HoundShield CMMC control coverage map with summary statistics.
 * Used by the Coverage Map dashboard page.
 *
 * Response includes:
 *   - summary: aggregate counts + SPRS totals
 *   - controls: all 110 enriched control coverage entries
 */

import { NextResponse } from 'next/server';
import { getAllCoverage, getCoverageSummary } from '@/lib/cmmc-coverage/index';

export const dynamic = 'force-static';
export const revalidate = 86400; // revalidate at most once per day

export function GET() {
  try {
    const summary = getCoverageSummary();
    const controls = getAllCoverage().map((c) => ({
      controlId: c.controlId,
      status: c.status,
      description: c.description,
      sprsProtected: c.sprsProtected,
      // Include essential control metadata (avoid sending full 800-char descriptions)
      family: c.control.family,
      familyName: c.control.familyName,
      title: c.control.title,
      cmmcLevel: c.control.cmmcLevel,
      sprsDeduction: c.control.sprsDeduction,
    }));

    return NextResponse.json({ summary, controls });
  } catch (err) {
    console.error('[cmmc-coverage] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to load coverage data' },
      { status: 500 },
    );
  }
}
