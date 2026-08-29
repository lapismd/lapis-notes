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

export function validateReleaseWorkflows({
  ci,
  release,
  pages,
} = {}) {
  requireContains("CI workflow", ci, "pnpm spec:first");
  requireContains("CI workflow", ci, "pnpm packages:check");
  requireContains("CI workflow", ci, "pnpm packages:pack");
  requireContains("CI workflow", ci, "pnpm check:all");
  requireContains("CI workflow", ci, "pnpm build-storybook");
  requireContains("CI workflow", ci, "pnpm test:storybook");
  requireContains("CI workflow", ci, "pnpm release:intent");

  requireContains("Release workflow", release, "changesets/action@v1.8.0");
  requireContains("Release workflow", release, "commitMode: github-api");
  requireContains("Release workflow", release, "pnpm release:version");
  requireContains("Release workflow", release, "pnpm release:prepare");
  requireContains("Release workflow", release, "pnpm release:publish");
  requireContains("Release workflow", release, "pnpm release:verify");
  requireContains("Release workflow", release, "pnpm release:notes");
  requireContains("Release workflow", release, RELEASE_ENVIRONMENT);
  requireContains("Release workflow", release, "id-token: write");
  requireContains("Release workflow", release, "include-hidden-files: true");
  requireContains("Release workflow", release, "LAPIS_RELEASE_APPROVED: \"1\"");
  requireContains(
    "Release workflow",
    release,
    "Initial packages require manual npm publication from the verified release artifact.",
  );
  requireNotContains("Release workflow", release, "NPM_TOKEN");

  requireContains("Pages workflow", pages, "actions/configure-pages@v6");
  requireContains("Pages workflow", pages, "actions/upload-pages-artifact@v5");
  requireContains("Pages workflow", pages, "actions/deploy-pages@v5");
  requireContains("Pages workflow", pages, "pnpm build-storybook");
  requireContains("Pages workflow", pages, "storybook-static/index.html");
  requireContains("Pages workflow", pages, "storybook-static/iframe.html");
}

export function validateWorkflowFiles(repoRoot = DEFAULT_REPO_ROOT) {
  validateReleaseWorkflows({
    ci: readFileSync(path.join(repoRoot, ".github/workflows/lapis-ci.yml"), "utf8"),
    release: readFileSync(path.join(repoRoot, ".github/workflows/release.yml"), "utf8"),
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
