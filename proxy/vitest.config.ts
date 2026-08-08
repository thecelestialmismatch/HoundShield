import { defineConfig } from "vitest/config";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/*
 * Every run gets its own throwaway SQLite directory.
 *
 * storage.ts resolves its database to `HOUNDSHIELD_DATA_DIR ?? cwd()/data`.
 * With the variable unset, the suite wrote proxy/data/houndshield-events.db
 * into the working tree and left it there — so the FIRST `npm test` on a
 * clean checkout passed, and every run after it failed three tests in
 * __tests__/tool-calls.test.ts, including "blocks the request when tool_call
 * arguments contain CUI".
 *
 * The failures were real, not spurious: OODA reads behavioural baselines and
 * accumulated block counts out of that database, and decide() legitimately
 * returns BLOCK instead of WARN once an entity has prior blocks. The tests
 * were asserting first-run behaviour against ever-growing state.
 *
 * CI never caught it because a fresh container starts with no data directory.
 * A developer running the suite twice saw the compliance engine apparently
 * failing its own CUI-blocking tests — the most alarming possible false
 * positive, in the one area nobody should learn to ignore.
 */
const TEST_DATA_DIR = mkdtempSync(join(tmpdir(), "houndshield-proxy-test-"));

export default defineConfig({
  // The proxy has no CSS. Pin an empty inline PostCSS config so Vite does not
  // search upward and load the repo-root postcss.config.mjs, whose Tailwind
  // plugin is not resolvable from this package.
  css: { postcss: {} },
  test: {
    environment: "node",
    globals: false,
    include: ["**/__tests__/**/*.test.ts"],
    env: { HOUNDSHIELD_DATA_DIR: TEST_DATA_DIR },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary"],
      /*
       * `include` is explicit so that files NO test imports still count
       * against the number. Without it, v8 reports only modules the suite
       * happened to load — which measures the tests against themselves and
       * reads ~82% while server.ts, storage.ts, webhook.ts and license.ts
       * contribute nothing. That flatters the figure exactly where the risk
       * is highest.
       */
      include: ["*.ts", "patterns/**/*.ts", "ooda/**/*.ts"],
      exclude: [
        "**/__tests__/**",
        "**/*.test.ts",
        "**/*.d.ts",
        "dist/**",
        "bench/**",
        "vitest.config.ts",
      ],
      /*
       * Ratchet, set at the measured floor rounded down to the nearest 5%.
       * Measured 2026-08-08 with the include above:
       *   statements 65.26%  branches 54.29%  functions 69.90%  lines 66.30%
       * Raise these as coverage improves; never lower them to green a build.
       */
      thresholds: {
        lines: 65,
        functions: 65,
        branches: 50,
        statements: 65,
      },
    },
  },
});
