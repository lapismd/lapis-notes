import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createLocalPluginInstallFingerprint,
  invalidateLocalPluginConsumerCaches,
  isCurrentLocalPluginInstall,
  localPluginInstallArguments,
  runPreservingFile,
} from "./local-plugin-consumer.mjs";

test("uses a normal lockfile-aware pnpm install", () => {
  assert.deepEqual(localPluginInstallArguments, [
    "install",
    "--no-frozen-lockfile",
    "--prefer-offline",
    "--force",
  ]);
  assert.equal(localPluginInstallArguments.includes("--lockfile=false"), false);
});

test("fingerprints the registry lockfile and each release candidate", () => {
  const entries = [
    {
      packageName: "@lapis-notes/markdown",
      sha256: "abc123",
      version: "0.1.3",
    },
  ];
  const original = createLocalPluginInstallFingerprint("lockfile", entries);

  assert.equal(
    createLocalPluginInstallFingerprint("lockfile", entries),
    original,
  );
  assert.notEqual(
    createLocalPluginInstallFingerprint("changed", entries),
    original,
  );
  assert.notEqual(
    createLocalPluginInstallFingerprint("lockfile", [
      { ...entries[0], version: "0.1.4" },
    ]),
    original,
  );
});

test("recognizes a matching stamped package install", async () => {
  const repositoryRoot = await mkdtemp(
    path.join(os.tmpdir(), "lapis-local-plugin-state-"),
  );
  const installStampPath = path.join(repositoryRoot, "install-stamp.json");
  const releaseEntries = [
    { packageName: "@lapis-notes/markdown", version: "0.1.3" },
  ];
  const packageManifestPath = path.join(
    repositoryRoot,
    "node_modules/@lapis-notes/markdown/package.json",
  );
  await mkdir(path.dirname(packageManifestPath), { recursive: true });
  await writeFile(installStampPath, JSON.stringify({ fingerprint: "current" }));
  await writeFile(packageManifestPath, JSON.stringify({ version: "0.1.3" }));

  try {
    assert.equal(
      await isCurrentLocalPluginInstall({
        expectedFingerprint: "current",
        installStampPath,
        releaseEntries,
        repositoryRoot,
      }),
      true,
    );
    await writeFile(packageManifestPath, JSON.stringify({ version: "0.1.2" }));
    assert.equal(
      await isCurrentLocalPluginInstall({
        expectedFingerprint: "current",
        installStampPath,
        releaseEntries,
        repositoryRoot,
      }),
      false,
    );
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});

test("restores the registry lockfile after a failed install", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "lapis-local-plugin-lock-"),
  );
  const lockfilePath = path.join(directory, "pnpm-lock.yaml");
  await writeFile(lockfilePath, "registry lock\n");

  try {
    await assert.rejects(
      runPreservingFile(
        lockfilePath,
        Buffer.from("registry lock\n"),
        async () => {
          await writeFile(lockfilePath, "local tarball lock\n");
          throw new Error("install failed");
        },
      ),
      /install failed/,
    );
    assert.equal(await readFile(lockfilePath, "utf8"), "registry lock\n");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("invalidates generated consumer caches after a changed install", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "lapis-local-plugin-cache-"),
  );
  const cachePaths = [
    path.join(directory, "node_modules/.vite"),
    path.join(directory, "packages/web/node_modules/.vite"),
  ];
  await Promise.all(
    cachePaths.map(async (cachePath) => {
      await mkdir(cachePath, { recursive: true });
      await writeFile(path.join(cachePath, "stale.js"), "stale");
    }),
  );

  try {
    await invalidateLocalPluginConsumerCaches(cachePaths);
    await Promise.all(
      cachePaths.map(async (cachePath) => {
        await assert.rejects(readFile(path.join(cachePath, "stale.js")));
      }),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
