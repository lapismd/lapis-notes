/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const packageDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() })],
  resolve: {
    conditions: ["module", "browser", "development"],
    dedupe: ["svelte"],
    alias: [
      {
        find: /^lucide-static\/tags\.json$/,
        replacement: path.join(packageDir, "test/lucide-tags.stub.ts"),
      },
      {
        find: /^@lapis-notes\/api$/,
        replacement: path.join(packageDir, "test/api-types.stub.ts"),
      },
      {
        find: /^@lapis-notes\/workspace$/,
        replacement: path.join(packageDir, "src/lib/index.ts"),
      },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/vitest.setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.svelte-kit/**"],
  },
  ssr: {
    noExternal: [
      "@dnd-kit/svelte",
      "@lucide/svelte",
      "@lapismd/design-core",
      "bits-ui",
      "paneforge",
      "vaul-svelte",
    ],
  },
});
