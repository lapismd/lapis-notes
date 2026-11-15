import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const web = createRequire(
  new URL("../packages/web/package.json", import.meta.url),
);
const pwa = createRequire(web.resolve("vite-plugin-pwa"));
const workbox = createRequire(pwa.resolve("workbox-build"));
const { glob } = workbox("glob");
const { getManifest } = pwa("workbox-build");

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), "notes-pwa-security-"));
  try {
    for (const name of ["one", "two", "three"]) {
      await mkdir(path.join(root, name, "nested"), { recursive: true });
      await writeFile(path.join(root, name, "nested", "index.html"), name);
    }
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("Workbox retains its actual glob manifest API and matching files", async () => {
  await fixture(async (root) => {
    const result = await getManifest({
      globDirectory: root,
      globPatterns: ["**/*.html"],
    });
    assert.deepEqual(result.warnings, []);
    assert.deepEqual(result.manifestEntries.map(({ url }) => url).sort(), [
      "one/nested/index.html",
      "three/nested/index.html",
      "two/nested/index.html",
    ]);
    assert.ok(
      result.manifestEntries.every(
        ({ revision }) => typeof revision === "string" && revision.length > 0,
      ),
    );
  });
});

test("Workbox's resolved glob stops filesystem traversal after cancellation", async () => {
  await fixture(async (root) => {
    const controller = new AbortController();
    let reads = 0;
    const observed = {
      ...fs,
      readdir(directory, options, callback) {
        reads += 1;
        fs.readdir(directory, options, (error, entries) => {
          if (reads === 1) controller.abort(new Error("cancelled traversal"));
          callback(error, entries);
        });
      },
    };
    await assert.rejects(
      glob("**/*", { cwd: root, fs: observed, signal: controller.signal }),
      /cancelled traversal|abort/i,
    );
    const stopped = reads;
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(
      reads,
      stopped,
      "cancelled traversal must not continue reading directories",
    );
  });
});
