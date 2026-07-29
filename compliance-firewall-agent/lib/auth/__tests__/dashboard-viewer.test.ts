import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildDashboardViewer, initialsFrom, firstNameFrom } from "@/lib/auth/dashboard-viewer";

// Founder access is env-only (nothing personal committed to this public repo), so
// these tests must configure the identity they assert on.
const TEST_FOUNDER_EMAIL = 'founder@houndshield.com';
beforeEach(() => {
  process.env.FOUNDER_EMAIL = TEST_FOUNDER_EMAIL;
});
afterEach(() => {
  delete process.env.FOUNDER_EMAIL;
});


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
  const session = { email: "founder@houndshield.com", name: "Founder" };

  it("founder resolves to the top tier with the Founder plan label, whatever the profile says", () => {
    const v = buildDashboardViewer({ company: "HoundShield", full_name: "Founder", tier: "free" }, session);
    expect(v).toMatchObject({
      company: "HoundShield",
      tier: "agency",
      plan: "Founder",
      isFounder: true,
      firstName: "Founder",
    });
  });

  it("founder gets a viewer even with NO profile row (fresh sign-in)", () => {
    const v = buildDashboardViewer(null, session);
    expect(v?.isFounder).toBe(true);
    expect(v?.tier).toBe("agency");
    expect(v?.plan).toBe("Founder");
    expect(v?.company).toBe("Founder");
  });

  it("founder with no profile AND no session name falls back to the email local part", () => {
    const v = buildDashboardViewer(null, { email: "founder@houndshield.com" });
    expect(v?.isFounder).toBe(true);
    // Local part of the email, verbatim — no capitalisation applied.
    expect(v?.company).toBe("founder");
  });

  it("a non-founder session never gets the founder treatment", () => {
    const v = buildDashboardViewer({ company: "Acme", tier: "free" }, { email: "jordan@acme.com" });
    expect(v?.tier).toBe("free");
    expect(v?.plan).toBe("Free");
    expect(v).not.toHaveProperty("isFounder");
  });
});
