import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const { createHooks } = require("./local-plugin-pnpmfile.cjs");

test("leaves registry ranges unchanged without a local release manifest", () => {
  const manifest = { dependencies: { "@lapis-notes/search": "^0.1.1" } };
  createHooks({}).readPackage(manifest);
  assert.equal(manifest.dependencies["@lapis-notes/search"], "^0.1.1");
});

test("redirects only plugin consumers to packed release candidates", async () => {
  const releaseDirectory = await mkdtemp(
    path.join(os.tmpdir(), "lapis-plugin-tarballs-"),
  );
  const manifestPath = path.join(
    releaseDirectory,
    ".release/npm/manifest.json",
  );
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(
    manifestPath,
    JSON.stringify([
      {
        packageName: "@lapis-notes/search",
        tarball: ".release/npm/lapis-notes-search-0.1.1.tgz",
      },
    ]),
  );

  try {
    const manifest = {
      dependencies: {
        "@lapis-notes/api": "^0.1.0",
        "@lapis-notes/search": "^0.1.1",
      },
      devDependencies: { "@lapis-notes/search": "^0.1.1" },
      optionalDependencies: { "@lapis-notes/search": "^0.1.1" },
      peerDependencies: {
        "@lapis-notes/search": "^0.1.1",
        "@lapis-notes/ui": "^0.1.0",
      },
    };
    createHooks({ LAPIS_PLUGIN_TARBALL_MANIFEST: manifestPath }).readPackage(
      manifest,
    );
    assert.equal(
      manifest.dependencies["@lapis-notes/search"],
      `file:${path.join(releaseDirectory, ".release/npm/lapis-notes-search-0.1.1.tgz")}`,
    );
    const tarball = `file:${path.join(releaseDirectory, ".release/npm/lapis-notes-search-0.1.1.tgz")}`;
    assert.equal(manifest.devDependencies["@lapis-notes/search"], tarball);
    assert.equal(manifest.optionalDependencies["@lapis-notes/search"], tarball);
    assert.equal(manifest.dependencies["@lapis-notes/api"], "^0.1.0");
    assert.equal(manifest.peerDependencies["@lapis-notes/search"], "^0.1.1");
    assert.equal(manifest.peerDependencies["@lapis-notes/ui"], "^0.1.0");
  } finally {
    await rm(releaseDirectory, { recursive: true, force: true });
  }
});
