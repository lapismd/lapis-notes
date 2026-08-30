import assert from "node:assert/strict";
import { test } from "node:test";
import { assertNoFatalStorybookRuntimeWarning } from "./storybook-runtime-warnings.mjs";

test("fails on Svelte derived lifecycle warnings", () => {
  assert.throws(
    () =>
      assertNoFatalStorybookRuntimeWarning([
        "[svelte] derived_inert",
        "Reading a derived belonging to a now-destroyed effect may result in stale values",
      ]),
    /fatal Svelte runtime warning: \[svelte\] derived_inert/,
  );
});

test("allows unrelated console warnings", () => {
  assert.doesNotThrow(() =>
    assertNoFatalStorybookRuntimeWarning(["unrelated warning"]),
  );
});
