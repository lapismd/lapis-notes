/**
 * Prepare-dist-electron.mjs
 *
 * Writes dist-electron/package.json with {"type":"commonjs"} so that the
 * TypeScript-compiled CommonJS output (which uses `require`/`exports`) is not
 * mistakenly treated as ES modules when the package root has "type":"module".
 */

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist-electron");
const mcpShimSource = path.join(
  path.dirname(createRequire(import.meta.url).resolve("@lapismd/ai-host/package.json")),
  "dist/mcp-shim.js",
);
const mcpShimDestination = path.join(distDir, "mcp-shim.mjs");

fs.mkdirSync(distDir, { recursive: true });
if (!fs.existsSync(mcpShimSource)) {
  throw new Error(`Missing built MCP shim: ${mcpShimSource}`);
}
fs.copyFileSync(mcpShimSource, mcpShimDestination);
fs.chmodSync(mcpShimDestination, 0o755);
fs.writeFileSync(
  path.join(distDir, "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
);

console.log("[electron] dist-electron metadata and MCP shim written");
