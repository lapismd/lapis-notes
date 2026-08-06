#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8"));
const skip = new Set([
  "api-helpers--helpers",
  "api-confirm-dialog--cancel",
]);
const ids = Object.keys(index.entries ?? {}).filter(
  (id) => id.startsWith("api-") && !id.includes("--docs") && !skip.has(id),
);
const args = [
  "exec",
  "visual-delta",
  "update",
  "--baseline-path-mode",
  "nested-import",
  "--approved",
  ...ids.flatMap((id) => ["--story-id", id]),
];
const result = spawnSync("pnpm", args, {
  stdio: "inherit",
  env: { ...process.env, VISUAL_UPDATE_APPROVED: "1" },
});
process.exit(result.status ?? 1);
