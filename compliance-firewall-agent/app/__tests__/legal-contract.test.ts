/**
 * Guards on the published legal documents.
 *
 * These exist because of a specific failure, not as a formality. On 2026-08-13
 * `/privacy`, `/terms` and `/dpa` were all live in production containing the
 * literal strings `[COMPANY LEGAL NAME]` and `[MAILING ADDRESS]`. Three pages,
 * three unfilled copies, shipped and serving 200s. The DPA is a contract, and
 * GDPR Art. 28(3) requires it to identify the parties.
 *
 * Nothing in CI would have caught it. A reviewer reading a 142-line legal page
 * skims. A test does not.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  LEGAL_ENTITY,
  LAUNCH_BLOCKERS,
  controllerDisclosure,
  isEntityEstablished,
} from "@/lib/legal/entity";
import { SUB_PROCESSORS, contentTouchingSubProcessors } from "@/lib/legal/subprocessors";

const APP_DIR = join(process.cwd(), "app");

const LEGAL_PAGES = [
  "privacy",
  "terms",
  "dpa",
  "acceptable-use",
  "subprocessors",
] as const;

function pageSource(route: string): string {
  const p = join(APP_DIR, route, "page.tsx");
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

describe("no unfilled placeholder ships", () => {
  /*
   * Matches a bracketed ALL-CAPS token: [COMPANY LEGAL NAME], [MAILING ADDRESS],
   * [TBD]. Scoped to caps so ordinary prose and JSX arrays are not flagged.
   */
  const PLACEHOLDER = /\[[A-Z][A-Z0-9 _/-]{3,}\]/g;

  it.each(LEGAL_PAGES)("/%s has no bracketed placeholder", (route) => {
    const src = pageSource(route);
    expect(src, `${route}/page.tsx should exist`).not.toBe("");
    expect(src.match(PLACEHOLDER) ?? []).toEqual([]);
  });

  it("catches a placeholder if one is reintroduced", () => {
    // Fails in both directions, so the regex above cannot silently rot into
    // matching nothing. Without this, deleting a character from PLACEHOLDER
    // would make every assertion above pass vacuously.
    expect("operated by [COMPANY LEGAL NAME] of".match(PLACEHOLDER)).toEqual([
      "[COMPANY LEGAL NAME]",
    ]);
  });
});

describe("the disclosure renders as a sentence, not as fragments glued together", () => {
  /*
   * THE BUG THIS EXISTS FOR, found in production on 2026-08-14.
   *
   * `/terms` §12 wrapped the disclosure in its own prose and an empty element:
   *
   *   HoundShield is operated by <strong>{controllerDisclosure()}</strong>,{" "}
   *   <strong></strong>.
   *
   * controllerDisclosure() already returns a COMPLETE sentence, so the page
   * served:
   *
   *   "HoundShield is operated by HoundShield is operated by an independent
   *    sole proprietor. … regardless of entity status., ."
   *
   * The duplicated clause and the dangling ", ." were on the section of a
   * contract that identifies the counterparty, in a document sold to DoD
   * subcontractors. Every existing guard passed: there was no placeholder, the
   * entity function was honest, and the page rendered 200.
   *
   * The empty element is the generic tell — a half-finished JSX slot where a
   * value was meant to go — so that is what is asserted, alongside the specific
   * double-prefix.
   */
  const EMPTY_INLINE = /<(strong|em|b|span|p)\b[^>]*>\s*<\/\1>/g;

  /**
   * Match the RENDERED page, not the commentary about it.
   *
   * Written after this guard went red on the very comment explaining the bug it
   * guards against — a comment that necessarily quotes the bad output. It is the
   * sixth guard in this codebase to read its own explanatory prose (see the CSP
   * drift check and the accessibility overclaim check, which both learned it the
   * same way). A guard that cannot tell code from a comment about code will
   * eventually be deleted by whoever is trying to ship.
   *
   * `//` is stripped only when it is not part of a scheme, so `https://…` in a
   * legal page survives.
   */
  function withoutComments(src: string): string {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
  }

  it.each(LEGAL_PAGES)("/%s has no empty inline element left over", (route) => {
    const src = pageSource(route);
    expect(src, `${route}/page.tsx should exist`).not.toBe("");
    expect(withoutComments(src).match(EMPTY_INLINE) ?? []).toEqual([]);
  });

  it("catches an empty element if one is reintroduced", () => {
    // Fails in both directions so the regex cannot rot into matching nothing.
    expect('<strong className="x"></strong>'.match(EMPTY_INLINE)).toEqual([
      '<strong className="x"></strong>',
    ]);
  });

  it.each(LEGAL_PAGES)("/%s does not re-introduce the disclosure it renders", (route) => {
    const src = withoutComments(pageSource(route));
    if (!src.includes("controllerDisclosure()")) return;
    // controllerDisclosure() opens with "<trading name> is operated by …" while
    // unincorporated. A page that writes that lead-in itself says it twice.
    expect(
      src,
      `${route}/page.tsx prefixes controllerDisclosure() with prose it already contains`,
    ).not.toMatch(new RegExp(`${LEGAL_ENTITY.tradingName} is operated by`));
  });

  it("catches a double-prefixed disclosure if one is reintroduced", () => {
    // Both directions, and specifically NOT satisfied by the comment form —
    // otherwise stripping comments could silently neuter the check above.
    const bad = `<p>${LEGAL_ENTITY.tradingName} is operated by {controllerDisclosure()}</p>`;
    expect(withoutComments(bad)).toMatch(
      new RegExp(`${LEGAL_ENTITY.tradingName} is operated by`),
    );
    expect(withoutComments(`{/* ${bad} */}`)).not.toMatch(
      new RegExp(`${LEGAL_ENTITY.tradingName} is operated by`),
    );
  });
});

describe("controller disclosure is honest about entity status", () => {
  it("never fabricates a company name while unincorporated", () => {
    if (isEntityEstablished()) return;
    const text = controllerDisclosure();
    expect(text).not.toMatch(/\b(Inc\.|LLC|Ltd\.?|GmbH|Corporation)\b/);
  });

  it("always gives a working contact route, incorporated or not", () => {
    expect(controllerDisclosure()).toContain(LEGAL_ENTITY.legalEmail);
    expect(LEGAL_ENTITY.legalEmail).toMatch(/^[^@]+@houndshield\.com$/);
  });

  it("names both entity and address once incorporated", () => {
    if (!isEntityEstablished()) return;
    const text = controllerDisclosure();
    expect(text).toContain(LEGAL_ENTITY.name);
    expect(text).toContain(LEGAL_ENTITY.address);
  });
});

describe("sub-processor disclosure is single-sourced", () => {
  it("privacy and dpa render the shared list rather than hardcoding their own", () => {
    // The original defect: /privacy named Google, OpenRouter, Stripe, Supabase,
    // Vercel while /dpa named Resend, Stripe, Supabase, Vercel. Two documents,
    // two different answers to the same legal question.
    expect(pageSource("privacy")).toContain("lib/legal/subprocessors");
  });

  it("discloses every vendor the application actually integrates", () => {
    const names = SUB_PROCESSORS.map((s) => s.name);
    for (const required of [
      "Vercel",
      "Supabase",
      "Stripe",
      "Resend",
      "PostHog",
      "Sentry",
      "Cloudflare",
      "OpenRouter",
    ]) {
      expect(names, `${required} is integrated and must be disclosed`).toContain(required);
    }
  });

  it("does not list the customer's own AI providers as our sub-processors", () => {
    // The gateway forwards to these with the CUSTOMER's key, at their
    // instruction. Listing them would misstate who the controller is.
    const names = SUB_PROCESSORS.map((s) => s.name);
    expect(names).not.toContain("OpenAI");
    expect(names).not.toContain("Anthropic");
  });

  it("every entry cites in-repo evidence, so the list cannot become aspirational", () => {
    for (const s of SUB_PROCESSORS) {
      expect(s.evidence.length, `${s.name} needs evidence`).toBeGreaterThan(0);
      expect(s.purpose.length, `${s.name} needs a purpose`).toBeGreaterThan(0);
    }
  });

  it("flags the content-touching vendors, and warns about them", () => {
    const content = contentTouchingSubProcessors().map((s) => s.name);
    expect(content).toContain("OpenRouter");
    // OpenRouter's own entry must carry the CUI/PHI warning, because that is
    // the one a Privacy Officer reads.
    const openrouter = SUB_PROCESSORS.find((s) => s.name === "OpenRouter");
    expect(openrouter?.purpose).toMatch(/CUI|PHI/);
  });
});

describe("launch blockers stay visible", () => {
  it("records incorporation as blocking while the entity is unset", () => {
    if (isEntityEstablished()) return;
    const incorporate = LAUNCH_BLOCKERS.find((b) => b.id === "incorporate");
    expect(incorporate?.blocking).toBe(true);
  });

  it("never marks a CLOSED item as still blocking", () => {
    /*
     * This test used to assert `webhook-allowlist` stayed blocking. PR #286
     * closed that work, so honesty and the suite were in direct conflict:
     * marking it done turned the build red.
     *
     * A guard that pins today's answer converts progress into a failure. It now
     * asserts the PROPERTY — an item whose summary says DONE must not also
     * claim to be blocking — so the list can be updated truthfully and still be
     * enforced.
     */
    const lying = LAUNCH_BLOCKERS.filter((b) => /^DONE\b/.test(b.summary) && b.blocking);
    expect(
      lying.map((b) => b.id),
      "these are recorded as DONE but still flagged blocking",
    ).toEqual([]);
  });

  it("keeps a reason on closed items, not just open ones", () => {
    // The evidence that closed a blocker is the part worth keeping — without it
    // the next reader cannot tell a finished item from a forgotten one.
    for (const b of LAUNCH_BLOCKERS.filter((x) => !x.blocking)) {
      expect(b.why.length, `${b.id} was closed without recording why`).toBeGreaterThan(20);
    }
  });

  it("gives a reason for every blocker", () => {
    for (const b of LAUNCH_BLOCKERS) {
      expect(b.why.length, `${b.id} needs a why`).toBeGreaterThan(20);
    }
  });
});
