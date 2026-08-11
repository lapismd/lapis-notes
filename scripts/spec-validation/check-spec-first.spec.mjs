import assert from "node:assert/strict";
import test from "node:test";

import { classifySpecFirstChanges } from "./check-spec-first.mjs";

test("spec tooling and discovery configuration require governance", () => {
  for (const file of [
    "scripts/spec-validation/index.mjs",
    "scripts/spec-validation/index.spec.mjs",
    "scripts/spec-validation/spec-search.mjs",
    ".qmd/index.yml",
    ".gitignore",
  ]) {
    const result = classifySpecFirstChanges([file]);
    assert.equal(result.ok, false);
    assert.deepEqual(result.missingChapters, [
      "spec/src/spec-governance.md",
    ]);
  }
});

test("the governance chapter satisfies validator changes", () => {
  const result = classifySpecFirstChanges([
    "scripts/spec-validation/SUMMARY.mjs",
    "spec/src/spec-governance.md",
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.missingChapters, []);
});
