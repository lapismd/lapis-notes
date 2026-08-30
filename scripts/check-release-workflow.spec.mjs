import assert from "node:assert/strict";
import { test } from "node:test";
import { validateReleaseWorkflows } from "./check-release-workflow.mjs";

const ci = [
  "pnpm spec:first --base origin/main --head abc123",
  "pnpm packages:check",
  "pnpm packages:pack",
  "pnpm check:all",
  "pnpm build-storybook",
  "pnpm test:storybook",
  "pnpm release:intent",
].join("\n");

const release = [
  "changesets/action@v1.8.0",
  "commitMode: github-api",
  "pnpm release:version",
  "pnpm release:prepare",
  "pnpm release:publish",
  "pnpm release:verify",
  "pnpm release:notes",
  "npm-production",
  "id-token: write",
  "include-hidden-files: true",
  'LAPIS_RELEASE_APPROVED: "1"',
  "github.event_name == 'workflow_dispatch' && inputs.publish == true && needs.artifact.outputs.has_work == 'true'",
  "Initial packages require manual npm publication from the verified release artifact.",
].join("\n");

const pages = [
  "actions/configure-pages@v6",
  "actions/upload-pages-artifact@v5",
  "actions/deploy-pages@v5",
  "pnpm build-storybook",
  "storybook-static/index.html",
  "storybook-static/iframe.html",
].join("\n");

test("accepts the expected workflow structure", () => {
  assert.doesNotThrow(() => validateReleaseWorkflows({ ci, release, pages }));
});

test("rejects a literal option separator before spec-first revision flags", () => {
  assert.throws(
    () =>
      validateReleaseWorkflows({
        ci: ci.replace("pnpm spec:first --base", "pnpm spec:first -- --base"),
        release,
        pages,
      }),
    /must include pnpm spec:first --base/,
  );
});

test("rejects bootstrap token publishing", () => {
  assert.throws(
    () => validateReleaseWorkflows({ ci, release: `${release}\nNPM_TOKEN`, pages }),
    /must not include NPM_TOKEN/,
  );
});

test("requires hidden release candidates to be included in the artifact", () => {
  assert.throws(
    () =>
      validateReleaseWorkflows({
        ci,
        release: release.replace("include-hidden-files: true\n", ""),
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
          "github.event_name == 'workflow_dispatch' && inputs.publish == true && needs.artifact.outputs.has_work == 'true'\n",
          "needs.artifact.outputs.has_work == 'true'\n",
        ),
        pages,
      }),
    /must include github\.event_name == 'workflow_dispatch' && inputs\.publish == true/,
  );
});
