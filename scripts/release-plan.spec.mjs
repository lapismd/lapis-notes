import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planReleaseCandidates,
} from "./release-plan.mjs";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

function records() {
  return PUBLIC_PACKAGE_GRAPH.map((definition) => ({
    ...definition,
    version: "0.1.0",
    manifest: {
      name: definition.name,
      version: "0.1.0",
    },
  }));
}

test("selects unpublished public packages in graph order", () => {
  const packageRecords = records();
  const plan = planReleaseCandidates(
    packageRecords,
    packageRecords.map((record) => ({
      name: record.name,
      version: record.version,
      published: false,
      registryEmpty: true,
    })),
  );
  assert.deepEqual(
    plan.selected.map((entry) => entry.name),
    ["@lapis-notes/ui", "@lapis-notes/api", "@lapis-notes/workspace"],
  );
  assert.equal(plan.bootstrapRequired, true);
});

test("skips versions already present on npm", () => {
  const packageRecords = records();
  const plan = planReleaseCandidates(
    packageRecords,
    packageRecords.map((record) => ({
      name: record.name,
      version: record.version,
      published: true,
      registryEmpty: false,
      integrity: "sha512-example",
    })),
  );
  assert.equal(plan.selected.length, 0);
  assert.equal(plan.published.length, 3);
});
