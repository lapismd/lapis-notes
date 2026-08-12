import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const electronBuilderCli = require.resolve("electron-builder/cli.js");
const patchModule = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "./electron-builder-collector-fallback.cjs",
);

const result = spawnSync(
  process.execPath,
  ["--require", patchModule, electronBuilderCli, ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
