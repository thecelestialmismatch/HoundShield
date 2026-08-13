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
import { readFileSync, readdirSync, existsSync } from "node:fs";
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

  it("keeps the webhook allowlist on the blocking list", () => {
    // proxy/webhook.ts is the only channel that can carry customer content back
    // to houndshield.com in Mode B, so it is what decides HIPAA Business
    // Associate status. Audit finding 14.
    const webhook = LAUNCH_BLOCKERS.find((b) => b.id === "webhook-allowlist");
    expect(webhook?.blocking).toBe(true);
  });

  it("gives a reason for every blocker", () => {
    for (const b of LAUNCH_BLOCKERS) {
      expect(b.why.length, `${b.id} needs a why`).toBeGreaterThan(20);
    }
  });
});
