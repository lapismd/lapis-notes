import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createTargetManifest,
  assembleDesktopManifest,
  verifyDesktopArtifacts,
  validateDesktopTag,
} from "./desktop-release.mjs";

const version = "2026.31.5";
const sourceCommit = "a".repeat(40);
const targets = [
  "aarch64-apple-darwin",
  "aarch64-unknown-linux-gnu",
  "x86_64-unknown-linux-gnu",
];

async function fixture(run) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "lapis-desktop-release-"),
  );
  try {
    const manifests = [];
    for (const target of targets) {
      const platform = target.includes("darwin") ? "macos" : "linux";
      const architecture = target.startsWith("aarch64") ? "arm64" : "x64";
      await writeFile(
        path.join(
          directory,
          `Lapis-Notes-${version}-${platform}-${architecture}.${platform === "macos" ? "zip" : "tar.gz"}`,
        ),
        target,
      );
      manifests.push(
        await createTargetManifest({
          directory,
          version,
          sourceCommit,
          target,
        }),
      );
    }
    await run({ directory, manifests });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("desktop tags must exactly match the private application version", () => {
  assert.equal(validateDesktopTag(`desktop-v${version}`, version), version);
  assert.throws(() => validateDesktopTag("api@0.1.3", version), /desktop tag/);
  assert.throws(
    () => validateDesktopTag("desktop-v2026.31.6", version),
    /match/,
  );
});

test("assembles three source-bound targets and verifies actual artifact bytes", async () =>
  fixture(async ({ directory, manifests }) => {
    const manifest = assembleDesktopManifest(manifests);
    assert.equal(manifest.artifacts.length, 3);
    assert.equal(manifest.sourceCommit, sourceCommit);
    assert.equal(manifest.tag, `desktop-v${version}`);
    assert.match(
      manifest.artifacts[0].url,
      /^https:\/\/github.com\/lapismd\/lapis-notes\/releases\/download\/desktop-v/,
    );
    await verifyDesktopArtifacts(manifest, directory);
  }));

test("rejects missing and duplicate target qualification", async () =>
  fixture(async ({ manifests }) => {
    assert.throws(
      () => assembleDesktopManifest(manifests.slice(1)),
      /three targets/,
    );
    assert.throws(
      () => assembleDesktopManifest([...manifests.slice(1), manifests[1]]),
      /duplicate/,
    );
  }));

test("rejects deferred Intel macOS packaging and qualification", async () => {
  await assert.rejects(
    createTargetManifest({
      directory: ".",
      version,
      sourceCommit,
      target: "x86_64-apple-darwin",
    }),
    /Unsupported desktop target/,
  );
  await fixture(async ({ manifests }) => {
    const changed = structuredClone(manifests);
    changed[0].artifacts[0].target = "x86_64-apple-darwin";
    assert.throws(() => assembleDesktopManifest(changed), /Unsupported/);
    assert.throws(
      () => assembleDesktopManifest([...manifests, changed[0]]),
      /three targets/,
    );
  });
});

test("rejects mixing source commits or application versions", async () =>
  fixture(async ({ manifests }) => {
    const changed = structuredClone(manifests);
    changed[0].sourceCommit = "b".repeat(40);
    assert.throws(() => assembleDesktopManifest(changed), /source/);
    changed[0].sourceCommit = sourceCommit;
    changed[0].version = "2026.31.6";
    assert.throws(() => assembleDesktopManifest(changed), /version/);
  }));

test("rejects tampered release archives before publication", async () =>
  fixture(async ({ directory, manifests }) => {
    const manifest = assembleDesktopManifest(manifests);
    await writeFile(
      path.join(directory, manifest.artifacts[0].file),
      "tampered",
    );
    await assert.rejects(
      verifyDesktopArtifacts(manifest, directory),
      /checksum|size/,
    );
  }));
