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

test("verified pin updates every mapped chapter and is idempotent", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  const publishedDigest = `sha256:${"b".repeat(64)}`;
  const first = await runImageUpdater(root, publishedDigest);
  assert.equal(first.status, 0, first.stderr);
  const manifest = await validateCiImageManifest(root);
  const snapshots = new Map();
  for (const chapter of ["architecture", "packages", "spec-governance"]) {
    const file = path.join(root, `spec/src/${chapter}.md`);
    const source = await readFile(file, "utf8");
    assert.ok(source.startsWith(`# ${chapter}\n\nExisting policy.\n`));
    assert.ok(
      source.includes(`ghcr.io/lapismd/lapis-notes-ci@${publishedDigest}`),
    );
    assert.ok(source.includes(manifest.dependencies.tag));
    assert.ok(source.includes(manifest.dependencies.lockfileSha256));
    snapshots.set(file, source);
  }
  const repeated = await runImageUpdater(root, publishedDigest);
  assert.equal(repeated.status, 0, repeated.stderr);
  for (const [file, source] of snapshots) {
    assert.equal(await readFile(file, "utf8"), source);
  }
  const nextDigest = `sha256:${"c".repeat(64)}`;
  const refreshed = await runImageUpdater(root, nextDigest);
  assert.equal(refreshed.status, 0, refreshed.stderr);
  for (const file of snapshots.keys()) {
    const source = await readFile(file, "utf8");
    assert.ok(source.includes(nextDigest));
    assert.ok(!source.includes(publishedDigest));
    assert.equal(source.split("<!-- ci-dependency-image:start -->").length, 2);
  }
});

test("missing mapped chapter prevents a partial manifest update", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifestPath = path.join(root, ".ci/images.json");
  const chapterPath = path.join(root, "spec/src/architecture.md");
  const manifestBefore = await readFile(manifestPath, "utf8");
  const chapterBefore = await readFile(chapterPath, "utf8");
  await rm(path.join(root, "spec/src/spec-governance.md"));
  const result = await runImageUpdater(root, `sha256:${"b".repeat(64)}`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /spec-governance/);
  assert.equal(await readFile(manifestPath, "utf8"), manifestBefore);
  assert.equal(await readFile(chapterPath, "utf8"), chapterBefore);
});

test("malformed snapshot markers prevent any pin or chapter rewrite", async (t) => {
  const root = await fixtureRepository();
  t.after(() => rm(root, { recursive: true, force: true }));
  const chapterPath = path.join(root, "spec/src/packages.md");
  await writeFile(
    chapterPath,
    "# Packages\n<!-- ci-dependency-image:start -->\n",
  );
  const paths = [
    ".ci/images.json",
    "spec/src/architecture.md",
    "spec/src/packages.md",
    "spec/src/spec-governance.md",
  ];
  const before = await Promise.all(
    paths.map((file) => readFile(path.join(root, file), "utf8")),
  );
  const result = await runImageUpdater(root, `sha256:${"b".repeat(64)}`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid CI dependency-image markers/);
  assert.deepEqual(
    await Promise.all(
      paths.map((file) => readFile(path.join(root, file), "utf8")),
    ),
    before,
  );
});

test("automation stages all mapped pin outputs and checks them for changes", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/dependency-image.yml", import.meta.url),
    "utf8",
  );
  const paths = workflow
    .match(/pin_paths=\(([\s\S]*?)\)/)?.[1]
    .trim()
    .split(/\s+/);
  assert.ok(paths, "The automation must declare its complete pin output set.");
  for (const output of [
    ".ci/images.json",
    "spec/src/architecture.md",
    "spec/src/packages.md",
    "spec/src/spec-governance.md",
  ]) {
    assert.ok(paths.includes(output), `Automation omits ${output}`);
  }
  assert.ok(workflow.includes('git diff --quiet -- "${pin_paths[@]}"'));
  assert.ok(workflow.includes('git add -- "${pin_paths[@]}"'));
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
  await mkdir(path.join(root, "spec/src"), { recursive: true });
  for (const chapter of ["architecture", "packages", "spec-governance"]) {
    await writeFile(
      path.join(root, `spec/src/${chapter}.md`),
      `# ${chapter}\n\nExisting policy.\n`,
    );
  }
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
