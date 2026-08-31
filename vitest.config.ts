import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@checker/shared": `${root}packages/shared/src/index.ts`,
      "@checker/db": `${root}packages/db/src/index.ts`,
      "@checker/rules": `${root}packages/rules/src/index.ts`,
    },
  },
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
