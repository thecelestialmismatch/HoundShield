import { describe, it, expect } from "vitest";
import { findFaqAnswer } from "../faq";
import { cleanAnswer } from "../format-answer";

/** Strings that must never appear in any user-facing answer. */
const INTERNAL_LEAKS = [
  "OPENROUTER_API_KEY",
  "NVIDIA_API_KEY",
  "OPENROUTER",
  "Vercel",
  "environment variable",
  "env var",
];

describe("findFaqAnswer — conversational check-ins", () => {
  it("answers 'how are you?' warmly without an LLM key", () => {
    const answer = findFaqAnswer("how are you?");
    expect(answer).not.toBeNull();
    expect(answer!.toLowerCase()).toContain("great");
  });

  it("answers 'how am i?' instead of dropping to a robotic fallback", () => {
    const answer = findFaqAnswer("how am i?");
    expect(answer).not.toBeNull();
    expect(answer!.toLowerCase()).toContain("brain ai");
  });

  it("handles casual variants ('what's up', 'how's it going')", () => {
    expect(findFaqAnswer("what's up")).not.toBeNull();
    expect(findFaqAnswer("how's it going")).not.toBeNull();
  });

  it("responds to thanks like a person", () => {
    const answer = findFaqAnswer("thanks!");
    expect(answer).not.toBeNull();
    expect(answer!.toLowerCase()).toContain("welcome");
  });
});

describe("findFaqAnswer — never leaks internal config", () => {
  const probes = [
    "how are you?",
    "how am i?",
    "thanks",
    "what is houndshield",
    "how do i install",
    "what's the pricing",
    "tell me about cmmc",
    "who are you",
  ];

  it("no answer mentions env-var names or the hosting provider", () => {
    for (const probe of probes) {
      const answer = findFaqAnswer(probe);
      if (!answer) continue;
      for (const leak of INTERNAL_LEAKS) {
        expect(answer.includes(leak)).toBe(false);
      }
    }
  });

  it("conversational answers are clean prose after sanitization (no stray markdown bullets)", () => {
    const answer = cleanAnswer(findFaqAnswer("how are you?")!);
    expect(answer).not.toMatch(/^\s*[-*]\s/m); // no markdown bullets
    expect(answer).not.toContain("**"); // no bold markers
  });
});

describe("findFaqAnswer — 'help me…' asks NEVER get the contact-info dump (prod regression)", () => {
  // Exact queries from the 2026-07 live transcript that misfired to "Get in touch:".
  const misfires = [
    "can you help me to fix this issue?",
    "help me to build the ai bot",
    "help me to build the abs system",
  ];

  it("never answers a help/build ask with the contact dump", () => {
    for (const q of misfires) {
      const answer = findFaqAnswer(q);
      expect(answer, q).not.toBeNull();
      expect(answer!, q).not.toContain("Get in touch");
      expect(answer!, q).not.toContain("typically respond same day");
    }
  });

  it("'can you help me to fix this issue?' triages the problem", () => {
    const answer = findFaqAnswer("can you help me to fix this issue?")!;
    expect(answer.toLowerCase()).toContain("what's going wrong");
  });

  it("'what issue I have?' asks for the problem instead of a canned dump", () => {
    const answer = findFaqAnswer("what issue I have?");
    expect(answer).not.toBeNull();
    expect(answer!).not.toContain("Get in touch");
  });

  it("build-a-bot asks get the compliance-gateway pivot with a code sample", () => {
    for (const q of ["help me to build the ai bot", "help me to build the abs system", "coading?"]) {
      const answer = findFaqAnswer(q);
      expect(answer, q).not.toBeNull();
      expect(answer!, q).toContain("proxy.houndshield.com/v1");
    }
  });

  it("specific product questions still outrank the help triage (two-tier)", () => {
    const answer = findFaqAnswer("help me install houndshield")!;
    expect(answer).toContain("gateway.houndshield.com");
    expect(answer).not.toContain("what's going wrong");
  })

  it("real contact intent still reaches the contact answer", () => {
    const answer = findFaqAnswer("how do I contact sales?")!;
    expect(answer).toContain("info@houndshield.com");
  });

  it("word boundaries: 'vs'/'pro' no longer fire inside other words", () => {
    // "canvas" must not trigger the competitor-comparison entry via "vs"
    expect(findFaqAnswer("I love canvas art and painting")).toBeNull();
    // "problem" must not trigger pricing via "pro" — it triages instead
    const answer = findFaqAnswer("I have a problem");
    expect(answer === null || !answer.includes("$199")).toBe(true);
  });
});

describe("findFaqAnswer — compliance questions still outrank chit-chat", () => {
  it("'how does CMMC work' routes to the CMMC answer, not the check-in", () => {
    const answer = findFaqAnswer("how does cmmc level 2 work");
    expect(answer).not.toBeNull();
    expect(answer!.toLowerCase()).toContain("110");
  });

  it("'how do I install' routes to a product answer, not the check-in", () => {
    const answer = findFaqAnswer("how do i install houndshield");
    expect(answer).not.toBeNull();
    // Mentions the gateway URL change — not the chit-chat reply.
    expect(answer!.toLowerCase()).toContain("gateway.houndshield.com");
    expect(answer!.toLowerCase()).not.toContain("thanks for asking");
  });
});
