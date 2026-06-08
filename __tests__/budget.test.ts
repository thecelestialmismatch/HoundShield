import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPeriodStart } from "@/lib/budget/enforce";

// getPeriodStart is pure — no mocks needed
describe("getPeriodStart", () => {
  beforeEach(() => {
    // Fix time to 2026-05-16 14:30:00 UTC for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-16T14:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("daily — returns start of today (UTC)", () => {
    const start = getPeriodStart("daily");
    expect(start.getUTCDate()).toBe(16);
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);
    expect(start.getUTCSeconds()).toBe(0);
  });

  it("monthly — returns first of current month (UTC)", () => {
    const start = getPeriodStart("monthly");
    expect(start.getUTCFullYear()).toBe(2026);
    expect(start.getUTCMonth()).toBe(4); // May = 4 (0-indexed)
    expect(start.getUTCDate()).toBe(1);
    expect(start.getUTCHours()).toBe(0);
  });

  it("weekly — returns most recent Sunday (UTC)", () => {
    // 2026-05-16 UTC is a Saturday (day 6), so Sunday is 2026-05-10 UTC
    const start = getPeriodStart("weekly");
    expect(start.getUTCDay()).toBe(0); // Sunday
    expect(start.getUTCDate()).toBe(10);
  });

  it("unknown period defaults to monthly", () => {
    const start = getPeriodStart("quarterly"); // unsupported
    // Should default to monthly behaviour (same as monthly)
    const monthly = getPeriodStart("monthly");
    expect(start.getTime()).toBe(monthly.getTime());
  });

  it("period start is always in the past relative to now", () => {
    for (const period of ["daily", "weekly", "monthly"]) {
      const start = getPeriodStart(period);
      expect(start.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });
});

// Slack alert — pure function, test message content
describe("sendBudgetAlert", () => {
  it("does not throw when no webhook URL is configured", async () => {
    const { sendBudgetAlert } = await import("@/lib/alerts/slack");
    // Pass null webhook URL — should silently no-op
    await expect(
      sendBudgetAlert(null, {
        orgName: "ACME Corp",
        orgId: "org-123",
        usedUsd: 1600,
        limitUsd: 2000,
        pctUsed: 80,
        period: "monthly",
        scopeType: "org",
        scopeId: "*",
      }, "warning")
    ).resolves.toBeUndefined();
  });

  it("does not throw when fetch fails", async () => {
    const { sendBudgetAlert } = await import("@/lib/alerts/slack");
    // Provide a bad URL — fetch will fail, function must not propagate
    await expect(
      sendBudgetAlert("https://hooks.slack.com/invalid-test-url", {
        orgName: "Test Org",
        orgId: "org-456",
        usedUsd: 2000,
        limitUsd: 2000,
        pctUsed: 100,
        period: "monthly",
        scopeType: "org",
        scopeId: "*",
      }, "critical")
    ).resolves.toBeUndefined();
  });
});
