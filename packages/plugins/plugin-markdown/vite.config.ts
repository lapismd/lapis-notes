/// <reference types="vitest" />

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [{ find: "$lib", replacement: path.resolve(packageDir, "src/lib") }],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
