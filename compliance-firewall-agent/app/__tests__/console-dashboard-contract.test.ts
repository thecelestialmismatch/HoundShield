import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * After-login dashboard contract.
 *
 * The /console "Live Command Center" is THE single post-login home, and the
 * /command-center app is unified onto its light "Steel & Cream" palette. These
 * tests pin the founder-approved wins so they can't silently regress:
 *
 *  1. Fonts load. The console must reach Fraunces/DM Sans through the next/font
 *     CSS variables (var(--font-display)/var(--font-body)) — a literal
 *     'Fraunces' family name is unreachable (hashed) and falls back to Times.
 *  2. The evidence-chain SPINE (the uncopyable differentiator) is present with a
 *     one-click "Generate Audit PDF".
 *  3. Brain AI carries the Doberman mark + the mandatory CUI warning.
 *  4. Mobile: off-canvas drawer + dismiss scrim exist.
 *  5. /command-center is re-themed light (cc-light layer) with an unboxed,
 *     aspect-correct logo — never the old squished dark w-9 h-9 square.
 */

const CFA = path.resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(path.join(CFA, rel), "utf8");

describe("console fonts — reach next/font via CSS variables (no Times fallback)", () => {
  const css = read("components/dashboard/lccStyles.ts");
  it("display + body families resolve through the font variables", () => {
    expect(css).toMatch(/--f-disp:\s*var\(--font-display\)/);
    expect(css).toMatch(/--f:\s*var\(--font-body\)/);
  });
  it("no font-family declaration starts with a hashed-unreachable literal", () => {
    // A `font-family:'Fraunces'` (or 'DM Sans') would silently render Times,
    // because next/font only exposes the hashed family via the CSS variable.
    expect(css).not.toMatch(/font-family:\s*['"]Fraunces['"]/);
    expect(css).not.toMatch(/font-family:\s*['"]DM Sans['"]/);
  });
});

describe("evidence-chain spine — the differentiator, on every tab", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  it("renders the live audit-chain header", () => {
    expect(lcc).toContain('id="lcc-chainN"');
    expect(lcc).toContain('id="lcc-chainHash"');
    expect(lcc).toMatch(/Audit chain intact/);
  });
  it("puts the $499 PDF one click away", () => {
    expect(lcc).toMatch(/Generate Audit PDF/);
  });
});

describe("Brain AI — logo-forward and CUI-safe", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  it("shows the Doberman mark on the Brain surfaces", () => {
    expect(lcc).toMatch(/brain-mark[\s\S]{0,80}houndshield-logo\.png/);
  });
  it("displays the mandatory CUI warning (routes to a commercial cloud endpoint)", () => {
    expect(lcc).toMatch(/Do not enter CUI/i);
    expect(lcc).toMatch(/commercial cloud endpoint/i);
  });
  it("keeps a quick-ask card wired to the live analyst", () => {
    expect(lcc).toContain("askBrain");
    expect(lcc).toContain("bchips");
  });
});

describe("subscription-aware — the dashboard bills against entitlements, not hardcoded caps", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  it("resolves the signed-in plan through the entitlements model", () => {
    expect(lcc).toMatch(/from '@\/lib\/billing\/entitlements'/);
    expect(lcc).toMatch(/getEntitlements\(viewer\?\.tier/);
  });
  it("no longer hardcodes the old 250,000 scan cap or a fixed Pro plan", () => {
    expect(lcc).not.toContain("250,000");
    expect(lcc).not.toContain("143,280 / 250,000");
  });
  it("renders the gated feature grid + a plan-driven upgrade CTA", () => {
    expect(lcc).toMatch(/FEATURE_LABELS/);
    expect(lcc).toMatch(/Upgrade to \{getEntitlements\(ent\.nextTier\)\.name\}/);
  });
});

describe("personalized Brain AI — greets by name, human + tier-aware", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  it("brainAnswer accepts an operator context (name + entitlements)", () => {
    expect(lcc).toMatch(/export function brainAnswer\(qRaw: string, ctx\?: BrainContext\)/);
  });
  it("greets the operator by first name on the dashboard", () => {
    expect(lcc).toMatch(/Welcome back, \$\{name\}/);
  });
  it("shows a Brain-query budget meter (metered usage made visible)", () => {
    expect(lcc).toContain('id="lcc-brainUse"');
    expect(lcc).toContain('id="lcc-brainBar"');
  });
  it("escapes profile-sourced strings before they reach innerHTML", () => {
    expect(lcc).toMatch(/export function escapeHtml/);
    expect(lcc).toMatch(/escapeHtml\(orgName\)/);
  });
});

describe("hero identity band — brand-forward Overview anchor (carries the greeting + plan)", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  const css = read("components/dashboard/lccStyles.ts");
  it("renders a branded hero band with the logo + greeting/org in hero-org", () => {
    expect(lcc).toMatch(/className="hero"/);
    expect(lcc).toMatch(/hero-logo[\s\S]{0,80}houndshield-logo\.png/);
    expect(lcc).toMatch(/hero-org/);
  });
  it("carries the personalization inside the hero (greet-by-name + plan chip)", () => {
    expect(lcc).toMatch(/hero-org[\s\S]{0,80}Welcome back, \$\{name\}/);
    expect(lcc).toMatch(/hero[\s\S]{0,400}plan-chip/);
  });
  it("its status chips COMPLEMENT the KPIs (Engines / Scan p50 / Regions — no SPRS/blocked dupes)", () => {
    expect(lcc).toMatch(/hero-metric[\s\S]{0,120}Engines/);
    expect(lcc).toMatch(/hero-metric[\s\S]{0,120}Scan p50/);
    expect(lcc).toMatch(/hero-metric[\s\S]{0,120}Regions/);
  });
  it("the hero logo tilts on hover (rotate/scale only, never a translate)", () => {
    expect(css).toMatch(/\.hs-lcc \.hero-logo:hover img\{transform:rotate\(-8deg\) scale\(1\.08\)\}/);
    // guard: the hero band must not smuggle a translate into the mark
    const heroRules = css.match(/\.hs-lcc \.hero-logo[^{]*\{[^}]*\}/g) ?? [];
    for (const rule of heroRules) {
      if (/transform\s*:/.test(rule)) expect(rule).not.toMatch(/translate|matrix|skew/i);
    }
  });
});

describe("mobile — off-canvas drawer with a dismiss scrim", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  const css = read("components/dashboard/lccStyles.ts");
  it("renders a tappable scrim tied to the open state", () => {
    expect(lcc).toMatch(/className=\{`scrim\$\{sideOpen \? ' on' : ''\}`\}/);
  });
  it("styles the drawer + scrim and uses dvh/safe-area for phones", () => {
    expect(css).toContain(".hs-lcc .scrim");
    expect(css).toContain("100dvh");
    expect(css).toContain("env(safe-area-inset-bottom)");
  });
});

describe("/command-center unified onto the light palette", () => {
  const layout = read("app/command-center/layout.tsx");
  const globals = read("app/globals.css");
  it("the shell root carries the cc-light scope on a light surface", () => {
    expect(layout).toMatch(/className="cc-light[^"]*bg-\[var\(--hs-surface-1\)\]/);
  });
  it("the boxed/squished dark logo is gone — aspect-correct mark instead", () => {
    expect(layout).not.toContain('variant="dark"');
    expect(layout).not.toMatch(/<Logo[^>]*w-9 h-9/);
    expect(layout).toMatch(/<Logo size=\{34\}\s*\/>/);
  });
  it("no indigo/purple accents survive in the shell", () => {
    expect(layout).not.toMatch(/purple-|indigo-/);
  });
  it("globals ships the cc-light override layer", () => {
    expect(globals).toContain(".cc-light");
    expect(globals).toMatch(/\.cc-light \.text-white/);
    expect(globals).toMatch(/\.cc-light \.bg-\\\[\\#0a0a0a\\\]/);
  });
});

describe("data honesty — simulated telemetry is labeled, seeds share one source of truth", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  const charts = read("components/dashboard/OverviewCharts.tsx");

  it("carries the persistent Simulated-preview affordance in the spine", () => {
    expect(lcc).toMatch(/spine-sim/);
    expect(lcc).toMatch(/Simulated preview/);
  });

  it("KPI seeds import the SAME constants the charts contract-test against (no drift)", () => {
    expect(lcc).toMatch(/SCANS_24H, BLOCKED_TODAY \} from '@\/components\/dashboard\/OverviewCharts'/);
    expect(lcc).toMatch(/let scan = SCANS_24H/);
    expect(lcc).toMatch(/let blocked = BLOCKED_TODAY/);
    expect(lcc).toMatch(/let quar = QUAR_SEED/);
    // The old drifting literals must never come back.
    expect(lcc).not.toMatch(/143,280|\b2218\b|\b142690\b/);
  });

  it("settings has no fake-success chrome (Reveal/Saved stubs + fabricated keys are gone)", () => {
    expect(lcc).not.toMatch(/action="Reveal"|done="Saved"|done="Revealed"/);
    expect(lcc).not.toMatch(/hs_live_•|sk-or-•/);
  });

  it("Brain AI never emits a spill determination and labels sample answers as sample", () => {
    expect(lcc).not.toMatch(/No spill occurred/);
    expect(lcc).toMatch(/incident · awaiting telemetry/);
    expect(lcc).toMatch(/sprs · your assessment/);
    expect(lcc).toMatch(/sprs · sample data/);
  });

  it("the overview charts label themselves as sample data", () => {
    expect(charts).toMatch(/sample · \{fmt\(SCANS_24H\)\} prompts/);
    expect(charts).toMatch(/Sample score/);
  });

  it("the assessment tab summary is React-owned real data (AssessSnapshot), not a hardcoded ring", () => {
    expect(lcc).toMatch(/<AssessSnapshot live=\{isViewer\}/);
    expect(lcc).not.toMatch(/lcc-ring2|AI-ranked/);
  });

  it("a sign-out control exists in the console shell for signed-in operators", () => {
    expect(lcc).toMatch(/SignOutButton/);
  });
});

describe("data provenance — click any number to see where it comes from", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  const charts = read("components/dashboard/OverviewCharts.tsx");
  const snap = read("components/dashboard/AssessSnapshot.tsx");
  const panel = read("components/dashboard/ProvenancePanel.tsx");
  const registry = read("components/dashboard/dataProvenance.ts");

  it("the console renders the provenance dialog wired to viewer state + Settings", () => {
    expect(lcc).toMatch(/import \{ SourceChip, ProvenancePanel \} from '\.\/ProvenancePanel'/);
    expect(lcc).toMatch(/<ProvenancePanel[\s\S]{0,200}live=\{isViewer\}/);
    expect(lcc).toMatch(/onOpenSettings=\{\(\) => setTab\('settings'\)\}/);
  });

  it("every KPI tile is a real button that opens its data source", () => {
    for (const id of ["scans-24h", "blocked-today", "sprs-score", "quarantine"]) {
      expect(lcc).toMatch(new RegExp(`button" className="kpi[^"]*" aria-haspopup="dialog" onClick=\\{\\(\\) => setProv\\('${id}'\\)\\}`));
    }
  });

  it("the overview charts + assessment snapshot receive the provenance hook", () => {
    expect(lcc).toMatch(/<OverviewCharts onSource=\{setProv\} \/>/);
    expect(lcc).toMatch(/<AssessSnapshot live=\{isViewer\} onSource=\{setProv\} \/>/);
    expect(charts).toMatch(/<SourceChip id="hourly-activity"/);
    expect(snap).toMatch(/<SourceChip id="assessment"/);
  });

  it("the Simulated-preview pill opens the audit-chain provenance (not a silent tab jump)", () => {
    expect(lcc).toMatch(/spine-sim"[\s\S]{0,120}setProv\('audit-chain'\)/);
  });

  it("the dialog is a labeled modal (role=dialog + aria-modal + Escape close)", () => {
    expect(panel).toMatch(/role="dialog"/);
    expect(panel).toMatch(/aria-modal="true"/);
    expect(panel).toMatch(/aria-labelledby="prov-title"/);
    expect(panel).toMatch(/e\.key === 'Escape'/);
  });

  it("a SourceChip without a handler degrades to a span — never a dead button", () => {
    expect(panel).toMatch(/if \(!onSource\) return <span className=\{className\}>\{children\}<\/span>/);
  });

  it("the registry keeps the honesty ledger: simulated entries must name a path to live data", () => {
    expect(registry).toMatch(/kind === 'simulated' \? e\.liveWhen : undefined/);
    expect(registry).toMatch(/Settings → Proxy URL/);
    // Live variants for account/on-device surfaces exist.
    expect(registry).toMatch(/kindLive: 'account'/);
    expect(registry).toMatch(/kindLive: 'on-device'/);
  });
});

describe("console a11y guards — the fixes that regress silently", () => {
  const lcc = read("components/dashboard/LiveCommandCenter.tsx");
  const css = read("components/dashboard/lccStyles.ts");

  it("active sidebar tab exposed via aria-current", () => {
    expect(lcc).toMatch(/aria-current=\{tab === s\.id \? 'page' : undefined\}/);
  });

  it("Brain chat: labeled input + polite live-region log", () => {
    expect(lcc).toMatch(/aria-label="Ask Brain AI"/);
    expect(lcc).toMatch(/role="log" aria-live="polite"/);
  });

  it("closed mobile drawer leaves the tab order (visibility, not just transform)", () => {
    expect(css).toMatch(/transform:translateX\(-100%\);visibility:hidden/);
    expect(css).toMatch(/\.side\.open\{transform:none;visibility:visible/);
  });

  it("reduced motion silences the highest-frequency animations (bump, feed flash, pulse dots)", () => {
    expect(css).toMatch(/\.hs-lcc \.bump,\.hs-lcc \.feed-row\.fresh,\.hs-lcc \.dot\{animation:none\}/);
  });

  it("small status text uses the AA text-grade tokens (incl. the mandated CUI warning)", () => {
    expect(css).toMatch(/--ok-text:#067A54/);
    expect(css).toMatch(/\.cui-note\{[^}]*color:var\(--warn-text\)/);
    expect(css).toMatch(/\.live-tag\{[^}]*color:var\(--ok-text\)/);
  });
});
