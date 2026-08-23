import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src-deno/**/*.test.ts", "src/**/*.test.ts"],
  },
});
