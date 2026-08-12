import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const crossOriginIsolationHeaders = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
};

export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  clearScreen: false,
  envPrefix: ["VITE_", "ELECTRON_"],
  plugins: [svelte()],
  server: {
    port: 1421,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
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
