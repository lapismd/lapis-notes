import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { EventEmitter } from "node:events";
import { startRegistryFixture } from "./run-web-registry-acceptance.mjs";
import { navigateServerPage } from "../packages/web/e2e/server-navigation.ts";

function navigationFixture() {
  const page = new EventEmitter();
  page.calls = [];
  page.navigate = async () => {};
  page.goto = async (url) => {
    page.calls.push(url);
    await page.navigate();
  };
  const url = "http://127.0.0.1:8787";
  const failRequest = ({
    requestUrl = `${url}/assets/ServerVaultHost.js`,
    errorText = "net::ERR_NETWORK_CHANGED",
    resourceType = "script",
  } = {}) =>
    page.emit("requestfailed", {
      url: () => requestUrl,
      failure: () => ({ errorText }),
      resourceType: () => resourceType,
    });
  return { page, url, failRequest };
}

test("server startup retries one same-origin script network change and records it", async () => {
  const { page, url, failRequest } = navigationFixture();
  const retries = [];
  let readyChecks = 0;
  const attempts = await navigateServerPage(
    page,
    url,
    async () => {
      readyChecks++;
      if (readyChecks === 1) {
        failRequest();
        throw new Error("Sign in did not load");
      }
    },
    async (info) => retries.push(info),
  );
  assert.equal(attempts, 2);
  assert.deepEqual(page.calls, [url, url]);
  assert.equal(readyChecks, 2);
  assert.deepEqual(retries, [
    {
      failedRequests: [`${url}/assets/ServerVaultHost.js`],
      firstFailure: "Error: Sign in did not load",
    },
  ]);
  assert.equal(page.listenerCount("requestfailed"), 0);
});

test("server startup retries a document navigation network change once", async () => {
  const { page, url } = navigationFixture();
  page.navigate = async () => {
    if (page.calls.length === 1)
      throw new Error("page.goto: net::ERR_NETWORK_CHANGED");
  };
  assert.equal(await navigateServerPage(page, url, async () => {}), 2);
  assert.deepEqual(page.calls, [url, url]);
  assert.equal(page.listenerCount("requestfailed"), 0);
});

test("server startup does not retry application readiness failures", async () => {
  const { page, url } = navigationFixture();
  const failure = new Error("Sign in did not load");
  await assert.rejects(
    navigateServerPage(page, url, async () => {
      throw failure;
    }),
    (error) => error === failure,
  );
  assert.deepEqual(page.calls, [url]);
  assert.equal(page.listenerCount("requestfailed"), 0);
});

test("server startup does not retry other errors or unrelated resources", async () => {
  for (const input of [
    { errorText: "net::ERR_CONNECTION_REFUSED" },
    { errorText: "net::ERR_NAME_NOT_RESOLVED" },
    { resourceType: "image" },
    { resourceType: "stylesheet" },
    { requestUrl: "https://unrelated.example/asset.js" },
  ]) {
    const { page, url, failRequest } = navigationFixture();
    const failure = new Error("Sign in did not load");
    await assert.rejects(
      navigateServerPage(page, url, async () => {
        failRequest(input);
        throw failure;
      }),
      (error) => error === failure,
    );
    assert.deepEqual(page.calls, [url]);
    assert.equal(page.listenerCount("requestfailed"), 0);
  }
});

test("server startup still fails when its one network-change retry fails", async () => {
  const { page, url, failRequest } = navigationFixture();
  const failures = [new Error("first startup"), new Error("second startup")];
  let readyChecks = 0;
  await assert.rejects(
    navigateServerPage(page, url, async () => {
      failRequest();
      throw failures[readyChecks++];
    }),
    (error) => error === failures[1],
  );
  assert.deepEqual(page.calls, [url, url]);
  assert.equal(page.listenerCount("requestfailed"), 0);
});

test("server startup does not retry a successful first navigation", async () => {
  const { page, url } = navigationFixture();
  let readyChecks = 0;
  assert.equal(
    await navigateServerPage(page, url, async () => {
      readyChecks++;
    }),
    1,
  );
  assert.deepEqual(page.calls, [url]);
  assert.equal(readyChecks, 1);
  assert.equal(page.listenerCount("requestfailed"), 0);
});

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
