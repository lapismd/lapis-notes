import assert from "node:assert/strict";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { assertDesktopReleaseJobsRemoved } from "./check-desktop-release-workflow.mjs";

const workflow = new URL(
  "../.github/workflows/desktop-release.yml",
  import.meta.url,
);

test("notes does not run desktop release jobs", () => {
  assert.equal(existsSync(workflow), false);
  assert.doesNotThrow(() => assertDesktopReleaseJobsRemoved());
});

test("desktop release checker rejects a restored workflow file", () => {
  const root = mkdtempSync(path.join(tmpdir(), "notes-desktop-release-"));
  const file = path.join(root, "desktop-release.yml");
  writeFileSync(file, "jobs: {}\n");
  assert.throws(
    () => assertDesktopReleaseJobsRemoved(pathToFileURL(file)),
    /must not remain/,
  );
});
