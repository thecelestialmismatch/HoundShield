import { describe, it, expect, afterEach } from "vitest";
import { isCloudAssistEnabled } from "../cloud-assist";

/**
 * C6 guard: cloud classifier egress (Gemini/Anthropic) must be OFF unless
 * explicitly opted in. This is the single choke point both isGeminiConfigured
 * and isAdvisorConfigured depend on, so verifying it here proves prompt text
 * cannot leave the boundary by default.
 */
describe("isCloudAssistEnabled", () => {
  const original = process.env.HOUNDSHIELD_CLOUD_ASSIST;
  afterEach(() => {
    if (original === undefined) delete process.env.HOUNDSHIELD_CLOUD_ASSIST;
    else process.env.HOUNDSHIELD_CLOUD_ASSIST = original;
  });

  it("is OFF by default (env unset)", () => {
    delete process.env.HOUNDSHIELD_CLOUD_ASSIST;
    expect(isCloudAssistEnabled()).toBe(false);
  });

  it("stays OFF for falsey / unrelated values", () => {
    for (const v of ["", "0", "false", "no", "off", "  "]) {
      process.env.HOUNDSHIELD_CLOUD_ASSIST = v;
      expect(isCloudAssistEnabled()).toBe(false);
    }
  });

  it("turns ON only for explicit opt-in tokens", () => {
    for (const v of ["1", "true", "TRUE", "yes", " Yes "]) {
      process.env.HOUNDSHIELD_CLOUD_ASSIST = v;
      expect(isCloudAssistEnabled()).toBe(true);
    }
  });
});
