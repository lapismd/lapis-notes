import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  dependencyImageTag,
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
