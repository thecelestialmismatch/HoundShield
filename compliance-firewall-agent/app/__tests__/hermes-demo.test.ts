import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, statSync } from "fs";
import { createHash } from "crypto";
import path from "path";

/**
 * HERMES demo — fidelity contract.
 *
 * public/hermes-demo.html is a BYTE-FOR-BYTE port of
 * HERMES-REDESIGN/houndshield-demo.html. These tests guarantee the served
 * artifact never silently drifts from the source the user signed off on:
 * exact size + sha256, the asset it depends on, the two design directions,
 * every dashboard tab, the Brain AI answer layer, and the clean-URL rewrite.
 */

const CFA_ROOT = path.resolve(__dirname, "../..");
const DEMO = path.join(CFA_ROOT, "public", "hermes-demo.html");

// Locked at port time. Update ONLY when intentionally re-porting the source.
const EXPECTED_BYTES = 120300;
const EXPECTED_SHA256 =
  "b4d6db4a630a820693f57d417d8899d8914df8566f345288e3c11b6692d49f11";

function html(): string {
  return readFileSync(DEMO, "utf8");
}

describe("HERMES demo — byte-for-byte fidelity", () => {
  it("the static artifact exists", () => {
    expect(existsSync(DEMO)).toBe(true);
  });

  it("matches the exact source size", () => {
    expect(statSync(DEMO).size).toBe(EXPECTED_BYTES);
  });

  it("matches the exact source sha256 (no drift)", () => {
    const digest = createHash("sha256").update(readFileSync(DEMO)).digest("hex");
    expect(digest).toBe(EXPECTED_SHA256);
  });
});

describe("HERMES demo — dependency assets present", () => {
  it("references and ships the brand logo it depends on", () => {
    expect(html()).toContain('src="houndshield-logo.png"');
    expect(existsSync(path.join(CFA_ROOT, "public", "houndshield-logo.png"))).toBe(
      true,
    );
  });
});

describe("HERMES demo — both design directions", () => {
  it("ships Direction A (Steel & Cream) and Direction B (Midnight Command)", () => {
    const doc = html();
    expect(doc).toContain('body[data-dir="A"]');
    expect(doc).toContain('body[data-dir="B"]');
    expect(doc).toContain("A · Steel &amp; Cream");
    expect(doc).toContain("B · Midnight Command");
  });
});

describe("HERMES demo — full live dashboard", () => {
  it("ships every command-center tab", () => {
    const doc = html();
    for (const tab of [
      'data-tab="overview"',
      'data-tab="feed"',
      'data-tab="assess"',
      'data-tab="reports"',
      'data-tab="brain"',
      'data-tab="settings"',
    ]) {
      expect(doc).toContain(tab);
    }
  });

  it("ships the live throughput chart, SPRS ring and threat feed", () => {
    const doc = html();
    expect(doc).toContain('id="liveChart"');
    expect(doc).toContain('class="ring"');
    expect(doc).toContain('id="feedFull"');
    expect(doc).toContain('id="feedMini"');
  });

  it("ships the on-device Brain AI answer layer", () => {
    const doc = html();
    expect(doc).toContain('id="brainInput"');
    expect(doc).toContain("on-device compliance analyst");
    expect(doc).toContain("DFARS 252.204-7012");
  });
});

describe("HERMES demo — every product + answer view ported", () => {
  it("ships all six industry product views", () => {
    const doc = html();
    for (const view of [
      'data-view="prod-technology"',
      'data-view="prod-healthcare"',
      'data-view="prod-defense"',
      'data-view="prod-legal"',
      'data-view="prod-global"',
      'data-view="prod-government"',
    ]) {
      expect(doc).toContain(view);
    }
  });

  it("ships the marketing surface (home, how, features, pricing, docs, partners)", () => {
    const doc = html();
    for (const view of [
      'data-view="home"',
      'data-view="how"',
      'data-view="features"',
      'data-view="pricing"',
      'data-view="docs"',
      'data-view="partners"',
    ]) {
      expect(doc).toContain(view);
    }
  });
});

describe("HERMES demo — clean-URL rewrite wired", () => {
  it("next.config.js rewrites /hermes to the static artifact", () => {
    const cfg = readFileSync(path.join(CFA_ROOT, "next.config.js"), "utf8");
    expect(cfg).toContain("/hermes-demo.html");
    expect(cfg).toMatch(/source:\s*['"]\/hermes['"]/);
  });
});
