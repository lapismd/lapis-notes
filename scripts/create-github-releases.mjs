import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_REPO_ROOT,
  packageReleaseTag,
  REPOSITORY,
} from "./public-packages.mjs";
import {
  defaultReleaseManifestPath,
  loadReleaseManifest,
  validateReleaseManifest,
} from "./release-manifest.mjs";

function parseArgs(argv) {
  const options = {
    repoRoot: DEFAULT_REPO_ROOT,
    manifestPath: null,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") {
      continue;
    }
    if (value === "--manifest") {
      options.manifestPath = argv[++index];
      continue;
    }
    if (value === "--repo-root") {
      options.repoRoot = argv[++index];
      continue;
    }
    if (value === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    throw new Error(`Unknown argument: ${value}`);
  }

  return options;
}

function run(command, args, options) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "inherit",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

export function extractChangelogNotes(changelog, version) {
  const heading = new RegExp(`^##\\s+${version.replaceAll(".", "\\.")}\\s*$`, "m");
  const match = heading.exec(changelog);
  if (!match) {
    return "";
  }
  const start = match.index + match[0].length;
  const nextHeading = /^##\s+/m.exec(changelog.slice(start));
  const end = nextHeading ? start + nextHeading.index : changelog.length;
  return changelog.slice(start, end).trim();
}

export function releaseBody(entry, manifest, changelogNotes = "") {
  const tarballLines = [
    `- npm package: https://www.npmjs.com/package/${entry.name}/v/${entry.version}`,
    `- npm dist-tag: \`${entry.tag}\``,
    `- source commit: \`${manifest.commit}\``,
    `- tarball SHA-256: \`${entry.shasum}\``,
    `- npm integrity: \`${entry.integrity}\``,
  ];

  return [
    `# ${entry.name}@${entry.version}`,
    "",
    `Package-scoped release for \`${entry.name}\`.`,
    "",
    "## Verification",
    "",
    ...tarballLines,
    "",
    "## Release notes",
    "",
    changelogNotes || `See \`packages/${entry.directory}/CHANGELOG.md\`.`,
    "",
  ].join("\n");
}

export function createGithubReleases({
  repoRoot = DEFAULT_REPO_ROOT,
  manifest,
  manifestPath,
  dryRun = false,
  runCommand = run,
} = {}) {
  validateReleaseManifest(manifest, {
    repoRoot,
    manifestPath,
    requireTarballs: false,
  });

  for (const entry of manifest.packages) {
    const tag = packageReleaseTag(entry.name, entry.version);
    const changelog = readFileSync(
      path.join(repoRoot, "packages", entry.directory, "CHANGELOG.md"),
      "utf8",
    );
    const body = releaseBody(
      entry,
      manifest,
      extractChangelogNotes(changelog, entry.version),
    );
    const args = [
      "release",
      "create",
      tag,
      "--repo",
      REPOSITORY,
      "--target",
      manifest.commit,
      "--title",
      `${entry.name}@${entry.version}`,
      "--notes",
      body,
    ];
    if (dryRun) {
      process.stdout.write(`[dry-run] gh ${args.join(" ")}\n`);
      continue;
    }
    runCommand("gh", args, { cwd: repoRoot });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath =
    options.manifestPath ?? defaultReleaseManifestPath(options.repoRoot);
  const manifest = loadReleaseManifest(manifestPath);
  createGithubReleases({
    repoRoot: options.repoRoot,
    manifest,
    manifestPath,
    dryRun: options.dryRun,
  });
}
