import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { startRegistryFixture } from "./run-web-registry-acceptance.mjs";

test("fixture transport serves only V2 data and closes its listener", async (t) => {
  const previousCandidate = process.env.LAPIS_PLUGIN_CANDIDATE_COMMIT;
  process.env.LAPIS_PLUGIN_CANDIDATE_COMMIT = "a".repeat(40);
  t.after(() => {
    if (previousCandidate === undefined)
      delete process.env.LAPIS_PLUGIN_CANDIDATE_COMMIT;
    else process.env.LAPIS_PLUGIN_CANDIDATE_COMMIT = previousCandidate;
  });
  const root = await mkdtemp(path.join(tmpdir(), "lapis-registry-transport-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "v2"));
  await writeFile(
    path.join(root, "fixture.json"),
    JSON.stringify({
      schemaVersion: 1,
      sourceCommit: "a".repeat(40),
      pluginCount: 12,
      artifactOrigin: "https://registry.local.lapis.md",
      trustedKeys: [],
    }),
  );
  await writeFile(path.join(root, "v2/index.json"), "{}");
  const fixture = await startRegistryFixture(root);
  t.after(() => fixture.close());
  const url = fixture.environment.VITE_LAPIS_LOCAL_REGISTRY_URL;
  const response = await fetch(url);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.deepEqual(await response.json(), {});
  for (const pathname of [
    "/fixture.json",
    "/v2/%2e%2e/fixture.json",
    "/v2/missing.json",
  ])
    assert.equal((await fetch(new URL(pathname, url))).status, 404);
  process.env.LAPIS_PLUGIN_CANDIDATE_COMMIT = "b".repeat(40);
  await assert.rejects(
    startRegistryFixture(root),
    /does not match the pinned plugin candidate/,
  );
});
