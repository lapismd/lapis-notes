import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
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

test("CI runs complete web and native packaged acceptance before aggregation", () => {
  assert.equal(
    workflow.jobs["web-acceptance"].steps.some(
      (step) => step.run === "pnpm test:web:e2e",
    ),
    true,
  );
  const native = workflow.jobs["desktop-packaged"];
  assert.deepEqual(native.strategy.matrix.os, ["macos-15", "ubuntu-24.04"]);
  assert.equal(native.strategy["fail-fast"], false);
  assert.ok(native.steps.some((step) => step.run === "pnpm package:desktop"));
  assert.ok(
    native.steps.some((step) => step.run === "pnpm test:desktop:packaged"),
  );
  assert.ok(
    native.steps.some((step) =>
      step.run?.includes(
        "xvfb-run -a dbus-run-session -- pnpm test:desktop:packaged",
      ),
    ),
  );
  assert.equal(
    native.steps.find((step) =>
      step.uses?.startsWith("actions/upload-artifact@"),
    ).if,
    "always()",
  );
  for (const lane of ["web-acceptance", "desktop-packaged"])
    assert.ok(workflow.jobs.validate.needs.includes(lane));
});

test("Web fixtures come from an immutable Plugins candidate", () => {
  assert.match(workflow.env.LAPIS_PLUGIN_CANDIDATE_COMMIT, /^[a-f0-9]{40}$/);
  const fixture = workflow.jobs["registry-fixture"];
  const checkout = fixture.steps.find(
    (step) => step.with?.repository === "lapismd/lapis-plugins",
  );
  assert.equal(checkout.with.ref, "${{ env.LAPIS_PLUGIN_CANDIDATE_COMMIT }}");
  const build = fixture.steps.find(
    (step) => step.name === "Build test-signed registry candidate",
  );
  assert.match(build.run, /pnpm install --frozen-lockfile/);
  assert.match(
    build.run,
    /node scripts\/create-registry-acceptance-fixture\.mjs/,
  );
  assert.ok(workflow.jobs["web-acceptance"].needs.includes("registry-fixture"));
});

test("native acceptance provisions the released standalone controller CLI", () => {
  const native = workflow.jobs["desktop-packaged"];
  assert.match(
    workflow.env.LAPIS_CONTROLLER_CANDIDATE_COMMIT,
    /^[a-f0-9]{40}$/,
  );
  const checkout = native.steps.find(
    (step) => step.with?.repository === "lapismd/ai-controller",
  );
  assert.equal(
    checkout.with.ref,
    "${{ env.LAPIS_CONTROLLER_CANDIDATE_COMMIT }}",
  );
  const install = native.steps.find(
    (step) => step.name === "Provision the released controller CLI",
  );
  assert.match(install.run, /git rev-parse HEAD/);
  assert.match(install.run, /pnpm install --frozen-lockfile/);
  assert.match(install.run, /pnpm build:cli/);
  assert.match(install.run, /node scripts\/install-cli\.mjs/);
  assert.match(install.run, /LAPIS_AI_CONTROLLER_BIN=/);
  assert.match(install.run, /GITHUB_ENV/);
});

test("Web acceptance provisions Docker and builds the server candidate", () => {
  const web = workflow.jobs["web-acceptance"];
  assert.equal(web.container, undefined);
  const server = web.steps.findIndex((step) =>
    step.run?.includes("docker build -f packages/server-deno/Dockerfile"),
  );
  const suite = web.steps.findIndex((step) => step.run === "pnpm test:web:e2e");
  assert.ok(server >= 0 && suite > server);
  assert.ok(
    web.steps.some((step) =>
      step.run?.includes("playwright install --with-deps chromium"),
    ),
  );
});

test("fixture build uses the checked-out Plugins source instead of the host workflow SHA", () => {
  const build = workflow.jobs["registry-fixture"].steps.find(
    (step) => step.name === "Build test-signed registry candidate",
  );
  const candidate = workflow.env.LAPIS_PLUGIN_CANDIDATE_COMMIT;
  const script = `
    pnpm() { :; }
    git() { printf '%s\\n' "$TEST_CHECKOUT_SHA"; }
    node() { printf '%s\\n' "$GITHUB_SHA"; }
    ${build.run}
  `;
  const run = (checkout) =>
    spawnSync("bash", ["-e", "-o", "pipefail", "-c", script], {
      env: {
        ...process.env,
        GITHUB_SHA: "b".repeat(40),
        LAPIS_PLUGIN_CANDIDATE_COMMIT: candidate,
        TEST_CHECKOUT_SHA: checkout,
      },
      encoding: "utf8",
    });
  const matched = run(candidate);
  assert.equal(matched.status, 0, matched.stderr);
  assert.equal(matched.stdout.trim(), `${candidate}\n${candidate}`);
  assert.notEqual(run("c".repeat(40)).status, 0);
});

test("the actual Notes aggregate rejects missing acceptance in every lane", () => {
  const step = workflow.jobs.validate.steps[0];
  const success = Object.fromEntries(
    Object.keys(step.env).map((name) => [name, "success"]),
  );
  const run = (env) =>
    spawnSync("bash", ["-c", step.run], {
      env: { ...process.env, ...env },
      encoding: "utf8",
    });
  assert.equal(run(success).status, 0);
  for (const name of Object.keys(success))
    for (const result of ["skipped", "failure", "cancelled"])
      assert.notEqual(
        run({ ...success, [name]: result }).status,
        0,
        `${name}: ${result}`,
      );
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
