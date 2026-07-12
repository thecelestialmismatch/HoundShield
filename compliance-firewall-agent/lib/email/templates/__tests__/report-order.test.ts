import { reportOrderEmail } from "../report-order";

describe("reportOrderEmail", () => {
  it("has the correct from address", () => {
    expect(reportOrderEmail.from).toBe("HoundShield <noreply@houndshield.com>");
  });

  it("subject names the report", () => {
    expect(reportOrderEmail.subject).toMatch(/CMMC AI Risk Assessment Report/i);
  });

  it("confirms the $499 charge", () => {
    const html = reportOrderEmail.html("Jordan");
    expect(html).toContain("$499");
    expect(html).toMatch(/paid in full/i);
  });

  it("interpolates the buyer name", () => {
    expect(reportOrderEmail.html("Rachel Healthcare")).toContain("Rachel Healthcare");
  });

  it("falls back gracefully when name is empty", () => {
    const html = reportOrderEmail.html("");
    expect(html).toContain("there");
  });

  it("carries the Mode-B / CUI disclosure (not FedRAMP-authorized)", () => {
    const html = reportOrderEmail.html("Jordan");
    expect(html).toMatch(/Mode B/);
    expect(html).toMatch(/not FedRAMP-authorized/i);
    expect(html).toMatch(/CUI/);
  });

  it("points to the 14-day engagement and NIST 800-171", () => {
    const html = reportOrderEmail.html("Jordan");
    expect(html).toMatch(/14[- ]day/i);
    expect(html).toMatch(/NIST 800-171/);
  });
});

describe("reportOrderEmail.founderAlert", () => {
  it("uses the HoundShield from address", () => {
    const a = reportOrderEmail.founderAlert({ email: "jane@acme.com" });
    expect(a.from).toBe("HoundShield <noreply@houndshield.com>");
  });

  it("subject shows the money and the buyer email", () => {
    const a = reportOrderEmail.founderAlert({ email: "jane@acme.com", amountCents: 49900 });
    expect(a.subject).toContain("$499");
    expect(a.subject).toContain("jane@acme.com");
    expect(a.subject).toMatch(/sold/i);
  });

  it("defaults to $499 retail when no amount is given", () => {
    const a = reportOrderEmail.founderAlert({ email: "jane@acme.com" });
    expect(a.subject).toContain("$499");
    expect(a.html).toMatch(/retail/i);
  });

  it("flags a wholesale ($299 co-brand) sale", () => {
    const a = reportOrderEmail.founderAlert({
      email: "rpo@summit7.com",
      isWholesale: true,
      amountCents: 29900,
    });
    expect(a.subject).toContain("$299");
    expect(a.html).toMatch(/wholesale/i);
    expect(a.html).toMatch(/co-brand/i);
  });

  it("derives the dollar amount from amountCents over the retail/wholesale default", () => {
    const a = reportOrderEmail.founderAlert({ email: "jane@acme.com", amountCents: 39900 });
    expect(a.subject).toContain("$399");
  });

  it("includes buyer, vertical, and the fulfillment next-step", () => {
    const a = reportOrderEmail.founderAlert({
      email: "rachel@clinic.com",
      name: "Rachel H",
      vertical: "healthcare",
    });
    expect(a.html).toContain("rachel@clinic.com");
    expect(a.html).toContain("Rachel H");
    expect(a.html).toContain("healthcare");
    expect(a.html).toMatch(/14-day/i);
    expect(a.html).toMatch(/report_orders/);
    expect(a.html).toMatch(/fulfill/i);
  });

  it("shows 'unspecified' when no vertical is provided", () => {
    const a = reportOrderEmail.founderAlert({ email: "jane@acme.com" });
    expect(a.html).toMatch(/unspecified/i);
  });

  it("HTML-escapes an untrusted buyer name (no raw script tag)", () => {
    const a = reportOrderEmail.founderAlert({
      email: "x@y.com",
      name: "<script>alert(1)</script>",
    });
    expect(a.html).not.toContain("<script>alert(1)</script>");
    expect(a.html).toContain("&lt;script&gt;");
  });
});
