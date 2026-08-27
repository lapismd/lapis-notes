import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const candidates = [
  process.env.DENO_BIN?.trim(),
  join(
    homedir(),
    ".deno",
    "bin",
    process.platform === "win32" ? "deno.exe" : "deno",
  ),
  "deno",
].filter(Boolean);
const deno = candidates.find(
  (candidate) => candidate === "deno" || existsSync(candidate),
);
if (!deno) throw new Error("Deno executable not found");

const result = spawnSync(
  deno,
  [
    "run",
    "--allow-all",
    "--node-modules-dir=none",
    "--sloppy-imports",
    "src-deno/app-database-worker.smoke.ts",
  ],
  { cwd: new URL("..", import.meta.url), encoding: "utf8" },
);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
