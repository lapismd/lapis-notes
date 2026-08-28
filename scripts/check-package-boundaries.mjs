import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import semver from "semver";
import {
  assertPublicPackageOrder,
  assertValidPublicVersion,
  DEFAULT_REPO_ROOT,
  PUBLIC_PACKAGE_NAMES,
  readPublicPackages,
  REPOSITORY,
} from "./public-packages.mjs";

const REQUIRED_FILE_ENTRIES = ["README.md", "CHANGELOG.md", "LICENSE.md", "dist"];
const DEPENDENCY_FIELDS = [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "devDependencies",
];

function fail(message) {
  throw new Error(message);
}

function assertFile(repoRoot, record, filename) {
  const filePath = path.join(repoRoot, "packages", record.directory, filename);
  if (!existsSync(filePath)) {
    fail(`${record.name} is missing ${filename}`);
  }
}

function assertNoLocalRanges(manifest, packageName) {
  for (const field of DEPENDENCY_FIELDS) {
    for (const [dependencyName, range] of Object.entries(manifest[field] ?? {})) {
      if (/^(?:file|link|workspace):/.test(range)) {
        fail(`${packageName} ${field}.${dependencyName} uses local protocol ${range}`);
      }
      if (dependencyName.startsWith("@lapis-notes/") && !PUBLIC_PACKAGE_NAMES.has(dependencyName)) {
        fail(`${packageName} ${field}.${dependencyName} references private package ${dependencyName}`);
      }
    }
  }
}

function assertInternalRange(record, recordsByName) {
  const manifest = record.manifest;
  for (const dependencyName of record.internalDependencies) {
    const dependency = recordsByName.get(dependencyName);
    if (!dependency) {
      fail(`${record.name} references unknown internal dependency ${dependencyName}`);
    }
    const range =
      manifest.dependencies?.[dependencyName] ??
      manifest.peerDependencies?.[dependencyName] ??
      manifest.optionalDependencies?.[dependencyName];
    if (!range) {
      fail(`${record.name} must declare ${dependencyName}`);
    }
    if (!semver.satisfies(dependency.version, range)) {
      fail(
        `${record.name} range ${dependencyName}@${range} does not satisfy ${dependency.version}`,
      );
    }
    if (!range.startsWith("^")) {
      fail(`${record.name} range ${dependencyName}@${range} must be a caret npm range`);
    }
  }
}

export function validatePublicPackageBoundaries({
  repoRoot = DEFAULT_REPO_ROOT,
  records = readPublicPackages(repoRoot),
} = {}) {
  assertPublicPackageOrder(records);
  const recordsByName = new Map(records.map((record) => [record.name, record]));

  for (const record of records) {
    const manifest = record.manifest;
    if (manifest.name !== record.name) {
      fail(`${record.directory} package name must be ${record.name}`);
    }
    assertValidPublicVersion(record.name, manifest.version);
    if (manifest.private) {
      fail(`${record.name} must not be private`);
    }
    if (manifest.publishConfig?.access !== "public") {
      fail(`${record.name} must set publishConfig.access=public`);
    }
    if (manifest.repository?.type !== "git") {
      fail(`${record.name} repository.type must be git`);
    }
    if (manifest.repository?.url !== "git+https://github.com/lapismd/lapis-notes.git") {
      fail(`${record.name} repository URL must point at ${REPOSITORY}`);
    }
    if (manifest.repository?.directory !== `packages/${record.directory}`) {
      fail(`${record.name} repository.directory must be packages/${record.directory}`);
    }
    if (!manifest.homepage?.includes(`github.com/lapismd/lapis-notes/tree/main/packages/${record.directory}`)) {
      fail(`${record.name} homepage must point at its package README`);
    }
    if (manifest.bugs?.url !== "https://github.com/lapismd/lapis-notes/issues") {
      fail(`${record.name} bugs URL must point at ${REPOSITORY}`);
    }
    if (!manifest.license) {
      fail(`${record.name} must declare a license`);
    }
    for (const filename of ["README.md", "CHANGELOG.md", "LICENSE.md"]) {
      assertFile(repoRoot, record, filename);
    }
    for (const entry of REQUIRED_FILE_ENTRIES) {
      if (!manifest.files?.includes(entry)) {
        fail(`${record.name} package files must include ${entry}`);
      }
    }
    assertNoLocalRanges(manifest, record.name);
    assertInternalRange(record, recordsByName);
  }

}

if (import.meta.url === `file://${process.argv[1]}`) {
  validatePublicPackageBoundaries();
  process.stdout.write("Public package boundary checks passed.\n");
}
