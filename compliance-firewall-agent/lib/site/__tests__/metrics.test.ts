import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { PRODUCT_METRICS, NAV_TRUST_BADGE } from "@/lib/site/metrics";

const ROOT = path.resolve(__dirname, "..", "..", "..");

describe("product metrics", () => {
  it("exposes the truthful, verifiable product facts", () => {
    expect(PRODUCT_METRICS.detectionEngines).toBe(16);
    expect(PRODUCT_METRICS.nistControls).toBe(110);
    expect(PRODUCT_METRICS.scanLatencyMs).toBe(10);
  });

  it("builds one consistent nav badge from those facts", () => {
    expect(NAV_TRUST_BADGE).toBe("16 engines · <10ms scan");
  });
});

describe("the nav no longer ships a fabricated live counter", () => {
  // The brand rule: publish no fictional metrics — buyers verify everything.
  // These guard against the old client-incrementing "14,672 intercepted" /
  // "14,312 blocked" counters creeping back in.
  const navs = ["components/layout/NavV3.tsx", "components/Navbar.tsx"];

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
