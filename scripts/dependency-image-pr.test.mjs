import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const rollingBranch = "automation/lapis-notes-ci";

for (const state of ["MERGED", "CLOSED", "OPEN"]) {
  test(`dependency-image publication ${state === "OPEN" ? "updates the open PR" : `creates a new PR after the previous one ${state.toLowerCase()}`}`, async (t) => {
    const { result, calls } = await publish(t, { state });
    assert.equal(result.status, 0, result.stderr);
    const mutations = calls.filter((args) =>
      ["create", "edit"].includes(args[1]),
    );
    assert.equal(mutations.length, 1);
    assert.equal(mutations[0][1], state === "OPEN" ? "edit" : "create");
  });
}

test("lockfile changes reuse the same rolling review branch", async (t) => {
  for (const tag of ["lock-aaaaaaaaaaaaaaaa", "lock-bbbbbbbbbbbbbbbb"]) {
    const { result, calls, gitCalls } = await publish(t, {
      state: "OPEN",
      tag,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      gitCalls.find((args) => args[0] === "switch"),
      ["switch", "-c", rollingBranch],
    );
    const lookup = calls.find((args) => args[1] === "list");
    assert.equal(lookup[lookup.indexOf("--head") + 1], rollingBranch);
    assert.equal(lookup[lookup.indexOf("--base") + 1], "main");
    assert.equal(lookup[lookup.indexOf("--state") + 1], "open");
    assert.equal(calls.find((args) => args[1] === "edit")[2], "42");
  }
});

test("successful rolling publication closes only legacy bot image reviews", async (t) => {
  const { result, calls } = await publish(t, { legacy: "48\n63\n" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    calls.filter((args) => args[1] === "close").map((args) => args[2]),
    ["48", "63"],
  );
  const query = calls.find((args) => args[0] === "api");
  assert.ok(query.includes("--paginate"));
  assert.ok(
    query.includes(
      "repos/lapismd/lapis-notes/pulls?state=open&base=main&per_page=100",
    ),
  );
  const filter = query[query.indexOf("--jq") + 1];
  assert.ok(filter.includes('.user.login == "github-actions[bot]"'));
  assert.ok(filter.includes(".head.repo.full_name == .base.repo.full_name"));
  assert.ok(
    filter.includes('test("^automation/lapis-notes-ci-lock-[a-f0-9]{16}$")'),
  );
  assert.ok(
    calls.findIndex((args) => args[1] === "create") <
      calls.findIndex((args) => args[1] === "close"),
  );
});

test("an already pinned image closes obsolete rolling and legacy reviews", async (t) => {
  const { result, calls, gitCalls } = await publish(t, {
    state: "OPEN",
    changed: false,
    legacy: "63\n",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    calls.filter((args) => args[1] === "close").map((args) => args[2]),
    ["42", "63"],
  );
  assert.ok(!calls.some((args) => ["create", "edit"].includes(args[1])));
  assert.ok(!gitCalls.some((args) => args[0] === "push"));
});

test("failed publication preserves legacy reviews", async (t) => {
  const { result, calls } = await publish(t, {
    fail: "create",
    legacy: "63\n",
  });
  assert.notEqual(result.status, 0);
  assert.ok(!calls.some((args) => args[1] === "close"));
});

test("an unchanged pin without an open rolling review needs no new PR", async (t) => {
  const { result, calls } = await publish(t, { changed: false });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(
    !calls.some((args) => ["create", "edit", "close"].includes(args[1])),
  );
});

test("manual publication is restricted to main", async () => {
  const workflow = await readFile(
    ".github/workflows/dependency-image.yml",
    "utf8",
  );
  assert.match(
    workflow,
    /if:.*github\.repository == 'lapismd\/lapis-notes'.*github\.ref == 'refs\/heads\/main'/,
  );
});

async function publish(
  t,
  {
    state = "CLOSED",
    tag = "lock-fixture",
    changed = true,
    legacy = "",
    fail = "",
  } = {},
) {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-image-pr-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const bin = path.join(root, "bin");
  await mkdir(bin);
  const log = path.join(root, "calls.jsonl");
  const gitLog = path.join(root, "git.jsonl");
  await writeFile(log, "");
  await writeFile(gitLog, "");
  const workflow = await readFile(
    ".github/workflows/dependency-image.yml",
    "utf8",
  );
  const step = workflow.slice(
    workflow.indexOf("      - name: Verify and propose immutable digest pin"),
  );
  const lines = step.split("\n");
  const start = lines.findIndex((line) => line === "        run: |");
  assert.ok(start >= 0, "pin-publication shell step exists");
  const shell = lines
    .slice(start + 1)
    .filter((line) => line.startsWith("          "))
    .map((line) => line.slice(10))
    .join("\n");
  await writeFile(path.join(bin, "node"), "#!/bin/sh\nexit 0\n", {
    mode: 0o755,
  });
  await writeFile(
    path.join(bin, "git"),
    `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.TEST_GIT_LOG, JSON.stringify(args) + "\\n");
if (args[0] === "diff") process.exit(process.env.TEST_CHANGED === "1" ? 1 : 0);
`,
    { mode: 0o755 },
  );
  await writeFile(
    path.join(bin, "gh"),
    `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.TEST_CALL_LOG, JSON.stringify(args) + "\\n");
if (args[1] === process.env.TEST_FAIL) process.exit(1);
if (args[0] === "api") process.stdout.write(process.env.TEST_LEGACY_PRS);
else if (args[0] !== "pr") process.exit(2);
if (args[1] === "list") {
  const head = args[args.indexOf("--head") + 1];
  const onlyOpen = args[args.indexOf("--state") + 1] === "open";
  if (head === "${rollingBranch}" && (!onlyOpen || process.env.TEST_PR_STATE === "OPEN")) console.log("42");
}
`,
    { mode: 0o755 },
  );
  const result = spawnSync("bash", ["-c", shell], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      TEST_CALL_LOG: log,
      TEST_GIT_LOG: gitLog,
      TEST_PR_STATE: state,
      TEST_CHANGED: changed ? "1" : "0",
      TEST_LEGACY_PRS: legacy,
      TEST_FAIL: fail,
      IMAGE_TAG: tag,
      IMAGE_DIGEST: `sha256:${"c".repeat(64)}`,
      GITHUB_REPOSITORY: "lapismd/lapis-notes",
      GITHUB_STEP_SUMMARY: path.join(root, "summary"),
    },
  });
  const parse = async (file) =>
    (await readFile(file, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(JSON.parse);
  return { result, calls: await parse(log), gitCalls: await parse(gitLog) };
}
