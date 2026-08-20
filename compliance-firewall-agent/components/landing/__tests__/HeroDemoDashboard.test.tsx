import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/Logo', () => ({
  Logo: () => <span data-testid="logo" />,
}));

import { HeroDemoDashboard } from '../HeroDemoDashboard';

/**
 * The homepage hero dashboard must stay diverse AND self-explanatory: every
 * visual carries a plain-English caption, and identity is never colour-alone
 * (labels + numbers on every bar). All data is simulated demo data.
 */
describe('HeroDemoDashboard — the hero-page dashboard window', () => {
  it('renders the full visual set: KPIs, feed, donut, engines, destinations, gauge', () => {
    render(<HeroDemoDashboard />);
    expect(screen.getByText('Sample events')).toBeTruthy();
    expect(screen.getByText('Sample policy decisions')).toBeTruthy();
    expect(screen.getByText(/Example policy categories/)).toBeTruthy();
    expect(screen.getByText('Illustrative routing')).toBeTruthy();
    expect(screen.getByText(/Illustrative assessment posture/)).toBeTruthy();
    expect(screen.getByText('Example AI control flow')).toBeTruthy();
  });

  it('every chart panel carries a self-explanatory caption', () => {
    render(<HeroDemoDashboard />);
    expect(screen.getByText(/Illustrative assessment posture/)).toBeTruthy();
    expect(screen.getByText(/Sample policy decisions/)).toBeTruthy();
    expect(screen.getByText(/static example/)).toBeTruthy();
    expect(screen.getAllByText(/not a customer score/).length).toBeGreaterThanOrEqual(2);
  });

  it('destination shares are directly labeled and sum to 100%', () => {
    render(<HeroDemoDashboard />);
    for (const [label, share] of [['ChatGPT', 46], ['Copilot', 31], ['Claude', 18], ['Other', 5]] as const) {
      expect(screen.getByText(label)).toBeTruthy();
      expect(screen.getAllByText(`${share}%`).length).toBeGreaterThanOrEqual(1);
    }
    expect(46 + 31 + 18 + 5).toBe(100);
  });

  it('is explicitly labeled a demo (no fabricated-metrics ambiguity)', () => {
    render(<HeroDemoDashboard />);
    expect(screen.getByText('Illustrative preview')).toBeTruthy();
  });
});
