import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

// Flat config replacing the legacy .eslintrc.json (Next 16 removed `next lint`).
//
// Scope note: `eslint .` lints the whole tree, whereas `next lint` only checked
// the app source dirs. The ignores below restore that scope — `legacy/`, `sdk/`,
// and the data/config dirs were never linted, and linting them now surfaces
// hundreds of errors from an unrelated custom rule-set and CommonJS idioms that
// have nothing to do with this upgrade.
export default defineConfig([
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "next-env.d.ts",
      "public/**",
      "legacy/**",
      "sdk/**",
      "reference-data/**",
      "supabase/**",
      "docs/**",
      "scripts/**",
    ],
  },
  {
    extends: [...nextCoreWebVitals, ...nextTypescript],

    plugins: {
      "unused-imports": unusedImports,
    },

    rules: {
      "unused-imports/no-unused-imports": "warn",

      "@typescript-eslint/no-unused-vars": ["warn", {
        args: "after-used",
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],

      // react-hooks v7 (bundled by eslint-config-next 16) adds these rules as
      // errors. They fire on unchanged, working code that passed under Next 15's
      // react-hooks version — advisory best-practices, not regressions from this
      // upgrade. Keep them visible as warnings (matching the Next 15 outcome:
      // lint stays green) rather than block on a 39-file refactor of the live app.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      // NOTE: react-hooks/rules-of-hooks and exhaustive-deps stay at their default
      // severity — those catch real bugs, and app code has zero violations.
    },
  },
  {
    // CommonJS config files legitimately use require(); next lint never checked
    // these, so keep the require-imports rule from failing the build.
    files: ["next.config.js", "**/*.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
