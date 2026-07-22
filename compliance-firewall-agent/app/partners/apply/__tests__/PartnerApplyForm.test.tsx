import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { PartnerApplyForm } from "../PartnerApplyForm";

/**
 * The RPO/MSP application form is the caller the /api/partners/apply route
 * never had. These tests pin the two things that matter:
 *   1) it makes a REAL request with the backend's exact payload shape, and
 *   2) it obeys the honesty contract (tasks/lessons.md 2026-07-12) — success
 *      only on res.ok, and an honest direct-email fallback on any failure,
 *      never a fake success that shreds a partner lead.
 */

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /submit application/i }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PartnerApplyForm — validation", () => {
  it("blocks submission and shows errors when required fields are empty", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerApplyForm />);
    submit();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/your name is required/i)).toBeTruthy();
    expect(screen.getByText(/company is required/i)).toBeTruthy();
    expect(screen.getByText(/work email is required/i)).toBeTruthy();
  });

  it("rejects an invalid email without firing a request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerApplyForm />);
    fill(/your name/i, "Jane Smith");
    fill(/company/i, "Summit Compliance");
    fill(/work email/i, "not-an-email");
    submit();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/valid email/i)).toBeTruthy();
  });

  it("rejects a non-numeric client count", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerApplyForm />);
    fill(/your name/i, "Jane Smith");
    fill(/company/i, "Summit Compliance");
    fill(/work email/i, "jane@summit.com");
    fill(/clients you serve/i, "lots");
    submit();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/whole number/i)).toBeTruthy();
  });
});

describe("PartnerApplyForm — real request with the route's payload shape", () => {
  it("POSTs to /api/partners/apply with the exact fields the route expects", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerApplyForm />);
    fill(/your name/i, "Jane Smith");
    fill(/company/i, "Summit Compliance LLC");
    fill(/work email/i, "jane@summit.com");
    fireEvent.change(screen.getByLabelText(/partner type/i), { target: { value: "reseller" } });
    fill(/clients you serve/i, "25");
    fill(/anything else/i, "We serve defense contractors.");
    submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/partners/apply");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      name: "Jane Smith",
      company: "Summit Compliance LLC",
      email: "jane@summit.com",
      partnerType: "reseller",
      clientCount: 25,
      message: "We serve defense contractors.",
    });
    // clientCount is sent as a real number, not a string.
    expect(typeof body.clientCount).toBe("number");
  });

  it("omits clientCount when the field is left blank (route defaults it to 0)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerApplyForm />);
    fill(/your name/i, "Jane Smith");
    fill(/company/i, "Summit Compliance LLC");
    fill(/work email/i, "jane@summit.com");
    submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("clientCount");
    // message omitted (undefined) rather than an empty string.
    expect(body).not.toHaveProperty("message");
  });
});

describe("PartnerApplyForm — honesty contract", () => {
  it("shows the confirmation state only on res.ok && success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerApplyForm />);
    fill(/your name/i, "Jane Smith");
    fill(/company/i, "Summit Compliance LLC");
    fill(/work email/i, "jane@summit.com");
    submit();

    expect(await screen.findByText(/application received/i)).toBeTruthy();
  });

  it("degrades to a direct email and NEVER fakes success on a non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "boom" }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerApplyForm />);
    fill(/your name/i, "Jane Smith");
    fill(/company/i, "Summit Compliance LLC");
    fill(/work email/i, "jane@summit.com");
    submit();

    const alert = await screen.findByText(/contact@houndshield\.com/i);
    expect(alert).toBeTruthy();
    // The success state must NOT have rendered.
    expect(screen.queryByText(/application received/i)).toBeNull();
  });

  it("degrades to a direct email on a network throw", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    render(<PartnerApplyForm />);
    fill(/your name/i, "Jane Smith");
    fill(/company/i, "Summit Compliance LLC");
    fill(/work email/i, "jane@summit.com");
    submit();

    expect(await screen.findByText(/contact@houndshield\.com/i)).toBeTruthy();
    expect(screen.queryByText(/application received/i)).toBeNull();
  });
});

describe("PartnerApplyForm — channel doctrine", () => {
  it("states the C3PAO exclusion (32 CFR Part 170)", () => {
    render(<PartnerApplyForm />);
    expect(screen.getByText(/C3PAOs are not eligible/i)).toBeTruthy();
    expect(screen.getByText(/32 CFR Part 170/i)).toBeTruthy();
  });
});
