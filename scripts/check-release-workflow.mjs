import { readFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_REPO_ROOT, RELEASE_ENVIRONMENT } from "./public-packages.mjs";

function fail(message) {
  throw new Error(message);
}

function requireContains(name, source, fragment) {
  if (!source.includes(fragment)) {
    fail(`${name} must include ${fragment}`);
  }
}

function requireNotContains(name, source, fragment) {
  if (source.includes(fragment)) {
    fail(`${name} must not include ${fragment}`);
  }
}

function requireDigestPinnedCiImage(name, source) {
  if (
    !/ghcr\.io\/lapismd\/lapis-(?:notes-)?ci@sha256:[a-f0-9]{64}/.test(source)
  ) {
    fail(`${name} must use a digest-pinned Lapis CI image`);
  }
}

export function validateReleaseWorkflows({ ci, release, pages } = {}) {
  for (const fragment of [
    "workflow_call:",
    "build-cache:",
    "governance:",
    "quality:",
    "unit:",
    "storybook-static:",
    "storybook-interaction:",
    "release-artifacts:",
    "validate:",
    "pnpm spec:first",
    "pnpm packages:policy",
    "pnpm packages:pack -- --already-built",
    "pnpm build-storybook",
    "pnpm test:storybook",
    "pnpm release:intent",
    "include-hidden-files: true",
    "TURBO_REMOTE_CACHE_SIGNATURE_KEY",
    "Initial packages require manual npm publication from the verified release artifact.",
  ]) {
    requireContains("CI workflow", ci, fragment);
  }
  requireDigestPinnedCiImage("CI workflow", ci);
  requireNotContains("CI workflow", ci, "actions/cache");

  for (const fragment of [
    "changesets/action@v1.8.0",
    "commitMode: github-api",
    "pnpm release:version",
    "uses: ./.github/workflows/lapis-ci.yml",
    "secrets: inherit",
    "pnpm release:publish",
    "pnpm release:verify",
    "pnpm release:notes",
    RELEASE_ENVIRONMENT,
    "id-token: write",
    'LAPIS_RELEASE_APPROVED: "1"',
    "github.event_name == 'workflow_dispatch' && inputs.publish == true && needs.validation.outputs.has_work == 'true'",
  ]) {
    requireContains("Release workflow", release, fragment);
  }
  requireDigestPinnedCiImage("Release workflow", release);
  requireNotContains("Release workflow", release, "NPM_TOKEN");
  requireNotContains("Release workflow", release, "pnpm release:prepare");

  for (const fragment of [
    "actions/configure-pages@v6",
    "actions/upload-pages-artifact@v5",
    "actions/deploy-pages@v5",
    "pnpm build-storybook",
    "storybook-static/index.html",
    "storybook-static/iframe.html",
    "uses: ./.github/actions/ci-setup",
  ]) {
    requireContains("Pages workflow", pages, fragment);
  }
  requireDigestPinnedCiImage("Pages workflow", pages);
}

export function validateWorkflowFiles(repoRoot = DEFAULT_REPO_ROOT) {
  validateReleaseWorkflows({
    ci: readFileSync(
      path.join(repoRoot, ".github/workflows/lapis-ci.yml"),
      "utf8",
    ),
    release: readFileSync(
      path.join(repoRoot, ".github/workflows/release.yml"),
      "utf8",
    ),
    pages: readFileSync(
      path.join(repoRoot, ".github/workflows/publish-storybook-pages.yml"),
      "utf8",
    ),
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateWorkflowFiles();
  process.stdout.write("Release workflow checks passed.\n");
}
