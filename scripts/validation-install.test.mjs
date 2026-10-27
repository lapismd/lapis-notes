import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { projectPackage } from "./validation/install-projection.mjs";

test("archive installs retain effective workspace security overrides without source mutation", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "notes-install-policy-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const pkg = {
    name: "fixture",
    private: true,
    devDependencies: { retained: "1.0.0" },
  };
  const source = JSON.stringify(pkg);
  const workspace =
    'packages: []\noverrides:\n  "simple-git@<4.0.1": "4.0.1"\n  sharp: ">=0.35.5 <0.36"\n';
  await writeFile(join(root, "package.json"), source);
  await writeFile(join(root, "pnpm-workspace.yaml"), workspace);
  const projected = projectPackage(root, pkg, {
    "@lapismd/design-core": "file:/qualified/design-core.tgz",
  });
  assert.deepEqual(projected.pnpm.overrides, {
    "simple-git@<4.0.1": "4.0.1",
    sharp: ">=0.35.5 <0.36",
    "@lapismd/design-core": "file:/qualified/design-core.tgz",
  });
  assert.equal(projected.devDependencies.retained, "1.0.0");
  assert.equal(await readFile(join(root, "package.json"), "utf8"), source);
  assert.equal(
    await readFile(join(root, "pnpm-workspace.yaml"), "utf8"),
    workspace,
  );
  assert.deepEqual(pkg, JSON.parse(source));
});

test("archive projection retains effective package settings and explicit archive precedence", () => {
  const pkg = {
    pnpm: {
      overrides: { selected: "1.0.0" },
      patchedDependencies: { retained: "patches/retained.patch" },
    },
  };
  const projected = projectPackage(
    "/fixture",
    pkg,
    { selected: "file:/qualified/selected.tgz" },
    () => JSON.stringify({ selected: "1.0.0", guard: "2.0.0" }),
  );
  assert.equal(
    projected.pnpm.overrides.selected,
    "file:/qualified/selected.tgz",
  );
  assert.equal(projected.pnpm.overrides.guard, "2.0.0");
  assert.deepEqual(
    projected.pnpm.patchedDependencies,
    pkg.pnpm.patchedDependencies,
  );
});

test("archive projection fails closed on unreadable or malformed effective policy", () => {
  for (const output of ['"unexpected"', "[]", '{"guard":false}', "invalid"])
    assert.throws(
      () => projectPackage("/fixture", {}, {}, () => output),
      /override policy/u,
    );
  assert.throws(
    () =>
      projectPackage("/fixture", {}, {}, () => {
        throw Error("config unavailable");
      }),
    /config unavailable/u,
  );
  assert.deepEqual(
    projectPackage("/fixture", {}, {}, () => "undefined").pnpm.overrides,
    {},
  );
});
