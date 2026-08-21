import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSave } = vi.hoisted(() => ({ mockSave: vi.fn() }));
vi.mock("@/lib/reports/download", () => ({
  saveComplianceReport: mockSave,
}));
// ReportCheckoutButton pulls next/navigation's router — stub it for jsdom.
vi.mock("@/components/ReportCheckoutButton", () => ({
  ReportCheckoutButton: ({ label }: { label?: string }) => (
    <button type="button">{label ?? "Get your $499 report"}</button>
  ),
}));

import { InstantSnapshot } from "../InstantSnapshot";

beforeEach(() => {
  mockSave.mockClear();
});

function loadExampleAndScan(): void {
  fireEvent.click(screen.getByText("Load an example"));
  fireEvent.click(screen.getByRole("button", { name: /scan locally/i }));
}

describe("InstantSnapshot — the money-path climax", () => {
  it("states the local-only boundary up front", () => {
    render(<InstantSnapshot />);
    expect(
      screen.getByText(/never sent anywhere/i)
    ).toBeTruthy();
  });

  it("scans locally and surfaces NIST-mapped findings (no raw content shown)", () => {
    render(<InstantSnapshot />);
    loadExampleAndScan();

    // Findings surface with a control id and severity, but not the matched strings.
    expect(screen.getAllByText("SC.L2-3.13.1").length).toBeGreaterThan(0);
    const region = screen.getByText(/finding type/i).closest("div")!.parentElement!;
    expect(region.textContent).not.toContain("123-45-6789");
    expect(region.textContent).not.toContain("AKIA1234567890ABCD12");
    expect(region.textContent).not.toContain("John Smith");
  });

  it("does not hand over a downloadable report — the full report is locked behind $499", () => {
    render(<InstantSnapshot />);
    loadExampleAndScan();

    // The free give-away download is gone; nothing is saved to the device.
    expect(screen.queryByRole("button", { name: /generate my gap-report pdf/i })).toBeNull();
    expect(mockSave).not.toHaveBeenCalled();

    // Instead the full report is shown locked, with a single $499 unlock CTA.
    expect(screen.getByText(/your full cmmc ai risk assessment report/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /unlock the full report/i })).toBeTruthy();
  });

  it("frames the on-screen report as a preview, not the signed assessment", () => {
    render(<InstantSnapshot />);
    loadExampleAndScan();
    expect(screen.getByText(/not the tamper-evident 14-day signed report/i)).toBeTruthy();
    expect(screen.getByText(/your full cmmc ai risk assessment report/i)).toBeTruthy();
  });

  it("lead capture posts counts only — never the pasted text", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
    try {
      render(<InstantSnapshot />);
      loadExampleAndScan();

      const form = screen.getByText(/Email me this snapshot/i).closest("form")!;
      fireEvent.change(within(form).getByPlaceholderText("Name"), { target: { value: "Jane" } });
      fireEvent.change(within(form).getByPlaceholderText("Work email"), {
        target: { value: "jane@acme.com" },
      });
      fireEvent.click(within(form).getByRole("button", { name: /email me the snapshot/i }));

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("/api/report/snapshot-lead");
      const body = JSON.parse(init.body);
      expect(body).toHaveProperty("criticalCount");
      expect(body).not.toHaveProperty("inputText");
      expect(init.body).not.toContain("123-45-6789");
      expect(init.body).not.toContain("AKIA1234567890ABCD12");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
