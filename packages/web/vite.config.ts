import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, searchForWorkspaceRoot } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Keep these host-build values aligned with the public plugin-asset contract.
// Importing the browser API package while Vite evaluates its Node config would
// execute the packaged ESM entry before Vite can resolve its extensionless
// Svelte-package imports.
const WEB_PLUGIN_ASSET_ROUTE_PREFIX = "/__lapis/plugins";
const WEB_PLUGIN_ASSET_CACHE_NAME = "lapis-plugin-assets-v1";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = searchForWorkspaceRoot(packageRoot);
const linkedDesignCoreRoot = realpathSync(
  path.join(packageRoot, "node_modules", "@lapismd", "design-core"),
);
const linkedMiraWorkspaceRoot = searchForWorkspaceRoot(
  realpathSync(path.join(workspaceRoot, "node_modules", "@lapismd", "mira")),
);
const crossOriginIsolationHeaders = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
};
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

export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_COMMIT_HASH": JSON.stringify(
      process.env.LAPIS_BUILD_COMMIT ?? "local",
    ),
  },
  plugins: [
    tailwindcss(),
    svelte(),
    VitePWA({
      injectRegister: false,
      registerType: "prompt",
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "pwa-1024x1024.png",
        "pwa-1024x1024-maskable.png",
      ],
      manifest: {
        id: "/",
        name: "Lapis Notes",
        short_name: "Lapis",
        description: "Installable offline-first Lapis Notes web app.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        background_color: "#f6f6f6",
        theme_color: "#f6f6f6",
        protocol_handlers: [{ protocol: "web+lapis", url: "/open?url=%s" }],
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-1024x1024.png",
            sizes: "1024x1024",
            type: "image/png",
          },
          {
            src: "pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa-1024x1024-maskable.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        navigateFallback: "index.html",
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webmanifest,woff2,woff,ttf,wasm}",
        ],
        globIgnores: ["**/sw.js", "**/workbox-*.js"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              url.pathname.startsWith(`${WEB_PLUGIN_ASSET_ROUTE_PREFIX}/`),
            handler: "CacheOnly",
            options: { cacheName: WEB_PLUGIN_ASSET_CACHE_NAME },
          },
        ],
      },
      devOptions: { enabled: false, type: "module" },
    }),
  ],
  server: {
    port: 4174,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
    fs: { allow: [workspaceRoot, linkedDesignCoreRoot, linkedMiraWorkspaceRoot] },
  },
  preview: {
    port: 4174,
    strictPort: true,
    headers: crossOriginIsolationHeaders,
  },
  worker: { format: "es" },
  resolve: { dedupe: rendererSingletonPackages },
  build: {
    target: "es2022",
    sourcemap: false,
    minify: false,
    reportCompressedSize: false,
    outDir: "dist",
  },
});
