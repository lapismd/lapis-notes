/**
 * Prepare-dist-electron.mjs
 *
 * Writes dist-electron/package.json with {"type":"commonjs"} so that the
 * TypeScript-compiled CommonJS output (which uses `require`/`exports`) is not
 * mistakenly treated as ES modules when the package root has "type":"module".
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist-electron");

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(
  path.join(distDir, "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
);

console.log("[electron] dist-electron/package.json written (type: commonjs)");
