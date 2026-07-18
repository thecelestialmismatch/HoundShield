import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * AURORA dashboard + hero redesign contract (2026-07-18, founder-directed).
 *
 * The founder pointed at a soft, clean, "eye-soothing" reference dashboard and
 * asked for BOTH the marketing hero window and the after-login console to share
 * that look: a cool slate-blue → pale-sage gradient stage, glass panels, and a
 * pastel lime / peach / periwinkle accent set. These tests pin the redesign so
 * it can't silently drift back to the old dark hero / flat console:
 *
 *  1. The aurora tokens are defined ONCE in globals.css and reused by both
 *     surfaces (the "same family, both sides" requirement).
 *  2. The marketing hero SECTION sits on the aurora gradient.
 *  3. The hero DEMO window is the new light skin (no leftover dark palette),
 *     with the SubTracker-style chrome the founder liked.
 *  4. The console shares the same aurora gradient + pastel data-viz.
 */

const CFA = path.resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(path.join(CFA, rel), "utf8");

describe("aurora tokens — one source of truth in globals.css", () => {
  const g = read("app/globals.css");
  it("defines the shared aurora gradient + pastel accent set", () => {
    expect(g).toMatch(/--hs-aurora-bg:\s*linear-gradient/);
    expect(g).toMatch(/--hs-aurora-1:/);
    expect(g).toMatch(/--hs-lime:/);
    expect(g).toMatch(/--hs-peach:/);
    expect(g).toMatch(/--hs-peri:/);
    expect(g).toMatch(/--hs-action:/);
  });
});

describe("marketing hero section — sits on the aurora gradient", () => {
  const h = read("app/hermes.css");
  it("the .hero background references the shared aurora gradient", () => {
    expect(h).toMatch(/\.hermes \.hero\s*\{[^}]*var\(--hs-aurora-bg/);
  });
  it("keeps the faint trust row at AA ink over the gradient", () => {
    expect(h).toMatch(/\.hero \.hero-trust span\s*\{\s*color:\s*var\(--text-2\)/);
  });
});

describe("hero demo window — the new light SubTracker-style skin", () => {
  const d = read("components/landing/HeroDemoDashboard.tsx");
  it("is the light aurora window, not the retired dark palette", () => {
    expect(d).toContain("hd-window");
    expect(d).toMatch(/--a-stage:\s*var\(--hs-aurora-bg/);
    // The old dark demo palette must be gone.
    expect(d).not.toContain("--d-bg:#0A1220");
    expect(d).not.toContain("#0A1220");
  });
  it("carries the reference chrome: ghost cards, monitor heading, add button, KPI icon badges", () => {
    expect(d).toContain("hd-ghost");
    expect(d).toContain("Live AI Monitor");
    expect(d).toMatch(/hd-add[^>]*>[\s\S]{0,40}New scan/);
    expect(d).toContain("hd-kpi-ic");
  });
  it("draws the donut with the pastel aurora sweep (shared with the console)", () => {
    expect(d).toMatch(/conic-gradient\(var\(--a-lime\)/);
  });
});

describe("console — shares the aurora gradient + pastel data-viz", () => {
  const css = read("components/dashboard/lccStyles.ts");
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  it("the shell background is the shared aurora gradient", () => {
    expect(css).toMatch(/--bg:\s*var\(--hs-aurora-bg/);
    expect(css).toMatch(/background:var\(--bg\);background-attachment:fixed/);
  });
  it("the sidebar is a glass surface over the gradient", () => {
    expect(css).toMatch(/\.hs-lcc \.side\{[^}]*backdrop-filter:blur/);
  });
  it("panels/kpis/cards float on the softer shared shadow token", () => {
    expect(css).toMatch(/--soft:\s*0 2px 12px/);
    expect(css).toMatch(/\.hs-lcc \.panel\{[^}]*box-shadow:var\(--soft\)/);
    expect(css).toMatch(/\.hs-lcc \.kpi\{[^}]*box-shadow:var\(--soft\)/);
  });
  it("bars + rings use the pastel accents; donut uses the pastel sweep", () => {
    expect(css).toMatch(/\.hs-lcc \.bar i\{[^}]*var\(--peri\)[^}]*var\(--lime\)/);
    expect(lcc).toContain("conic-gradient(#B6D94E 0");
    expect(lcc).toMatch(/conic-gradient\(var\(--lime\)/);
  });
});
