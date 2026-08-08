#!/usr/bin/env node
/**
 * Regenerate API and workspace visual-pending baselines with Visual Delta.
 *
 * Docker stages only this repository, while design-core and Mira packages are
 * permanent sibling dependencies. Capture temporarily copies those siblings
 * into `.deps/` and retargets the root dependency/overrides. Package manifests
 * keep their portable `*` dependency declarations.
 *
 * Pass one or more `--story-prefix <prefix>` options to update a narrow family
 * without rewriting existing baselines. With no prefix, the `api-`,
 * `workspace-shell-`, and `workspace-lapis-editor-demo-` stories are selected.
 * Markdown panel stories are `skip-visual` until Visual Delta capture is resumed.
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
    if (args[index] === "--") continue;
    if (args[index] !== "--story-prefix") {
      throw new Error(`Unknown option: ${args[index]}`);
    }
    const prefix = args[index + 1];
    if (!prefix) throw new Error("--story-prefix requires a value");
    prefixes.push(prefix);
    index += 1;
  }
  return prefixes.length > 0 ? prefixes : undefined;
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
