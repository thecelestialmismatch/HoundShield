import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The accessibility numbers published on /accessibility, read from the CI
 * config that actually enforces them.
 *
 * Hardcoding "0.9" into the page would be a claim about a gate rather than the
 * gate itself, and the two would drift the first time someone raised the
 * threshold — exactly how `.claude/rules/api.md` came to say "minimum 16
 * patterns" against 33 shipped. The number on the page is therefore READ from
 * `.lighthouserc.json` at build time.
 *
 * Server-only: this runs during static generation of a server component. It is
 * never bundled for the browser.
 */

interface LighthouseRc {
  ci?: { assert?: { assertions?: Record<string, [string, { minScore?: number }]> } };
}

function readGateMinScore(): number {
  const raw = readFileSync(join(process.cwd(), ".lighthouserc.json"), "utf8");
  const rc = JSON.parse(raw) as LighthouseRc;
  const assertion = rc.ci?.assert?.assertions?.["categories:accessibility"];
  const min = assertion?.[1]?.minScore;
  if (typeof min !== "number") {
    throw new Error(
      "categories:accessibility minScore missing from .lighthouserc.json — " +
        "/accessibility publishes this number and must not invent it.",
    );
  }
  return min;
}

/** The enforced minimum, as published. e.g. "0.90". */
export const A11Y_GATE_MIN_SCORE: string = readGateMinScore().toFixed(2);

/**
 * The measured range recorded when the gate was set (2026-08-08), across
 * /pricing, /controls and /blog. Stated as a range because that is what was
 * observed; a single flattering number would be a selective quote.
 */
export const A11Y_MEASURED_RANGE = "0.94–0.95";
