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
