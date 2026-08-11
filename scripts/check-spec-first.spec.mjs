import assert from "node:assert/strict";
import test from "node:test";

import { classifySpecFirstChanges } from "./check-spec-first.mjs";

test("validator source and test files require specification governance", () => {
  for (const file of [
    "scripts/spec-validation/index.mjs",
    "scripts/spec-validation/index.spec.mjs",
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
