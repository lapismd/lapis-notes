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
    ...options,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );
  }
}

export async function githubReleaseExists(
  name,
  version,
  {
    repository = REPOSITORY,
    fetchImpl = globalThis.fetch,
    token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "",
  } = {},
) {
  const tag = packageReleaseTag(name, version);
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "lapis-notes-release",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(
    `https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`,
    { headers },
  );
  if (response.status === 200) return true;
  if (response.status === 404) return false;
  throw new Error(
    `GitHub release lookup for ${tag} returned HTTP ${response.status}`,
  );
}

function releaseAlreadyExists(error) {
  return /already exists/i.test(String(error?.message ?? error));
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

export async function createGithubReleases({
  repoRoot = DEFAULT_REPO_ROOT,
  manifest,
  manifestPath,
  dryRun = false,
  runCommand = run,
  fetchImpl = globalThis.fetch,
  token,
} = {}) {
  validateReleaseManifest(manifest, {
    repoRoot,
    manifestPath,
    requireTarballs: false,
  });

  for (const entry of manifest.packages) {
    const tag = packageReleaseTag(entry.name, entry.version);
    if (
      await githubReleaseExists(entry.name, entry.version, {
        fetchImpl,
        token,
      })
    ) {
      process.stdout.write(`Skipping existing GitHub release ${tag}\n`);
      continue;
    }
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
    try {
      runCommand("gh", args, { cwd: repoRoot });
    } catch (error) {
      if (!releaseAlreadyExists(error)) throw error;
      process.stdout.write(`Skipping existing GitHub release ${tag}\n`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath =
    options.manifestPath ?? defaultReleaseManifestPath(options.repoRoot);
  const manifest = loadReleaseManifest(manifestPath);
  await createGithubReleases({
    repoRoot: options.repoRoot,
    manifest,
    manifestPath,
    dryRun: options.dryRun,
  });
}
