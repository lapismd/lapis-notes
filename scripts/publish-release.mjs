import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  DEFAULT_REPO_ROOT,
  packageReleaseTag,
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

export function publishVerifiedPackages({
  manifest,
  manifestPath,
  repoRoot = DEFAULT_REPO_ROOT,
  dryRun = false,
  env = process.env,
  runCommand = run,
} = {}) {
  validateReleaseManifest(manifest, { repoRoot, manifestPath });

  if (manifest.bootstrapRequired) {
    throw new Error(
      "Initial packages require manual npm publication from the verified release artifact.",
    );
  }
  if (env.LAPIS_RELEASE_APPROVED !== "1") {
    throw new Error("Set LAPIS_RELEASE_APPROVED=1 before publishing from CI");
  }

  const manifestDir = path.dirname(manifestPath);
  for (const entry of manifest.packages) {
    if (!entry.shouldPublish) {
      continue;
    }
    const tarballPath = path.resolve(manifestDir, entry.tarball);
    const args = [
      "publish",
      tarballPath,
      "--tag",
      entry.tag,
      "--access",
      "public",
      "--provenance",
    ];
    if (dryRun) {
      args.push("--dry-run");
    }
    process.stdout.write(
      `Publishing ${entry.name}@${entry.version} (${packageReleaseTag(
        entry.name,
        entry.version,
      )})\n`,
    );
    runCommand("npm", args, { cwd: repoRoot });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath =
    options.manifestPath ?? defaultReleaseManifestPath(options.repoRoot);
  const manifest = loadReleaseManifest(manifestPath);
  publishVerifiedPackages({
    manifest,
    manifestPath,
    repoRoot: options.repoRoot,
    dryRun: options.dryRun,
  });
}
