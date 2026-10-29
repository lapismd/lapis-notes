import { build } from "esbuild";

await build({
  entryPoints: [
    "index",
    "paths",
    "app-database-worker-protocol",
    "app-database-worker-runtime",
    "native-app-database",
    "language-service",
  ].map((name) => `src/${name}.ts`),
  outdir: "dist",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "node",
  target: "node24",
  external: ["@tursodatabase/database", "@huggingface/transformers"],
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
});
