import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

// The panel dynamically imports the heavy generator + assessment modules on
// click — mock them so tests stay fast and deterministic.
vi.mock('@/lib/reports/artifact-pdfs', () => ({
  generateArtifactPdf: (...args: unknown[]) => mockGenerate(...args),
}));
vi.mock('@/lib/shieldready/controls', () => ({ ALL_CONTROLS: [] }));
vi.mock('@/lib/shieldready/scoring', () => ({
  calculateSPRS: () => ({ total: 0, byFamily: {}, metCount: 0, partialCount: 0, unmetCount: 0, assessedCount: 0, completionPercent: 0 }),
}));
vi.mock('@/lib/shieldready/storage', () => ({
  getAssessmentResponses: () => [],
  getOrganization: () => ({ name: 'Vector Defense', cmmcLevel: 2 }),
}));

import { ReportsPanel } from '../ReportsPanel';
import { getEntitlements } from '@/lib/billing/entitlements';

describe('ReportsPanel — the three PDF buttons are real, gated, and founder-free', () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    mockGenerate.mockReturnValue({
      bytes: new TextEncoder().encode('%PDF-1.7 test').buffer,
      pageCount: 3,
      filename: 'SSP_Vector-Defense_2026-07-14.pdf',
    });
    // jsdom lacks object URLs — stub the download plumbing.
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('renders all three artifacts', () => {
    render(<ReportsPanel ent={getEntitlements('growth')} onGoToPlan={() => {}} />);
    expect(screen.getByText('System Security Plan')).toBeTruthy();
    expect(screen.getByText('POA&M')).toBeTruthy();
    expect(screen.getByText('C3PAO Evidence Pack')).toBeTruthy();
  });

  it('locked (free tier): shows the priced restriction, routes to Plan & Unlocks, never generates', () => {
    const onGoToPlan = vi.fn();
    render(<ReportsPanel ent={getEntitlements('free')} onGoToPlan={onGoToPlan} />);

    expect(screen.getAllByText(/Available on Growth — \$499\/mo/)).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /Generate PDF/i })).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: /See unlock options/i })[0]);
    expect(onGoToPlan).toHaveBeenCalledTimes(1);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('entitled (growth): clicking Generate PDF produces a real artifact + a fingerprinted export row', async () => {
    render(<ReportsPanel ent={getEntitlements('growth')} onGoToPlan={() => {}} />);

    fireEvent.click(screen.getAllByRole('button', { name: /Generate PDF/i })[0]);

    expect(await screen.findByText(/✓ Downloaded SSP_Vector-Defense_2026-07-14\.pdf/)).toBeTruthy();
    expect(mockGenerate).toHaveBeenCalledWith('ssp', expect.objectContaining({ orgName: 'Vector Defense', cmmcLevel: 2 }));
    // A real export row lands in Recent exports with a SHA-256 fingerprint.
    expect(screen.getByText(/sha256:/)).toBeTruthy();
    expect(screen.getAllByText(/SSP_Vector-Defense_2026-07-14\.pdf/).length).toBeGreaterThanOrEqual(1);
  });

  it('founder on the FREE tier: everything generates, free of cost', async () => {
    render(<ReportsPanel ent={getEntitlements('free')} founder onGoToPlan={() => {}} />);

    expect(screen.getByText(/Founder access/)).toBeTruthy();
    expect(screen.getByText(/free of cost/)).toBeTruthy();
    expect(screen.queryByText(/Available on Growth/)).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: /Generate PDF/i })[1]);
    await screen.findByText(/✓ Downloaded/);
    expect(mockGenerate).toHaveBeenCalledWith('poam', expect.anything());
  });

  it('a generation failure shows a visible error — never a fake success', async () => {
    mockGenerate.mockImplementation(() => {
      throw new Error('boom');
    });
    render(<ReportsPanel ent={getEntitlements('growth')} onGoToPlan={() => {}} />);

    fireEvent.click(screen.getAllByRole('button', { name: /Generate PDF/i })[0]);

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText(/✓ Downloaded/)).toBeNull();
  });

  it('signed-in with no exports: honest empty state, no fake sample rows', () => {
    render(<ReportsPanel ent={getEntitlements('growth')} onGoToPlan={() => {}} />);
    expect(screen.getByText(/No exports yet/)).toBeTruthy();
    expect(screen.queryByText(/sample · 2d ago/)).toBeNull();
  });

  it('public demo (sampleMode): sample rows are labeled as samples', () => {
    render(<ReportsPanel ent={getEntitlements('pro')} sampleMode onGoToPlan={() => {}} />);
    expect(screen.getAllByText(/sample · /).length).toBe(3);
  });
});
