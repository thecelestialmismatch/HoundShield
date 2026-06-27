import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  buildIdentityAnswer,
  isIdentityQuestion,
} from "@/lib/brain-ai/user-context";

describe("isIdentityQuestion", () => {
  it("matches identity questions", () => {
    for (const q of [
      "Who am I?",
      "who am i",
      "What's my name?",
      "what is my company",
      "What's my plan?",
      "do you know who I am",
      "What do you know about me?",
      "am I signed in?",
    ]) {
      expect(isIdentityQuestion(q), q).toBe(true);
    }
  });

  it("ignores unrelated questions", () => {
    for (const q of [
      "What is CMMC Level 2?",
      "How do I install HoundShield?",
      "Who is the assessor for my contract?",
      "",
    ]) {
      expect(isIdentityQuestion(q), q).toBe(false);
    }
  });
});

describe("buildIdentityAnswer", () => {
  it("gives a graceful guest answer with no account details", () => {
    const a = buildIdentityAnswer(null);
    expect(a.toLowerCase()).toContain("guest");
    expect(a.toLowerCase()).toContain("sign in");
  });

  it("identifies a known paying customer by name, company, and plan", () => {
    const a = buildIdentityAnswer({
      name: "Jordan Marsh",
      company: "Vector Defense",
      role: "compliance_manager",
      tier: "pro",
    });
    expect(a).toContain("Jordan");
    expect(a).toContain("Vector Defense");
    expect(a).toContain("pro");
    expect(a).toContain("compliance manager");
  });

  it("never uses markdown symbols", () => {
    const a = buildIdentityAnswer({ name: "Sam", company: "Acme", tier: "growth" });
    expect(a).not.toMatch(/[*#`]|^\s*-\s/m);
  });
});

describe("Brain AI never leaks internal config to customers", () => {
  // The public widget renders these strings — internal env-var / Vercel
  // instructions must never reach a buyer. Guards against regression.
  const sources = [
    "lib/brain-ai/user-context.ts",
    "app/api/chat/route.ts",
  ];
  const FORBIDDEN = [
    "OPENROUTER_API_KEY",
    "NVIDIA_API_KEY",
    "Vercel environment",
    "in your Vercel",
    ".env.local",
  ];

  for (const rel of sources) {
    it(`${rel} ships no leaked config copy in user-facing strings`, () => {
      const root = path.resolve(__dirname, "..", "..", "..");
      const src = readFileSync(path.join(root, rel), "utf8");
      // Strip line comments so we only inspect runtime strings, not docs.
      const runtime = src
        .split("\n")
        .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
        .join("\n");
      for (const bad of FORBIDDEN) {
        expect(runtime.includes(bad), `${rel} leaks "${bad}"`).toBe(false);
      }
    });
  }
});
