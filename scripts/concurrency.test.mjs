import assert from "node:assert/strict";
import test from "node:test";

import { resolveTurboConcurrency } from "./lib/concurrency.mjs";

test("Turbo defaults to half the processors capped at four", () => {
  assert.equal(resolveTurboConcurrency({}, 1), "1");
  assert.equal(resolveTurboConcurrency({}, 6), "3");
  assert.equal(resolveTurboConcurrency({}, 32), "4");
});

test("Turbo accepts numeric and percentage overrides", () => {
  assert.equal(resolveTurboConcurrency({ TURBO_CONCURRENCY: "2" }, 32), "2");
  assert.equal(
    resolveTurboConcurrency({ TURBO_CONCURRENCY: "50%" }, 32),
    "50%",
  );
  assert.throws(
    () => resolveTurboConcurrency({ TURBO_CONCURRENCY: "0" }, 4),
    /positive integer/,
  );
});
