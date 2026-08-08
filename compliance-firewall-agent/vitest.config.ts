import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.tsx", "**/*.test.ts"],
    exclude: ["node_modules", ".next", "**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary"],
      // Only first-party source counts. Config, generated types, stubs and the
      // tests themselves would otherwise inflate the number toward meaningless.
      include: ["app/**", "components/**", "lib/**", "hooks/**"],
      exclude: [
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "**/node_modules/**",
        ".next/**",
        "test/stubs/**",
        "**/_*.ts",
        "app/**/layout.tsx",
        "app/**/loading.tsx",
        "app/**/not-found.tsx",
        "app/**/error.tsx",
      ],
      /*
       * A RATCHET, not an aspiration.
       *
       * The previous threshold in this repo was 70%, written in jest.config.js
       * — which nothing ever ran (`npm test` is vitest). A number no command
       * enforces is not a gate, and this project already had four of those.
       *
       * These values are set at the MEASURED floor at the time of writing,
       * rounded down. That is deliberate: a threshold pitched above reality
       * fails on its first run and gets lowered or deleted within a day, which
       * is how the 70% became decorative. Raise these as coverage improves;
       * never lower them to make a red build green.
       *
       * Measured 2026-08-08 across 2220 passing tests:
       *   statements 29.36%  branches 27.87%  functions 26.34%  lines 29.79%
       *
       * Note the gap between that and the "80% coverage gate" named in
       * CLAUDE.md. The gate was never enforced anywhere, so the real figure
       * drifted to a third of the claim without anything going red. 25% is
       * the honest starting line, not a target — the target is still 80%.
       */
      thresholds: {
        lines: 25,
        functions: 25,
        branches: 25,
        statements: 25,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` is a Next-compiler alias, not an installed package, so
      // Vite cannot resolve the bare specifier. Without this, every test that
      // imports a server module dies at import. See test/stubs/server-only.ts.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
});
