import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
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

export function validateVersionChangelog(source, version, packageName) {
  const sections = source.split(/^## /m).slice(1);
  const section = sections.find(
    (entry) => entry.split("\n", 1)[0].trim() === version,
  );
  if (!section || !section.slice(section.indexOf("\n") + 1).trim()) {
    fail(`${packageName} is missing changelog notes for ${version}`);
  }
}

export async function validateChangelogFormatting(
  repoRoot = DEFAULT_REPO_ROOT,
  formatter,
) {
  // Use the same formatter installation as Changesets version preparation.
  const require = createRequire(import.meta.url);
  const changesetsRequire = createRequire(require.resolve("@changesets/cli"));
  const releaseRequire = createRequire(
    changesetsRequire.resolve("@changesets/apply-release-plan"),
  );
  let prettier = formatter;
  if (!prettier) {
    try {
      prettier = require(require.resolve("prettier", { paths: [repoRoot] }));
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") throw error;
      prettier = releaseRequire("prettier");
    }
  }
  for (const definition of PUBLIC_PACKAGE_GRAPH) {
    const filepath = path.join(
      repoRoot,
      "packages",
      definition.directory,
      "CHANGELOG.md",
    );
    await prettier.format("## 0.0.0\n\n- Changelog formatting preflight.\n", {
      ...(await prettier.resolveConfig(filepath)),
      filepath,
      parser: "markdown",
    });
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
    validateVersionChangelog(
      readFileSync(
        path.join(repoRoot, "packages", definition.directory, "CHANGELOG.md"),
        "utf8",
      ),
      manifest.version,
      definition.name,
    );
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
  if (
    !pagesWorkflow.includes(
      "node scripts/run-turbo.mjs ci:storybook-static --summarize",
    )
  ) {
    fail("Storybook Pages workflow must build Storybook through Turbo");
  }

  const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
  if (!readme.includes(STORYBOOK_URL)) {
    fail("README must link to the published Storybook URL");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateReleaseConfig();
  await validateChangelogFormatting();
  process.stdout.write("Release configuration checks passed.\n");
}
