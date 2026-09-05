import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { PRODUCT_METRICS, NAV_TRUST_BADGE } from "@/lib/site/metrics";
import { ENGINE_COUNT } from "@/lib/detection/engines";

const ROOT = path.resolve(__dirname, "..", "..", "..");

describe("product metrics", () => {
  it("exposes the truthful, verifiable product facts", () => {
    expect(PRODUCT_METRICS.detectionEngines).toBe(16);
    expect(PRODUCT_METRICS.nistControls).toBe(110);
    expect(PRODUCT_METRICS.scanLatencyMs).toBe(10);
  });

  it("agrees with the computed engine list, so the two cannot drift apart", () => {
    /*
     * Two independent sources state the engine count: this hardcoded
     * constant (used by the nav badge and /about) and ENGINE_COUNT, which
     * is derived from the shipped ENGINES array. Both said 16, but nothing
     * connected them — adding a 17th engine would have moved one and left
     * the other quietly lying. This is the link.
     */
    expect(PRODUCT_METRICS.detectionEngines).toBe(ENGINE_COUNT);
  });

  it("builds one consistent nav badge from those facts", () => {
    expect(NAV_TRUST_BADGE).toBe("16 engines · <10ms scan");
  });
});

describe("the nav no longer ships a fabricated live counter", () => {
  // The brand rule: publish no fictional metrics — buyers verify everything.
  // These guard against the old client-incrementing "14,672 intercepted" /
  // "14,312 blocked" counters creeping back in.
  // `components/Navbar.tsx` was also checked here until 2026-09-03. It was
  // superseded by NavV3 (44 call sites vs none) and kept alive only by its own
  // test, so it was deleted. NavV3 is the shipped nav and the only one a
  // fabricated counter could reach a buyer through.
  const navs = ["components/layout/NavV3.tsx"];

  for (const rel of navs) {
    it(`${rel} has no fabricated counter`, () => {
      const src = readFileSync(path.join(ROOT, rel), "utf8");
      expect(src).not.toContain("14672");
      expect(src).not.toContain("14_312");
      expect(src).not.toMatch(/setCount/);
      expect(src).toContain("NAV_TRUST_BADGE");
    });
  }
});
