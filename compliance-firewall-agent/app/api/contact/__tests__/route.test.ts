/**
 * Tests for POST /api/contact
 *
 * Guards the fix for the fake contact form: the route must deliver the lead
 * (Resend → founder) or fail HONESTLY (503 + fallback email) — never a silent
 * fake success. Also asserts untrusted input is HTML-escaped in the email.
 */

const { mockResendSend } = vi.hoisted(() => ({
  mockResendSend: vi.fn().mockResolvedValue({ id: "email-123" }),
}));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockResendSend } };
  }),
}));

import { POST } from "@/app/api/contact/route";
import { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const VALID_BODY = {
  name: "Jane Smith",
  email: "jane@acme.com",
  company: "Acme Defense Corp",
  subject: "Assessment Report",
  message: "I want the $499 report.",
};

beforeEach(() => {
  mockResendSend.mockClear();
  delete process.env.RESEND_API_KEY;
});

describe("POST /api/contact — validation", () => {
  it("returns 400 when name is missing", async () => {
    const { name: _n, ...body } = VALID_BODY;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/name/i);
  });

  it("returns 400 when message is missing", async () => {
    const { message: _m, ...body } = VALID_BODY;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/message/i);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
  });
});

describe("POST /api/contact — honest failure (no fake success)", () => {
  it("returns 503 with a fallback email when Resend is not configured", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.success).toBeUndefined();
    expect(data.fallbackEmail).toContain("@");
    expect(mockResendSend).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact — delivery", () => {
  it("sends the founder notification and returns success when configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const [email] = mockResendSend.mock.calls[0];
    expect(email.subject).toContain("Jane Smith");
    expect(email.replyTo).toBe("jane@acme.com");
    delete process.env.RESEND_API_KEY;
  });

  it("HTML-escapes untrusted input in the notification body", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    await POST(makeRequest({ ...VALID_BODY, name: "<script>alert(1)</script>" }));
    const [email] = mockResendSend.mock.calls[0];
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    delete process.env.RESEND_API_KEY;
  });

  it("returns 500 if Resend throws (does not fake success)", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockResendSend.mockRejectedValueOnce(new Error("Resend outage"));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
    expect((await res.json()).success).toBeUndefined();
    delete process.env.RESEND_API_KEY;
  });
});

describe("POST /api/contact — malformed input", () => {
  it("returns 500 for malformed JSON", async () => {
    const res = await POST(makeRequest("{bad-json"));
    expect(res.status).toBe(500);
  });
});
