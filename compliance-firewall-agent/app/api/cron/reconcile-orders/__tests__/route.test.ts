/**
 * Tests for GET /api/cron/reconcile-orders — the second rail for money.
 *
 * What this route exists to guarantee, and therefore what these tests pin:
 *   1. A paid $499 sale that the webhook never delivered IS recovered.
 *   2. Re-running tomorrow over the same window recovers nothing twice.
 *   3. Subscriptions and unpaid (ACH-authorised) sessions are left alone.
 *   4. A refund the webhook missed is reconciled, so revenue is not overstated.
 *   5. A degraded money path reaches the founder's inbox — weekly, not daily,
 *      and not at all once it is fixed.
 *   6. The endpoint is not open to the internet.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockRecordReportOrder } = vi.hoisted(() => ({
  mockRecordReportOrder: vi.fn(),
}));
vi.mock('@/lib/stripe/report-fulfillment', async (importOriginal) => {
  // The predicates are pure and shared — exercise the REAL ones, so a change to
  // what counts as a report sale is caught here too. Only the write is stubbed.
  const actual = await importOriginal<typeof import('@/lib/stripe/report-fulfillment')>();
  return { ...actual, recordReportOrder: mockRecordReportOrder };
});

const { mockSessionsList, mockRefundsList } = vi.hoisted(() => ({
  mockSessionsList: vi.fn(),
  mockRefundsList: vi.fn(),
}));
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      checkout: { sessions: { list: mockSessionsList } },
      refunds: { list: mockRefundsList },
    };
  }),
}));

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

const { mockResendSend } = vi.hoisted(() => ({
  mockResendSend: vi.fn().mockResolvedValue({ id: 'email-1' }),
}));
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockResendSend } };
  }),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/reconcile-orders/route';
import {
  lookbackDays,
  moneyPathStatus,
  isWeeklyAlertDay,
  DEFAULT_LOOKBACK_DAYS,
  MAX_LOOKBACK_DAYS,
} from '@/lib/stripe/money-path';

// ── Helpers ────────────────────────────────────────────────────────────────

const SECRET = 'cron-secret-value';

function req(query = '', auth: string | null = `Bearer ${SECRET}`) {
  return new NextRequest(`http://localhost/api/cron/reconcile-orders${query}`, {
    headers: auth ? { authorization: auth } : {},
  });
}

function paidSession(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    mode: 'payment',
    payment_status: 'paid',
    amount_total: 49900,
    currency: 'usd',
    customer_details: { email: 'buyer@example.com', name: 'Jordan M' },
    metadata: {},
    payment_intent: `pi_${id}`,
    ...over,
  };
}

/** No refunds, no matching orders — the default for sale-focused tests. */
function noReversals() {
  mockRefundsList.mockResolvedValue({ data: [], has_more: false });
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }),
    }),
    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = SECRET;
  process.env.STRIPE_SECRET_KEY = 'sk_live_abc';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_abc';
  delete process.env.RESEND_API_KEY;
  mockRecordReportOrder.mockResolvedValue({
    sessionId: 'cs_1',
    created: true,
    notified: true,
    status: 'paid',
  });
  noReversals();
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.CRON_SECRET;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.RESEND_API_KEY;
});

// ── Auth ───────────────────────────────────────────────────────────────────

describe('auth', () => {
  it('503s when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req());
    expect(res.status).toBe(503);
  });

  it('401s without the bearer token', async () => {
    expect((await GET(req('', null))).status).toBe(401);
    expect((await GET(req('', 'Bearer wrong'))).status).toBe(401);
    // The endpoint replays real customer records; an open one would let anyone
    // trigger reads of the Stripe account on demand.
    expect(mockSessionsList).not.toHaveBeenCalled();
  });

  it('accepts the configured bearer token', async () => {
    mockSessionsList.mockResolvedValue({ data: [], has_more: false });
    expect((await GET(req())).status).toBe(200);
  });
});

// ── The window ─────────────────────────────────────────────────────────────

describe('lookback window', () => {
  it('defaults, and clamps a manual sweep to the maximum', () => {
    expect(lookbackDays(null)).toBe(DEFAULT_LOOKBACK_DAYS);
    expect(lookbackDays('not-a-number')).toBe(DEFAULT_LOOKBACK_DAYS);
    expect(lookbackDays('0')).toBe(DEFAULT_LOOKBACK_DAYS);
    expect(lookbackDays('-7')).toBe(DEFAULT_LOOKBACK_DAYS);
    expect(lookbackDays('7')).toBe(7);
    expect(lookbackDays('9999')).toBe(MAX_LOOKBACK_DAYS);
  });

  it('asks Stripe for sessions created inside the window', async () => {
    mockSessionsList.mockResolvedValue({ data: [], has_more: false });
    const before = Math.floor(Date.now() / 1000);
    await GET(req('?days=7'));
    const arg = mockSessionsList.mock.calls[0][0];
    expect(arg.limit).toBe(100);
    expect(arg.created.gte).toBeGreaterThanOrEqual(before - 7 * 86400 - 5);
    expect(arg.created.gte).toBeLessThanOrEqual(before - 7 * 86400 + 5);
  });

  it('follows pagination until Stripe says there is no more', async () => {
    mockSessionsList
      .mockResolvedValueOnce({ data: [paidSession('cs_a')], has_more: true })
      .mockResolvedValueOnce({ data: [paidSession('cs_b')], has_more: false });
    const body = await (await GET(req())).json();
    expect(mockSessionsList).toHaveBeenCalledTimes(2);
    expect(mockSessionsList.mock.calls[1][0].starting_after).toBe('cs_a');
    expect(body.scanned).toBe(2);
  });
});

// ── Recovery ───────────────────────────────────────────────────────────────

describe('recovering sales the webhook missed', () => {
  it('replays a paid report session through the shared recorder', async () => {
    mockSessionsList.mockResolvedValue({ data: [paidSession('cs_live_1')], has_more: false });
    const body = await (await GET(req())).json();

    expect(mockRecordReportOrder).toHaveBeenCalledTimes(1);
    expect(mockRecordReportOrder.mock.calls[0][1].id).toBe('cs_live_1');
    // Provenance matters: the founder alert says "RECOVERED" only for this rail.
    expect(mockRecordReportOrder.mock.calls[0][2]).toBe('reconciler');
    expect(body.recovered).toBe(1);
    expect(body.recoveredSessionIds).toEqual(['cs_1']);
  });

  it('counts nothing on the second run over the same window', async () => {
    // The job re-reads 30 days every morning. If an already-recorded sale
    // counted as a recovery, the founder would get the same alert daily and
    // the number would be meaningless.
    mockSessionsList.mockResolvedValue({ data: [paidSession('cs_live_1')], has_more: false });
    mockRecordReportOrder.mockResolvedValue({
      sessionId: 'cs_live_1',
      created: false,
      notified: false,
      status: 'paid',
    });
    const body = await (await GET(req())).json();
    expect(body.reportSessions).toBe(1);
    expect(body.recovered).toBe(0);
  });

  it('skips subscription sessions', async () => {
    mockSessionsList.mockResolvedValue({
      data: [paidSession('cs_sub', { mode: 'subscription' })],
      has_more: false,
    });
    const body = await (await GET(req())).json();
    expect(mockRecordReportOrder).not.toHaveBeenCalled();
    expect(body.scanned).toBe(1);
    expect(body.reportSessions).toBe(0);
  });

  it('skips a session whose money has not landed yet', async () => {
    // ACH/SEPA authorise days before settling. The webhook records those as
    // pending on its own timeline; the reconciler must not race it to 'paid'.
    mockSessionsList.mockResolvedValue({
      data: [paidSession('cs_ach', { payment_status: 'unpaid' })],
      has_more: false,
    });
    await GET(req());
    expect(mockRecordReportOrder).not.toHaveBeenCalled();
  });

  it('reports a Stripe read failure without discarding earlier progress', async () => {
    mockSessionsList
      .mockResolvedValueOnce({ data: [paidSession('cs_ok')], has_more: true })
      .mockRejectedValueOnce(new Error('stripe 500'));
    const res = await GET(req());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.recovered).toBe(1);
    expect(body.errors.join(' ')).toContain('stripe 500');
  });
});

// ── Reversals ──────────────────────────────────────────────────────────────

describe('reconciling refunds the webhook missed', () => {
  function withOrder(order: Record<string, unknown> | null) {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: order }) }),
      }),
      update,
    });
    return update;
  }

  beforeEach(() => {
    mockSessionsList.mockResolvedValue({ data: [], has_more: false });
  });

  it('marks a fully-refunded order refunded', async () => {
    mockRefundsList.mockResolvedValue({
      data: [{ status: 'succeeded', payment_intent: 'pi_1', amount: 49900 }],
      has_more: false,
    });
    const update = withOrder({ id: 'row-1', status: 'paid', amount_cents: 49900 });
    const body = await (await GET(req())).json();
    expect(update).toHaveBeenCalledWith({ status: 'refunded' });
    expect(body.reversed).toBe(1);
    expect(body.reversedPaymentIntentIds).toEqual(['pi_1']);
  });

  it('leaves a PARTIAL refund counted — it is a support credit, not a reversal', async () => {
    mockRefundsList.mockResolvedValue({
      data: [{ status: 'succeeded', payment_intent: 'pi_1', amount: 5000 }],
      has_more: false,
    });
    const update = withOrder({ id: 'row-1', status: 'paid', amount_cents: 49900 });
    const body = await (await GET(req())).json();
    expect(update).not.toHaveBeenCalled();
    expect(body.reversed).toBe(0);
  });

  it('ignores a pending refund and an already-refunded order', async () => {
    mockRefundsList.mockResolvedValue({
      data: [{ status: 'pending', payment_intent: 'pi_1', amount: 49900 }],
      has_more: false,
    });
    expect((await (await GET(req())).json()).reversed).toBe(0);

    mockRefundsList.mockResolvedValue({
      data: [{ status: 'succeeded', payment_intent: 'pi_1', amount: 49900 }],
      has_more: false,
    });
    const update = withOrder({ id: 'row-1', status: 'refunded', amount_cents: 49900 });
    expect((await (await GET(req())).json()).reversed).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });

  it('ignores a refund with no matching report order', async () => {
    mockRefundsList.mockResolvedValue({
      data: [{ status: 'succeeded', payment_intent: 'pi_other', amount: 49900 }],
      has_more: false,
    });
    withOrder(null);
    expect((await (await GET(req())).json()).reversed).toBe(0);
  });
});

// ── The money-path alarm ───────────────────────────────────────────────────

// A route module may only export HTTP handlers, so these live in
// lib/stripe/money-path.ts and are exercised directly.
describe('money path status', () => {
  it('reads healthy when both variables are set', () => {
    const m = moneyPathStatus();
    expect(m).toMatchObject({ keyOk: true, webhookOk: true, degraded: false });
  });

  it('reads degraded, with an actionable hint, when the webhook secret is missing', () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const m = moneyPathStatus();
    expect(m.degraded).toBe(true);
    expect(m.webhookOk).toBe(false);
    expect(m.hints.join(' ')).toContain('STRIPE_WEBHOOK_SECRET');
  });

  it('fires exactly one alert day per week', () => {
    // 2026-09-07 is a Monday. Checking the whole week proves it is one day, not
    // "the day the test happened to run".
    const days = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 8, 7 + i)));
    expect(days.filter(isWeeklyAlertDay)).toHaveLength(1);
    expect(isWeeklyAlertDay(new Date(Date.UTC(2026, 8, 7)))).toBe(true);
  });
});

describe('the degraded-money-path alert', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test';
    mockSessionsList.mockResolvedValue({ data: [], has_more: false });
  });

  it('emails the founder on the weekly alert day while degraded', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-07T15:00:00Z')); // Monday
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const body = await (await GET(req())).json();
    expect(body.alerted).toBe(true);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const mail = mockResendSend.mock.calls[0][0];
    expect(mail.subject).toContain('money path degraded');
    expect(mail.html).toContain('STRIPE_WEBHOOK_SECRET');
  });

  it('stays quiet on the other six days', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-08T15:00:00Z')); // Tuesday
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const body = await (await GET(req())).json();
    expect(body.alerted).toBe(false);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('stays quiet forever once the money path is whole', async () => {
    // The property that makes this alert readable rather than filtered: it
    // stops the moment it is fixed.
    vi.useFakeTimers().setSystemTime(new Date('2026-09-07T15:00:00Z')); // Monday
    const body = await (await GET(req())).json();
    expect(body.alerted).toBe(false);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('can be forced on any day for a deliberate test send', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-09T15:00:00Z')); // Wednesday
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect((await (await GET(req('?alert=force'))).json()).alerted).toBe(true);
  });

  it('does not fail the run when the alert cannot be sent', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-07T15:00:00Z'));
    delete process.env.STRIPE_WEBHOOK_SECRET;
    mockResendSend.mockRejectedValueOnce(new Error('resend down'));
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect((await res.json()).alerted).toBe(false);
  });
});

// ── No key ─────────────────────────────────────────────────────────────────

describe('without a usable STRIPE_SECRET_KEY', () => {
  it('skips the reconciliation but still reports and still alerts', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-07T15:00:00Z')); // Monday
    process.env.RESEND_API_KEY = 're_test';
    process.env.STRIPE_SECRET_KEY = 'pk_live_wrong_key_pasted';
    const res = await GET(req());
    const body = await res.json();

    // 200, not 5xx: a scheduled job that reports "error" is indistinguishable
    // from a broken one in the Vercel cron dashboard.
    expect(res.status).toBe(200);
    expect(body.skipped).toBe(true);
    expect(body.moneyPath.keyOk).toBe(false);
    expect(body.alerted).toBe(true);
    expect(mockSessionsList).not.toHaveBeenCalled();
  });
});
