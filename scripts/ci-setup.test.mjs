import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parse } from "yaml";

const action = parse(
  await readFile(
    new URL("../.github/actions/ci-setup/action.yml", import.meta.url),
    "utf8",
  ),
);
const verification = action.runs.steps.find(
  (step) => step.name === "Verify pinned toolchain",
).run;

async function verifyToolchain(t, denoVersion) {
  const directory = await mkdtemp(path.join(tmpdir(), "lapis-ci-toolchain-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const tools = {
    node: "v24.15.0",
    pnpm: "10.34.5",
    playwright: "Version 1.61.1",
    mdbook: "mdbook v0.5.4",
    ...(denoVersion
      ? {
          deno: `deno ${denoVersion} (stable, release, x86_64-unknown-linux-gnu)`,
        }
      : {}),
  };
  for (const [name, output] of Object.entries(tools)) {
    await writeFile(
      path.join(directory, name),
      `#!/bin/sh\nprintf '%s\\n' '${output}'\n`,
      { mode: 0o755 },
    );
  }
  await symlink("/usr/bin/awk", path.join(directory, "awk"));
  // Exclude all installed tools so even a future Deno-equipped image tests absence.
  return spawnSync("/bin/bash", ["-c", verification], {
    env: { ...process.env, PATH: directory },
    encoding: "utf8",
  });
}

test("CI refuses the package graph when Deno is missing", async (t) => {
  const result = await verifyToolchain(t);
  assert.notEqual(
    result.status,
    0,
    "toolchain verification must reject missing Deno",
  );
});

test("CI rejects a different Deno version", async (t) => {
  const result = await verifyToolchain(t, "2.9.6");
  assert.notEqual(
    result.status,
    0,
    "toolchain verification must enforce its Deno pin",
  );
});

test("CI accepts the complete pinned toolchain", async (t) => {
  const result = await verifyToolchain(t, "2.9.7");
  assert.equal(result.status, 0, result.stderr);
});

test("CI provisions the pinned Deno before verification and frozen installation", () => {
  const steps = action.runs.steps;
  const setup = steps.findIndex((step) =>
    step.uses?.startsWith("denoland/setup-deno@"),
  );
  const verify = steps.findIndex(
    (step) => step.name === "Verify pinned toolchain",
  );
  const install = steps.findIndex(
    (step) => step.name === "Install frozen workspace",
  );
  assert.ok(setup >= 0 && setup < verify && verify < install);
  assert.equal(steps[setup].with["deno-version"], "v2.9.7");
});
