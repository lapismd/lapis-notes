import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^npm:nostr-tools@2\.25\.2\/(.*)$/u,
        replacement: "nostr-tools/$1",
      },
      { find: "npm:nostr-tools@2.25.2", replacement: "nostr-tools" },
    ],
  },
  test: {
    environment: "node",
    include: [
      "scripts/**/*.test.mjs",
      "src-deno/**/*.test.ts",
      "src/**/*.test.ts",
    ],
  },
});
