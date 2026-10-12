import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const CI_IMAGE_MANIFEST = ".ci/images.json";

export async function sha256File(filePath) {
  return createHash("sha256")
    .update(await readFile(filePath))
    .digest("hex");
}

export function dependencyImageTag(lockfileSha256) {
  assertSha256(lockfileSha256, "lockfile SHA-256");
  return `lock-${lockfileSha256.slice(0, 16)}`;
}

export async function loadCiImageManifest(root) {
  return JSON.parse(await readFile(path.join(root, CI_IMAGE_MANIFEST), "utf8"));
}

export async function validateCiImageManifest(
  root,
  { requireDependencyDigest = false } = {},
) {
  const manifest = await loadCiImageManifest(root);
  if (manifest.schemaVersion !== 1) {
    throw new Error("CI image manifest schemaVersion must be 1.");
  }

  assertImage(manifest.base, "base", true);
  assertImage(manifest.dependencies, "dependencies", requireDependencyDigest);

  const lockfileSha256 = await sha256File(path.join(root, "pnpm-lock.yaml"));
  if (manifest.dependencies.lockfileSha256 !== lockfileSha256) {
    throw new Error("Dependency image manifest is stale for pnpm-lock.yaml.");
  }
  const expectedTag = dependencyImageTag(lockfileSha256);
  if (manifest.dependencies.tag !== expectedTag) {
    throw new Error(`Dependency image tag must be ${expectedTag}.`);
  }

  return manifest;
}

function assertImage(value, label, requireDigest) {
  if (!value || !/^ghcr\.io\/lapismd\/[a-z0-9-]+$/.test(value.image ?? "")) {
    throw new Error(`${label} image must be a lapismd GHCR image.`);
  }
  if (!value.tag || /(^|:)latest$/.test(value.tag)) {
    throw new Error(`${label} image must have an immutable tag.`);
  }
  if (value.digest !== null || requireDigest) {
    assertSha256(value.digest, `${label} image digest`);
  }
}

function assertSha256(value, label) {
  if (
    !/^sha256:[a-f0-9]{64}$/.test(value ?? "") &&
    !/^[a-f0-9]{64}$/.test(value ?? "")
  ) {
    throw new Error(`${label} must be a SHA-256 value.`);
  }
}
