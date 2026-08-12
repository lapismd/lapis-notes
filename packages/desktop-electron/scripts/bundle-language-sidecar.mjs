import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [
    path.join(packageDir, "src-electron/language-service-sidecar-child.ts"),
  ],
  outfile: path.join(
    packageDir,
    "dist-electron/language-service-sidecar-child.js",
  ),
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node22",
  sourcemap: true,
  logLevel: "warning",
});
