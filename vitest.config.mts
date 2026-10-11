import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    clearMocks: true,
    restoreMocks: true,
    env: {
      // A dummy URL so modules that import the Prisma singleton can be loaded in
      // unit tests. The pg driver adapter is lazy and never connects on the code
      // paths under test. The DB integration suite overrides this before its
      // dynamic import.
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://test:test@localhost:5432/interviewprep_test",
    },
  },
});
