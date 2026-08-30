#!/usr/bin/env node

import {
  appendFile,
  cp,
  mkdir,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  dependencyImageTag,
  sha256File,
  validateCiImageManifest,
} from "./lib/ci-images.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export async function prepareCiDependencyContext({
  root = repositoryRoot,
  outDir = path.join(root, ".ci/dependency-context"),
} = {}) {
  const manifest = await validateCiImageManifest(root);
  const lockfileSha256 = await sha256File(path.join(root, "pnpm-lock.yaml"));

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await cp(
    path.join(root, ".ci/dependency-image.Dockerfile"),
    path.join(outDir, "Dockerfile"),
  );

  for (const relativePath of [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
  ]) {
    await copyRelative(root, outDir, relativePath);
  }
  await cp(path.join(root, "patches"), path.join(outDir, "patches"), {
    recursive: true,
  });

  for (const directory of await packageDirectories(root)) {
    await copyRelative(
      root,
      outDir,
      path.join("packages", directory, "package.json"),
    );
  }

  const metadata = {
    baseImage: `${manifest.base.image}@${manifest.base.digest}`,
    dependencyImage: manifest.dependencies.image,
    lockfileSha256,
    tag: dependencyImageTag(lockfileSha256),
  };
  await writeFile(
    path.join(outDir, "context.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  return metadata;
}

async function packageDirectories(root) {
  return (await readdir(path.join(root, "packages"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function copyRelative(root, outDir, relativePath) {
  const destination = path.join(outDir, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(root, relativePath), destination);
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--out-dir") options.outDir = path.resolve(args[++index]);
    else if (arg === "--github-output") {
      options.githubOutput = path.resolve(args[++index]);
    } else throw new Error(`Unexpected argument: ${arg}`);
  }
  return options;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  const metadata = await prepareCiDependencyContext({ outDir: options.outDir });
  if (options.githubOutput) {
    await appendFile(
      options.githubOutput,
      [
        `base_image=${metadata.baseImage}`,
        `dependency_image=${metadata.dependencyImage}`,
        `lockfile_sha256=${metadata.lockfileSha256}`,
        `tag=${metadata.tag}`,
        "",
      ].join("\n"),
    );
  }
  console.log(
    `Prepared dependency image ${metadata.dependencyImage}:${metadata.tag}.`,
  );
}
