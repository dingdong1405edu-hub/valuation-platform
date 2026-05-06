import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", "apps/web/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "apps/worker/src/valuation/**",
        "apps/worker/src/agents/ratioAnalysis/**",
        "apps/worker/src/agents/sensitivity/**",
        "apps/worker/src/agents/appendixCompiler/**",
        "packages/ai/src/tools/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@vp/shared": path.resolve(dirname, "packages/shared/src"),
      "@vp/db": path.resolve(dirname, "packages/db/src"),
      "@vp/ai": path.resolve(dirname, "packages/ai/src"),
    },
  },
});
