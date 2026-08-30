import assert from "node:assert/strict";
import { test } from "node:test";
import { validateReleaseWorkflows } from "./check-release-workflow.mjs";

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
  "pnpm build-storybook",
  "pnpm test:storybook",
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
  "actions/configure-pages@v6",
  "actions/upload-pages-artifact@v5",
  "actions/deploy-pages@v5",
  "pnpm build-storybook",
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
