import assert from "node:assert/strict";
import { test } from "node:test";
import { checkReleaseIntent } from "./check-release-intent.mjs";

test("requires a changeset for public package contract changes", () => {
  assert.throws(
    () =>
      checkReleaseIntent([
        "packages/ui/src/lib/index.ts",
        "packages/ui/README.md",
      ]),
    /Public package changes require a Changeset/,
  );
});

test("accepts public package changes when a changeset is present", () => {
  assert.deepEqual(
    checkReleaseIntent([
      "packages/api/package.json",
      ".changeset/lapis-api.md",
    ]),
    {
      required: true,
      hasChangeset: true,
      files: ["packages/api/package.json"],
    },
  );
});

test("skips generated Changesets release branches", () => {
  assert.deepEqual(
    checkReleaseIntent(["packages/workspace/package.json"], {
      GITHUB_HEAD_REF: "changeset-release/main",
    }),
    {
      required: false,
      hasChangeset: false,
      files: ["packages/workspace/package.json"],
    },
  );
});
