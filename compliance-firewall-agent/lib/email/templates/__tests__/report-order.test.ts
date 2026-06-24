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
