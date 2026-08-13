import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [path.join(packageRoot, "src-electron/main.ts")],
  outfile: path.join(packageRoot, "dist-electron/main.js"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  sourcemap: true,
  external: [
    "electron",
    "chokidar",
    "@huggingface/transformers",
    "@tursodatabase/database",
    "@tursodatabase/database-wasm",
    "@tursodatabase/database-wasm/bundle",
    "@tursodatabase/database-wasm/vite",
  ],
});

console.log("[electron] main process bundle written");
