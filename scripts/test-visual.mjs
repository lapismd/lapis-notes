#!/usr/bin/env node
import {
  selectVisualStoryIds,
  spawnInRepo,
  withStagedDesignCore,
} from "./visual-design-core-stage.mjs";

const storyIds = selectVisualStoryIds();
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
