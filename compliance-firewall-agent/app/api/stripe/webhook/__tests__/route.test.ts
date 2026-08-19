/**
 * Tests for POST /api/stripe/webhook
 *
 * Validates: missing-config guard, signature verification, each event
 * handler (checkout.session.completed, customer.subscription.updated,
 * customer.subscription.deleted, invoice.payment_failed, invoice.paid),
 * and graceful error handling.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

// Supabase
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn();
const mockEq = vi.fn().mockResolvedValue({ error: null });
const mockEq2 = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

// Stripe
const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      webhooks: {
        constructEvent: mockConstructEvent,
      },
      subscriptions: {
        retrieve: mockSubscriptionsRetrieve,
      },
    };
  }),
}));

// Resend — the webhook imports it dynamically (`await import('resend')`), so the
// mock must be hoisted (mirrors app/api/contact/__tests__/route.test.ts). Email
// is best-effort; most tests keep RESEND_API_KEY unset so this never loads.
const { mockResendSend } = vi.hoisted(() => ({
  mockResendSend: vi.fn().mockResolvedValue({ id: "email-1" }),
}));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockResendSend } };
  }),
}));

// ── Import route handler after mocks ──────────────────────────────────────

import { POST } from "@/app/api/stripe/webhook/route";
import { NextRequest } from "next/server";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(body = "{}") {
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "t=123,v1=abc",
    },
    body,
  });
}

function setupSupabase() {
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq2 });
  mockFrom.mockReturnValue({
    upsert: mockUpsert,
    update: mockUpdate,
    select: vi.fn().mockReturnValue({
      // subscription/customer lookups: select().eq().single()
      // report-order idempotency probe: select().eq('stripe_session_id',…).maybeSingle()
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }),
      // report-order account linkage: select().ilike().limit().maybeSingle()
      ilike: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
  });
}

const BASE_SUBSCRIPTION = {
  id: "sub_123",
  status: "active",
  metadata: { tier: "growth", supabase_user_id: "user-abc" },
  customer: "cus_123",
  items: { data: [{ price: { id: "price_growth" } }] },
  cancel_at_period_end: false,
  canceled_at: null,
  current_period_start: 1700000000,
  current_period_end: 1702592000,
  trial_start: null,
  trial_end: null,
};

// ── Config guards ──────────────────────────────────────────────────────────

describe("POST /api/stripe/webhook — config guards", () => {
  it("returns 503 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeRequest());
    expect(res.status).toBe(503);
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("does NOT require STRIPE_SECRET_KEY — the signing secret alone accepts a delivery", async () => {
    // Signature verification is a local HMAC check. Requiring the API key here
    // used to drop live Payment-Link sales on the floor.
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    setupSupabase();
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.created",
      id: "evt_unhandled",
      data: { object: {} },
    });

    const res = await POST(makeRequest());
    expect(res.status).not.toBe(503);
    expect(res.status).toBe(200);

    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });
});

// ── The money path with a broken/absent STRIPE_SECRET_KEY ──────────────────
//
// Production reality this locks down: STRIPE_SECRET_KEY is missing/mis-pasted,
// so /api/stripe/report-checkout serves the Stripe-hosted Payment Link. A buyer
// pays. Stripe posts checkout.session.completed. That sale MUST be recorded and
// the founder MUST be alerted without the API key.

describe("POST /api/stripe/webhook — $499 report records without STRIPE_SECRET_KEY", () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY; // the broken-key production state
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.RESEND_API_KEY = "re_test"; // exercise the alert path
    process.env.FOUNDER_EMAIL = "founder@houndshield.com";
    setupSupabase();
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.RESEND_API_KEY;
    delete process.env.FOUNDER_EMAIL;
    vi.clearAllMocks();
  });

  it("records the payment-link sale and alerts the founder with no API key set", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_keyless_sale",
      data: {
        object: {
          id: "cs_keyless",
          mode: "payment",
          payment_intent: "pi_keyless",
          customer: null,
          client_reference_id: "report-healthcare",
          customer_details: { email: "rachel@clinic.com", name: "Rachel H" },
          amount_total: 49900,
          currency: "usd",
        },
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: "cs_keyless",
        email: "rachel@clinic.com",
        amount_cents: 49900,
        vertical: "healthcare",
        status: "paid",
      }),
      expect.any(Object)
    );
    // Buyer receipt + founder alert both go out — the sale is not silent.
    const recipients = mockResendSend.mock.calls.map((c) => c[0].to);
    expect(recipients).toContain("rachel@clinic.com");
    expect(recipients).toContain("founder@houndshield.com");
  });

  it("ACKNOWLEDGES (2xx) a subscription event it cannot expand, instead of failing", async () => {
    // A non-2xx would make Stripe retry and eventually disable the endpoint,
    // which would take the report-order path down with it.
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_sub_no_key",
      data: {
        object: {
          id: "cs_sub_no_key",
          mode: "subscription",
          subscription: "sub_1",
          customer: "cus_1",
          metadata: { supabase_user_id: "user-1" },
        },
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled();
  });
});

// ── Signature verification ─────────────────────────────────────────────────

describe("POST /api/stripe/webhook — signature verification", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/signature/i);
  });

  it("returns 400 when constructEvent throws (invalid signature)", async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error("Signature verification failed");
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it("processes event when signature is valid", async () => {
    setupSupabase();
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_1",
      data: {
        object: {
          subscription: "sub_123",
          customer: "cus_123",
          metadata: { supabase_user_id: "user-abc" },
        },
      },
    });
    mockSubscriptionsRetrieve.mockResolvedValueOnce(BASE_SUBSCRIPTION);
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
  });
});

// ── checkout.session.completed ─────────────────────────────────────────────

describe("POST /api/stripe/webhook — checkout.session.completed", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    setupSupabase();
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  it("upserts subscription and updates profile tier", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_checkout",
      data: {
        object: {
          subscription: "sub_123",
          customer: "cus_123",
          metadata: { supabase_user_id: "user-abc" },
        },
      },
    });
    mockSubscriptionsRetrieve.mockResolvedValueOnce(BASE_SUBSCRIPTION);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_subscription_id: "sub_123",
        tier: "growth",
        user_id: "user-abc",
      }),
      expect.any(Object)
    );
  });

  it("returns 200 even when no user ID is found", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_noid",
      data: {
        object: {
          subscription: "sub_noid",
          customer: "cus_unknown",
          metadata: {},
        },
      },
    });
    mockSubscriptionsRetrieve.mockResolvedValueOnce({
      ...BASE_SUBSCRIPTION,
      id: "sub_noid",
      metadata: {},
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
  });
});

// ── checkout.session.completed (one-time $499 report) ─────────────────────

describe("POST /api/stripe/webhook — report order (mode: payment)", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    delete process.env.RESEND_API_KEY; // keep email path a no-op in tests
    setupSupabase();
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  it("records a report_orders row and does NOT retrieve a subscription", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_report",
      data: {
        object: {
          id: "cs_report_1",
          mode: "payment",
          payment_intent: "pi_1",
          customer: "cus_report",
          customer_details: { email: "jordan@dib.com", name: "Jordan M" },
          amount_total: 49900,
          currency: "usd",
          metadata: { product: "cmmc_ai_risk_report", vertical: "defense", wholesale: "false" },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    // Subscription retrieval must never run for a one-time report.
    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: "cs_report_1",
        email: "jordan@dib.com",
        amount_cents: 49900,
        is_wholesale: false,
        status: "paid",
      }),
      expect.any(Object)
    );
  });

  it("records a payment-link (fallback rail) sale — no metadata, vertical from client_reference_id", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_report_plink",
      data: {
        object: {
          id: "cs_report_plink",
          mode: "payment",
          payment_intent: "pi_plink",
          customer: null,
          customer_details: { email: "rachel@clinic.com", name: "Rachel H" },
          amount_total: 49900,
          currency: "usd",
          // Payment Links created in the dashboard carry no metadata; the
          // fallback rail encodes the vertical in client_reference_id.
          metadata: {},
          client_reference_id: "report-healthcare",
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: "cs_report_plink",
        email: "rachel@clinic.com",
        vertical: "healthcare",
        is_wholesale: false,
        status: "paid",
      }),
      expect.any(Object)
    );
  });

  it("flags wholesale ($299 co-brand) orders", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_report_ws",
      data: {
        object: {
          id: "cs_report_ws",
          mode: "payment",
          customer_details: { email: "rpo@summit7.com", name: "" },
          amount_total: 29900,
          currency: "usd",
          metadata: { product: "cmmc_ai_risk_report", partner_ref: "summit7", wholesale: "true" },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        is_wholesale: true,
        partner_ref: "summit7",
        amount_cents: 29900,
      }),
      expect.any(Object)
    );
  });
});

// ── report order — founder alert (fires alongside the buyer receipt) ────────

describe("POST /api/stripe/webhook — report order founder alert", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.RESEND_API_KEY = "re_test"; // enable the best-effort email path
    process.env.FOUNDER_EMAIL = "founder@houndshield.com";
    setupSupabase();
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.RESEND_API_KEY;
    delete process.env.FOUNDER_EMAIL;
    vi.clearAllMocks();
  });

  it("emails BOTH the buyer receipt and the founder alert on a paid report", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_report_alert",
      data: {
        object: {
          id: "cs_report_alert",
          mode: "payment",
          customer_details: { email: "rachel@clinic.com", name: "Rachel H" },
          amount_total: 49900,
          currency: "usd",
          metadata: { product: "cmmc_ai_risk_report", vertical: "healthcare", wholesale: "false" },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    // Two sends: buyer receipt + founder alert.
    expect(mockResendSend).toHaveBeenCalledTimes(2);
    const recipients = mockResendSend.mock.calls.map((c) => c[0].to);
    expect(recipients).toContain("rachel@clinic.com");
    expect(recipients).toContain("founder@houndshield.com");

    // The founder alert is the money-and-buyer notification.
    const founderCall = mockResendSend.mock.calls.find(
      (c) => c[0].to === "founder@houndshield.com",
    );
    expect(founderCall?.[0].subject).toContain("$499");
    expect(founderCall?.[0].subject).toContain("rachel@clinic.com");
  });

  // Contract CHANGED deliberately: the sale alert used to default to the generic
  // contact@ inbox while the RPO/MSP partner alert defaulted to info@ — the same
  // decision resolved two ways. Both now route through founderInbox(), whose
  // default is the founder's own mailbox, because a $499 sale alert sitting
  // unread in a shared inbox is the failure mode that matters.
  it("falls back to the PUBLISHED generic inbox when FOUNDER_EMAIL is unset", async () => {
    delete process.env.FOUNDER_EMAIL;
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_report_alert2",
      data: {
        object: {
          id: "cs_report_alert2",
          mode: "payment",
          customer_details: { email: "jordan@dib.com", name: "Jordan M" },
          amount_total: 49900,
          currency: "usd",
          metadata: { product: "cmmc_ai_risk_report", vertical: "defense" },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    // Never a personal address: this default ships in a public repo. Set
    // FOUNDER_EMAIL in Vercel to route sale alerts to a mailbox you actually read.
    const recipients = mockResendSend.mock.calls.map((c) => c[0].to);
    expect(recipients).toContain("contact@houndshield.com");
  });

  it("still returns 200 (billing unaffected) when an email send throws", async () => {
    mockResendSend.mockRejectedValueOnce(new Error("Resend outage")); // a send fails
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      id: "evt_report_alert3",
      data: {
        object: {
          id: "cs_report_alert3",
          mode: "payment",
          customer_details: { email: "marcus@lawfirm.com", name: "Marcus T" },
          amount_total: 49900,
          currency: "usd",
          metadata: { product: "cmmc_ai_risk_report", vertical: "legal" },
        },
      },
    });

    const res = await POST(makeRequest());
    // Email is best-effort — a send failure must never fail the webhook.
    expect(res.status).toBe(200);
    // The order row must still have been written.
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_session_id: "cs_report_alert3", status: "paid" }),
      expect.any(Object),
    );
  });
});

// ── report order idempotency (Stripe retries must NOT re-send emails) ───────

describe("POST /api/stripe/webhook — report order idempotency", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.RESEND_API_KEY = "re_test"; // enable the best-effort email path
    process.env.FOUNDER_EMAIL = "founder@houndshield.com";
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq2 });
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.RESEND_API_KEY;
    delete process.env.FOUNDER_EMAIL;
    vi.clearAllMocks();
  });

  // Wire the report_orders idempotency probe to a specific result. `existing`
  // truthy = the order was already recorded by a prior webhook delivery.
  function setupWithExistingOrder(existing: { id: string; status?: string } | null) {
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
      update: mockUpdate,
      select: vi.fn().mockReturnValue({
        // idempotency probe: select('id').eq('stripe_session_id',…).maybeSingle()
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: existing }),
        }),
        // account linkage: select('id').ilike('email',…).limit().maybeSingle()
        ilike: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    });
  }

  const reportEvent = (id: string) => ({
    type: "checkout.session.completed",
    id,
    data: {
      object: {
        id: "cs_report_dup",
        mode: "payment",
        customer_details: { email: "rachel@clinic.com", name: "Rachel H" },
        amount_total: 49900,
        currency: "usd",
        metadata: { product: "cmmc_ai_risk_report", vertical: "healthcare", wholesale: "false" },
      },
    },
  });

  it("does NOT re-send the buyer receipt or founder alert on a duplicate (retried) event", async () => {
    // The order was already recorded by a prior delivery of the same session.
    setupWithExistingOrder({ id: "existing-order-1" });
    mockConstructEvent.mockReturnValueOnce(reportEvent("evt_report_dup"));

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    // The row is still upserted idempotently — DB stays the source of truth…
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_session_id: "cs_report_dup", status: "paid" }),
      expect.any(Object),
    );
    // …but NO emails go out the second time. This is the whole fix.
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("sends both emails on the FIRST delivery of an order", async () => {
    // No existing row → this is the first time we record the order.
    setupWithExistingOrder(null);
    mockConstructEvent.mockReturnValueOnce(reportEvent("evt_report_first"));

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockResendSend).toHaveBeenCalledTimes(2);
    const recipients = mockResendSend.mock.calls.map((c) => c[0].to);
    expect(recipients).toContain("rachel@clinic.com");
    expect(recipients).toContain("founder@houndshield.com");
  });

  // ── delayed-notification payment methods ────────────────────────────────
  //
  // `checkout.session.completed` does NOT mean the money arrived. ACH, Bacs, SEPA
  // and Klarna fire it on AUTHORISATION, with `payment_status: 'unpaid'` and funds
  // days away. Recording that as 'paid' starts a 14-day fulfillment engagement and
  // books revenue for money that may never land.

  const unpaidReportEvent = (id: string) => ({
    type: "checkout.session.completed",
    id,
    data: {
      object: {
        id: "cs_report_dup",
        mode: "payment",
        payment_status: "unpaid",
        customer_details: { email: "rachel@clinic.com", name: "Rachel H" },
        amount_total: 49900,
        currency: "usd",
        metadata: { product: "cmmc_ai_risk_report", vertical: "healthcare", wholesale: "false" },
      },
    },
  });

  it("records an UNPAID session as pending_payment and sends nothing", async () => {
    setupWithExistingOrder(null);
    mockConstructEvent.mockReturnValueOnce(unpaidReportEvent("evt_unpaid"));

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending_payment" }),
      expect.any(Object),
    );
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("promotes pending_payment → paid and sends the emails when the funds land", async () => {
    // The async success re-delivers the same session; the row already exists.
    setupWithExistingOrder({ id: "existing-order-1", status: "pending_payment" });
    mockConstructEvent.mockReturnValueOnce({
      ...reportEvent("evt_async_ok"),
      type: "checkout.session.async_payment_succeeded",
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "paid" }),
      expect.any(Object),
    );
    // First time this order is actually funded → notify now, not before.
    expect(mockResendSend).toHaveBeenCalledTimes(2);
  });

  it("never walks a status BACKWARDS on a late retry", async () => {
    // Fulfillment already advanced; a delayed Stripe retry must not reset it to 'paid'.
    setupWithExistingOrder({ id: "existing-order-1", status: "report_delivered" });
    mockConstructEvent.mockReturnValueOnce(reportEvent("evt_late_retry"));

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "report_delivered" }),
      expect.any(Object),
    );
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("does not resurrect a refunded order", async () => {
    setupWithExistingOrder({ id: "existing-order-1", status: "refunded" });
    mockConstructEvent.mockReturnValueOnce(reportEvent("evt_after_refund"));

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "refunded" }),
      expect.any(Object),
    );
  });
});

// ── customer.subscription.updated ─────────────────────────────────────────

describe("POST /api/stripe/webhook — customer.subscription.updated", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    setupSupabase();
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  it("upserts subscription and updates profile to active tier", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.updated",
      id: "evt_updated",
      data: { object: BASE_SUBSCRIPTION },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_subscription_id: "sub_123",
        tier: "growth",
        status: "active",
      }),
      expect.any(Object)
    );
  });

  it("downgrades to free when subscription status is canceled", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.updated",
      id: "evt_canceled",
      data: {
        object: {
          ...BASE_SUBSCRIPTION,
          status: "canceled",
          metadata: { tier: "growth", supabase_user_id: "user-abc" },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ tier: "free" });
  });
});

// ── customer.subscription.deleted ─────────────────────────────────────────

describe("POST /api/stripe/webhook — customer.subscription.deleted", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    setupSupabase();
    mockEq.mockReturnValue({ error: null });
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  it("marks subscription canceled and downgrades user to free", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.deleted",
      id: "evt_deleted",
      data: { object: BASE_SUBSCRIPTION },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "canceled" })
    );
  });
});

// ── invoice.payment_failed ────────────────────────────────────────────────

describe("POST /api/stripe/webhook — invoice.payment_failed", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    setupSupabase();
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  // THE SHAPE STRIPE ACTUALLY SENDS. `invoice.subscription` was removed in API
  // version 2025-04-30.basil; this integration pins 2026-07-29.dahlia and the live
  // endpoint runs 2026-02-25.clover, both past basil. The previous version of this
  // test asserted the pre-basil shape, so it passed green over a handler that could
  // never fire in production. If someone reverts `invoiceSubscriptionId`, THIS fails.
  it("sets subscription status to past_due (post-basil parent shape)", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.payment_failed",
      id: "evt_failed",
      data: {
        object: {
          parent: {
            type: "subscription_details",
            subscription_details: { subscription: "sub_123" },
          },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "past_due" });
  });

  it("reads an EXPANDED subscription object under parent", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.payment_failed",
      id: "evt_expanded",
      data: {
        object: {
          parent: { subscription_details: { subscription: { id: "sub_123" } } },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "past_due" });
  });

  it("still reads the legacy pre-basil top-level field", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.payment_failed",
      id: "evt_legacy",
      data: { object: { subscription: "sub_123" } },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "past_due" });
  });

  it("returns 200 even when invoice has no subscription field", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.payment_failed",
      id: "evt_nosub",
      data: { object: {} },
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
  });
});

// ── invoice.paid ──────────────────────────────────────────────────────────

describe("POST /api/stripe/webhook — invoice.paid", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    setupSupabase();
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  it("restores subscription to active (only past_due rows)", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.paid",
      id: "evt_paid",
      data: {
        object: {
          parent: { subscription_details: { subscription: "sub_123" } },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "active" });
  });
});

// ── charge.refunded / charge.dispute.created ──────────────────────────────
//
// Money leaving again. Without these, a refunded $499 order stays at status
// 'paid' and keeps counting as revenue and as a paying customer in
// lib/admin/founder-metrics.ts — the numbers the Sep 1 kill-criteria review reads.

describe("POST /api/stripe/webhook — refunds and disputes", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    setupSupabase();
    mockEq.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  it("marks a fully refunded order 'refunded'", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "charge.refunded",
      id: "evt_refund",
      data: { object: { payment_intent: "pi_123", refunded: true, amount: 49900, amount_refunded: 49900 } },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "refunded" });
  });

  it("leaves a PARTIAL refund counted — a goodwill credit is not a reversal", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "charge.refunded",
      id: "evt_partial",
      data: { object: { payment_intent: "pi_123", refunded: false, amount: 49900, amount_refunded: 5000 } },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("marks a disputed order 'disputed'", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "charge.dispute.created",
      id: "evt_dispute",
      data: { object: { payment_intent: "pi_123" } },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "disputed" });
  });

  it("acknowledges (200) when there is no payment_intent to match on", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "charge.dispute.created",
      id: "evt_nopi",
      data: { object: {} },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Unhandled event type ──────────────────────────────────────────────────

describe("POST /api/stripe/webhook — unhandled events", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("returns 200 for unrecognised event types", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "payment_intent.created",
      id: "evt_unknown",
      data: { object: {} },
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });
});

// ── Handler errors ────────────────────────────────────────────────────────

describe("POST /api/stripe/webhook — handler errors", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  it("returns 500 when handler throws unexpectedly", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.updated",
      id: "evt_err",
      data: { object: BASE_SUBSCRIPTION },
    });

    // Make supabase blow up inside the handler
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockRejectedValue(new Error("DB connection lost")),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
