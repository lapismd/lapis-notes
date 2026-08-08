/// <reference types="vitest" />

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const miraSrc = path.resolve(packageDir, "../../../../mira-mde/packages/mira/src");

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [
      { find: "$lib", replacement: path.resolve(packageDir, "src/lib") },
      {
        find: /^@lapismd\/mira\/preview\/frontmatter$/,
        replacement: path.join(miraSrc, "preview/frontmatter/index.ts"),
      },
      {
        find: /^@lapismd\/mira\/preview$/,
        replacement: path.join(miraSrc, "preview/index.ts"),
      },
      {
        find: /^@lapismd\/mira\/codemirror$/,
        replacement: path.join(miraSrc, "codemirror.ts"),
      },
      {
        find: /^@lapismd\/mira\/extensions$/,
        replacement: path.join(miraSrc, "extensions/index.ts"),
      },
      {
        find: /^@lapismd\/mira\/core$/,
        replacement: path.join(miraSrc, "core/index.ts"),
      },
      {
        find: /^@lapismd\/mira$/,
        replacement: path.join(miraSrc, "index.ts"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
