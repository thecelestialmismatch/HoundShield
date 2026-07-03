import { describe, it, expect } from "vitest";
import { hashApiKey, generateApiKey } from "../api-key";

/**
 * C2 support: keys are stored only as SHA-256 hashes, and generated keys carry
 * a stable prefix for display. (resolveApiKey's DB path is covered by the
 * route-level integration checks; here we lock down the pure crypto helpers.)
 */
describe("api-key helpers", () => {
  it("hashes deterministically to a 64-char hex digest", () => {
    const h1 = hashApiKey("hs_live_abc");
    const h2 = hashApiKey("hs_live_abc");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(hashApiKey("hs_live_xyz")).not.toBe(h1);
  });

  it("generates a prefixed key whose hash matches the raw key", () => {
    const { rawKey, keyHash, keyPrefix } = generateApiKey();
    expect(rawKey.startsWith("hs_live_")).toBe(true);
    expect(keyHash).toBe(hashApiKey(rawKey));
    expect(keyPrefix.startsWith("hs_live_")).toBe(true);
    // Two generations are unique.
    expect(generateApiKey().rawKey).not.toBe(rawKey);
  });
});
