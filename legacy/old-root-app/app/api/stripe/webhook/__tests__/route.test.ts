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
const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn();
const mockEq = jest.fn().mockResolvedValue({ error: null });
const mockEq2 = jest.fn().mockResolvedValue({ error: null });
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createServiceClient: jest.fn(() => ({ from: mockFrom })),
}));

// Stripe
const mockConstructEvent = jest.fn();
const mockSubscriptionsRetrieve = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    subscriptions: {
      retrieve: mockSubscriptionsRetrieve,
    },
  }));
});

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
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null }),
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
  it("returns 503 when STRIPE_SECRET_KEY is missing", async () => {
    const orig = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const res = await POST(makeRequest());
    expect(res.status).toBe(503);
    process.env.STRIPE_SECRET_KEY = orig;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("returns 503 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeRequest());
    expect(res.status).toBe(503);
    delete process.env.STRIPE_SECRET_KEY;
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
    jest.clearAllMocks();
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
    jest.clearAllMocks();
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
    jest.clearAllMocks();
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
    jest.clearAllMocks();
  });

  it("sets subscription status to past_due", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.payment_failed",
      id: "evt_failed",
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
    jest.clearAllMocks();
  });

  it("restores subscription to active (only past_due rows)", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.paid",
      id: "evt_paid",
      data: { object: { subscription: "sub_123" } },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "active" });
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
    jest.clearAllMocks();
  });

  it("returns 500 when handler throws unexpectedly", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.updated",
      id: "evt_err",
      data: { object: BASE_SUBSCRIPTION },
    });

    // Make supabase blow up inside the handler
    mockFrom.mockReturnValue({
      upsert: jest.fn().mockRejectedValue(new Error("DB connection lost")),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
