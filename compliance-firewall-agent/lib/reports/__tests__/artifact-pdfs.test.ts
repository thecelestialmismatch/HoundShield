/**
 * The three console report artifacts (SSP · POA&M · Evidence Pack) must be
 * REAL PDFs built from the operator's assessment — never stubs. These tests
 * pin the row-building contract (what goes in each document) and prove each
 * generator emits a valid, multi-page PDF.
 */
import { describe, it, expect } from 'vitest';
import {
  ARTIFACT_META,
  artifactFilename,
  buildEvidenceRows,
  buildPoamRows,
  buildSspRows,
  generateArtifactPdf,
  totalOpenHours,
  type ArtifactInput,
  type ArtifactType,
} from '@/lib/reports/artifact-pdfs';
import { ALL_CONTROLS } from '@/lib/shieldready/controls';
import { calculateSPRS } from '@/lib/shieldready/scoring';
import type { AssessmentResponse } from '@/lib/shieldready/types';

/** Realistic mixed assessment: 40 met, 10 partial, 5 unmet, rest not assessed. */
function makeInput(): ArtifactInput {
  const now = new Date().toISOString();
  const responses: AssessmentResponse[] = ALL_CONTROLS.slice(0, 55).map((c, i) => ({
    controlId: c.id,
    status: i < 40 ? 'MET' : i < 50 ? 'PARTIAL' : 'UNMET',
    notes: '',
    updatedAt: now,
  }));
  return {
    orgName: 'Vector Defense Systems',
    cmmcLevel: 2,
    generatedAt: '2026-07-14T06:00:00.000Z',
    sprs: calculateSPRS(ALL_CONTROLS, responses),
    controls: ALL_CONTROLS,
    responses,
  };
}

describe('artifactFilename', () => {
  it('is filesystem-safe and dated', () => {
    expect(artifactFilename('ssp', 'Vector Defense Systems', '2026-07-14T06:00:00Z')).toBe(
      'SSP_Vector-Defense-Systems_2026-07-14.pdf',
    );
    expect(artifactFilename('poam', '  Ac/me & Co. ', '2026-07-14T06:00:00Z')).toBe(
      'POAM_Ac-me-Co_2026-07-14.pdf',
    );
    expect(artifactFilename('evidence', '', '2026-07-14T06:00:00Z')).toBe(
      'Evidence_Organization_2026-07-14.pdf',
    );
  });
});

describe('buildSspRows — full control inventory', () => {
  it('has one row per control with a truthful status', () => {
    const input = makeInput();
    const rows = buildSspRows(input);
    expect(rows).toHaveLength(ALL_CONTROLS.length); // all 110
    expect(rows[0][0]).toBe(ALL_CONTROLS[0].id);
    expect(rows[0][3]).toBe('Met');
    // Beyond the answered 55, every control reads Not assessed.
    expect(rows[60][3]).toBe('Not assessed');
  });
});

describe('buildPoamRows — open items only, most impactful first', () => {
  it('excludes met controls and labels partial as In progress', () => {
    const input = makeInput();
    const rows = buildPoamRows(input);
    const ids = new Set(rows.map((r) => r[0]));
    // The 40 MET controls never appear on the POA&M.
    for (const c of ALL_CONTROLS.slice(0, 40)) expect(ids.has(c.id)).toBe(false);
    // Partial controls are In progress; unmet/not-assessed are Open.
    const partialRow = rows.find((r) => r[0] === ALL_CONTROLS[45].id);
    expect(partialRow?.[2]).toBe('In progress');
    const openRow = rows.find((r) => r[0] === ALL_CONTROLS[52].id);
    expect(openRow?.[2]).toBe('Open');
    // Every row carries a remediation plan and an effort estimate.
    for (const r of rows) {
      expect(r[5].length).toBeGreaterThan(0);
      expect(r[6]).toMatch(/^\d+h$/);
    }
  });

  it('sums a positive total effort for an assessment with gaps', () => {
    expect(totalOpenHours(makeInput())).toBeGreaterThan(0);
  });
});

describe('buildEvidenceRows — implemented controls with assessor-facing evidence', () => {
  it('lists exactly the MET controls, each with evidence text', () => {
    const input = makeInput();
    const rows = buildEvidenceRows(input);
    expect(rows).toHaveLength(40);
    for (const r of rows) expect(r[2].length).toBeGreaterThan(0);
  });
});

describe('generateArtifactPdf — valid multi-page PDFs for all three buttons', () => {
  const input = makeInput();
  for (const type of Object.keys(ARTIFACT_META) as ArtifactType[]) {
    it(`${type}: emits a real PDF with pages and the right filename`, () => {
      const out = generateArtifactPdf(type, input);
      const magic = new TextDecoder().decode(new Uint8Array(out.bytes.slice(0, 5)));
      expect(magic).toBe('%PDF-');
      expect(out.bytes.byteLength).toBeGreaterThan(4_000);
      expect(out.pageCount).toBeGreaterThanOrEqual(2);
      expect(out.filename).toBe(
        artifactFilename(type, input.orgName, input.generatedAt),
      );
    });
  }

  it('poam with a clean assessment still produces a valid "no open items" PDF', () => {
    const now = new Date().toISOString();
    const clean: ArtifactInput = {
      ...input,
      responses: ALL_CONTROLS.map((c) => ({ controlId: c.id, status: 'MET', notes: '', updatedAt: now })),
      sprs: calculateSPRS(ALL_CONTROLS, ALL_CONTROLS.map((c) => ({ controlId: c.id, status: 'MET', notes: '', updatedAt: now }))),
    };
    const out = generateArtifactPdf('poam', clean);
    expect(new TextDecoder().decode(new Uint8Array(out.bytes.slice(0, 5)))).toBe('%PDF-');
    expect(buildPoamRows(clean)).toHaveLength(0);
  });
});
