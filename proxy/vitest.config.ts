import { defineConfig } from "vitest/config";

export default defineConfig({
  // The proxy has no CSS. Pin an empty inline PostCSS config so Vite does not
  // search upward and load the repo-root postcss.config.mjs, whose Tailwind
  // plugin is not resolvable from this package.
  css: { postcss: {} },
  test: {
    environment: "node",
    globals: false,
    include: ["**/__tests__/**/*.test.ts"],
  },
});
