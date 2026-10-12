import assert from "node:assert/strict";
import { test } from "node:test";
import * as runtimeWarnings from "./storybook-runtime-warnings.mjs";
const { assertNoFatalStorybookRuntimeWarning } = runtimeWarnings;

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

for (const [name, args] of [
  ["formatted diagnostic", ["%c[svelte]%c derived_inert", "color: orange", ""]],
  ["diagnostic URL", ["https://svelte.dev/e/derived_inert"]],
  [
    "Error diagnostic",
    [new Error("https://svelte.dev/e/effect_update_depth_exceeded")],
  ],
  ["other Svelte warning", ["[svelte] state_proxy_equality_mismatch"]],
]) {
  test(`fails on ${name}`, () => {
    assert.throws(
      () => assertNoFatalStorybookRuntimeWarning(args),
      /fatal Svelte runtime/,
    );
  });
}

test("caught teardown diagnostics remain fatal until inspected", () => {
  const warnings = [],
    errors = [];
  const target = {
    warn: (...args) => warnings.push(args),
    error: (...args) => errors.push(args),
  };
  const originalWarn = target.warn,
    originalError = target.error;
  const guard =
    runtimeWarnings.installFatalStorybookRuntimeWarningGuard(target);
  try {
    target.warn("unrelated warning");
    try {
      target.warn("[svelte] derived_inert");
    } catch {}
    try {
      target.error(
        new Error("https://svelte.dev/e/effect_update_depth_exceeded"),
      );
    } catch {}
    assert.equal(warnings.length, 2);
    assert.equal(errors.length, 1);
    assert.throws(
      () => guard.assertClean(),
      /derived_inert[\s\S]*effect_update_depth_exceeded/,
    );
    assert.doesNotThrow(() => guard.assertClean());
  } finally {
    guard.dispose();
  }
  assert.equal(target.warn, originalWarn);
  assert.equal(target.error, originalError);
  assert.doesNotThrow(() => target.warn("[svelte] derived_inert"));
});

test("disposal preserves a newer console owner", () => {
  const target = { warn() {}, error() {} };
  const guard =
    runtimeWarnings.installFatalStorybookRuntimeWarningGuard(target);
  const replacement = () => {};
  target.warn = replacement;
  guard.dispose();
  guard.dispose();
  assert.equal(target.warn, replacement);
});
