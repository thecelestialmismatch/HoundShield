import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PricingPage from '../pricing/page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/pricing',
  useRouter: () => ({ push: vi.fn() }),
}));

/**
 * /pricing is the only page where money changes hands, so it gets its own
 * guard independent of the component tests.
 *
 * The regression this prevents: a live read of the published page on
 * 2026-08-18 extracted "$499", then "Talk to us first", and no purchase path.
 * The buy control existed in the tree but was a `<button>`, which is invisible
 * to anything that reads HTML instead of executing it. For a product whose
 * distribution plan leans on AI answer engines, an unreadable buy path is the
 * same as no buy path.
 */
describe('/pricing always exposes a purchase path', () => {
  it('renders a checkout anchor with a Stripe href', () => {
    render(<PricingPage />);
    const buy = screen.getByTestId('report-checkout');
    expect(buy.tagName).toBe('A');
    expect(buy.getAttribute('href')).toMatch(/^https:\/\/buy\.stripe\.com\//);
  });

  it('the primary control reads as a purchase, not as a lead form', () => {
    render(<PricingPage />);
    const buy = screen.getByTestId('report-checkout');
    expect(buy.textContent).toMatch(/buy/i);
    expect(buy.textContent).toContain('$499');
  });

  it('"talk to us" is present but secondary, never the only path', () => {
    const { container } = render(<PricingPage />);
    const talk = container.querySelector('a.talk-first');
    expect(talk).not.toBeNull();
    expect(talk?.textContent).toMatch(/talk to us/i);
    // The buy control must exist alongside it.
    expect(screen.getByTestId('report-checkout')).toBeTruthy();
  });

  it('the buy path targets the $499 offer specifically', () => {
    // Single-offer / no-subscription is already locked by
    // app/pricing/__tests__/pricing-single-offer.test.tsx — not duplicated here.
    // This asserts only that the PURCHASE control is bound to that offer.
    render(<PricingPage />);
    const buy = screen.getByTestId('report-checkout');
    expect(buy.textContent).toContain('$499');
    expect(buy.getAttribute('href')).toContain('client_reference_id=report-');
  });
});
