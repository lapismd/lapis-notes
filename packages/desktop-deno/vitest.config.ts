import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "scripts/**/*.test.mjs",
      "src-deno/**/*.test.ts",
      "src/**/*.test.ts",
    ],
  },
});
