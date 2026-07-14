import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, ...p }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...(p as object)}>
      {children}
    </a>
  ),
}));

import { PlanUnlocksBoard } from '../PlanUnlocksBoard';

describe('PlanUnlocksBoard — the sidebar paywall view', () => {
  it('free: restricted plan with the $499 upgrade CTA and locked tiles', () => {
    render(<PlanUnlocksBoard tier="free" />);
    expect(screen.getByText(/Free plan/)).toBeTruthy();
    expect(screen.getByText(/Restricted plan/)).toBeTruthy();
    expect(screen.getByText(/\$499 report/)).toBeTruthy();

    // The gateway is included on Free…
    expect(screen.getByText('AI prompt gateway')).toBeTruthy();
    // …but PDF reports are locked, labelled with the tier that unlocks them.
    expect(screen.getByText('PDF compliance reports')).toBeTruthy();
    expect(screen.getAllByText(/Available on Growth/).length).toBeGreaterThan(0);
  });

  it('free: every locked tile says exactly what it costs to unlock', () => {
    render(<PlanUnlocksBoard tier="free" />);
    // Growth-locked capabilities carry the Growth price; Pro-locked the Pro price.
    expect(screen.getAllByText(/Available on Growth — \$499\/mo/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Available on Pro — \$199\/mo/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Available on Enterprise — \$999\/mo/).length).toBeGreaterThan(0);
  });

  it('paid (growth): full access, PDF reports unlocked, no free-upgrade CTA', () => {
    render(<PlanUnlocksBoard tier="growth" />);
    expect(screen.getByText(/Growth plan/)).toBeTruthy();
    expect(screen.getByText(/Full access/)).toBeTruthy();
    // PDF reports now included; Enterprise-only capability still locked.
    expect(screen.getByText('PDF compliance reports')).toBeTruthy();
    expect(screen.getAllByText(/Available on Enterprise/).length).toBeGreaterThan(0);
    // Paid users never see the "$499 report" restricted-plan CTA.
    expect(screen.queryByText(/\$499 report/)).toBeNull();
  });

  it('enterprise: everything unlocked — no locked section at all', () => {
    render(<PlanUnlocksBoard tier="enterprise" />);
    expect(screen.getByText(/Enterprise plan/)).toBeTruthy();
    expect(screen.queryByText(/Locked — upgrade to unlock/)).toBeNull();
  });

  it('unknown tier falls back to the restricted free board', () => {
    render(<PlanUnlocksBoard tier="nonsense" />);
    expect(screen.getByText(/Free plan/)).toBeTruthy();
    expect(screen.getByText(/Restricted plan/)).toBeTruthy();
  });

  it('founder: everything unlocked, explicit no-payment banner, zero upgrade copy', () => {
    render(<PlanUnlocksBoard tier="agency" founder />);
    expect(screen.getByText(/Founder plan/)).toBeTruthy();
    expect(screen.getByText(/no payment required/i)).toBeTruthy();
    expect(screen.queryByText(/Locked — upgrade to unlock/)).toBeNull();
    expect(screen.queryByText(/\$499 report/)).toBeNull();
  });
});
