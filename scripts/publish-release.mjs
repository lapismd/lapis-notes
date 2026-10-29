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
import { fetchPackageVersionState } from "./release-plan.mjs";

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

function alreadyPublished(error) {
  return /E409|EPUBLISHCONFLICT|previously published|cannot publish over/i.test(
    String(error?.message ?? error),
  );
}

export async function publishVerifiedPackages({
  manifest,
  manifestPath,
  repoRoot = DEFAULT_REPO_ROOT,
  dryRun = false,
  env = process.env,
  runCommand = run,
  fetchImpl = globalThis.fetch,
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
    const state = await fetchPackageVersionState(entry.name, entry.version, {
      registry: manifest.registry,
      fetchImpl,
    });
    if (state.published) {
      process.stdout.write(
        `Skipping ${entry.name}@${entry.version}; npm already has this version.\n`,
      );
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
    try {
      runCommand("npm", args, { cwd: repoRoot });
    } catch (error) {
      if (!alreadyPublished(error)) throw error;
      process.stdout.write(
        `Skipping ${entry.name}@${entry.version}; npm already has this version.\n`,
      );
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath =
    options.manifestPath ?? defaultReleaseManifestPath(options.repoRoot);
  const manifest = loadReleaseManifest(manifestPath);
  await publishVerifiedPackages({
    manifest,
    manifestPath,
    repoRoot: options.repoRoot,
    dryRun: options.dryRun,
  });
}
