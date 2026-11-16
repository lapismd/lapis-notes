import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pin = "e3c91cb3bc19f19299842054a9309b0ca44da5b6";
const source = () =>
  readFile(
    new URL("../.github/workflows/dependency-completed.yml", import.meta.url),
    "utf8",
  );

test("source completion delegates only to the reviewed metadata verifier", async () => {
  const text = await source();
  assert.match(text, /^name: Notify dependency completion$/m);
  assert.match(text, /^  workflow_run:$/m);
  assert.match(text, /^    types: \[completed\]$/m);
  const names = [...text.matchAll(/^      - (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(names, [
    "Lapis CI",
    "Publish Storybook Pages",
    "Publish PWA to Cloudflare",
    "Release",
    "Publish verified dependency image",
  ]);
  assert(!names.includes("Notify dependency completion"));
  assert.deepEqual(
    [
      ...text
        .split(/^on:\s*$/m)[1]
        .split(/^permissions:\s*$/m)[0]
        .matchAll(/^  ([\w-]+):/gm),
    ].map((m) => m[1]),
    ["workflow_run"],
  );
  assert.match(
    text,
    new RegExp(
      `^    uses: lapismd/dependency-automation/\\.github/workflows/completion\\.yml@${pin}$`,
      "m",
    ),
  );
  assert.match(text, new RegExp(`^      automation-ref: ${pin}$`, "m"));
  assert.match(
    text,
    /^    if: github\.event\.workflow_run\.conclusion == 'success'$/m,
  );
});

test("completion caller has read-only authority and one named notification secret", async () => {
  const text = await source();
  const permissions = text
    .split(/^permissions:\s*$/m)[1]
    .split(/^jobs:\s*$/m)[0];
  assert.deepEqual(
    permissions
      .trim()
      .split("\n")
      .map((line) => line.trim()),
    ["contents: read", "actions: read", "pull-requests: read"],
  );
  const jobs = text.split(/^jobs:\s*$/m)[1];
  assert.deepEqual(
    [...jobs.matchAll(/^  ([\w-]+):/gm)].map((m) => m[1]),
    ["notify"],
  );
  assert.match(
    jobs,
    /^      app-private-key: \$\{\{ secrets\.LAPIS_DEPENDENCY_APP_PRIVATE_KEY \}\}$/m,
  );
  assert.equal((jobs.match(/secrets\./g) ?? []).length, 1);
  assert.doesNotMatch(
    text,
    /: write|secrets: inherit|concurrency:|cancel-in-progress:|runs-on:|steps:|container:|\brun:|checkout@|download-artifact@|cache@|head_sha|pull_request_target|workflow_dispatch:/,
  );
  assert.doesNotMatch(
    text,
    /Nostr|Deno|Community|publish-release|release:publish/,
  );
});
