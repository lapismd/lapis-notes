#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile, readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createDistributionPlan } from "../packages/desktop-deno/scripts/distribution.mjs";

export const DESKTOP_TARGETS = [
  "aarch64-apple-darwin",
  "aarch64-unknown-linux-gnu",
  "x86_64-unknown-linux-gnu",
];
const repository = "lapismd/lapis-notes";

export function validateDesktopTag(tag, version) {
  if (
    !/^\d+\.\d+\.\d+$/.test(version) ||
    !/^desktop-v\d+\.\d+\.\d+$/.test(tag)
  ) {
    throw new Error("A numeric desktop tag desktop-v<version> is required");
  }
  if (tag !== `desktop-v${version}`)
    throw new Error("Desktop tag must match the desktop package version");
  return version;
}

function metadata(version, sourceCommit) {
  validateDesktopTag(`desktop-v${version}`, version);
  if (!/^[a-f0-9]{40}$/.test(sourceCommit))
    throw new Error("An exact source commit is required");
  return {
    schemaVersion: 1,
    repository,
    version,
    tag: `desktop-v${version}`,
    sourceCommit,
  };
}

export async function createTargetManifest({
  directory,
  version,
  sourceCommit,
  target,
}) {
  if (!DESKTOP_TARGETS.includes(target))
    throw new Error(`Unsupported desktop target ${target}`);
  const root = metadata(version, sourceCommit);
  const plan = createDistributionPlan({
    packageDir: ".",
    releaseDir: directory,
    version,
    target,
  });
  const bytes = await readFile(plan.archive);
  if (!bytes.length) throw new Error("Desktop release archive is empty");
  const file = path.basename(plan.archive);
  return {
    ...root,
    artifacts: [
      {
        target,
        platform: plan.platform,
        architecture: plan.architecture,
        file,
        url: `https://github.com/${repository}/releases/download/${root.tag}/${file}`,
        size: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    ],
  };
}

export function assembleDesktopManifest(manifests) {
  if (manifests.length !== DESKTOP_TARGETS.length)
    throw new Error("Desktop release requires all three targets");
  const first = manifests[0];
  const root = metadata(first.version, first.sourceCommit);
  const artifacts = [];
  for (const manifest of manifests) {
    if (
      manifest.schemaVersion !== 1 ||
      manifest.repository !== repository ||
      manifest.version !== root.version ||
      manifest.tag !== root.tag
    ) {
      throw new Error("Desktop manifests disagree on version or repository");
    }
    if (manifest.sourceCommit !== root.sourceCommit)
      throw new Error("Desktop manifests disagree on source commit");
    if (manifest.artifacts.length !== 1)
      throw new Error("Each native manifest must describe one target");
    const artifact = manifest.artifacts[0];
    if (
      !DESKTOP_TARGETS.includes(artifact.target) ||
      artifacts.some((item) => item.target === artifact.target)
    )
      throw new Error("Unsupported or duplicate desktop target");
    const plan = createDistributionPlan({
      packageDir: ".",
      releaseDir: ".",
      version: root.version,
      target: artifact.target,
    });
    const file = path.basename(plan.archive);
    if (
      artifact.file !== file ||
      artifact.platform !== plan.platform ||
      artifact.architecture !== plan.architecture ||
      artifact.url !==
        `https://github.com/${repository}/releases/download/${root.tag}/${file}`
    )
      throw new Error("Invalid desktop artifact identity or URL");
    if (
      !/^[a-f0-9]{64}$/.test(artifact.sha256) ||
      /^0+$/.test(artifact.sha256) ||
      !Number.isSafeInteger(artifact.size) ||
      artifact.size <= 0
    )
      throw new Error("Invalid desktop artifact checksum or size");
    artifacts.push(artifact);
  }
  return {
    ...root,
    artifacts: DESKTOP_TARGETS.map((target) =>
      artifacts.find((item) => item.target === target),
    ),
  };
}

export async function verifyDesktopArtifacts(manifest, directory) {
  // Revalidate the public manifest before using any filename as a local path.
  assembleDesktopManifest(
    manifest.artifacts.map((artifact) => ({
      ...manifest,
      artifacts: [artifact],
    })),
  );
  for (const artifact of manifest.artifacts) {
    const bytes = await readFile(path.join(directory, artifact.file));
    if (bytes.length !== artifact.size)
      throw new Error(`Desktop artifact size mismatch: ${artifact.file}`);
    if (createHash("sha256").update(bytes).digest("hex") !== artifact.sha256)
      throw new Error(`Desktop artifact checksum mismatch: ${artifact.file}`);
  }
}

async function publishDesktopRelease(manifest, directory) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GitHub release publication requires GH_TOKEN");
  validateDesktopTag(process.env.GITHUB_REF_NAME || "", manifest.version);
  if (process.env.GITHUB_SHA !== manifest.sourceCommit)
    throw new Error("Release source must match the executing tagged commit");
  await verifyDesktopArtifacts(manifest, directory);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const api = `https://api.github.com/repos/${repository}/releases`;
  const existing = await fetch(
    `${api}/tags/${encodeURIComponent(manifest.tag)}`,
    { headers },
  );
  if (existing.status !== 404) {
    if (existing.ok)
      throw new Error(
        "Desktop release already exists; published assets are never replaced",
      );
    throw new Error(
      `Unable to check existing desktop release: HTTP ${existing.status}`,
    );
  }
  const response = await fetch(api, {
    method: "POST",
    headers,
    body: JSON.stringify({
      tag_name: manifest.tag,
      target_commitish: manifest.sourceCommit,
      name: `Lapis Notes ${manifest.version}`,
      draft: true,
      body: "Lapis Notes desktop for Apple Silicon macOS 15+ and ARM64/x86-64 Linux (Ubuntu 24.04). Intel macOS is deferred because the pinned Turso database has no published native addon for that platform. macOS builds are ad-hoc signed, without Developer ID signing or notarization. [Homebrew installation guide](https://github.com/lapismd/homebrew-tap#readme).",
      make_latest: "false",
    }),
  });
  if (!response.ok)
    throw new Error(
      `Unable to create draft desktop release: HTTP ${response.status}`,
    );
  const release = await response.json();
  const files = [
    ...manifest.artifacts.map((item) => item.file),
    "desktop-manifest.json",
    "SHA256SUMS",
  ];
  for (const file of files) {
    const upload = await fetch(
      `${release.upload_url.split("{")[0]}?name=${encodeURIComponent(file)}`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/octet-stream" },
        body: await readFile(path.join(directory, file)),
      },
    );
    if (!upload.ok)
      throw new Error(
        `Unable to upload ${file}: HTTP ${upload.status}; release remains a draft`,
      );
  }
  const publish = await fetch(`${api}/${release.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ draft: false, make_latest: "false" }),
  });
  if (!publish.ok)
    throw new Error(
      `Unable to publish desktop release: HTTP ${publish.status}`,
    );
  console.log(`Published ${release.html_url}`);
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      directory: { type: "string" },
      output: { type: "string" },
      target: { type: "string" },
      commit: { type: "string" },
      tag: { type: "string" },
    },
  });
  const packageMetadata = JSON.parse(
    await readFile(
      new URL("../packages/desktop-deno/package.json", import.meta.url),
      "utf8",
    ),
  );
  const version = packageMetadata.version;
  const command = positionals[0];
  if (command === "preflight") {
    validateDesktopTag(
      values.tag || process.env.GITHUB_REF_NAME || "",
      version,
    );
    console.log(`Validated desktop version ${version}`);
    return;
  }
  const directory = path.resolve(
    values.directory || "packages/desktop-deno/release",
  );
  if (command === "target") {
    const manifest = await createTargetManifest({
      directory,
      version,
      sourceCommit: values.commit || process.env.GITHUB_SHA,
      target: values.target,
    });
    const output =
      values.output ||
      path.join(directory, `desktop-target-${values.target}.json`);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
    return;
  }
  if (command === "assemble") {
    const files = (await readdir(directory)).filter((file) =>
      /^desktop-target-.*\.json$/.test(file),
    );
    const manifest = assembleDesktopManifest(
      await Promise.all(
        files.map(async (file) =>
          JSON.parse(await readFile(path.join(directory, file), "utf8")),
        ),
      ),
    );
    if (
      manifest.sourceCommit !== (values.commit || process.env.GITHUB_SHA) ||
      manifest.version !== version
    )
      throw new Error(
        "Candidate does not match the current source and package version",
      );
    await verifyDesktopArtifacts(manifest, directory);
    await writeFile(
      path.join(directory, "desktop-manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    await writeFile(
      path.join(directory, "SHA256SUMS"),
      manifest.artifacts
        .map((item) => `${item.sha256}  ${item.file}\n`)
        .join(""),
    );
    return;
  }
  if (command === "publish") {
    const manifest = JSON.parse(
      await readFile(path.join(directory, "desktop-manifest.json"), "utf8"),
    );
    await publishDesktopRelease(manifest, directory);
    return;
  }
  throw new Error("Expected preflight, target, assemble or publish");
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
