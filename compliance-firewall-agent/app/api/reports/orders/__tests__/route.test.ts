/**
 * Tests for GET /api/reports/orders — the signed-in customer's own $499 report
 * orders. Ownership is enforced by Supabase RLS (migration 020); this route
 * adds an explicit user_id filter and sanitizes each row via buildOrderView.
 *
 * Validates: demo-mode empty result, 401 when unauthenticated, sanitized list
 * on success, and 500 on a query error.
 */

const { mockIsConfigured, mockGetUser, mockOrder } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(() => true),
  mockGetUser: vi.fn(),
  mockOrder: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => mockIsConfigured(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: () => mockGetUser() },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => mockOrder(),
        }),
      }),
    }),
  }),
}));

import { GET } from "@/app/api/reports/orders/route";

describe("GET /api/reports/orders", () => {
  beforeEach(() => {
    mockIsConfigured.mockReset();
    mockIsConfigured.mockReturnValue(true);
    mockGetUser.mockReset();
    mockOrder.mockReset();
  });

  it("returns an empty list in demo mode (Supabase unconfigured)", async () => {
    mockIsConfigured.mockReturnValue(false);
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).orders).toEqual([]);
  });

  it("returns 401 when there is no signed-in user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the user's sanitized orders", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          email: "jordan@subcontractor.com",
          vertical: "defense",
          amount_cents: 49900,
          currency: "usd",
          status: "paid",
          is_wholesale: false,
          stripe_session_id: "cs_live_abc123def456ghi789",
          created_at: "2026-07-04T00:00:00.000Z",
          report_delivered_at: null,
        },
      ],
      error: null,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const { orders } = await res.json();
    expect(orders).toHaveLength(1);
    expect(orders[0].reference).toMatch(/^HS-[A-Z0-9]{8}$/);
    expect(orders[0].verticalLabel).toBe("Defense / DIB");
    // sanitized — no raw email leaks through the list endpoint either
    expect(JSON.stringify(orders[0])).not.toContain("jordan@subcontractor.com");
  });

  it("returns an empty list when the user has no orders", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockOrder.mockResolvedValue({ data: [], error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).orders).toEqual([]);
  });

  it("returns 500 when the query errors", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockOrder.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
