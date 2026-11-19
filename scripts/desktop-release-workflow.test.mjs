import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import {
  assertDesktopReleaseJobsRemoved,
  assertRetiredDesktopSourcesRemoved,
} from "./check-desktop-release-workflow.mjs";

const workflow = new URL(
  "../.github/workflows/desktop-release.yml",
  import.meta.url,
);

test("notes does not run desktop release jobs", () => {
  assert.equal(existsSync(workflow), false);
  assert.doesNotThrow(() => assertDesktopReleaseJobsRemoved());
});

test("notes does not retain the retired desktop implementation", () => {
  assert.doesNotThrow(() => assertRetiredDesktopSourcesRemoved());
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

test("desktop release checker rejects restored implementation sources", () => {
  const root = mkdtempSync(path.join(tmpdir(), "notes-desktop-sources-"));
  mkdirSync(path.join(root, "packages", "desktop-deno"), { recursive: true });
  assert.throws(
    () => assertRetiredDesktopSourcesRemoved(pathToFileURL(root + path.sep)),
    /packages\/desktop-deno/,
  );
});
