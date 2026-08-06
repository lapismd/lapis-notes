#!/usr/bin/env node
/**
 * Regenerate API and workspace visual-pending baselines with Visual Delta.
 *
 * Docker stages only this repository, while design-core is a permanent sibling
 * dependency. Capture temporarily copies that sibling into `.deps/design-core`
 * and retargets the root dependency/override. Package manifests keep their
 * portable `*` dependency declarations.
 *
 * Pass one or more `--story-prefix <prefix>` options to update a narrow family
 * without rewriting existing baselines. With no prefix, both `api-` and
 * `workspace-shell-` stories are selected.
 */
import { spawnSync } from "node:child_process";
import {
  repoRoot,
  selectVisualStoryIds,
  spawnInRepo,
  withStagedDesignCore,
} from "./visual-design-core-stage.mjs";

function requestedStoryPrefixes(args) {
  const prefixes = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== "--story-prefix") {
      throw new Error(`Unknown option: ${args[index]}`);
    }
    const prefix = args[index + 1];
    if (!prefix) throw new Error("--story-prefix requires a value");
    prefixes.push(prefix);
    index += 1;
  }
  return prefixes.length > 0 ? prefixes : ["api-", "workspace-shell-"];
}

const prefixes = requestedStoryPrefixes(process.argv.slice(2));
const ids = selectVisualStoryIds(prefixes);

if (ids.length === 0) {
  throw new Error(`No Storybook stories matched: ${prefixes.join(", ")}`);
}

const result = withStagedDesignCore(() => {
  const args = [
    "exec",
    "visual-delta",
    "update",
    "--baseline-path-mode",
    "nested-import",
    "--approved",
    ...ids.flatMap((id) => ["--story-id", id]),
  ];
  return spawnSync("pnpm", args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, VISUAL_UPDATE_APPROVED: "1" },
  });
});

process.exit(result?.status === 0 ? 0 : 1);
