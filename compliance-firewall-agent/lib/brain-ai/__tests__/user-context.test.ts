import { describe, it, expect } from "vitest";
import { buildUserContextPrompt } from "../user-context";

describe("buildUserContextPrompt", () => {
  it("returns empty for null/undefined", () => {
    expect(buildUserContextPrompt(null)).toBe("");
    expect(buildUserContextPrompt(undefined)).toBe("");
  });

  it("returns empty when nothing identifying is known", () => {
    expect(buildUserContextPrompt({ tier: "free" })).toBe("");
    expect(buildUserContextPrompt({ name: "", company: "", role: null })).toBe("");
  });

  it("uses the first name only and asks Brain to address them", () => {
    const out = buildUserContextPrompt({ name: "Rachel Hernandez", role: "compliance_manager" });
    expect(out).toContain("Rachel");
    expect(out).not.toContain("Hernandez");
    expect(out).toContain("a compliance manager");
    expect(out).toContain("Address them by their first name");
  });

  it("includes company when present", () => {
    expect(buildUserContextPrompt({ name: "Jordan", company: "Acme Defense" })).toContain(
      "at Acme Defense",
    );
  });

  it("flags paying customers by tier, but not free", () => {
    expect(buildUserContextPrompt({ name: "Jordan", tier: "pro" })).toContain("on the pro plan");
    expect(buildUserContextPrompt({ name: "Jordan", tier: "free" })).not.toContain("plan");
  });

  it("falls back gracefully when only a company is known", () => {
    const out = buildUserContextPrompt({ company: "Acme" });
    expect(out).toContain("signed-in customer");
    expect(out).toContain("at Acme");
  });

  it("maps unknown roles to no role clause without breaking", () => {
    const out = buildUserContextPrompt({ name: "Sam", role: "wizard" });
    expect(out).toContain("Sam");
    expect(out).not.toContain("undefined");
  });
});
