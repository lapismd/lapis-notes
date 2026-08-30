import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_REPO_ROOT,
  PUBLIC_PACKAGE_GRAPH,
  readJson,
  REPOSITORY,
  RELEASE_ENVIRONMENT,
  STORYBOOK_URL,
} from "./public-packages.mjs";

const REQUIRED_RELEASE_SCRIPTS = [
  "changeset",
  "packages:check",
  "packages:pack",
  "release:check",
  "release:intent",
  "release:notes",
  "release:plan",
  "release:prepare",
  "release:publish",
  "release:test",
  "release:verify",
  "release:version",
];

function fail(message) {
  throw new Error(message);
}

function assertFile(repoRoot, relativePath) {
  if (!existsSync(path.join(repoRoot, relativePath))) {
    fail(`Missing release file ${relativePath}`);
  }
}

export function validateReleaseConfig(repoRoot = DEFAULT_REPO_ROOT) {
  const rootManifest = readJson(path.join(repoRoot, "package.json"));
  const changesets = readJson(path.join(repoRoot, ".changeset/config.json"));

  for (const scriptName of REQUIRED_RELEASE_SCRIPTS) {
    if (!rootManifest.scripts?.[scriptName]) {
      fail(`Root package.json is missing script ${scriptName}`);
    }
  }
  for (const dependencyName of [
    "@changesets/cli",
    "@changesets/changelog-github",
    "semver",
  ]) {
    if (!rootManifest.devDependencies?.[dependencyName]) {
      fail(
        `Root package.json is missing release devDependency ${dependencyName}`,
      );
    }
  }
  if (changesets.changelog?.[1]?.repo !== REPOSITORY) {
    fail(`Changesets changelog repo must be ${REPOSITORY}`);
  }
  if (changesets.access !== "public") {
    fail("Changesets access must be public");
  }
  if (changesets.baseBranch !== "main") {
    fail("Changesets baseBranch must be main");
  }
  if (
    changesets.privatePackages?.version !== false ||
    changesets.privatePackages?.tag !== false
  ) {
    fail("Changesets must not version or tag private packages");
  }

  for (const relativePath of [
    ".github/workflows/lapis-ci.yml",
    ".github/workflows/publish-storybook-pages.yml",
    ".github/workflows/release.yml",
    ".changeset/README.md",
    "RELEASING.md",
  ]) {
    assertFile(repoRoot, relativePath);
  }

  for (const definition of PUBLIC_PACKAGE_GRAPH) {
    const manifest = readJson(
      path.join(repoRoot, "packages", definition.directory, "package.json"),
    );
    if (!manifest.publishConfig || manifest.publishConfig.access !== "public") {
      fail(`${definition.name} must publish publicly`);
    }
  }

  const releaseWorkflow = readFileSync(
    path.join(repoRoot, ".github/workflows/release.yml"),
    "utf8",
  );
  if (!releaseWorkflow.includes(RELEASE_ENVIRONMENT)) {
    fail(`Release workflow must use ${RELEASE_ENVIRONMENT}`);
  }
  if (!releaseWorkflow.includes("id-token: write")) {
    fail(
      "Release workflow must request id-token: write for npm trusted publishing",
    );
  }
  if (releaseWorkflow.includes("NPM_TOKEN")) {
    fail("Release workflow must not use NPM_TOKEN bootstrap publishing");
  }
  const ciWorkflow = readFileSync(
    path.join(repoRoot, ".github/workflows/lapis-ci.yml"),
    "utf8",
  );
  if (
    !`${ciWorkflow}\n${releaseWorkflow}`.includes(
      "Initial packages require manual npm publication",
    )
  ) {
    fail("Release workflow must stop with a manual-bootstrap notice");
  }
  if (
    !releaseWorkflow.includes(
      "github.event_name == 'workflow_dispatch' && inputs.publish == true && needs.validation.outputs.has_work == 'true'",
    )
  ) {
    fail(
      "Release workflow must require an explicit manual dispatch before publication",
    );
  }

  const pagesWorkflow = readFileSync(
    path.join(repoRoot, ".github/workflows/publish-storybook-pages.yml"),
    "utf8",
  );
  if (!pagesWorkflow.includes("actions/deploy-pages@v5")) {
    fail("Storybook Pages workflow must deploy with GitHub Pages");
  }
  if (!pagesWorkflow.includes("pnpm build-storybook")) {
    fail("Storybook Pages workflow must build Storybook");
  }

  const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
  if (!readme.includes(STORYBOOK_URL)) {
    fail("README must link to the published Storybook URL");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateReleaseConfig();
  process.stdout.write("Release configuration checks passed.\n");
}
