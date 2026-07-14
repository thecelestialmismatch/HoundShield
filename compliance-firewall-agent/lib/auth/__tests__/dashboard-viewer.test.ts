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

  it("falls back to the session name when the profile row has no name yet", () => {
    const v = buildDashboardViewer({ company: null, full_name: null, tier: "pro" }, {
      email: "jordan@vector.com",
      name: "Jordan Marsh",
    });
    expect(v?.company).toBe("Jordan Marsh");
    expect(v?.firstName).toBe("Jordan");
    expect(v?.tier).toBe("pro");
    expect(v).not.toHaveProperty("isFounder");
  });
});

describe("buildDashboardViewer — founder access (full access, no payment)", () => {
  const session = { email: "gaurav@houndshield.com", name: "Gaurav" };

  it("founder resolves to the top tier with the Founder plan label, whatever the profile says", () => {
    const v = buildDashboardViewer({ company: "HoundShield", full_name: "Gaurav", tier: "free" }, session);
    expect(v).toMatchObject({
      company: "HoundShield",
      tier: "agency",
      plan: "Founder",
      isFounder: true,
      firstName: "Gaurav",
    });
  });

  it("founder gets a viewer even with NO profile row (fresh sign-in)", () => {
    const v = buildDashboardViewer(null, session);
    expect(v?.isFounder).toBe(true);
    expect(v?.tier).toBe("agency");
    expect(v?.plan).toBe("Founder");
    expect(v?.company).toBe("Gaurav");
  });

  it("founder with no profile AND no session name falls back to the email local part", () => {
    const v = buildDashboardViewer(null, { email: "Gaurav@HoundShield.com" });
    expect(v?.isFounder).toBe(true);
    expect(v?.company).toBe("Gaurav");
  });

  it("a non-founder session never gets the founder treatment", () => {
    const v = buildDashboardViewer({ company: "Acme", tier: "free" }, { email: "jordan@acme.com" });
    expect(v?.tier).toBe("free");
    expect(v?.plan).toBe("Free");
    expect(v).not.toHaveProperty("isFounder");
  });
});
