import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportCheckoutButton } from '../ReportCheckoutButton';

/**
 * The invariant under test: A BUYER MUST ALWAYS REACH A CHECKOUT PAGE.
 *
 * The control shipped as a `<button>` whose only path to Stripe was an onClick
 * fetch. A live read of /pricing on 2026-08-18 extracted the price and the
 * secondary "Talk to us first" link but no buy path at all — because a
 * `<button>` is invisible to anything that reads HTML rather than executing it,
 * which now includes the AI answer engines the AEO strategy targets.
 */

const ORIGINAL_LOCATION = window.location;

function stubLocation() {
  // jsdom's location is not writable; replace it so assignment is observable.
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { ...ORIGINAL_LOCATION, href: 'http://localhost/pricing' },
  });
}

beforeEach(() => {
  stubLocation();
  vi.restoreAllMocks();
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: ORIGINAL_LOCATION,
  });
});

describe('ReportCheckoutButton — works without JavaScript', () => {
  it('renders an anchor, not a button, so non-executing readers see a buy path', () => {
    render(<ReportCheckoutButton />);
    const el = screen.getByTestId('report-checkout');
    expect(el.tagName).toBe('A');
  });

  it('the href points at a real Stripe Payment Link', () => {
    render(<ReportCheckoutButton />);
    const el = screen.getByTestId('report-checkout') as HTMLAnchorElement;
    expect(el.getAttribute('href')).toMatch(/^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+\?/);
  });

  it('carries the vertical through client_reference_id for webhook attribution', () => {
    render(<ReportCheckoutButton vertical="healthcare" />);
    const el = screen.getByTestId('report-checkout') as HTMLAnchorElement;
    expect(el.getAttribute('href')).toContain('client_reference_id=report-healthcare');
  });

  it('falls back to report-direct when no vertical is given', () => {
    render(<ReportCheckoutButton />);
    const el = screen.getByTestId('report-checkout') as HTMLAnchorElement;
    expect(el.getAttribute('href')).toContain('client_reference_id=report-direct');
  });

  it('the href is deterministic across renders, so SSR and hydration agree', () => {
    const { unmount } = render(<ReportCheckoutButton vertical="defense" />);
    const first = screen.getByTestId('report-checkout').getAttribute('href');
    unmount();
    render(<ReportCheckoutButton vertical="defense" />);
    const second = screen.getByTestId('report-checkout').getAttribute('href');
    expect(first).toBe(second);
  });
});

describe('ReportCheckoutButton — progressive enhancement', () => {
  it('prefers the dynamic rail when it answers with a URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/c/pay/session_123' }),
      }),
    );

    render(<ReportCheckoutButton vertical="healthcare" />);
    fireEvent.click(screen.getByTestId('report-checkout'));

    await waitFor(() =>
      expect(window.location.href).toBe('https://checkout.stripe.com/c/pay/session_123'),
    );
  });

  it('falls back to the Payment Link when the dynamic rail 503s', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );

    render(<ReportCheckoutButton />);
    fireEvent.click(screen.getByTestId('report-checkout'));

    await waitFor(() => expect(window.location.href).toMatch(/^https:\/\/buy\.stripe\.com\//));
  });

  it('falls back to the Payment Link when the network throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    render(<ReportCheckoutButton />);
    fireEvent.click(screen.getByTestId('report-checkout'));

    await waitFor(() => expect(window.location.href).toMatch(/^https:\/\/buy\.stripe\.com\//));
  });

  it('falls back when the rail answers 200 with no URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );

    render(<ReportCheckoutButton />);
    fireEvent.click(screen.getByTestId('report-checkout'));

    await waitFor(() => expect(window.location.href).toMatch(/^https:\/\/buy\.stripe\.com\//));
  });

  it('falls back when the response body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('not json');
        },
      }),
    );

    render(<ReportCheckoutButton />);
    fireEvent.click(screen.getByTestId('report-checkout'));

    await waitFor(() => expect(window.location.href).toMatch(/^https:\/\/buy\.stripe\.com\//));
  });

  it('leaves modified clicks to the browser, so open-in-new-tab still works', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<ReportCheckoutButton />);
    fireEvent.click(screen.getByTestId('report-checkout'), { metaKey: true });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
