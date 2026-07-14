import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  OverviewCharts,
  SCANS_24H,
  BLOCKED_TODAY,
  HOURLY_SCANS,
  HOURLY_BLOCKED,
  DESTINATIONS,
  RISK_MIX,
  SPRS_TREND,
  SPRS_TARGET,
} from '../OverviewCharts';

/**
 * The founder's exact complaint was numbers that don't agree with each other.
 * This suite makes data consistency a CONTRACT: every chart's totals must equal
 * the KPI seeds, or the build fails.
 */
describe('OverviewCharts — data consistency contract', () => {
  it('hourly scans sum exactly to the 24h KPI', () => {
    expect(HOURLY_SCANS.reduce((a, b) => a + b, 0)).toBe(SCANS_24H);
  });

  it('hourly blocks sum exactly to the Blocked-today KPI', () => {
    expect(HOURLY_BLOCKED.reduce((a, b) => a + b, 0)).toBe(BLOCKED_TODAY);
  });

  it('no hour blocks more than it scanned', () => {
    HOURLY_SCANS.forEach((v, i) => expect(HOURLY_BLOCKED[i]).toBeLessThanOrEqual(v));
  });

  it('destination counts sum exactly to the 24h KPI', () => {
    expect(DESTINATIONS.reduce((s, d) => s + d.count, 0)).toBe(SCANS_24H);
  });

  it('risk-mix counts sum exactly to the Blocked-today KPI', () => {
    expect(RISK_MIX.reduce((s, r) => s + r.count, 0)).toBe(BLOCKED_TODAY);
  });

  it('SPRS trend never regresses, ends at the dashboard score, below target', () => {
    for (let i = 1; i < SPRS_TREND.length; i++) {
      expect(SPRS_TREND[i]).toBeGreaterThanOrEqual(SPRS_TREND[i - 1]);
    }
    expect(SPRS_TREND[SPRS_TREND.length - 1]).toBe(78); // the score shown everywhere else
    expect(SPRS_TREND[SPRS_TREND.length - 1]).toBeLessThan(SPRS_TARGET);
  });

  it('every categorical/status series carries a distinct colour (identity never recycled)', () => {
    const colours = [...DESTINATIONS.map((d) => d.color), ...RISK_MIX.map((r) => r.color)];
    // Within each chart the hues must be unique.
    expect(new Set(DESTINATIONS.map((d) => d.color)).size).toBe(DESTINATIONS.length);
    expect(new Set(RISK_MIX.map((r) => r.color)).size).toBe(RISK_MIX.length);
    expect(colours.every((c) => /^#[0-9A-F]{6}$/i.test(c))).toBe(true);
  });
});

describe('OverviewCharts — renders four self-explanatory panels', () => {
  it('shows every panel with its plain-English explanation and legend', () => {
    render(<OverviewCharts />);

    expect(screen.getByText(/Activity by hour · last 24h/)).toBeTruthy();
    expect(screen.getByText(/hour by hour/)).toBeTruthy(); // microcopy
    expect(screen.getByText(/Scanned & passed/)).toBeTruthy(); // legend

    expect(screen.getByText('Where prompts go')).toBeTruthy();
    expect(screen.getByText('ChatGPT')).toBeTruthy();
    expect(screen.getByText('46%')).toBeTruthy(); // direct label, not colour-alone

    expect(screen.getByText(/SPRS score · 30 days/)).toBeTruthy();
    expect(screen.getByText(/DoD supplier risk score/)).toBeTruthy();
    expect(screen.getByText(/\+16 this month/)).toBeTruthy(); // 78 − 62

    expect(screen.getByText(/Risk mix · today/)).toBeTruthy();
    expect(screen.getByText('Critical')).toBeTruthy();
    expect(screen.getByText('118')).toBeTruthy(); // direct count label
  });

  it('every chart exposes an accessible description', () => {
    render(<OverviewCharts />);
    expect(screen.getByRole('img', { name: /prompts scanned per hour/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: /SPRS score over 30 days/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: /blocked prompts by severity/i })).toBeTruthy();
  });
});
