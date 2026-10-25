import assert from "node:assert/strict";
import test from "node:test";

const base = {
  image: "sha256:tools-amd64",
  workspace: "workspace-a",
  pnpmLock: Buffer.from("javascript dependencies"),
  cargoLock: Buffer.from("core dependencies"),
  companionLock: Buffer.from("companion dependencies"),
  archives: [{ name: "@lapismd/design-core", version: "0.6.0", sha256: "a" }],
  nativeSources: [{ name: "lapis-ai", revision: "one", sha256: "b" }],
};
const plan = async (change = {}) => {
  const { cachePlan } = await import("./validation/cache.mjs");
  return cachePlan({ ...base, ...change });
};

test("UI archives preserve native compiler caches while invalidating JavaScript caches", async () => {
  const first = await plan();
  const changed = await plan({
    archives: [{ ...base.archives[0], sha256: "new public source" }],
  });
  assert.equal(first.keys.native, changed.keys.native);
  assert.notEqual(first.keys.javascript, changed.keys.javascript);
  const mounts = (value, types) =>
    value.mounts.filter(([name]) =>
      types.some((type) => name.endsWith(`-${type}`)),
    );
  assert.deepEqual(
    mounts(first, ["cargo", "rust", "native"]),
    mounts(changed, ["cargo", "rust", "native"]),
  );
  assert.notDeepEqual(
    mounts(first, ["pnpm", "turbo"]),
    mounts(changed, ["pnpm", "turbo"]),
  );
});

test("native pins and both Cargo locks preserve JavaScript caches", async () => {
  const first = await plan();
  for (const change of [
    {
      nativeSources: [
        { ...base.nativeSources[0], revision: "two", sha256: "c" },
      ],
    },
    { cargoLock: Buffer.from("new core graph") },
    { companionLock: Buffer.from("new companion graph") },
  ]) {
    const changed = await plan(change);
    assert.equal(first.keys.javascript, changed.keys.javascript);
    assert.notEqual(first.keys.native, changed.keys.native);
  }
});

test("JavaScript locks cannot invalidate native caches and tool images fence both", async () => {
  const first = await plan();
  const js = await plan({ pnpmLock: Buffer.from("new JavaScript graph") });
  assert.equal(first.keys.native, js.keys.native);
  assert.notEqual(first.keys.javascript, js.keys.javascript);
  const image = await plan({ image: "sha256:tools-arm64" });
  assert.notEqual(first.keys.javascript, image.keys.javascript);
  assert.notEqual(first.keys.native, image.keys.native);
});

test("transfer paths and inventory ordering do not change dependency identities", async () => {
  const archives = [
    ...base.archives,
    { name: "other", version: "1.0.0", sha256: "d" },
  ];
  const nativeSources = [
    ...base.nativeSources,
    { name: "other", revision: "three", sha256: "e" },
  ];
  const first = await plan({ archives, nativeSources });
  const moved = await plan({
    archives: archives
      .toReversed()
      .map((entry) => ({ ...entry, path: "/another/archive.tgz" })),
    nativeSources: nativeSources
      .toReversed()
      .map((entry) => ({ ...entry, path: "another.tar" })),
  });
  assert.deepEqual(first, moved);
});

test("UI-only workers never mount native caches and workspaces remain isolated", async () => {
  const ui = await plan({
    cargoLock: undefined,
    companionLock: undefined,
    nativeSources: [],
  });
  assert.equal(ui.keys.native, undefined);
  assert.deepEqual(
    ui.mounts.map(([, path]) => path),
    ["/cache/pnpm", "/cache/deno", "/work/lapis-notes/.turbo"],
  );
  const first = await plan(),
    second = await plan({ workspace: "workspace-b" });
  assert.deepEqual(first.keys, second.keys);
  assert.ok(
    first.mounts.every(([name]) =>
      second.mounts.every(([other]) => name !== other),
    ),
  );
});
