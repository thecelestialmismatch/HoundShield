/**
 * Tests for lib/stripe/report-payment-link — the Stripe-hosted fallback rail
 * for the $499 report.
 *
 * Contract: the rail must always produce a live buy.stripe.com URL (a bad
 * STRIPE_REPORT_PAYMENT_LINK override must degrade to the known-good link,
 * never to a broken redirect), and vertical attribution must round-trip
 * through client_reference_id exactly as the webhook parses it.
 */

import {
  REPORT_VERTICALS,
  reportPaymentLinkBase,
  reportPaymentLinkUrl,
  verticalFromClientReference,
} from "@/lib/stripe/report-payment-link";

const KNOWN_GOOD = "https://buy.stripe.com/aFa00lgzIgJx3Aqb7qgUM00";

afterEach(() => {
  delete process.env.STRIPE_REPORT_PAYMENT_LINK;
});

describe("reportPaymentLinkBase", () => {
  it("returns the verified live link when no override is set", () => {
    expect(reportPaymentLinkBase()).toBe(KNOWN_GOOD);
  });

  it("honors a valid STRIPE_REPORT_PAYMENT_LINK override", () => {
    process.env.STRIPE_REPORT_PAYMENT_LINK = "https://buy.stripe.com/testRotated123";
    expect(reportPaymentLinkBase()).toBe("https://buy.stripe.com/testRotated123");
  });

  it("rejects a non-Stripe override and falls back to the known-good link", () => {
    process.env.STRIPE_REPORT_PAYMENT_LINK = "https://evil.example.com/phish";
    expect(reportPaymentLinkBase()).toBe(KNOWN_GOOD);
  });

  it("rejects a garbled override (whitespace, extra path) — never a broken redirect", () => {
    process.env.STRIPE_REPORT_PAYMENT_LINK = "buy.stripe.com/missing-scheme";
    expect(reportPaymentLinkBase()).toBe(KNOWN_GOOD);
    process.env.STRIPE_REPORT_PAYMENT_LINK = "https://buy.stripe.com/ok/../traversal";
    expect(reportPaymentLinkBase()).toBe(KNOWN_GOOD);
  });
});

describe("reportPaymentLinkUrl", () => {
  it("tags every known vertical into client_reference_id", () => {
    for (const vertical of REPORT_VERTICALS) {
      expect(reportPaymentLinkUrl(vertical)).toBe(
        `${KNOWN_GOOD}?client_reference_id=report-${vertical}`
      );
    }
  });

  it("tags unknown/absent verticals as report-direct (rail marker only)", () => {
    expect(reportPaymentLinkUrl()).toBe(`${KNOWN_GOOD}?client_reference_id=report-direct`);
    expect(reportPaymentLinkUrl("aerospace")).toBe(
      `${KNOWN_GOOD}?client_reference_id=report-direct`
    );
  });

  it("always produces an https buy.stripe.com URL", () => {
    expect(reportPaymentLinkUrl("defense")).toMatch(/^https:\/\/buy\.stripe\.com\//);
  });
});

describe("verticalFromClientReference", () => {
  it("round-trips the vertical the URL builder encodes", () => {
    for (const vertical of REPORT_VERTICALS) {
      const url = new URL(reportPaymentLinkUrl(vertical));
      const ref = url.searchParams.get("client_reference_id");
      expect(verticalFromClientReference(ref)).toBe(vertical);
    }
  });

  it("returns null for the rail marker, foreign refs, and absent values", () => {
    expect(verticalFromClientReference("report-direct")).toBeNull();
    expect(verticalFromClientReference("report-aerospace")).toBeNull();
    expect(verticalFromClientReference("some-other-ref")).toBeNull();
    expect(verticalFromClientReference("")).toBeNull();
    expect(verticalFromClientReference(null)).toBeNull();
    expect(verticalFromClientReference(undefined)).toBeNull();
  });
});
