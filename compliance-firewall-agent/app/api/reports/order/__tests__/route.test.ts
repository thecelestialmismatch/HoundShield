/**
 * Tests for GET /api/reports/order — the unauthenticated, session-id-keyed
 * confirmation lookup for the $499 CMMC AI Risk Assessment Report.
 *
 * Validates: session-id shape guard, Stripe config guard, unknown/unpaid
 * sessions return a generic 404, Stripe-only synthesis before the webhook
 * lands, DB enrichment when the row exists, and that the response is sanitized
 * (masked email, no Stripe identifiers).
 */

const mockSessionsRetrieve = vi.fn();

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      checkout: { sessions: { retrieve: mockSessionsRetrieve } },
    };
  }),
}));

const { mockIsConfigured, mockOrderLookup } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(() => false),
  mockOrderLookup: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mockOrderLookup(),
        }),
      }),
    }),
  }),
}));

import { GET } from "@/app/api/reports/order/route";
import { NextRequest } from "next/server";

const SESSION_ID = "cs_test_a1b2c3d4e5f6g7h8i9j0";

function makeRequest(sessionId?: string) {
  const url = sessionId
    ? `http://localhost/api/reports/order?session_id=${encodeURIComponent(sessionId)}`
    : `http://localhost/api/reports/order`;
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/reports/order", () => {
  beforeEach(() => {
    mockSessionsRetrieve.mockReset();
    mockIsConfigured.mockReset();
    mockIsConfigured.mockReturnValue(false);
    mockOrderLookup.mockReset();
    mockOrderLookup.mockResolvedValue({ data: null });
    process.env.STRIPE_SECRET_KEY = "sk_test";
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("returns 400 for a missing session_id", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 for a malformed session_id", async () => {
    const res = await GET(makeRequest("not-a-session"));
    expect(res.status).toBe(400);
    expect(mockSessionsRetrieve).not.toHaveBeenCalled();
  });

  it("returns 503 when Stripe is not configured", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(503);
  });

  it("returns 404 when the session is unknown to Stripe", async () => {
    mockSessionsRetrieve.mockRejectedValue(new Error("No such session"));
    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(404);
  });

  it("returns 404 (never any detail) for an unpaid session", async () => {
    mockSessionsRetrieve.mockResolvedValue({
      id: SESSION_ID,
      payment_status: "unpaid",
      amount_total: 49900,
      currency: "usd",
      created: 1_760_000_000,
    });
    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.order).toBeUndefined();
  });

  it("confirms a paid session from Stripe alone (webhook not yet landed)", async () => {
    mockSessionsRetrieve.mockResolvedValue({
      id: SESSION_ID,
      payment_status: "paid",
      amount_total: 49900,
      currency: "usd",
      created: 1_760_000_000,
      customer_details: { email: "jordan@subcontractor.com", name: "Jordan M." },
      metadata: { vertical: "defense", wholesale: "false" },
    });

    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(200);
    const { order } = await res.json();
    expect(order.reference).toMatch(/^HS-[A-Z0-9]{8}$/);
    expect(order.amountFormatted).toBe("$499.00");
    expect(order.verticalLabel).toBe("Defense / DIB");
    // sanitized: masked email, no raw address or Stripe ids
    expect(order.emailMasked).toBe("j" + "•".repeat(5) + "@subcontractor.com");
    const serialized = JSON.stringify(order);
    expect(serialized).not.toContain("jordan@subcontractor.com");
    expect(serialized).not.toContain(SESSION_ID);
  });

  it("enriches the confirmation from the DB row when it exists", async () => {
    mockIsConfigured.mockReturnValue(true);
    mockOrderLookup.mockResolvedValue({
      data: {
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        email: "privacy@clinic.org",
        vertical: "healthcare",
        amount_cents: 49900,
        currency: "usd",
        status: "proxy_deployed",
        is_wholesale: false,
        stripe_session_id: SESSION_ID,
        created_at: "2026-07-04T00:00:00.000Z",
        report_delivered_at: null,
      },
    });
    mockSessionsRetrieve.mockResolvedValue({
      id: SESSION_ID,
      payment_status: "paid",
      amount_total: 49900,
      currency: "usd",
      created: 1_760_000_000,
      customer_details: { email: "privacy@clinic.org" },
      metadata: { vertical: "healthcare" },
    });

    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(200);
    const { order } = await res.json();
    // DB status wins over the synthesized "paid"
    expect(order.status).toBe("proxy_deployed");
    expect(order.statusStep).toBe(2);
    expect(order.verticalLabel).toBe("Healthcare");
    expect(order.reportDueDate).toBe("2026-07-18T00:00:00.000Z");
  });

  it("still confirms when payment_status is no_payment_required (100% promo)", async () => {
    mockSessionsRetrieve.mockResolvedValue({
      id: SESSION_ID,
      payment_status: "no_payment_required",
      amount_total: 0,
      currency: "usd",
      created: 1_760_000_000,
      customer_details: { email: "a@b.com" },
      metadata: {},
    });
    const res = await GET(makeRequest(SESSION_ID));
    expect(res.status).toBe(200);
  });
});
