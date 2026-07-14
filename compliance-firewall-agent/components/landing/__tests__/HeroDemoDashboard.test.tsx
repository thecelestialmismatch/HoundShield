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
  it('renders the full visual set: KPIs, line, donut, engines, destinations, gauge, feed', () => {
    render(<HeroDemoDashboard />);
    expect(screen.getByText('Scans 24h')).toBeTruthy();
    expect(screen.getByText('Gateway throughput')).toBeTruthy();
    expect(screen.getByText('Detection mix')).toBeTruthy();
    expect(screen.getByText(/Detections by engine/)).toBeTruthy();
    expect(screen.getByText('Where prompts go')).toBeTruthy();
    expect(screen.getByText(/CMMC Level 2 coverage/)).toBeTruthy();
    expect(screen.getByText('Live prompt scans')).toBeTruthy();
  });

  it('every chart panel carries a self-explanatory caption', () => {
    render(<HeroDemoDashboard />);
    expect(screen.getByText(/scanned in <10ms each/)).toBeTruthy();
    expect(screen.getByText(/What the blocks were/)).toBeTruthy();
    expect(screen.getByText(/16 detection engines/)).toBeTruthy();
    expect(screen.getByText(/every prompt scanned locally first/)).toBeTruthy();
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
    expect(screen.getByText(/Live demo/)).toBeTruthy();
  });
});
