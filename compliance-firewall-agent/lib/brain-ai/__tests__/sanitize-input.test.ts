import { describe, it, expect } from "vitest";
import { sanitizeChatInput } from "../sanitize-input";

describe("sanitizeChatInput", () => {
  it("removes script blocks", () => {
    expect(sanitizeChatInput("Hi <script>alert(1)</script> there")).toBe("Hi  there");
  });

  it("strips HTML tags but keeps the words", () => {
    expect(sanitizeChatInput("What is <b>CMMC</b> Level 2?")).toBe("What is CMMC Level 2?");
  });

  it("removes stray angle brackets", () => {
    expect(sanitizeChatInput("a < b and c > d")).toBe("a  b and c  d");
  });

  it("caps length at 4000 chars", () => {
    expect(sanitizeChatInput("x".repeat(5000)).length).toBe(4000);
  });

  it("leaves normal compliance questions untouched", () => {
    const q = "Does pasting CUI into ChatGPT violate DFARS 252.204-7012?";
    expect(sanitizeChatInput(q)).toBe(q);
  });

  it("handles empty/falsey input", () => {
    expect(sanitizeChatInput("")).toBe("");
  });
});
