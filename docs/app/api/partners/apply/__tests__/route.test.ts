/**
 * Tests for POST /api/partners/apply
 *
 * Validates: required-field enforcement, email validation, partner-type
 * normalisation, Supabase insert, Resend notification (non-blocking),
 * and graceful error handling.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockInsert = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

const mockResendSend = jest.fn().mockResolvedValue({ id: "email-123" });
jest.mock("resend", () => ({
  Resend: jest.fn(() => ({ emails: { send: mockResendSend } })),
}));

// ── Import route handler after mocks ──────────────────────────────────────

import { POST } from "@/app/api/partners/apply/route";
import { NextRequest } from "next/server";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/partners/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  name: "Jane Smith",
  company: "Acme Compliance LLC",
  email: "jane@acme.com",
  clientCount: 10,
  partnerType: "referral",
  message: "Looking forward to partnering!",
};

function setupInsertSuccess() {
  mockFrom.mockReturnValue({
    insert: mockInsert,
  });
  mockInsert.mockResolvedValue({ error: null });
}

function setupInsertError(msg = "DB error") {
  mockFrom.mockReturnValue({
    insert: mockInsert,
  });
  mockInsert.mockResolvedValue({ error: { message: msg } });
}

// ── Param validation ──────────────────────────────────────────────────────

describe("POST /api/partners/apply — validation", () => {
  it("returns 400 when name is missing", async () => {
    const { name: _n, ...body } = VALID_BODY;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/name/i);
  });

  it("returns 400 when company is missing", async () => {
    const { company: _c, ...body } = VALID_BODY;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/company/i);
  });

  it("returns 400 when email is missing", async () => {
    const { email: _e, ...body } = VALID_BODY;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, email: "not-an-email" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it("returns 400 for email missing @", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, email: "nodomain.com" }));
    expect(res.status).toBe(400);
  });
});

// ── Successful submission ─────────────────────────────────────────────────

describe("POST /api/partners/apply — success", () => {
  beforeEach(() => {
    jest.resetModules();
    setupInsertSuccess();
    delete process.env.RESEND_API_KEY;
  });

  it("returns 200 on valid submission", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("calls supabase.from('partner_applications').insert()", async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockFrom).toHaveBeenCalledWith("partner_applications");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Jane Smith",
        company: "Acme Compliance LLC",
        email: "jane@acme.com",
        partner_type: "referral",
        status: "pending",
      })
    );
  });

  it("stores client_count as number", async () => {
    await POST(makeRequest({ ...VALID_BODY, clientCount: 25 }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ client_count: 25 })
    );
  });

  it("defaults client_count to 0 when not provided", async () => {
    const { clientCount: _cc, ...body } = VALID_BODY;
    await POST(makeRequest(body));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ client_count: 0 })
    );
  });

  it("normalises unknown partnerType to 'referral'", async () => {
    await POST(makeRequest({ ...VALID_BODY, partnerType: "hacker" }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ partner_type: "referral" })
    );
  });

  it("accepts 'reseller' as valid partner type", async () => {
    await POST(makeRequest({ ...VALID_BODY, partnerType: "reseller" }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ partner_type: "reseller" })
    );
  });

  it("accepts 'technology' as valid partner type", async () => {
    await POST(makeRequest({ ...VALID_BODY, partnerType: "technology" }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ partner_type: "technology" })
    );
  });

  it("stores null for missing message", async () => {
    const { message: _m, ...body } = VALID_BODY;
    await POST(makeRequest(body));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ message: null })
    );
  });
});

// ── Resend email notification ─────────────────────────────────────────────

describe("POST /api/partners/apply — Resend notification", () => {
  beforeEach(() => {
    setupInsertSuccess();
    mockResendSend.mockClear();
  });

  it("skips email when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    await POST(makeRequest(VALID_BODY));
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("sends notification email when RESEND_API_KEY is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    await POST(makeRequest(VALID_BODY));
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const [emailArg] = mockResendSend.mock.calls[0];
    expect(emailArg.subject).toContain("Acme Compliance LLC");
    delete process.env.RESEND_API_KEY;
  });

  it("does NOT fail the request if Resend throws", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockResendSend.mockRejectedValueOnce(new Error("Resend outage"));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    delete process.env.RESEND_API_KEY;
  });
});

// ── Error handling ────────────────────────────────────────────────────────

describe("POST /api/partners/apply — error handling", () => {
  it("returns 500 when Supabase insert fails", async () => {
    setupInsertError("duplicate key");
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 500 when request JSON is malformed", async () => {
    const req = new NextRequest("http://localhost/api/partners/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
