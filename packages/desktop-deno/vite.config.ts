import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, searchForWorkspaceRoot } from "vite";

import { TURSO_WASM_BUNDLE_ESM } from "./src-deno/production-build";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const lapisWorkspaceRoot = searchForWorkspaceRoot(packageRoot);
const linkedDesignCoreRoot = realpathSync(
  path.join(packageRoot, "node_modules", "@lapismd", "design-core"),
);
const linkedMiraWorkspaceRoot = searchForWorkspaceRoot(
  realpathSync(
    path.join(lapisWorkspaceRoot, "node_modules", "@lapismd", "mira"),
  ),
);
const linkedTerminalPluginRoot = realpathSync(
  path.join(packageRoot, "node_modules", "@lapis-notes/lapis-plugin-terminal"),
);
const rendererFileSystemAllow = [
  lapisWorkspaceRoot,
  linkedDesignCoreRoot,
  linkedMiraWorkspaceRoot,
  linkedTerminalPluginRoot,
];
const rendererSingletonPackages = [
  "@codemirror/state",
  "@codemirror/view",
  "@codemirror/language",
  "@codemirror/commands",
  "@codemirror/autocomplete",
  "@codemirror/search",
  "@codemirror/lint",
  "@lezer/common",
  "@lezer/highlight",
  "@lezer/markdown",
  "@lezer/lr",
  "svelte",
];
const crossOriginIsolationHeaders = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
};

export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  clearScreen: false,
  plugins: [tailwindcss(), svelte()],
  server: {
    host: "127.0.0.1",
    port: 1422,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
    fs: {
      allow: rendererFileSystemAllow,
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 1422,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
  },
  worker: { format: "es" },
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["ghostty-web"],
  },
  resolve: {
    dedupe: rendererSingletonPackages,
  },
  build: {
    target: "es2022",
    sourcemap: false,
    minify: false,
    reportCompressedSize: false,
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(packageRoot, "index.html"),
        about: path.resolve(packageRoot, "about.html"),
      },
    },
    commonjsOptions: {
      // Turso publishes this self-contained file as ESM. Let Rollup consume it
      // directly instead of recursively analysing its embedded worker/WASM data.
      exclude: [TURSO_WASM_BUNDLE_ESM],
    },
  },
}));
