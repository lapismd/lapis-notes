import assert from "node:assert/strict";
import { test } from "node:test";
import { packageReleaseTag } from "./public-packages.mjs";
import { extractChangelogNotes, releaseBody } from "./create-github-releases.mjs";

test("uses package-scoped Lapis release tags", () => {
  assert.equal(packageReleaseTag("@lapis-notes/ui", "0.1.0"), "ui@0.1.0");
  assert.equal(packageReleaseTag("@lapis-notes/api", "0.1.0"), "api@0.1.0");
});

test("documents npm and checksum evidence in release notes", () => {
  const body = releaseBody(
    {
      name: "@lapis-notes/ui",
      directory: "ui",
      version: "0.1.0",
      tag: "next",
      shasum: "a".repeat(64),
      integrity: "sha512-example",
    },
    {
      commit: "abc123",
    },
    "### Minor Changes\n\n- First public release.",
  );
  assert.match(body, /@lapis-notes\/ui@0\.1\.0/);
  assert.match(body, /npm package/);
  assert.match(body, /tarball SHA-256/);
  assert.match(body, /First public release/);
});

test("extracts changelog notes for one version", () => {
  assert.equal(
    extractChangelogNotes(
      "# @lapis-notes/ui\n\n## 0.2.0\n\n- Later\n\n## 0.1.0\n\n- First\n",
      "0.1.0",
    ),
    "- First",
  );
});
