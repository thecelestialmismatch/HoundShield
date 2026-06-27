import { describe, it, expect } from "vitest";
import { buildDashboardViewer, initialsFrom } from "@/lib/auth/dashboard-viewer";

describe("initialsFrom", () => {
  it("takes first+last initials of a multi-word name", () => {
    expect(initialsFrom("Vector Defense")).toBe("VD");
    expect(initialsFrom("Jordan A Marsh")).toBe("JM");
  });
  it("takes the first two letters of a single word", () => {
    expect(initialsFrom("Jordan")).toBe("JO");
  });
  it("returns empty for blank input", () => {
    expect(initialsFrom("   ")).toBe("");
  });
});

describe("buildDashboardViewer", () => {
  it("prefers company, maps the tier to a plan label, derives initials", () => {
    expect(
      buildDashboardViewer({ company: "Vector Defense", full_name: "Jordan Marsh", tier: "pro" }),
    ).toEqual({ company: "Vector Defense", plan: "Pro", initials: "VD" });
  });

  it("falls back to the user's name when there is no company", () => {
    expect(
      buildDashboardViewer({ company: null, full_name: "Jordan Marsh", tier: "growth" }),
    ).toEqual({ company: "Jordan Marsh", plan: "Growth", initials: "JM" });
  });

  it("defaults an unknown/empty tier to Free", () => {
    expect(buildDashboardViewer({ company: "Acme", tier: null })?.plan).toBe("Free");
  });

  it("returns null when nothing identifies the user (sample org shown instead)", () => {
    expect(buildDashboardViewer(null)).toBeNull();
    expect(buildDashboardViewer({ company: "", full_name: "", tier: "pro" })).toBeNull();
  });
});
