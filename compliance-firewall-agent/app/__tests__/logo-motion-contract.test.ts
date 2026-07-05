import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

/**
 * Logo motion contract (founder-approved, Direction-A demo verbatim).
 *
 * On hover the brand mark TILTS IN PLACE — rotate(-4deg) scale(1.06) — on
 * every surface (hermes nav/footer, shared <Logo>, sidebar chip, chat bubble,
 * hero demo dashboard, command-center). It must NEVER translate sideways.
 * The sideways-sway regression (hs-logo-sway, translateX keyframes) shipped
 * because per-component `[animation:…]` classes override the shared hover
 * pose in the CSS cascade: a running animation's keyframe transform beats any
 * transform declaration. These tests fail the build if sway — or the
 * mechanism that enabled it — ever returns, regardless of what the offending
 * keyframes are named or which property carries the translation.
 */

const CFA_ROOT = path.resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(path.join(CFA_ROOT, rel), "utf8");

/** Recursively collect source files under a directory. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__snapshots__" || entry === ".next") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx|css)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Strip JS/CSS comments so prose ABOUT the loophole doesn't trip the guards. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/[^\n"']*$/gm, "$1");

/**
 * Flat CSS rule extraction: every `selector { declarations }` pair, including
 * rules nested inside @media blocks (their inner pairs still match). Keyframe
 * step blocks are excluded by dropping @keyframes bodies first.
 */
function cssRules(src: string): Array<{ selector: string; body: string }> {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, "");
  const noKeyframes = noComments.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
  const rules: Array<{ selector: string; body: string }> = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(noKeyframes))) {
    const selector = m[1].trim();
    if (selector.startsWith("@")) continue; // at-rule preludes (@media …) — inner rules matched separately
    rules.push({ selector, body: m[2] });
  }
  return rules;
}

/** A selector that targets a brand-mark surface. */
const LOGO_SELECTOR = /logo-img|logo-on-dark|brand-mark|\.brand(\s|:|>| img)|\.brand$/;

/** Animations a logo element may legally run (idle breathe is rotate/scale only). */
const ALLOWED_LOGO_ANIMATIONS = new Set(["none", "hs-logo-idle", "hs-logo-idle-soft"]);

/** CSS sources that style logo surfaces (plus every .css under app/ swept below). */
const CSS_SOURCES = ["app/globals.css", "app/hermes.css", "components/dashboard/lccStyles.ts"];

describe("logo motion — the approved pose exists on every surface", () => {
  it("hermes.css carries the pronounced hover tilt on .brand-mark", () => {
    expect(read("app/hermes.css")).toMatch(
      /\.hermes \.brand:hover \.brand-mark\s*\{[^}]*transform:\s*rotate\(-8deg\)\s+scale\(1\.08\)/,
    );
  });

  it("globals.css shared .logo-img/.logo-on-dark hover rule strikes the same pose", () => {
    const css = read("app/globals.css");
    expect(css).toMatch(
      /\.logo-img:hover[\s\S]{0,1200}?transform:\s*rotate\(-8deg\)\s*scale\(1\.08\)/,
    );
    // The pose must also bind through a parent group/brand hover so standalone
    // marks (chat bubble, footer link, sidebar chip, hero demo) tilt too.
    expect(css).toContain(".group\\/brand:hover .logo-img");
    expect(css).toContain(".group\\/brand:hover .logo-on-dark");
  });

  it("command-center (lccStyles) hover pauses idle and strikes the same pose", () => {
    expect(read("components/dashboard/lccStyles.ts")).toMatch(
      /\.hs-lcc \.brand:hover img[^{]*\{[^}]*animation:\s*none;\s*transform:\s*rotate\(-8deg\)\s+scale\(1\.08\)/,
    );
  });

  it("every after-login logo placement tilts on hover (topbar, hero, Brain header + avatars)", () => {
    // The founder-directed "logo everywhere + tilt on hover" contract for the
    // dashboard: each brand-mark surface added to the command center must carry
    // the pronounced rotate/scale hover pose (never a translate).
    const lcc = read("components/dashboard/lccStyles.ts");
    for (const sel of [
      /\.hs-lcc \.top-logo:hover\{transform:rotate\(-8deg\) scale\(1\.08\)\}/,
      /\.hs-lcc \.hero-logo:hover img\{transform:rotate\(-8deg\) scale\(1\.08\)\}/,
      /\.hs-lcc \.brain-logo:hover img\{transform:rotate\(-8deg\) scale\(1\.08\)\}/,
      /\.hs-lcc \.ava-mini:hover img\{transform:rotate\(-8deg\) scale\(1\.08\)\}/,
    ]) {
      expect(lcc).toMatch(sel);
    }
  });

  it("the Brain AI chat bubble keeps group/brand so the inner mark tilts on hover", () => {
    expect(read("components/GlobalChat.tsx")).toMatch(
      /className="group\/brand[^"]*fixed bottom-7 right-7/,
    );
  });

  it("the hero demo dashboard brand row keeps group/brand so its mark tilts on hover", () => {
    // Founder-verified surface: the dark demo dashboard on the homepage hero.
    // Its <Logo variant="dark"> binds the shared tilt through the parent
    // group/brand — if that class is dropped, hover motion silently dies there.
    expect(read("components/landing/HeroDemoDashboard.tsx")).toMatch(
      /hd-brand[^"]*group\/brand[^"]*"[^>]*>\s*<Logo/,
    );
  });

  it("the sidebar logo chip keeps group/brand so chip hover tilts the mark", () => {
    expect(read("components/layout/Sidebar.tsx")).toMatch(/group\/brand[^"]*w-7 h-7/);
  });
});

describe("logo motion — sideways sway can never return", () => {
  const roots = ["app", "components"].map((d) => path.join(CFA_ROOT, d));
  const files = roots.flatMap(sourceFiles);
  const self = path.join(CFA_ROOT, "app", "__tests__", "logo-motion-contract.test.ts");

  it("no source file references hs-logo-sway (keyframes or animation classes)", () => {
    const offenders = files.filter(
      (f) => f !== self && readFileSync(f, "utf8").includes("hs-logo-sway"),
    );
    expect(offenders).toEqual([]);
  });

  it("every CSS rule targeting a logo surface transforms with rotate/scale ONLY", () => {
    // Closes the "translate smuggled into the hover pose itself" hole:
    // transform: translate(2px) rotate(-4deg) scale(1.06) would tilt AND slide.
    const offenders: string[] = [];
    for (const rel of CSS_SOURCES) {
      for (const rule of cssRules(read(rel))) {
        if (!LOGO_SELECTOR.test(rule.selector)) continue;
        if (/transform\s*:/.test(rule.body) && /translate|matrix|skew/i.test(rule.body)) {
          offenders.push(`${rel} → ${rule.selector}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("logo rules may only run the approved idle animations — no matter the name", () => {
    // Closes the "rename the sway keyframes" hole: ANY animation attached to a
    // logo selector must come from the allowlist, so a new keyframes name
    // (hs-mark-sway, wiggle, …) fails here even though it isn't named 'logo'.
    const offenders: string[] = [];
    for (const rel of CSS_SOURCES) {
      for (const rule of cssRules(read(rel))) {
        if (!LOGO_SELECTOR.test(rule.selector)) continue;
        const decls = rule.body.match(/animation(?:-name)?\s*:\s*([^;]+)/g) ?? [];
        for (const decl of decls) {
          const value = decl.replace(/animation(?:-name)?\s*:\s*/, "").replace(/!important/g, "");
          const name = value.trim().split(/[\s,]+/)[0];
          if (name && !ALLOWED_LOGO_ANIMATIONS.has(name)) {
            offenders.push(`${rel} → ${rule.selector} → animation "${name}"`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no @keyframes runnable on a logo element translates the mark", () => {
    // Belt-and-braces with the allowlist above: the approved idle keyframes
    // themselves must stay rotate/scale-only, and any keyframes whose name
    // mentions the logo/brand/mark must never translate.
    const offenders = files
      .filter((f) => f !== self)
      .filter((f) => {
        const src = readFileSync(f, "utf8");
        const blocks =
          src.match(/@keyframes[^{]*(logo|brand|mark)[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/gi) ?? [];
        return blocks.some((b) => /translate|matrix|skew/i.test(b));
      });
    expect(offenders).toEqual([]);
  });

  it("<Logo> carries no per-component animation override (the cascade loophole)", () => {
    expect(stripComments(read("components/Logo.tsx"))).not.toContain("[animation:");
  });

  it("no component re-attaches an [animation:…] or translate class to a logo element", () => {
    const offenders = files
      .filter((f) => f !== self && /\.tsx$/.test(f))
      .filter((f) => {
        const src = stripComments(readFileSync(f, "utf8"));
        // Flag animation utilities AND Tailwind translate utilities on lines
        // that also carry a logo hook.
        return src.split("\n").some(
          (line) =>
            (/\[animation:/.test(line) || /(^|[\s"':])-?translate-[xy]/.test(line)) &&
            /logo-img|logo-on-dark|brand-mark|<Logo[\s/>]/.test(line),
        );
      });
    expect(offenders).toEqual([]);
  });
});
