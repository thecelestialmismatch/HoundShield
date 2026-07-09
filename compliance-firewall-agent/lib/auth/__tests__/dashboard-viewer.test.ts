import { describe, it, expect } from "vitest";
import { buildDashboardViewer, initialsFrom, firstNameFrom } from "@/lib/auth/dashboard-viewer";

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

describe("firstNameFrom", () => {
  it("pulls the first token of a full name", () => {
    expect(firstNameFrom("Jordan Marsh")).toBe("Jordan");
    expect(firstNameFrom("  Rachel  H──  ")).toBe("Rachel");
  });
  it("is empty for blank/nullish", () => {
    expect(firstNameFrom(null)).toBe("");
    expect(firstNameFrom("   ")).toBe("");
  });
});

describe("buildDashboardViewer", () => {
  it("prefers company, maps the tier to a plan label, derives initials + firstName + slug", () => {
    expect(
      buildDashboardViewer({ company: "Vector Defense", full_name: "Jordan Marsh", tier: "pro" }),
    ).toEqual({
      company: "Vector Defense",
      tier: "pro",
      plan: "Pro",
      initials: "VD",
      firstName: "Jordan",
    });
  });

  it("falls back to the user's name when there is no company", () => {
    expect(
      buildDashboardViewer({ company: null, full_name: "Jordan Marsh", tier: "growth" }),
    ).toEqual({
      company: "Jordan Marsh",
      tier: "growth",
      plan: "Growth",
      initials: "JM",
      firstName: "Jordan",
    });
  });

  it("omits firstName when the profile has no personal name", () => {
    const v = buildDashboardViewer({ company: "Acme", tier: "pro" });
    expect(v).not.toHaveProperty("firstName");
    expect(v?.tier).toBe("pro");
  });

  it("defaults an unknown/empty tier to Free (slug + label)", () => {
    const v = buildDashboardViewer({ company: "Acme", tier: null });
    expect(v?.plan).toBe("Free");
    expect(v?.tier).toBe("free");
  });

  it("returns null when nothing identifies the user (sample org shown instead)", () => {
    expect(buildDashboardViewer(null)).toBeNull();
    expect(buildDashboardViewer({ company: "", full_name: "", tier: "pro" })).toBeNull();
  });
});
