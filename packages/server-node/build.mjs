import { build } from "esbuild";
import { rm } from "node:fs/promises";
import { runtimeExternalDependencies } from "./runtime-package.mjs";
await rm("dist", { recursive: true, force: true });
await build({
  entryPoints: ["main", "server", "database-worker", "server.smoke"].map(
    (name) => `src/${name}.ts`,
  ),
  outdir: "dist",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "node",
  target: "node24",
  external: runtimeExternalDependencies,
  banner: {
    js: 'import { createRequire as __serverCreateRequire } from "node:module"; const require = __serverCreateRequire(import.meta.url);',
  },
});
