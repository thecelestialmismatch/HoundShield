/**
 * Tests for lib/reports/order-view — the sanitized confirmation view for the
 * $499 CMMC AI Risk Assessment Report. Pure functions, zero mocks.
 */

import { describe, it, expect } from "vitest";
import {
  maskEmail,
  orderReference,
  addDays,
  computeReportDueDate,
  formatMoney,
  verticalLabel,
  statusMeta,
  buildOrderView,
  REPORT_FULFILLMENT_DAYS,
  type OrderRowLike,
} from "@/lib/reports/order-view";

describe("maskEmail", () => {
  it("keeps the first local char and the full domain", () => {
    // "jordan" = 6 chars → 1 shown + 5 bullets.
    expect(maskEmail("jordan@acme.com")).toBe("j" + "•".repeat(5) + "@acme.com");
  });

  it("caps the bullet run at 6 for very long local parts", () => {
    // local part = 20 chars → 1 shown + 6 bullets (capped), not 19.
    expect(maskEmail("averylonglocalpart99@acme.com")).toBe("a" + "•".repeat(6) + "@acme.com");
  });

  it("does not mask a single-char local part (nothing to hide)", () => {
    expect(maskEmail("a@x.io")).toBe("a@x.io");
  });

  it("returns a bullet placeholder for an invalid or empty address", () => {
    expect(maskEmail("")).toBe("•••••");
    expect(maskEmail(null)).toBe("•••••");
    expect(maskEmail(undefined)).toBe("•••••");
    expect(maskEmail("not-an-email")).toBe("•••••");
    expect(maskEmail("@nope.com")).toBe("•••••");
    expect(maskEmail("nope@")).toBe("•••••");
    expect(maskEmail("nope@localhost")).toBe("•••••"); // no dot in domain
  });

  it("never returns the full address for a normal multi-char local part", () => {
    const out = maskEmail("privacyofficer@clinic.org");
    expect(out).not.toContain("privacyofficer");
    expect(out).toContain("@clinic.org");
    expect(out.startsWith("p")).toBe(true);
  });
});

describe("orderReference", () => {
  it("strips the cs_test_ prefix and uppercases the last 8 alphanumerics", () => {
    // "a1b2c3d4e5f6g7h8" (16 chars) → last 8 = "e5f6g7h8" → "E5F6G7H8"
    expect(orderReference({ stripe_session_id: "cs_test_a1b2c3d4e5f6g7h8" })).toBe("HS-E5F6G7H8");
  });

  it("is deterministic for a given session id", () => {
    const a = orderReference({ stripe_session_id: "cs_live_ZZZZ11112222abcd" });
    const b = orderReference({ stripe_session_id: "cs_live_ZZZZ11112222abcd" });
    expect(a).toBe(b);
    expect(a).toMatch(/^HS-[A-Z0-9]{8}$/);
  });

  it("falls back to the row id when there is no session id", () => {
    const ref = orderReference({ id: "11111111-2222-3333-4444-555566667777" });
    expect(ref).toMatch(/^HS-[A-Z0-9]{8}$/);
  });

  it("returns HS-PENDING when neither id is present", () => {
    expect(orderReference({})).toBe("HS-PENDING");
    expect(orderReference({ stripe_session_id: "", id: null })).toBe("HS-PENDING");
  });
});

describe("addDays / computeReportDueDate", () => {
  it("adds whole days across a month boundary", () => {
    expect(addDays("2026-07-04T00:00:00.000Z", 14)).toBe("2026-07-18T00:00:00.000Z");
  });

  it("returns the input unchanged for an invalid date", () => {
    expect(addDays("not-a-date", 14)).toBe("not-a-date");
  });

  it("defaults the report due date to the 14-day fulfillment window", () => {
    expect(REPORT_FULFILLMENT_DAYS).toBe(14);
    expect(computeReportDueDate("2026-07-04T12:00:00.000Z")).toBe("2026-07-18T12:00:00.000Z");
  });
});

describe("formatMoney", () => {
  it("formats cents as USD currency", () => {
    expect(formatMoney(49900, "usd")).toBe("$499.00");
    expect(formatMoney(29900, "USD")).toBe("$299.00");
  });

  it("defaults currency to usd", () => {
    expect(formatMoney(49900)).toBe("$499.00");
  });

  it("falls back gracefully for an unknown currency code", () => {
    const out = formatMoney(49900, "zzz");
    expect(out).toContain("499");
  });
});

describe("verticalLabel", () => {
  it("maps known verticals", () => {
    expect(verticalLabel("defense")).toBe("Defense / DIB");
    expect(verticalLabel("healthcare")).toBe("Healthcare");
    expect(verticalLabel("legal")).toBe("Legal");
    expect(verticalLabel("Legal")).toBe("Legal");
  });

  it("returns null for none/unknown", () => {
    expect(verticalLabel(null)).toBeNull();
    expect(verticalLabel("")).toBeNull();
    expect(verticalLabel("aerospace")).toBeNull();
  });
});

describe("statusMeta", () => {
  it("labels each lifecycle stage with an ascending step", () => {
    expect(statusMeta("paid")).toEqual({
      label: "Payment received — deployment pending",
      step: 1,
    });
    expect(statusMeta("proxy_deployed").step).toBe(2);
    expect(statusMeta("report_delivered")).toEqual({ label: "Report delivered", step: 3 });
  });

  it("defaults unknown/empty status to paid", () => {
    expect(statusMeta(undefined).step).toBe(1);
    expect(statusMeta("something_else").step).toBe(1);
  });
});

describe("buildOrderView", () => {
  const base: OrderRowLike = {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    email: "jordan@subcontractor.com",
    full_name: "Jordan M.",
    vertical: "defense",
    amount_cents: 49900,
    currency: "usd",
    status: "paid",
    is_wholesale: false,
    stripe_session_id: "cs_live_abc123def456ghi789",
    report_delivered_at: null,
    created_at: "2026-07-04T00:00:00.000Z",
  };

  it("assembles a fully sanitized view", () => {
    const v = buildOrderView(base);
    expect(v.reference).toMatch(/^HS-[A-Z0-9]{8}$/);
    expect(v.emailMasked).toBe("j" + "•".repeat(5) + "@subcontractor.com");
    expect(v.emailMasked).not.toContain("jordan");
    expect(v.amountFormatted).toBe("$499.00");
    expect(v.vertical).toBe("defense");
    expect(v.verticalLabel).toBe("Defense / DIB");
    expect(v.statusStep).toBe(1);
    expect(v.reportDueDate).toBe("2026-07-18T00:00:00.000Z");
    expect(v.reportDeliveredAt).toBeNull();
  });

  it("never leaks Stripe identifiers or the raw email into the view keys", () => {
    const v = buildOrderView(base);
    const keys = Object.keys(v);
    expect(keys).not.toContain("stripe_session_id");
    expect(keys).not.toContain("email");
    expect(JSON.stringify(v)).not.toContain("jordan@subcontractor.com");
  });

  it("defaults amount to $499 and status to paid when missing", () => {
    const v = buildOrderView({ created_at: "2026-07-04T00:00:00.000Z" });
    expect(v.amountCents).toBe(49900);
    expect(v.amountFormatted).toBe("$499.00");
    expect(v.status).toBe("paid");
    expect(v.emailMasked).toBe("•••••");
  });

  it("treats an empty-string vertical as none", () => {
    const v = buildOrderView({ ...base, vertical: "  " });
    expect(v.vertical).toBeNull();
    expect(v.verticalLabel).toBeNull();
  });

  it("reflects wholesale and a delivered report", () => {
    const v = buildOrderView({
      ...base,
      amount_cents: 29900,
      is_wholesale: true,
      status: "report_delivered",
      report_delivered_at: "2026-07-18T00:00:00.000Z",
    });
    expect(v.isWholesale).toBe(true);
    expect(v.amountFormatted).toBe("$299.00");
    expect(v.statusStep).toBe(3);
    expect(v.reportDeliveredAt).toBe("2026-07-18T00:00:00.000Z");
  });

  it("synthesizes a created_at when the row has none", () => {
    const v = buildOrderView({ email: "a@b.com", stripe_session_id: "cs_test_x" });
    expect(new Date(v.createdAt).getTime()).not.toBeNaN();
    // due date is 14 days after createdAt
    expect(new Date(v.reportDueDate).getTime() - new Date(v.createdAt).getTime()).toBe(
      REPORT_FULFILLMENT_DAYS * 24 * 60 * 60 * 1000,
    );
  });
});
