import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { validateReleaseWorkflows } from "./check-release-workflow.mjs";
import "./ci-setup.test.mjs";

const pinnedImage =
  "ghcr.io/lapismd/lapis-notes-ci@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const ci = [
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
  "node scripts/run-turbo.mjs ci:storybook-static --summarize",
  "node scripts/run-turbo.mjs ci:storybook-interaction --summarize",
  "pnpm release:intent",
  "include-hidden-files: true",
  "TURBO_REMOTE_CACHE_SIGNATURE_KEY",
  "Initial packages require manual npm publication from the verified release artifact.",
  pinnedImage,
].join("\n");

const release = [
  "changesets/action@v1.8.0",
  "commitMode: github-api",
  "pnpm release:version",
  "uses: ./.github/workflows/lapis-ci.yml",
  "secrets: inherit",
  "pnpm release:publish",
  "pnpm release:verify",
  "pnpm release:notes",
  "npm-production",
  "id-token: write",
  'LAPIS_RELEASE_APPROVED: "1"',
  "github.event_name == 'workflow_dispatch' && inputs.publish == true && needs.validation.outputs.has_work == 'true'",
  pinnedImage,
].join("\n");

const pages = [
  "node scripts/run-turbo.mjs build --summarize",
  "node scripts/report-turbo-cache.mjs --github-summary",
  "actions/configure-pages@v6",
  "actions/upload-pages-artifact@v5",
  "actions/deploy-pages@v5",
  "node scripts/run-turbo.mjs ci:storybook-static --summarize",
  "storybook-static/index.html",
  "storybook-static/iframe.html",
  "uses: ./.github/actions/ci-setup",
  pinnedImage,
].join("\n");

test("accepts the expected parallel workflow structure", () => {
  assert.doesNotThrow(() => validateReleaseWorkflows({ ci, release, pages }));
});

test("rejects bootstrap token publishing", () => {
  assert.throws(
    () =>
      validateReleaseWorkflows({ ci, release: `${release}\nNPM_TOKEN`, pages }),
    /must not include NPM_TOKEN/,
  );
});

test("requires hidden release candidates in the reusable validation workflow", () => {
  assert.throws(
    () =>
      validateReleaseWorkflows({
        ci: ci.replace("include-hidden-files: true\n", ""),
        release,
        pages,
      }),
    /must include include-hidden-files: true/,
  );
});

test("requires an explicit manual dispatch before package publication", () => {
  assert.throws(
    () =>
      validateReleaseWorkflows({
        ci,
        release: release.replace(
          "github.event_name == 'workflow_dispatch' && inputs.publish == true && needs.validation.outputs.has_work == 'true'\n",
          "needs.validation.outputs.has_work == 'true'\n",
        ),
        pages,
      }),
    /must include github\.event_name == 'workflow_dispatch' && inputs\.publish == true/,
  );
});

test("rejects GitHub Actions file caching for Turbo", () => {
  assert.throws(
    () =>
      validateReleaseWorkflows({ ci: `${ci}\nactions/cache`, release, pages }),
    /must not include actions\/cache/,
  );
});

test("requires immutable CI image digests", () => {
  assert.throws(
    () =>
      validateReleaseWorkflows({
        ci: ci.replace(pinnedImage, "ghcr.io/lapismd/lapis-notes-ci:latest"),
        release,
        pages,
      }),
    /must use a digest-pinned Lapis CI image/,
  );
});

const workflow = parse(
  readFileSync(
    new URL("../.github/workflows/lapis-ci.yml", import.meta.url),
    "utf8",
  ),
);
for (const name of ["Spec-first gate", "Release intent gate"]) {
  test(`${name} skips only the generated Changesets PR`, () => {
    const step = workflow.jobs.governance.steps.find(
      (step) => step.name === name,
    );
    assert.ok(step, `${name} remains present`);
    const condition = new Function("github", `return (${step.if});`);
    assert.equal(
      condition({
        event_name: "pull_request",
        head_ref: "changeset-release/main",
      }),
      false,
    );
    for (const head_ref of [
      "fix/plugin-browser",
      "changeset-release/other",
      "main",
      "",
    ]) {
      assert.equal(
        condition({ event_name: "pull_request", head_ref }),
        true,
        head_ref,
      );
    }
    for (const event_name of ["push", "workflow_call", "workflow_dispatch"]) {
      assert.equal(condition({ event_name, head_ref: "" }), false, event_name);
    }
  });
}

test("generated Changesets PR retains remaining validation lanes", () => {
  for (const command of ["pnpm spec:validate", "pnpm spec:build"]) {
    const step = workflow.jobs.governance.steps.find(
      (step) => step.run === command,
    );
    assert.ok(step, command);
    assert.equal(step.if, undefined, command);
  }
  for (const lane of [
    "build-cache",
    "quality",
    "unit",
    "storybook-static",
    "storybook-interaction",
    "release-artifacts",
  ]) {
    assert.equal(workflow.jobs[lane].if, undefined, lane);
    assert.ok(workflow.jobs.validate.needs.includes(lane), lane);
  }
  assert.equal(workflow.jobs.validate.if, "always()");
});

test("Pages restores workspace builds before loading Storybook configuration", () => {
  const pagesWorkflow = parse(
    readFileSync(
      new URL(
        "../.github/workflows/publish-storybook-pages.yml",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const steps = pagesWorkflow.jobs.build.steps;
  const setup = steps.findIndex(
    (step) => step.uses === "./.github/actions/ci-setup",
  );
  const build = steps.findIndex(
    (step) => step.run === "node scripts/run-turbo.mjs build --summarize",
  );
  const storybook = steps.findIndex(
    (step) =>
      step.run === "node scripts/run-turbo.mjs ci:storybook-static --summarize",
  );
  assert.ok(
    setup >= 0 && build > setup && storybook > build,
    "Workspace dist outputs must be available before Storybook loads its public build-tools imports.",
  );
});

test("Pages policy rejects a missing package build preflight", () => {
  assert.throws(
    () =>
      validateReleaseWorkflows({
        ci,
        release,
        pages: pages.replace(
          "node scripts/run-turbo.mjs build --summarize\n",
          "",
        ),
      }),
    /must include node scripts\/run-turbo\.mjs build --summarize/,
  );
});

test("Pages policy rejects a package build after Storybook", () => {
  const reordered =
    pages.replace("node scripts/run-turbo.mjs build --summarize\n", "") +
    "\nnode scripts/run-turbo.mjs build --summarize";
  assert.throws(
    () => validateReleaseWorkflows({ ci, release, pages: reordered }),
    /must restore package builds before building Storybook/,
  );
});
