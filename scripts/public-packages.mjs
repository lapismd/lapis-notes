import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

export const REPOSITORY = "lapismd/lapis-notes";
export const INITIAL_PUBLIC_VERSION = "0.1.0";
export const RELEASE_ENVIRONMENT = "npm-production";
export const STORYBOOK_URL = "https://lapismd.github.io/lapis-notes/";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");

export const PUBLIC_PACKAGE_GRAPH = Object.freeze([
  Object.freeze({
    name: "@lapis-notes/ui",
    directory: "ui",
    internalDependencies: [],
    importSpecifiers: [
      "@lapis-notes/ui",
      "@lapis-notes/ui/search",
      "@lapis-notes/ui/modal",
      "@lapis-notes/ui/confirm-dialog",
      "@lapis-notes/ui/sidebar-custom",
      "@lapis-notes/ui/table-dnd",
      "@lapis-notes/ui/table-dnd/utils",
      "@lapis-notes/ui/table-dnd/sensors",
    ],
    resolveSpecifiers: [
      "@lapis-notes/ui/theme.css",
      "@lapis-notes/ui/styles.css",
      "@lapis-notes/ui/codemirror-autocomplete.css",
    ],
  }),
  Object.freeze({
    name: "@lapis-notes/api",
    directory: "api",
    internalDependencies: ["@lapis-notes/ui"],
    importSpecifiers: [
      "@lapis-notes/api",
      "@lapis-notes/api/app-database",
      "@lapis-notes/api/vault",
      "@lapis-notes/api/agent-tools",
      "@lapis-notes/api/agent-skills",
      "@lapis-notes/api/editor/core",
      "@lapis-notes/api/telemetry",
    ],
    resolveSpecifiers: [],
  }),
  Object.freeze({
    name: "@lapis-notes/language-service",
    directory: "language-service",
    internalDependencies: ["@lapis-notes/api"],
    importSpecifiers: [
      "@lapis-notes/language-service",
      "@lapis-notes/language-service/markdown",
      "@lapis-notes/language-service/markdownlint/runtime",
    ],
    resolveSpecifiers: [],
  }),
  Object.freeze({
    name: "@lapis-notes/file-explorer",
    directory: "file-explorer",
    internalDependencies: ["@lapis-notes/api"],
    importSpecifiers: ["@lapis-notes/file-explorer"],
    resolveSpecifiers: [],
  }),
  Object.freeze({
    name: "@lapis-notes/workspace",
    directory: "workspace",
    internalDependencies: ["@lapis-notes/api"],
    importSpecifiers: ["@lapis-notes/workspace"],
    resolveSpecifiers: [],
  }),
]);

export const PUBLIC_PACKAGE_NAMES = new Set(
  PUBLIC_PACKAGE_GRAPH.map((definition) => definition.name),
);

export function packageSlug(name) {
  if (name.startsWith("@lapis-notes/")) {
    return name.slice("@lapis-notes/".length);
  }
  return name.replace(/^@[^/]+\//, "");
}

export function packageReleaseTag(name, version) {
  return `${packageSlug(name)}@${version}`;
}

export function packageDirectory(definition, repoRoot = DEFAULT_REPO_ROOT) {
  return path.join(repoRoot, "packages", definition.directory);
}

export function packageJsonPath(definition, repoRoot = DEFAULT_REPO_ROOT) {
  return path.join(packageDirectory(definition, repoRoot), "package.json");
}

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function npmRegistryPackageName(name) {
  return name.replace("/", "%2f");
}

export function normalizeRegistry(registry) {
  return String(registry ?? "https://registry.npmjs.org").replace(/\/+$/, "");
}

export function readPublicPackages(repoRoot = DEFAULT_REPO_ROOT) {
  return PUBLIC_PACKAGE_GRAPH.map((definition) => {
    const manifestPath = packageJsonPath(definition, repoRoot);
    const manifest = readJson(manifestPath);
    return {
      ...definition,
      manifest,
      manifestPath,
      packageDir: packageDirectory(definition, repoRoot),
      version: manifest.version,
    };
  });
}

export function assertPublicPackageOrder(records) {
  const includedNames = new Set(records.map((record) => record.name));
  const seen = new Set();
  for (const record of records) {
    for (const dependencyName of record.internalDependencies) {
      if (includedNames.has(dependencyName) && !seen.has(dependencyName)) {
        throw new Error(
          `${record.name} appears before its internal dependency ${dependencyName}`,
        );
      }
    }
    seen.add(record.name);
  }
}

export function assertValidPublicVersion(name, version) {
  if (!semver.valid(version)) {
    throw new Error(`${name} has invalid semver version ${version}`);
  }
  if (semver.lt(version, INITIAL_PUBLIC_VERSION)) {
    throw new Error(
      `${name} must not publish before the ${INITIAL_PUBLIC_VERSION} public baseline`,
    );
  }
}

export function releaseArtifactName(commit) {
  return `lapis-notes-release-${commit}`;
}
