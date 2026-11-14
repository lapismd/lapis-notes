import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";

test("package qualification authenticates release lookups with the read-only job token", () => {
  const workflow = parse(
    readFileSync(
      new URL("../.github/workflows/lapis-ci.yml", import.meta.url),
      "utf8",
    ),
  );
  const job = workflow.jobs["release-artifacts"];
  const pack = job.steps.find(
    (step) => step.run === "pnpm packages:pack -- --already-built",
  );
  assert.ok(pack, "release package qualification remains enabled");
  assert.equal(pack.env?.GH_TOKEN, "${{ github.token }}");
  assert.equal(
    job.permissions?.contents ?? workflow.permissions.contents,
    "read",
  );
});
