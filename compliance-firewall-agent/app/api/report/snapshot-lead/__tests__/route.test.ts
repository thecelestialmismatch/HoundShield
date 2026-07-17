/**
 * Tests for POST /api/report/snapshot-lead
 *
 * Guards the opt-in snapshot lead capture. Two invariants matter most:
 *  1. PRIVACY: the schema is strict — any attempt to send pasted text (a field
 *     the client never sets) is rejected, not forwarded. Counts only.
 *  2. HONESTY: unconfigured Resend → 503 + fallback address, never fake success.
 */

const { mockResendSend } = vi.hoisted(() => ({
  mockResendSend: vi.fn().mockResolvedValue({ id: "email-123" }),
}));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockResendSend } };
  }),
}));

import { POST } from "@/app/api/report/snapshot-lead/route";
import { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/report/snapshot-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const VALID_BODY = {
  name: "Jane Smith",
  email: "jane@acme.com",
  company: "Acme Defense Corp",
  vertical: "defense",
  criticalCount: 2,
  highCount: 1,
  mediumCount: 3,
  totalMatches: 9,
  promptsScanned: 4,
  controls: ["SC.L2-3.13.1", "AC.L2-3.1.1"],
};

beforeEach(() => {
  mockResendSend.mockClear();
  delete process.env.RESEND_API_KEY;
  delete process.env.FOUNDER_EMAIL;
});

describe("POST /api/report/snapshot-lead — validation", () => {
  it("returns 400 when name is missing", async () => {
    const { name: _n, ...body } = VALID_BODY;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/name/i);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, email: "nope" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
  });

  it("REJECTS any attempt to smuggle pasted prompt text (strict schema)", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const res = await POST(
      makeRequest({ ...VALID_BODY, inputText: "CUI//SP-CTI secret contract N00024" })
    );
    expect(res.status).toBe(400);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("rejects negative counts", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, criticalCount: -1 }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/report/snapshot-lead — delivery honesty", () => {
  it("returns 503 with a fallback email when Resend is unconfigured", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.fallbackEmail).toBeTruthy();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("sends founder alert + requester confirmation when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(mockResendSend).toHaveBeenCalledTimes(2);
  });

  it("the emails carry counts but never any prompt content", async () => {
    process.env.RESEND_API_KEY = "re_test";
    await POST(makeRequest(VALID_BODY));
    const payloads = mockResendSend.mock.calls.map((c) => JSON.stringify(c[0]));
    for (const p of payloads) {
      // counts present
      expect(p).toContain("2 critical");
      // no pasted content ever (there is no channel for it)
      expect(p).not.toContain("CUI//");
      expect(p).not.toContain("N00024");
    }
  });

  it("routes the founder alert to FOUNDER_EMAIL when set", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.FOUNDER_EMAIL = "founder@houndshield.com";
    await POST(makeRequest(VALID_BODY));
    const founderCall = mockResendSend.mock.calls.find((c) => c[0].to === "founder@houndshield.com");
    expect(founderCall).toBeTruthy();
  });
});
