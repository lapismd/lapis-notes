import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, searchForWorkspaceRoot } from "vite";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const linkedDesignCoreRoot = realpathSync(
  path.join(packageRoot, "node_modules", "@lapismd", "design-core"),
);
const rendererFileSystemAllow = [
  searchForWorkspaceRoot(packageRoot),
  linkedDesignCoreRoot,
];

const crossOriginIsolationHeaders = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
};

export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  clearScreen: false,
  envPrefix: ["VITE_", "ELECTRON_"],
  plugins: [tailwindcss(), svelte()],
  server: {
    port: 1421,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
    fs: {
      allow: rendererFileSystemAllow,
    },
  },
  preview: {
    port: 1421,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
  },
  worker: { format: "es" },
  resolve: {
    dedupe: ["svelte"],
  },
  build: {
    target: "es2022",
    sourcemap: false,
    minify: false,
    reportCompressedSize: false,
    outDir: "dist",
  },
}));
