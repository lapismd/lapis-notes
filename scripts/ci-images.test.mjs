import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  dependencyImageTag,
  sha256File,
  validateCiImageManifest,
} from "./lib/ci-images.mjs";
import { prepareCiDependencyContext } from "./prepare-ci-dependency-context.mjs";

const digest = "a".repeat(64);

test("dependency image tag is derived from the lockfile hash", () => {
  assert.equal(dependencyImageTag(digest), `lock-${"a".repeat(16)}`);
});

test("dependency context contains manifests and patches but no source", async (t) => {
  const root = await fixtureRepository();
  const outDir = path.join(root, ".ci/context");
  t.after(() => rm(root, { recursive: true, force: true }));

  const metadata = await prepareCiDependencyContext({ root, outDir });

  assert.equal(metadata.tag, dependencyImageTag(metadata.lockfileSha256));
  assert.match(
    await readFile(path.join(outDir, "packages/api/package.json"), "utf8"),
    /lapis-notes\/api/,
  );
  await assert.rejects(
    readFile(path.join(outDir, "packages/api/src/index.ts"), "utf8"),
  );
});

test("image manifest rejects a stale lockfile hash", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "pnpm-lock.yaml"), "changed\n");
  await assert.rejects(validateCiImageManifest(root), /stale/);
});

test("dependency producer refreshes metadata without replacing the old pin", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifestPath = path.join(root, ".ci/images.json");
  const original = await readFile(manifestPath, "utf8");
  await writeFile(path.join(root, "pnpm-lock.yaml"), "changed\n");
  const expectedHash = await sha256File(path.join(root, "pnpm-lock.yaml"));

  const metadata = await prepareCiDependencyContext({ root });
  assert.equal(metadata.lockfileSha256, expectedHash);
  assert.equal(metadata.tag, dependencyImageTag(expectedHash));
  assert.equal(metadata.baseImage, `ghcr.io/lapismd/lapis-ci@sha256:${digest}`);
  assert.equal(await readFile(manifestPath, "utf8"), original);
  await assert.rejects(validateCiImageManifest(root), /stale/);
});

test("verified digest pin refreshes the current lockfile hash and tag", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "pnpm-lock.yaml"), "changed\n");
  const publishedDigest = `sha256:${"b".repeat(64)}`;
  const result = await runImageUpdater(root, publishedDigest);
  assert.equal(result.status, 0, result.stderr);

  const manifest = await validateCiImageManifest(root, {
    requireDependencyDigest: true,
  });
  const expectedHash = await sha256File(path.join(root, "pnpm-lock.yaml"));
  assert.equal(manifest.dependencies.digest, publishedDigest);
  assert.equal(manifest.dependencies.lockfileSha256, expectedHash);
  assert.equal(manifest.dependencies.tag, dependencyImageTag(expectedHash));
  assert.equal(manifest.base.digest, `sha256:${digest}`);
});

test("invalid digest does not rewrite the image manifest", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifestPath = path.join(root, ".ci/images.json");
  const original = await readFile(manifestPath, "utf8");
  const result = await runImageUpdater(root, "invalid");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Usage: update-ci-image-manifest/);
  assert.equal(await readFile(manifestPath, "utf8"), original);
});

test("dependency producer still rejects an invalid base digest", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifestPath = path.join(root, ".ci/images.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.base.digest = null;
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(
    prepareCiDependencyContext({ root }),
    /base image digest/,
  );
});

test("dependency consumers require a published digest", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(
    validateCiImageManifest(root, { requireDependencyDigest: true }),
    /dependencies image digest/,
  );
});

async function runImageUpdater(root, publishedDigest) {
  await mkdir(path.join(root, "scripts/lib"), { recursive: true });
  for (const script of ["update-ci-image-manifest.mjs", "lib/ci-images.mjs"]) {
    await cp(
      new URL(script, import.meta.url),
      path.join(root, "scripts", script),
    );
  }
  return spawnSync(
    process.execPath,
    [path.join(root, "scripts/update-ci-image-manifest.mjs"), publishedDigest],
    { encoding: "utf8" },
  );
}

async function fixtureRepository() {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-notes-ci-images-"));
  await mkdir(path.join(root, ".ci"), { recursive: true });
  await mkdir(path.join(root, "packages/api/src"), { recursive: true });
  await mkdir(path.join(root, "patches"), { recursive: true });
  const lockfile = "lockfileVersion: '9.0'\n";
  await writeFile(path.join(root, "pnpm-lock.yaml"), lockfile);
  const lockfileSha256 = await import("node:crypto").then(({ createHash }) =>
    createHash("sha256").update(lockfile).digest("hex"),
  );
  await writeFile(path.join(root, "package.json"), '{"name":"fixture"}\n');
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    'packages:\n  - "packages/*"\n',
  );
  await writeFile(path.join(root, "patches/example.patch"), "patch\n");
  await writeFile(
    path.join(root, "packages/api/package.json"),
    '{"name":"@lapis-notes/api"}\n',
  );
  await writeFile(path.join(root, "packages/api/src/index.ts"), "export {};\n");
  await writeFile(
    path.join(root, ".ci/dependency-image.Dockerfile"),
    "FROM scratch\n",
  );
  await writeFile(
    path.join(root, ".ci/images.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        base: {
          image: "ghcr.io/lapismd/lapis-ci",
          tag: "test",
          digest: `sha256:${digest}`,
        },
        dependencies: {
          image: "ghcr.io/lapismd/lapis-notes-ci",
          tag: dependencyImageTag(lockfileSha256),
          lockfileSha256,
          digest: null,
        },
      },
      null,
      2,
    )}\n`,
  );
  return root;
}
