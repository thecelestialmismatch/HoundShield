/**
 * Receipt printer — the printable record for a $499 purchase.
 *
 * What these tests actually protect:
 *
 * 1. PRINT ISOLATION. The whole reason this component exists is that the buyer
 *    expenses the purchase and needs a document to attach. If the printer
 *    chrome, the nav, or the CTA buttons print, the output is a screenshot of a
 *    web page rather than a receipt. `print:hidden` is load-bearing, not
 *    styling, so it is asserted like behaviour.
 *
 * 2. NO PII LEAK. `/report/thank-you` is reachable with a Stripe session id in
 *    the URL. The receipt must show the MASKED email that `buildOrderView`
 *    produced and never a raw address — the same contract lib/reports/order-view.ts
 *    enforces server-side, re-checked at the surface that renders it.
 *
 * 3. THE MONEY IS THE ORDER'S, NOT A CONSTANT. The amount comes from the
 *    fetched order, so a wholesale ($399) purchase never prints the retail
 *    figure — that class of drift is exactly what the pricing work fixed.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReceiptPrinter, type ReceiptOrder } from "../ReceiptPrinter";
import { buildOrderView } from "@/lib/reports/order-view";
import { RISK_REPORT } from "@/lib/pricing/plans";

const ORDER: ReceiptOrder = {
  reference: "HS-4F2A9C31",
  emailMasked: "r•••••@clinic.com",
  amountFormatted: "$499",
  vertical: "healthcare",
  verticalLabel: "Healthcare",
  statusLabel: "Payment received — deployment pending",
  isWholesale: false,
  createdAt: "2026-08-19T10:00:00.000Z",
  reportDueDate: "2026-09-02T10:00:00.000Z",
};

afterEach(() => vi.restoreAllMocks());

describe("ReceiptPrinter — what the buyer gets", () => {
  it("prints the order reference, total and fulfillment date", () => {
    render(<ReceiptPrinter order={ORDER} />);
    expect(screen.getByText("HS-4F2A9C31")).toBeInTheDocument();
    expect(screen.getAllByText("$499").length).toBeGreaterThan(0);
    expect(screen.getByText(/September 2, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Payment receipt/i)).toBeInTheDocument();
  });

  it("shows the MASKED email and never a raw address", () => {
    render(<ReceiptPrinter order={ORDER} />);
    expect(screen.getByText("r•••••@clinic.com")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("rachel@clinic.com");
  });

  it("takes its amount from the ORDER, so a wholesale receipt is not retail", () => {
    const wholesale = { ...ORDER, amountFormatted: `$${RISK_REPORT.wholesalePrice}`, isWholesale: true };
    render(<ReceiptPrinter order={wholesale} />);
    expect(screen.getAllByText(`$${RISK_REPORT.wholesalePrice}`).length).toBeGreaterThan(0);
    expect(screen.queryByText(`$${RISK_REPORT.oneTimePrice}`)).toBeNull();
    expect(screen.getByText(/RPO\/MSP co-brand/)).toBeInTheDocument();
  });

  it("omits the vertical line entirely when there is no vertical", () => {
    render(<ReceiptPrinter order={{ ...ORDER, vertical: null, verticalLabel: null }} />);
    expect(screen.queryByText("Vertical")).toBeNull();
  });

  it("survives a malformed date rather than rendering 'Invalid Date'", () => {
    render(<ReceiptPrinter order={{ ...ORDER, createdAt: "not-a-date" }} />);
    expect(document.body.textContent).not.toMatch(/Invalid Date/);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});

describe("print isolation — the reason this component exists", () => {
  it("hides the printer chrome and the print button from print output", () => {
    const { container } = render(<ReceiptPrinter order={ORDER} />);
    // The decorative machine must not appear on paper.
    const chrome = container.querySelector('[aria-hidden="true"].print\\:hidden');
    expect(chrome).not.toBeNull();

    const button = screen.getByRole("button", { name: /print receipt/i });
    expect(button.className).toContain("print:hidden");
  });

  it("drops the sawtooth clip-path when printing so no content is cut off", () => {
    const { container } = render(<ReceiptPrinter order={ORDER} />);
    const paper = container.querySelector("article");
    expect(paper?.className).toContain("print:[clip-path:none]");
  });

  it("keeps the printer chrome out of the accessibility tree", () => {
    const { container } = render(<ReceiptPrinter order={ORDER} />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    // The receipt itself stays reachable.
    expect(screen.getByLabelText("Order receipt")).toBeInTheDocument();
  });

  it("calls window.print() when the button is clicked", () => {
    const printSpy = vi.fn();
    vi.stubGlobal("print", printSpy);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    render(<ReceiptPrinter order={ORDER} />);
    screen.getByRole("button", { name: /print receipt/i }).click();
    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});

describe("stage affects only the status line, never the record", () => {
  it("labels each stage", () => {
    const { rerender } = render(<ReceiptPrinter order={ORDER} stage="processing" />);
    expect(screen.getByText("Processing your order")).toBeInTheDocument();

    rerender(<ReceiptPrinter order={ORDER} stage="printing" />);
    expect(screen.getByText("Printing your receipt")).toBeInTheDocument();

    rerender(<ReceiptPrinter order={ORDER} stage="complete" />);
    expect(screen.getByText("Order complete")).toBeInTheDocument();
  });
});

describe("contract with the server-side order view", () => {
  it("renders a view built by buildOrderView without adaptation", () => {
    // If lib/reports/order-view.ts changes shape, this fails here rather than
    // silently rendering blanks on a page a paying customer just landed on.
    const view = buildOrderView({
      email: "jordan@defensecorp.com",
      amount_cents: 49900,
      currency: "usd",
      vertical: "defense",
      status: "paid",
      stripe_session_id: "cs_test_abc123",
      created_at: "2026-08-19T10:00:00.000Z",
    });

    render(<ReceiptPrinter order={view} />);
    expect(screen.getByText(view.reference)).toBeInTheDocument();
    expect(screen.getByText(view.emailMasked)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("jordan@defensecorp.com");
  });
});
