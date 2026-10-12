#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CI_IMAGE_MANIFEST,
  validateCiImageManifest,
} from "./lib/ci-images.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = process.argv[2];
if (!/^sha256:[a-f0-9]{64}$/.test(digest ?? "")) {
  throw new Error("Usage: update-ci-image-manifest.mjs sha256:<digest>");
}

const manifestPath = path.join(root, CI_IMAGE_MANIFEST);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.dependencies.digest = digest;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await validateCiImageManifest(root, { requireDependencyDigest: true });
console.log(
  `Pinned dependency image ${manifest.dependencies.image}@${digest}.`,
);
