/// <reference types="vitest" />

import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() })],
  resolve: {
    conditions: ["module", "browser", "development"],
    dedupe: ["svelte"],
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/dist/**", "**/.svelte-kit/**"],
  },
});
