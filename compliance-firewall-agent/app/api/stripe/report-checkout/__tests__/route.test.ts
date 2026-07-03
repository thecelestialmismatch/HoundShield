/**
 * Tests for POST /api/stripe/report-checkout — the $499 one-time
 * CMMC AI Risk Assessment Report (Stage 1 primary product).
 *
 * Validates: config guard, retail price anchoring at $499, wholesale gating
 * (only with a partner_ref), vertical sanitization, and use of the configured
 * SKU when present.
 */

const mockSessionsCreate = vi.fn();

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      checkout: { sessions: { create: mockSessionsCreate } },
    };
  }),
}));

// Supabase mock — drives the H3 partner_ref verification.
const { mockPartnerLookup, mockIsConfigured } = vi.hoisted(() => ({
  mockPartnerLookup: vi.fn(),
  mockIsConfigured: vi.fn(() => false),
}));
vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => ({
            limit: () => ({
              maybeSingle: () => mockPartnerLookup(),
            }),
          }),
        }),
      }),
    }),
  }),
}));

import { POST } from "@/app/api/stripe/report-checkout/route";
import { NextRequest } from "next/server";

const APPROVED_UUID = "11111111-1111-4111-8111-111111111111";

function makeRequest(body: unknown = {}) {
  return new NextRequest("http://localhost/api/stripe/report-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/stripe/report-checkout", () => {
  beforeEach(() => {
    mockSessionsCreate.mockReset();
    mockSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/test" });
    mockIsConfigured.mockReturnValue(false);
    mockPartnerLookup.mockReset();
    mockPartnerLookup.mockResolvedValue({ data: null });
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_REPORT_PRICE_ID;
  });

  it("returns 503 when STRIPE_SECRET_KEY is missing", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(503);
  });

  it("creates a one-time payment session at $499 retail", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toContain("checkout.stripe.com");

    const args = mockSessionsCreate.mock.calls[0][0];
    expect(args.mode).toBe("payment");
    expect(args.line_items[0].price_data.unit_amount).toBe(49900);
    expect(args.metadata.product).toBe("cmmc_ai_risk_report");
    expect(args.metadata.wholesale).toBe("false");
  });

  it("ignores wholesale flag without a partner_ref (anchors $499)", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    await POST(makeRequest({ wholesale: true }));
    const args = mockSessionsCreate.mock.calls[0][0];
    expect(args.line_items[0].price_data.unit_amount).toBe(49900);
    expect(args.metadata.wholesale).toBe("false");
  });

  it("does NOT grant $299 wholesale for an unverified partner_ref (H3)", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    // Arbitrary, non-approved ref → must fall back to $499 retail.
    await POST(makeRequest({ wholesale: true, partner_ref: "summit7" }));
    const args = mockSessionsCreate.mock.calls[0][0];
    expect(args.line_items[0].price_data.unit_amount).toBe(49900);
    expect(args.metadata.wholesale).toBe("false");
  });

  it("grants $299 wholesale only for a verified approved partner (H3)", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    mockIsConfigured.mockReturnValue(true);
    mockPartnerLookup.mockResolvedValue({ data: { id: APPROVED_UUID, status: "approved" } });

    await POST(makeRequest({ wholesale: true, partner_ref: APPROVED_UUID }));
    const args = mockSessionsCreate.mock.calls[0][0];
    expect(args.line_items[0].price_data.unit_amount).toBe(29900);
    expect(args.metadata.wholesale).toBe("true");
    expect(args.metadata.partner_ref).toBe(APPROVED_UUID);
  });

  it("uses the configured SKU at retail when STRIPE_REPORT_PRICE_ID is set", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_REPORT_PRICE_ID = "price_report_499";
    await POST(makeRequest({}));
    const args = mockSessionsCreate.mock.calls[0][0];
    expect(args.line_items[0].price).toBe("price_report_499");
    expect(args.line_items[0].price_data).toBeUndefined();
  });

  it("sanitizes an unknown vertical to empty string", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    await POST(makeRequest({ vertical: "aerospace" }));
    const args = mockSessionsCreate.mock.calls[0][0];
    expect(args.metadata.vertical).toBe("");
  });

  it("passes through a valid vertical", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    await POST(makeRequest({ vertical: "healthcare" }));
    const args = mockSessionsCreate.mock.calls[0][0];
    expect(args.metadata.vertical).toBe("healthcare");
  });
});
