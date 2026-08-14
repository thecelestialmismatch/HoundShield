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
  "cookies",
  "refund",
  "legal",
  "hipaa",
] as const;

function pageSource(route: string): string {
  const p = join(APP_DIR, route, "page.tsx");
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

/**
 * The `export const metadata` block for a route, wherever it lives.
 *
 * A route's metadata sits in page.tsx or, for a "use client" page like /hipaa,
 * in a sibling layout.tsx. Reading only page.tsx is how a check passes
 * vacuously: /hipaa's page.tsx has no metadata at all, but it does have a
 * FEATURES array whose entries carry a `title:` key, so a naive search on that
 * file matches "Real-Time PHI Scanning" and reports success while the real
 * title goes unchecked.
 */
function metadataBlock(route: string): string {
  for (const file of ["page.tsx", "layout.tsx"]) {
    const p = join(APP_DIR, route, file);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8");
    const start = src.indexOf("export const metadata");
    if (start === -1) continue;
    return src.slice(start);
  }
  return "";
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
    //
    // This assertion checked only /privacy despite its name. /dpa kept a
    // hardcoded four-vendor list until 2026-08-13 while the registry held ten,
    // so the DPA under-disclosed six sub-processors — the exact GDPR Art. 28(2)
    // defect the single-sourcing existed to prevent. Both are checked now.
    for (const route of ["privacy", "dpa"]) {
      expect(pageSource(route), `/${route} must render the shared list`).toContain(
        "lib/legal/subprocessors"
      );
    }
  });

  it("no legal page hardcodes a vendor name in markup", () => {
    // A literal <li>Vendor</li> is how /dpa drifted out of sync. If a page
    // names a vendor in markup, that vendor must exist in the registry.
    const known = SUB_PROCESSORS.map((s) => s.name);
    const VENDORS = ["Supabase", "Vercel", "Stripe", "Resend", "PostHog", "Sentry", "OpenRouter"];
    for (const route of ["privacy", "dpa"]) {
      const src = pageSource(route);
      for (const vendor of VENDORS) {
        if (new RegExp(`>\\s*${vendor}\\s*<`).test(src)) {
          expect(known, `/${route} hardcodes ${vendor} in markup`).toContain(vendor);
        }
      }
    }
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

  it("the webhook blocker is resolved only while the schema actually enforces it", () => {
    // proxy/webhook.ts is the only channel that can carry customer content back
    // to houndshield.com in Mode B, so it is what decides HIPAA Business
    // Associate status (audit finding 14). The blocker flipped to non-blocking
    // because PR #286 shipped a zod strip-mode allowlist — so this verifies the
    // enforcement still EXISTS rather than trusting the flag. Revert the schema
    // and this fails, forcing the blocker back on.
    const webhook = LAUNCH_BLOCKERS.find((b) => b.id === "webhook-allowlist");
    expect(webhook).toBeDefined();

    const proxyWebhook = join(process.cwd(), "..", "proxy", "webhook.ts");
    expect(existsSync(proxyWebhook), "proxy/webhook.ts must exist").toBe(true);
    const src = readFileSync(proxyWebhook, "utf8");
    const enforced =
      src.includes("EventSchema") && src.includes(".strip()") && src.includes("safeParse");

    if (webhook?.blocking === false) {
      expect(enforced, "blocker says resolved but the schema is gone").toBe(true);
    }
  });

  it("the hipaa-posture blocker is resolved only while /hipaa states the position", () => {
    // The page must state the Mode A / Mode B boundary, name the Business
    // Associate question, and cite the definition it turns on.
    const posture = LAUNCH_BLOCKERS.find((b) => b.id === "hipaa-posture");
    expect(posture).toBeDefined();

    const hipaa = pageSource("hipaa");
    const stated =
      /BAA/.test(hipaa) &&
      /business associate/i.test(hipaa) &&
      /Mode\s*B/i.test(hipaa) &&
      /45 CFR 160\.103/.test(hipaa);

    if (posture?.blocking === false) {
      expect(stated, "blocker says resolved but /hipaa no longer states the position").toBe(true);
    }
  });

  it("gives a reason for every blocker", () => {
    for (const b of LAUNCH_BLOCKERS) {
      expect(b.why.length, `${b.id} needs a why`).toBeGreaterThan(20);
    }
  });
});

describe("no surface promises a BAA that cannot be signed", () => {
  /*
   * On 2026-08-13 four surfaces advertised a Business Associate Agreement:
   * /hipaa's meta description and OpenGraph description, the healthcare product
   * FAQ ("we still sign a BAA on paid plans"), and the Brain AI knowledge base
   * ("BAA available on Growth+") — the last of which the assistant would recite
   * to a healthcare buyer on request.
   *
   * No BAA document exists in this repository, and the operator is not
   * incorporated (see LEGAL_ENTITY), so there is no entity to sign one. A buyer
   * who reads that promise and asks for the document gets nothing, and an
   * unincorporated individual signing a BAA assumes HIPAA liability personally.
   *
   * The correct position, on /hipaa: in Mode B no PHI reaches HoundShield, so
   * no BAA with HoundShield is required. This keeps the promise from creeping
   * back while both conditions still hold.
   */
  const PROMISES =
    /\b(?:we|HoundShield)\s+(?:still\s+)?(?:sign|offer|provide)s?\s+a\s+BAA|BAA\s+is\s+available|BAA\s+available/i;

  const SURFACES = [
    "app/hipaa/layout.tsx",
    "app/hipaa/page.tsx",
    "app/products/_industries.ts",
    "app/answers/_answers.ts",
    "lib/brain-ai/faq.ts",
  ];

  it("no surface advertises signing or offering a BAA", () => {
    if (isEntityEstablished()) return; // Once incorporated, this becomes a business decision.
    for (const rel of SURFACES) {
      const p = join(process.cwd(), rel);
      if (!existsSync(p)) continue;
      const match = PROMISES.exec(readFileSync(p, "utf8"));
      expect(match?.[0], `${rel} promises a BAA that cannot be signed`).toBeUndefined();
    }
  });

  it("catches the promise if it is reintroduced", () => {
    // Fails in both directions so the pattern cannot rot into matching nothing.
    expect(PROMISES.test("and we still sign a BAA on paid plans")).toBe(true);
    expect(PROMISES.test("a BAA is available for that mode")).toBe(true);
    expect(PROMISES.test("no BAA with HoundShield is required")).toBe(false);
  });
});

describe("page titles do not double the brand", () => {
  /*
   * app/layout.tsx sets `template: "%s | HoundShield"`, so a page metadata
   * title of "Privacy Policy | HoundShield" renders as
   * "Privacy Policy | HoundShield | HoundShield" in the browser tab and in
   * Google results. 23 pages carried that, including /assessment — the $499
   * revenue page. Confirmed in a real browser before changing anything.
   *
   * Scoped to a TRAILING suffix on purpose: a few descriptive titles use the
   * brand mid-string ("About | HoundShield — AI Compliance Security"), which is
   * a copy choice rather than a mechanical duplication.
   */
  const TRAILING_BRAND = /\|\s*HoundShield\s*$/;

  it("no legal page repeats the suffix the root layout template already adds", () => {
    for (const route of LEGAL_PAGES) {
      const block = metadataBlock(route);
      if (!block) continue;
      const title = /title:\s*"([^"]+)"/.exec(block)?.[1];
      if (!title) continue;
      expect(title, `/${route} title repeats the template suffix`).not.toMatch(TRAILING_BRAND);
    }
  });

  it("actually reads /hipaa, whose metadata lives in layout.tsx", () => {
    // Without this the loop above silently skips the one page whose metadata is
    // not in page.tsx — the exact way this guard would rot.
    expect(metadataBlock("hipaa")).toContain("HIPAA");
  });

  it("catches a doubled title if one is reintroduced", () => {
    expect(TRAILING_BRAND.test("Privacy Policy | HoundShield")).toBe(true);
    expect(TRAILING_BRAND.test("Privacy Policy")).toBe(false);
    // Mid-string brand is a copy choice, not this defect.
    expect(TRAILING_BRAND.test("About | HoundShield — AI Compliance Security")).toBe(false);
  });
});

describe("withdrawing cookie consent is possible (GDPR Art. 7(3))", () => {
  it("/cookies offers a working withdrawal control, not just instructions", () => {
    // The page told visitors to "use the Cookie settings control in the consent
    // banner". CookieConsent renders null once consentUndecided() is false, and
    // a visitor only reads a cookie policy after dismissing the banner — so the
    // instruction pointed at something the reader could not see.
    expect(pageSource("cookies")).toContain("CookieSettingsButton");
  });

  it("the consent module exposes a way to clear the stored choice", () => {
    const consent = readFileSync(join(process.cwd(), "lib", "consent.ts"), "utf8");
    expect(consent).toMatch(/export function clearConsent/);
    // Must remove the key AND notify listeners, or the banner will not reappear
    // until a full page reload.
    expect(consent).toMatch(/removeItem\(CONSENT_KEY\)/);
    expect(consent).toMatch(/dispatchEvent/);
  });
});
