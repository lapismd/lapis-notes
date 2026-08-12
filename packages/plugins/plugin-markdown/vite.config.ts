/// <reference types="vitest" />

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [
      { find: "$lib", replacement: path.resolve(packageDir, "src/lib") },
      {
        find: /^lucide-static\/tags\.json$/,
        replacement: path.resolve(packageDir, "test/lucide-tags.stub.ts"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
