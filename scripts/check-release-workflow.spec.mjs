import assert from "node:assert/strict";
import { test } from "node:test";
import { validateReleaseWorkflows } from "./check-release-workflow.mjs";

const ci = [
  "pnpm spec:first",
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
  'LAPIS_RELEASE_APPROVED: "1"',
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

test("rejects bootstrap token publishing", () => {
  assert.throws(
    () => validateReleaseWorkflows({ ci, release: `${release}\nNPM_TOKEN`, pages }),
    /must not include NPM_TOKEN/,
  );
});
