import { createReadStream, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";

const crossOriginIsolationHeaders = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

function wasmHeadersPlugin(): Plugin {
  const applyHeaders = (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    if ((request.url ?? "").split("?")[0]?.endsWith(".wasm")) {
      response.setHeader("Content-Type", "application/wasm");
      response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    }
    next();
  };
  return {
    name: "lapis-metadata-performance-wasm-headers",
    configureServer(server) {
      server.middlewares.use(applyHeaders);
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        const fixturePath = process.env.LAPIS_METADATA_PERFORMANCE_FIXTURE;
        if (
          fixturePath &&
          (request.url ?? "").split("?")[0] === "/__metadata_fixture.turso"
        ) {
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/octet-stream");
          response.setHeader("Content-Length", statSync(fixturePath).size);
          response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
          createReadStream(fixturePath).pipe(response);
          return;
        }
        applyHeaders(request, response, next);
      });
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL("../packages/api/performance", import.meta.url)),
  plugins: [wasmHeadersPlugin()],
  define: { "process.env.NODE_DEBUG_NATIVE": "false" },
  esbuild: { target: "esnext" },
  optimizeDeps: {
    exclude: [
      "@tursodatabase/database-wasm/vite",
      "@tursodatabase/database-wasm-common",
    ],
    esbuildOptions: { target: "esnext" },
  },
  worker: { format: "es" },
  assetsInclude: ["**/*.wasm"],
  build: { target: "es2022", minify: false },
  server: { headers: crossOriginIsolationHeaders },
  preview: { headers: crossOriginIsolationHeaders },
});
