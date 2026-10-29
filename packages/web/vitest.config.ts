import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "src/hosted/rust/**",
      "src/history/backup.test.ts",
      "src/history/restore.test.ts",
    ],
  },
});
