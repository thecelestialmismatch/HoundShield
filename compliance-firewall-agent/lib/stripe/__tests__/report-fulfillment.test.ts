/**
 * Tests for lib/stripe/report-fulfillment.ts — the ONE definition of what a
 * $499 report order is, shared by the Stripe webhook and the daily reconciler.
 *
 * The invariants worth breaking a build over:
 *   1. A paid session is recorded AND notified — exactly once, ever.
 *   2. A replay (webhook retry, or the reconciler re-scanning the same window
 *      tomorrow) records nothing new and emails nobody.
 *   3. A status is never walked backwards by a late delivery.
 *   4. A database failure does NOT swallow the founder alert — money always
 *      reaches a human.
 *   5. The two rails share one definition; the webhook route carries no copy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type Stripe from 'stripe';

const { mockResendSend } = vi.hoisted(() => ({
  mockResendSend: vi.fn().mockResolvedValue({ id: 'email-1' }),
}));
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockResendSend } };
  }),
}));

import {
  recordReportOrder,
  isReportSession,
  isSessionPaid,
} from '@/lib/stripe/report-fulfillment';

// ── Supabase test double ───────────────────────────────────────────────────

type Existing = { id: string; status: string } | null;

function makeSupabase({
  existing = null,
  upsertError = null,
  profileId = null,
}: { existing?: Existing; upsertError?: { message: string } | null; profileId?: string | null } = {}) {
  const upsert = vi.fn().mockResolvedValue({ error: upsertError });
  const from = vi.fn().mockReturnValue({
    upsert,
    select: vi.fn().mockReturnValue({
      // report_orders idempotency probe
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: existing }),
      }),
      // profiles account linkage
      ilike: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: profileId ? { id: profileId } : null }),
        }),
      }),
    }),
  });
  // The module's ServiceClient type is the real Supabase client; the double
  // implements only the surface this function touches.
  return { client: { from } as never, from, upsert };
}

function session(over: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: 'cs_live_abc123',
    mode: 'payment',
    payment_status: 'paid',
    amount_total: 49900,
    currency: 'usd',
    customer_details: { email: 'buyer@contractor.example', name: 'Jordan M' },
    customer_email: null,
    client_reference_id: null,
    metadata: {},
    payment_intent: 'pi_1',
    customer: 'cus_1',
    ...over,
  } as unknown as Stripe.Checkout.Session;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = 're_test';
});
afterEach(() => {
  delete process.env.RESEND_API_KEY;
});

// ── Predicates ─────────────────────────────────────────────────────────────

describe('session predicates — shared by both rails', () => {
  it('treats a mode:payment session as a report sale', () => {
    expect(isReportSession(session())).toBe(true);
  });

  it('treats a tagged subscription session as a report sale too', () => {
    expect(
      isReportSession(session({ mode: 'subscription', metadata: { product: 'cmmc_ai_risk_report' } })),
    ).toBe(true);
  });

  it('ignores an ordinary subscription session', () => {
    expect(isReportSession(session({ mode: 'subscription', metadata: {} }))).toBe(false);
  });

  it('treats only payment_status "unpaid" as not-yet-paid', () => {
    // ACH/SEPA/Klarna authorise before the funds land. Recording that as paid
    // starts a 14-day engagement for money that may never arrive.
    expect(isSessionPaid(session({ payment_status: 'unpaid' }))).toBe(false);
    expect(isSessionPaid(session({ payment_status: 'paid' }))).toBe(true);
    expect(isSessionPaid(session({ payment_status: 'no_payment_required' }))).toBe(true);
  });
});

// ── Recording ──────────────────────────────────────────────────────────────

describe('recordReportOrder — first paid delivery', () => {
  it('records the order and sends both the buyer receipt and the founder alert', async () => {
    const db = makeSupabase();
    const result = await recordReportOrder(db.client, session(), 'webhook');

    expect(result).toMatchObject({ sessionId: 'cs_live_abc123', created: true, notified: true, status: 'paid' });
    expect(db.upsert).toHaveBeenCalledTimes(1);
    expect(db.upsert.mock.calls[0][0]).toMatchObject({
      email: 'buyer@contractor.example',
      full_name: 'Jordan M',
      stripe_session_id: 'cs_live_abc123',
      amount_cents: 49900,
      status: 'paid',
      is_wholesale: false,
    });
    expect(db.upsert.mock.calls[0][1]).toEqual({ onConflict: 'stripe_session_id' });
    expect(mockResendSend).toHaveBeenCalledTimes(2);
  });

  it('recovers the vertical from client_reference_id on the Payment-Link rail', async () => {
    // The fallback rail carries no metadata at all, and it is the rail that is
    // LIVE whenever STRIPE_SECRET_KEY is unset — i.e. the one real sales take.
    const db = makeSupabase();
    await recordReportOrder(
      db.client,
      session({ client_reference_id: 'report-healthcare', metadata: {} }),
      'webhook',
    );
    expect(db.upsert.mock.calls[0][0]).toMatchObject({ vertical: 'healthcare' });
  });

  it('puts the recovered vertical in the founder alert, not "unspecified"', async () => {
    // Regression: the alert read session.metadata.vertical directly, so every
    // Payment-Link sale — the only kind that can happen while the API key is
    // unset — told the founder the vertical was unspecified while the database
    // row knew better.
    const db = makeSupabase();
    await recordReportOrder(
      db.client,
      session({ client_reference_id: 'report-defense', metadata: {} }),
      'webhook',
    );
    const founderMail = mockResendSend.mock.calls.map((c) => c[0]).find((m) => String(m.subject).includes('sold'));
    expect(founderMail.html).toContain('defense');
    expect(founderMail.html).not.toContain('unspecified');
  });

  it('links the order to an existing account when the buyer already has one', async () => {
    const db = makeSupabase({ profileId: 'user-123' });
    await recordReportOrder(db.client, session(), 'webhook');
    expect(db.upsert.mock.calls[0][0]).toMatchObject({ user_id: 'user-123' });
  });

  it('honours the wholesale flag and falls back to the wholesale price with no amount', async () => {
    const db = makeSupabase();
    await recordReportOrder(
      db.client,
      session({ amount_total: null, metadata: { wholesale: 'true', partner_ref: 'p-1' } }),
      'webhook',
    );
    expect(db.upsert.mock.calls[0][0]).toMatchObject({
      is_wholesale: true,
      partner_ref: 'p-1',
      amount_cents: 39900,
    });
  });
});

describe('recordReportOrder — idempotency', () => {
  it('does not re-notify when the order is already recorded as paid', async () => {
    // The reconciler re-reads the same 30-day window every morning. Without
    // this, every past sale would re-email the buyer daily.
    const db = makeSupabase({ existing: { id: 'row-1', status: 'paid' } });
    const result = await recordReportOrder(db.client, session(), 'reconciler');
    expect(result).toMatchObject({ created: false, notified: false, status: 'paid' });
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('records an unpaid (delayed-settlement) session silently', async () => {
    const db = makeSupabase();
    const result = await recordReportOrder(db.client, session({ payment_status: 'unpaid' }), 'webhook');
    expect(result).toMatchObject({ notified: false, status: 'pending_payment' });
    expect(db.upsert.mock.calls[0][0]).toMatchObject({ status: 'pending_payment' });
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('promotes a pending order to paid and notifies then', async () => {
    const db = makeSupabase({ existing: { id: 'row-1', status: 'pending_payment' } });
    const result = await recordReportOrder(db.client, session(), 'webhook');
    expect(result).toMatchObject({ notified: true, status: 'paid' });
    expect(mockResendSend).toHaveBeenCalledTimes(2);
  });

  it('never walks a fulfillment status backwards', async () => {
    const db = makeSupabase({ existing: { id: 'row-1', status: 'report_delivered' } });
    const result = await recordReportOrder(db.client, session(), 'reconciler');
    expect(result.status).toBe('report_delivered');
    expect(db.upsert.mock.calls[0][0]).toMatchObject({ status: 'report_delivered' });
    expect(mockResendSend).not.toHaveBeenCalled();
  });
});

describe('recordReportOrder — failure behaviour', () => {
  it('still emails the founder when the database write fails', async () => {
    // The whole point of this module is that money always reaches a human. A
    // Supabase outage must not re-create the silent sale; one duplicate alert
    // later is the acceptable cost.
    const db = makeSupabase({ upsertError: { message: 'connection refused' } });
    const result = await recordReportOrder(db.client, session(), 'webhook');
    expect(result).toMatchObject({ notified: true, created: false });
    expect(result.error).toBe('connection refused');
    expect(mockResendSend).toHaveBeenCalledTimes(2);
  });

  it('sends nothing when Resend is not configured, and does not throw', async () => {
    delete process.env.RESEND_API_KEY;
    const db = makeSupabase();
    const result = await recordReportOrder(db.client, session(), 'webhook');
    expect(result.notified).toBe(true); // the decision was made; delivery is best-effort
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('survives a Resend failure without throwing', async () => {
    mockResendSend.mockRejectedValueOnce(new Error('resend down'));
    const db = makeSupabase();
    await expect(recordReportOrder(db.client, session(), 'webhook')).resolves.toMatchObject({
      notified: true,
    });
  });
});

describe('recordReportOrder — reconciler provenance', () => {
  it('marks a reconciler-recovered sale as recovered in the founder alert', async () => {
    const db = makeSupabase();
    await recordReportOrder(db.client, session(), 'reconciler');
    const founderMail = mockResendSend.mock.calls.map((c) => c[0]).find((m) => String(m.subject).includes('sold'));
    expect(founderMail.subject).toContain('RECOVERED');
    expect(founderMail.html).toContain('STRIPE_WEBHOOK_SECRET');
  });

  it('does not mark a normal webhook sale as recovered', async () => {
    const db = makeSupabase();
    await recordReportOrder(db.client, session(), 'webhook');
    const founderMail = mockResendSend.mock.calls.map((c) => c[0]).find((m) => String(m.subject).includes('sold'));
    expect(founderMail.subject).not.toContain('RECOVERED');
  });

  it('never puts the buyer address in a log line unmasked', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const db = makeSupabase();
    await recordReportOrder(db.client, session(), 'webhook');
    const lines = log.mock.calls.flat().join(' ');
    expect(lines).toContain('cs_live_abc123');
    expect(lines).not.toContain('buyer@contractor.example');
    log.mockRestore();
  });
});

// ── The single-definition guard ────────────────────────────────────────────

describe('one definition, two rails', () => {
  const APP_ROOT = path.resolve(__dirname, '../../..');
  const read = (rel: string) => fs.readFileSync(path.join(APP_ROOT, rel), 'utf8');

  // The precise signature of the RECORDING path is the upsert keyed on the
  // Stripe session id. Both rails legitimately UPDATE report_orders for
  // reversals (refund/dispute), so a blanket "never touches the table" guard
  // would be wrong — and a guard that is wrong gets deleted rather than fixed.
  const RECORDING_SIGNATURE = /onConflict:\s*['"]stripe_session_id['"]/;

  it('only the shared module carries the order-recording upsert', () => {
    expect(read('lib/stripe/report-fulfillment.ts')).toMatch(RECORDING_SIGNATURE);
    for (const rel of [
      'app/api/stripe/webhook/route.ts',
      'app/api/cron/reconcile-orders/route.ts',
    ]) {
      // The failure this prevents: someone "quickly" re-inlines the upsert in a
      // route, and the two rails start recording different rows.
      expect({ file: rel, inlinesRecording: RECORDING_SIGNATURE.test(read(rel)) }).toEqual({
        file: rel,
        inlinesRecording: false,
      });
      expect(read(rel)).toContain('recordReportOrder');
    }
  });

  it('the narrowed guard still has teeth', () => {
    // Narrowing a safety check is where real drift gets back in, so prove the
    // predicate against a synthetic offender AND a synthetic innocent here,
    // rather than leaving a future reader to reconstruct why it is safe.
    const offender = `await supabase.from('report_orders').upsert(row, { onConflict: 'stripe_session_id' });`;
    const innocent = `await supabase.from('report_orders').update({ status: 'refunded' }).eq('stripe_payment_intent_id', pi);`;
    expect(RECORDING_SIGNATURE.test(offender)).toBe(true);
    expect(RECORDING_SIGNATURE.test(innocent)).toBe(false);
  });

  it('both rails use the shared paid/report predicates rather than restating them', () => {
    for (const rel of ['app/api/stripe/webhook/route.ts', 'app/api/cron/reconcile-orders/route.ts']) {
      const src = read(rel);
      expect(src).toContain('isReportSession');
      expect(src).not.toMatch(/mode\s*===\s*['"]payment['"]/);
    }
  });
});
