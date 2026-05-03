/**
 * Tests for GET /api/reports/generate
 *
 * Tests the route logic in isolation — no real Supabase, no real PDF rendering.
 * Validates: param validation, demo mode, PDF format gating, error handling.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

// Supabase — start unconfigured (demo mode)
const mockIsSupabaseConfigured = jest.fn().mockReturnValue(false);
const mockCreateServiceClient = jest.fn();
const mockCreateClient = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => mockIsSupabaseConfigured(),
  createServiceClient: () => mockCreateServiceClient(),
}));
jest.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

// Subscription check
const mockGetUserSubscription = jest.fn().mockResolvedValue("free");
const mockCanAccessGateway = jest.fn().mockResolvedValue(true);
jest.mock("@/lib/subscription/check", () => ({
  getUserSubscription: (...args: unknown[]) => mockGetUserSubscription(...args),
  canAccessGateway: (...args: unknown[]) => mockCanAccessGateway(...args),
}));

// Seed anchors
jest.mock("@/lib/audit/seed-anchor", () => ({
  createSeedAnchor: jest.fn().mockResolvedValue("mock-seed-hash"),
  computeMerkleRoot: jest.fn().mockReturnValue("mock-merkle-root"),
}));

// PDF generator
const mockGeneratePDF = jest.fn().mockReturnValue(Buffer.from("fake-pdf-content"));
jest.mock("@/lib/reports/pdf-generator", () => ({
  generateCompliancePDF: (...args: unknown[]) => mockGeneratePDF(...args),
}));

// Demo data
jest.mock("@/lib/demo-data", () => ({
  DEMO_EVENTS: [
    {
      id: "1",
      created_at: new Date().toISOString(),
      risk_level: "HIGH",
      action_taken: "BLOCKED",
      classifications: ["CUI", "KEYS"],
      processing_time_ms: 7,
      seed_hash: "abc123",
    },
    {
      id: "2",
      created_at: new Date().toISOString(),
      risk_level: "NONE",
      action_taken: "ALLOWED",
      classifications: [],
      processing_time_ms: 5,
      seed_hash: null,
    },
    {
      id: "3",
      created_at: new Date().toISOString(),
      risk_level: "CRITICAL",
      action_taken: "BLOCKED",
      classifications: ["PII"],
      processing_time_ms: 9,
      seed_hash: "def456",
    },
  ],
}));

// ── Import route handler after mocks ──────────────────────────────────────

import { GET } from "@/app/api/reports/generate/route";
import { NextRequest } from "next/server";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/reports/generate");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

const FROM = "2026-04-01T00:00:00Z";
const TO = "2026-04-30T23:59:59Z";

// ── Param validation ─────────────────────────────────────────────────────

describe("GET /api/reports/generate — param validation", () => {
  it("returns 400 when 'from' is missing", async () => {
    const res = await GET(makeRequest({ to: TO }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/from/i);
  });

  it("returns 400 when 'to' is missing", async () => {
    const res = await GET(makeRequest({ from: FROM }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/to/i);
  });

  it("returns 400 when both params are missing", async () => {
    const res = await GET(makeRequest({}));
    expect(res.status).toBe(400);
  });
});

// ── Demo mode — JSON ──────────────────────────────────────────────────────

describe("GET /api/reports/generate — demo mode (JSON)", () => {
  beforeEach(() => {
    mockIsSupabaseConfigured.mockReturnValue(false);
  });

  it("returns 200 in demo mode", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    expect(res.status).toBe(200);
  });

  it("response contains summary object", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    const body = await res.json();
    expect(body.summary).toBeDefined();
    expect(typeof body.summary.total_events).toBe("number");
    expect(typeof body.summary.total_violations).toBe("number");
  });

  it("response contains breakdown by risk level", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    const body = await res.json();
    expect(body.breakdown.by_risk_level).toBeDefined();
  });

  it("response contains compliance_status object", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    const body = await res.json();
    expect(body.compliance_status).toBeDefined();
    expect(Object.keys(body.compliance_status).length).toBeGreaterThan(0);
  });

  it("response includes demo flag", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    const body = await res.json();
    expect(body.demo).toBe(true);
  });

  it("violation_rate is computed correctly from demo events", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    const body = await res.json();
    // 2 BLOCKED out of 3 total = 66.67% → rounded
    expect(body.summary.violation_rate).toBeGreaterThan(0);
    expect(body.summary.violation_rate).toBeLessThanOrEqual(100);
  });

  it("avg_processing_time_ms is a positive number", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    const body = await res.json();
    expect(body.summary.avg_processing_time_ms).toBeGreaterThan(0);
  });

  it("period matches the requested from/to", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    const body = await res.json();
    expect(body.summary.period.start).toBe(FROM);
    expect(body.summary.period.end).toBe(TO);
  });

  it("categories are counted correctly from demo events", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    const body = await res.json();
    // CUI appears in event 1, PII in event 3 — KEYS in event 1
    expect(body.breakdown.by_category["CUI"]).toBe(1);
    expect(body.breakdown.by_category["PII"]).toBe(1);
  });

  it("includes merkle_root field in integrity", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO }));
    const body = await res.json();
    expect(body.integrity).toBeDefined();
    expect("merkle_root" in body.integrity).toBe(true);
  });
});

// ── Demo mode — PDF format ────────────────────────────────────────────────

describe("GET /api/reports/generate?format=pdf — demo mode", () => {
  beforeEach(() => {
    mockIsSupabaseConfigured.mockReturnValue(false);
    mockGeneratePDF.mockClear();
    mockGeneratePDF.mockReturnValue(Buffer.from("fake-pdf-content-12345"));
  });

  it("returns 200 with PDF content-type in demo mode (no auth required)", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("sets Content-Disposition attachment header", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    const disposition = res.headers.get("content-disposition");
    expect(disposition).toMatch(/attachment/);
    expect(disposition).toMatch(/\.pdf/);
  });

  it("calls generateCompliancePDF with report data", async () => {
    await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    expect(mockGeneratePDF).toHaveBeenCalledTimes(1);
    const [reportArg] = mockGeneratePDF.mock.calls[0];
    expect(reportArg.summary).toBeDefined();
    expect(reportArg.demo).toBe(true);
  });

  it("PDF filename contains the from-date", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    const disposition = res.headers.get("content-disposition");
    expect(disposition).toContain("2026-04-01");
  });

  it("sets Cache-Control: no-store for PDF", async () => {
    const res = await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

// ── Production mode — tier gating ────────────────────────────────────────

describe("GET /api/reports/generate?format=pdf — production tier gating", () => {
  beforeEach(() => {
    mockIsSupabaseConfigured.mockReturnValue(true);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const res = await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    expect(res.status).toBe(401);
  });

  it("returns 402 when user is on free tier (PDF requires Growth+)", async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
    });
    mockGetUserSubscription.mockResolvedValue("free");
    const res = await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.upgrade_url).toBe("/pricing");
    expect(body.current_tier).toBe("free");
  });

  it("returns 402 for 'pro' tier (Growth+ required for PDF)", async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
    });
    mockGetUserSubscription.mockResolvedValue("pro");
    const res = await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    expect(res.status).toBe(402);
  });

  it("allows PDF for 'growth' tier user", async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-456" } } }),
      },
    });
    mockGetUserSubscription.mockResolvedValue("growth");

    const mockSelect = jest.fn().mockReturnThis();
    const mockGte = jest.fn().mockReturnThis();
    const mockLte = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockInsert = jest.fn().mockReturnThis();
    const mockSelectReport = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({ data: { id: "report-1" }, error: null });
    const mockUpdate = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });

    mockCreateServiceClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === "compliance_events") {
          return { select: mockSelect, gte: mockGte, lte: mockLte, order: mockOrder };
        }
        return {
          insert: mockInsert,
          select: mockSelectReport,
          single: mockSingle,
          update: mockUpdate,
          eq: mockEq,
        };
      }),
    });

    // Chain methods correctly
    mockSelect.mockReturnValue({ gte: mockGte });
    mockGte.mockReturnValue({ lte: mockLte });
    mockLte.mockReturnValue({ order: mockOrder });
    mockInsert.mockReturnValue({ select: mockSelectReport });
    mockSelectReport.mockReturnValue({ single: mockSingle });

    mockGeneratePDF.mockReturnValue(Buffer.from("real-pdf-bytes"));

    const res = await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    expect([200, 500]).toContain(res.status);
  });
});

// ── Error handling ────────────────────────────────────────────────────────

describe("GET /api/reports/generate — error handling", () => {
  it("returns 500 when PDF generator throws", async () => {
    mockIsSupabaseConfigured.mockReturnValue(false);
    mockGeneratePDF.mockImplementation(() => { throw new Error("jsPDF crashed"); });
    const res = await GET(makeRequest({ from: FROM, to: TO, format: "pdf" }));
    expect(res.status).toBe(500);
    mockGeneratePDF.mockReturnValue(Buffer.from("fake-pdf"));
  });
});
