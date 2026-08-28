import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import semver from "semver";
import {
  assertPublicPackageOrder,
  DEFAULT_REPO_ROOT,
  packageJsonPath,
  PUBLIC_PACKAGE_GRAPH,
  readJson,
  readPublicPackages,
  releaseArtifactName,
  REPOSITORY,
} from "./public-packages.mjs";

export const RELEASE_DIRECTORY = ".release";
export const TARBALL_DIRECTORY = path.join(RELEASE_DIRECTORY, "tarballs");
export const RELEASE_MANIFEST_FILE = path.join(
  RELEASE_DIRECTORY,
  "release-manifest.json",
);

export function defaultReleaseManifestPath(repoRoot = DEFAULT_REPO_ROOT) {
  return path.join(repoRoot, RELEASE_MANIFEST_FILE);
}

export function buildReleaseManifest({
  plan,
  packageRecords,
  tarballs,
  generatedAt = new Date().toISOString(),
}) {
  const tarballByName = new Map(tarballs.map((tarball) => [tarball.name, tarball]));
  const selectedNames = new Set(plan.selected.map((candidate) => candidate.name));

  return {
    schemaVersion: 1,
    repository: REPOSITORY,
    commit: plan.commit,
    artifactName: releaseArtifactName(plan.commit),
    registry: plan.registry,
    generatedAt,
    bootstrapRequired: Boolean(plan.bootstrapRequired),
    packages: packageRecords
      .filter((record) => selectedNames.has(record.name))
      .map((record) => {
        const tarball = tarballByName.get(record.name);
        if (!tarball) {
          throw new Error(`Missing tarball metadata for ${record.name}`);
        }
        return {
          name: record.name,
          directory: record.directory,
          version: record.version,
          tag: "next",
          dependencies: [...record.internalDependencies],
          registryEmpty: Boolean(
            plan.selected.find((candidate) => candidate.name === record.name)
              ?.registryEmpty,
          ),
          shouldPublish: !plan.bootstrapRequired,
          tarball: tarball.relativePath,
          shasum: tarball.shasum,
          integrity: tarball.integrity,
          size: tarball.size,
          files: tarball.files,
        };
      }),
  };
}

export function loadReleaseManifest(manifestPath = defaultReleaseManifestPath()) {
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

export function validateReleaseManifest(
  manifest,
  {
    repoRoot = DEFAULT_REPO_ROOT,
    manifestPath = defaultReleaseManifestPath(repoRoot),
    requireTarballs = true,
  } = {},
) {
  if (manifest.schemaVersion !== 1) {
    throw new Error("Release manifest schemaVersion must be 1");
  }
  if (manifest.repository !== REPOSITORY) {
    throw new Error(`Release manifest repository must be ${REPOSITORY}`);
  }
  if (!manifest.commit || typeof manifest.commit !== "string") {
    throw new Error("Release manifest must record a commit");
  }
  if (manifest.artifactName !== releaseArtifactName(manifest.commit)) {
    throw new Error("Release manifest artifactName must match the commit");
  }
  if (!Array.isArray(manifest.packages)) {
    throw new Error("Release manifest packages must be an array");
  }

  const packageRecords = readPublicPackages(repoRoot);
  const recordByName = new Map(packageRecords.map((record) => [record.name, record]));
  const manifestRecords = manifest.packages.map((entry) => {
    const definition = recordByName.get(entry.name);
    if (!definition) {
      throw new Error(`Release manifest includes unknown package ${entry.name}`);
    }
    return {
      ...definition,
      internalDependencies: entry.dependencies ?? [],
    };
  });
  assertPublicPackageOrder(manifestRecords);

  const manifestDir = path.dirname(manifestPath);
  for (const entry of manifest.packages) {
    const definition = recordByName.get(entry.name);
    const packageManifest = readJson(packageJsonPath(definition, repoRoot));
    if (packageManifest.version !== entry.version) {
      throw new Error(
        `${entry.name} manifest version ${packageManifest.version} does not match release manifest ${entry.version}`,
      );
    }
    if (!semver.valid(entry.version)) {
      throw new Error(`${entry.name} release version is not valid semver`);
    }
    if (entry.tag !== "next") {
      throw new Error(`${entry.name} must publish the bootstrap candidate with the next tag`);
    }
    if (typeof entry.registryEmpty !== "boolean") {
      throw new Error(`${entry.name} must record whether the npm package was empty`);
    }
    if (typeof entry.shouldPublish !== "boolean") {
      throw new Error(`${entry.name} must record shouldPublish`);
    }
    if (!/^sha512-[A-Za-z0-9+/=]+$/.test(entry.integrity)) {
      throw new Error(`${entry.name} must record sha512 integrity`);
    }
    if (!/^[a-f0-9]{64}$/.test(entry.shasum)) {
      throw new Error(`${entry.name} must record a sha256 tarball checksum`);
    }
    if (!Number.isInteger(entry.size) || entry.size <= 0) {
      throw new Error(`${entry.name} must record a positive tarball size`);
    }
    if (!Array.isArray(entry.files) || entry.files.length === 0) {
      throw new Error(`${entry.name} must record packed files`);
    }
    if (requireTarballs) {
      const tarballPath = path.resolve(manifestDir, entry.tarball);
      if (!existsSync(tarballPath)) {
        throw new Error(`${entry.name} tarball does not exist at ${tarballPath}`);
      }
      if (statSync(tarballPath).size !== entry.size) {
        throw new Error(`${entry.name} tarball size changed after manifest creation`);
      }
    }
  }

  return manifest;
}
