import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { validateDesktopReleaseWorkflow } from "./check-desktop-release-workflow.mjs";
const read = () =>
  parse(
    readFileSync(
      new URL("../.github/workflows/desktop-release.yml", import.meta.url),
      "utf8",
    ),
  );
test("desktop workflow preserves native qualification and tag-only publication", () =>
  assert.doesNotThrow(() => validateDesktopReleaseWorkflow(read())));
test("desktop workflow rejects cross-host and missing-architecture qualification", () => {
  const workflow = read();
  workflow.jobs.native.strategy.matrix.include[0].os = "ubuntu-24.04";
  assert.throws(
    () => validateDesktopReleaseWorkflow(workflow),
    /native target/,
  );
  workflow.jobs.native.strategy.matrix.include.pop();
  assert.throws(() => validateDesktopReleaseWorkflow(workflow), /four/);
});
test("desktop workflow rejects publication without complete native acceptance", () => {
  const workflow = read();
  workflow.jobs.publish.needs = ["contract"];
  assert.throws(() => validateDesktopReleaseWorkflow(workflow), /publication/);
});
test("desktop workflow rejects missing audited installation checks", () => {
  const workflow = read();
  workflow.jobs.native.steps = workflow.jobs.native.steps.filter(
    (step) => !step.run?.includes("test-install.mjs"),
  );
  assert.throws(() => validateDesktopReleaseWorkflow(workflow), /Audited/);
});
test("desktop workflow provisions Homebrew before checking the tap update", () => {
  const workflow = read();
  workflow.jobs.publish.steps = workflow.jobs.publish.steps.filter(
    (step) => !step.uses?.startsWith("Homebrew/actions/setup-homebrew@"),
  );
  assert.throws(
    () => validateDesktopReleaseWorkflow(workflow),
    /Homebrew tooling/,
  );
});
test("desktop workflow builds workspace exports before checking the host", () => {
  const workflow = read();
  const steps = workflow.jobs.native.steps;
  const checks = steps.find((step) => step.run?.includes("desktop-deno check"));
  workflow.jobs.native.steps = [
    checks,
    ...steps.filter((step) => step !== checks),
  ];
  assert.throws(
    () => validateDesktopReleaseWorkflow(workflow),
    /workspace exports/,
  );
});
