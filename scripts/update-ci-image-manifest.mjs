#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CI_IMAGE_MANIFEST,
  createCiImageManifestCandidate,
  validateCiImageManifest,
} from "./lib/ci-images.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = process.argv[2];
if (!/^sha256:[a-f0-9]{64}$/.test(digest ?? "")) {
  throw new Error("Usage: update-ci-image-manifest.mjs sha256:<digest>");
}

const manifestPath = path.join(root, CI_IMAGE_MANIFEST);
const manifest = await createCiImageManifestCandidate(root, {
  dependencyDigest: digest,
});
const start = "<!-- ci-dependency-image:start -->";
const end = "<!-- ci-dependency-image:end -->";
const snapshot = [
  start,
  "",
  "## Current CI dependency image",
  "",
  `- Image: \`${manifest.dependencies.image}@${digest}\``,
  `- Lockfile tag: \`${manifest.dependencies.tag}\``,
  `- pnpm-lock.yaml SHA-256: \`${manifest.dependencies.lockfileSha256}\``,
  "",
  end,
].join("\n");
const chapterUpdates = await Promise.all(
  ["architecture", "packages", "spec-governance"].map(async (chapter) => {
    const chapterPath = path.join(root, `spec/src/${chapter}.md`);
    const source = await readFile(chapterPath, "utf8");
    const startCount = source.split(start).length - 1;
    const endCount = source.split(end).length - 1;
    if (startCount === 0 && endCount === 0) {
      return [chapterPath, `${source.trimEnd()}\n\n${snapshot}\n`];
    }
    if (
      startCount !== 1 ||
      endCount !== 1 ||
      source.indexOf(start) >= source.indexOf(end)
    ) {
      throw new Error(`Invalid CI dependency-image markers in ${chapterPath}.`);
    }
    return [
      chapterPath,
      source.slice(0, source.indexOf(start)) +
        snapshot +
        source.slice(source.indexOf(end) + end.length),
    ];
  }),
);
// Read and validate all mapped chapters before changing the pin or any chapter.
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
for (const [chapterPath, source] of chapterUpdates) {
  await writeFile(chapterPath, source);
}
await validateCiImageManifest(root, { requireDependencyDigest: true });
console.log(
  `Pinned dependency image ${manifest.dependencies.image}@${digest}.`,
);
