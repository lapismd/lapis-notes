#!/usr/bin/env node
import {
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

const storyIds = selectVisualStoryIds(
  requestedStoryPrefixes(process.argv.slice(2)),
);
if (storyIds.length === 0) {
  throw new Error("No API or workspace visual stories were found");
}

const result = withStagedDesignCore(() =>
  spawnInRepo("pnpm", [
    "exec",
    "visual-delta",
    "test",
    "--baseline-path-mode",
    "nested-import",
    ...storyIds.flatMap((id) => ["--story-id", id]),
  ]),
);

process.exit(result?.status === 0 ? 0 : 1);
