import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, ...p }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...(p as object)}>
      {children}
    </a>
  ),
}));

// Keep the heavy 110-control board out of the render — a stub proves the inline
// mount without loading Framer Motion / localStorage machinery.
vi.mock('next/dynamic', () => ({
  default: () => {
    const Stub = () => <div data-testid="assessment-board">assessment board</div>;
    return Stub;
  },
}));

import { ConsoleDashboard } from '../ConsoleDashboard';

describe('ConsoleDashboard — tier gating', () => {
  it('free: restricted board with the $499 upgrade CTA and locked evidence tiles', () => {
    render(<ConsoleDashboard tier="free" />);
    expect(screen.getByText(/Free plan/)).toBeTruthy();
    expect(screen.getByText(/Restricted dashboard/)).toBeTruthy();
    expect(screen.getByText(/\$499 report/)).toBeTruthy();

    // The gateway is included on Free…
    expect(screen.getByText('AI prompt gateway')).toBeTruthy();
    // …but PDF reports are locked, labelled with the tier that unlocks them.
    expect(screen.getByText('PDF compliance reports')).toBeTruthy();
    expect(screen.getAllByText(/Available on Growth/).length).toBeGreaterThan(0);
  });

  it('free: assessment is the unlocked hero and mounts inline on demand (no bounce)', () => {
    render(<ConsoleDashboard tier="free" />);
    // Board is not mounted until the user begins.
    expect(screen.queryByTestId('assessment-board')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Begin assessment/i }));

    expect(screen.getByTestId('assessment-board')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Hide assessment/i })).toBeTruthy();
  });

  it('paid (growth): full access, PDF reports unlocked, no free-upgrade CTA', () => {
    render(<ConsoleDashboard tier="growth" />);
    expect(screen.getByText(/Growth plan/)).toBeTruthy();
    expect(screen.getByText(/Full access/)).toBeTruthy();
    // PDF reports now included; Enterprise-only capability still locked.
    expect(screen.getByText('PDF compliance reports')).toBeTruthy();
    expect(screen.getAllByText(/Available on Enterprise/).length).toBeGreaterThan(0);
    // Paid users never see the "$499 report" restricted-plan CTA.
    expect(screen.queryByText(/\$499 report/)).toBeNull();
  });

  it('enterprise: everything unlocked — no locked section at all', () => {
    render(<ConsoleDashboard tier="enterprise" />);
    expect(screen.getByText(/Enterprise plan/)).toBeTruthy();
    expect(screen.queryByText(/Unlock with an upgrade/)).toBeNull();
  });

  it('unknown tier falls back to the restricted free board', () => {
    render(<ConsoleDashboard tier="nonsense" />);
    expect(screen.getByText(/Free plan/)).toBeTruthy();
    expect(screen.getByText(/Restricted dashboard/)).toBeTruthy();
  });
});
