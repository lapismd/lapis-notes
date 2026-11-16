import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
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
  const pinned = /^ghcr\.io\/lapismd\/lapis-(?:notes-)?ci@sha256:[a-f0-9]{64}$/;
  const message = `${name} must use a digest-pinned Lapis CI image or the verified current-input resolver`;
  let document;
  try {
    document = parse(source);
  } catch {
    /* Legacy fragment fixtures retain literal digest checks. */
  }
  if (!document?.jobs) {
    if (
      !/ghcr\.io\/lapismd\/lapis-(?:notes-)?ci@sha256:[a-f0-9]{64}/.test(source)
    )
      fail(message);
    return;
  }
  const resolver = document.jobs["resolve-image"];
  let count = 0;
  for (const job of Object.values(document.jobs)) {
    if (!job.container) continue;
    count++;
    const image =
      typeof job.container === "string" ? job.container : job.container.image;
    if (pinned.test(image)) continue;
    const needs = Array.isArray(job.needs) ? job.needs : [job.needs];
    if (
      image !== "${{ needs.resolve-image.outputs.reference }}" ||
      resolver?.uses !== "./.github/workflows/resolve-dependency-image.yml" ||
      !needs.includes("resolve-image")
    )
      fail(message);
  }
  if (!count) fail(message);
}

export function validateDependencyImageResolver(resolver, producer) {
  const document = parse(resolver);
  const jobs = Object.values(document.jobs ?? {});
  const steps = jobs.flatMap((job) => job.steps ?? []);
  const pin = "29d83b5a61c0cf2b895873489de43f0d85e38e48";
  const action = steps.find((step) => step.id === "resolve");
  if (
    action?.uses !==
      `lapismd/lapis-ci/actions/resolve-dependency-image@${pin}` ||
    steps.some(
      (step) =>
        step.uses?.startsWith("lapismd/lapis-ci/actions/") &&
        !step.uses.endsWith(`@${pin}`),
    ) ||
    action.with?.repository !== "lapismd/lapis-notes" ||
    action.with?.context !== ".ci/dependency-context" ||
    document.permissions?.contents !== "read" ||
    document.permissions?.packages !== "read" ||
    Object.values(document.permissions ?? {}).some((v) => v !== "read") ||
    jobs.some((job) => job.permissions || job["continue-on-error"])
  )
    fail(
      "Dependency image resolver must retain exact reviewed verification and read-only authority",
    );
  const publication = parse(producer);
  const publish = publication.jobs?.publish;
  if (
    publication.concurrency?.["cancel-in-progress"] !== false ||
    publish?.if !==
      "github.repository == 'lapismd/lapis-notes' && github.ref == 'refs/heads/main'" ||
    !publish.steps.some(
      (step) =>
        step.uses ===
        `lapismd/lapis-ci/actions/publish-dependency-image@${pin}`,
    ) ||
    publication.permissions?.contents !== "read" ||
    publication.permissions?.["pull-requests"]
  )
    fail(
      "Dependency image producer must retain trusted serialized publication without source/PR writes",
    );
}

export function validateVersionPrAuthentication(source) {
  const job = parse(source).jobs?.changesets;
  const require = (condition, message) => {
    if (!condition) fail(`Version PR authentication: ${message}`);
  };
  require(job?.if ===
    "github.ref == 'refs/heads/main'", "must require trusted main");
  require(job.permissions?.contents === "read" &&
    job.permissions?.packages === "read" &&
    Object.keys(job.permissions).every((key) =>
      ["contents", "packages"].includes(key),
    ), "workflow token must have only contents/packages reads");
  const checkout = job.steps.find((step) =>
    step.uses?.startsWith("actions/checkout@"),
  );
  const app = job.steps.find((step) => step.id === "app");
  const version = job.steps.find((step) => step.id === "changesets");
  require(version?.uses ===
    "changesets/action@63a615b9cd06ba9a3e6d13796c7fbcb080a60a0b", "must retain the reviewed Changesets action");
  require(checkout?.with?.["persist-credentials"] ===
    false, "checkout credentials must not persist");
  require(app?.uses ===
    "actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510", "must mint the existing pinned App token");
  require(app.with?.["client-id"] ===
    "${{ vars.LAPIS_DEPENDENCY_APP_CLIENT_ID }}" &&
    app.with?.["private-key"] ===
      "${{ secrets.LAPIS_DEPENDENCY_APP_PRIVATE_KEY }}", "must use the existing encrypted App configuration");
  require(app.with?.owner === "${{ github.repository_owner }}" &&
    app.with?.repositories ===
      "${{ github.event.repository.name }}", "App scope must be this repository only");
  require(app.with?.["permission-contents"] === "write" &&
    app.with?.["permission-pull-requests"] === "write" &&
    Object.keys(app.with).every(
      (key) =>
        !key.startsWith("permission-") ||
        ["permission-contents", "permission-pull-requests"].includes(key),
    ), "App token must have only contents/PR writes");
  require(version?.env?.GITHUB_TOKEN ===
    "${{ steps.app.outputs.token }}", "version writer must use App output without fallback");
  require(version.with?.version === "pnpm release:version" &&
    version.with?.commitMode === "github-api" &&
    version.with?.createGithubReleases === false &&
    version.with?.publish ===
      undefined, "version recipe must remain preparation-only");
  require(job.steps.indexOf(app) <
    job.steps.indexOf(
      version,
    ), "token creation must precede version preparation");
  require(!job["continue-on-error"] &&
    !app["continue-on-error"] &&
    !version[
      "continue-on-error"
    ], "authentication and version failures must remain blocking");
  for (const step of job.steps)
    if (step.uses && !step.uses.startsWith("./"))
      require(/@[a-f0-9]{40}$/.test(
        step.uses,
      ), "external version-job actions must be immutable");
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
    "storybook-specification:",
    "release-artifacts:",
    "validate:",
    "pnpm spec:first",
    "pnpm packages:policy",
    "pnpm packages:pack -- --already-built",
    "node scripts/run-turbo.mjs ci:storybook-static --summarize",
    "pnpm test:storybook:run",
    "pnpm test:specification:dev",
    "github.event_name == 'workflow_dispatch' && inputs.run_quarantined_storybook == true",
    "pnpm release:intent",
    "include-hidden-files: true",
    "TURBO_REMOTE_CACHE_SIGNATURE_KEY",
    "Initial packages require manual npm publication from the verified release artifact.",
  ]) {
    requireContains("CI workflow", ci, fragment);
  }
  requireDigestPinnedCiImage("CI workflow", ci);
  requireNotContains("CI workflow", ci, "actions/cache");
  if (/actions\/runs\/[^\s"']*\/(?:force-)?cancel/u.test(ci)) {
    fail("CI workflow must not cancel workflow runs");
  }

  for (const fragment of [
    "changesets/action@63a615b9cd06ba9a3e6d13796c7fbcb080a60a0b",
    "actions: write",
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
    "node scripts/run-turbo.mjs build --summarize",
    "node scripts/report-turbo-cache.mjs --github-summary",
    "node scripts/run-turbo.mjs ci:storybook-static --summarize",
    "storybook-static/index.html",
    "storybook-static/iframe.html",
    "uses: ./.github/actions/ci-setup",
  ]) {
    requireContains("Pages workflow", pages, fragment);
  }
  if (
    pages.indexOf("node scripts/run-turbo.mjs build --summarize") >
    pages.indexOf("node scripts/run-turbo.mjs ci:storybook-static --summarize")
  ) {
    fail(
      "Pages workflow must restore package builds before building Storybook",
    );
  }
  requireDigestPinnedCiImage("Pages workflow", pages);
}

export function validateWorkflowFiles(repoRoot = DEFAULT_REPO_ROOT) {
  validateDependencyImageResolver(
    readFileSync(
      path.join(repoRoot, ".github/workflows/resolve-dependency-image.yml"),
      "utf8",
    ),
    readFileSync(
      path.join(repoRoot, ".github/workflows/dependency-image.yml"),
      "utf8",
    ),
  );
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
  validateVersionPrAuthentication(
    readFileSync(path.join(repoRoot, ".github/workflows/release.yml"), "utf8"),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateWorkflowFiles();
  process.stdout.write("Release workflow checks passed.\n");
}
