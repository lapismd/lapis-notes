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

test("published foundations stay on npm even in a mixed local manifest", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "lapis-foundation-ranges-"),
  );
  const manifestPath = path.join(root, ".release/npm/manifest.json");
  await mkdir(path.dirname(manifestPath), { recursive: true });
  const ranges = {
    "@lapismd/design-core": "^0.3.1",
    "@lapismd/mira": "~0.0.3",
    "@lapismd/mira-editor": "~0.0.2",
    "@lapismd/spec-validator": "^0.1.4",
  };
  const entries = Object.keys(ranges).map((packageName) => ({
    packageName,
    tarball: `.release/npm/${packageName.split("/")[1]}.tgz`,
  }));
  entries.push({
    packageName: "@lapis-notes/search",
    tarball: ".release/npm/search.tgz",
  });
  await writeFile(manifestPath, JSON.stringify(entries));
  try {
    const manifest = {
      dependencies: { ...ranges, "@lapis-notes/search": "^0.1.1" },
      devDependencies: { ...ranges },
      optionalDependencies: { ...ranges },
      peerDependencies: { ...ranges },
    };
    createHooks({ LAPIS_PLUGIN_TARBALL_MANIFEST: manifestPath }).readPackage(
      manifest,
    );
    for (const field of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      for (const [name, range] of Object.entries(ranges))
        assert.equal(manifest[field][name], range);
    }
    assert.equal(
      manifest.dependencies["@lapis-notes/search"],
      `file:${path.join(root, ".release/npm/search.tgz")}`,
    );
    const {
      selectLocalPluginReleaseEntries,
    } = require("./local-plugin-pnpmfile.cjs");
    assert.deepEqual(
      selectLocalPluginReleaseEntries(entries).map(
        (entry) => entry.packageName,
      ),
      ["@lapis-notes/search"],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
