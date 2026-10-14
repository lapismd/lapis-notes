import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

for (const state of ["MERGED", "CLOSED", "OPEN"]) {
  test(`dependency-image publication ${state === "OPEN" ? "updates the open PR" : `creates a new PR after the previous one ${state.toLowerCase()}`}`, async (t) => {
    const root = await mkdtemp(path.join(tmpdir(), "lapis-image-pr-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    const bin = path.join(root, "bin");
    await mkdir(bin);
    const log = path.join(root, "calls.jsonl");
    await writeFile(log, "");
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
      '#!/bin/sh\nif [ "$1" = diff ]; then exit 1; fi\nexit 0\n',
      { mode: 0o755 },
    );
    await writeFile(
      path.join(bin, "gh"),
      `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.TEST_CALL_LOG, JSON.stringify(args) + "\\n");
if (args[0] !== "pr") process.exit(2);
if (args[1] === "view") console.log(JSON.stringify({ url: "https://github.com/example/repo/pull/42", state: process.env.TEST_PR_STATE }));
if (args[1] === "list") {
  const onlyOpen = args[args.indexOf("--state") + 1] === "open";
  if (!onlyOpen || process.env.TEST_PR_STATE === "OPEN") console.log(args.includes("number") ? "42" : "https://github.com/example/repo/pull/42");
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
        TEST_PR_STATE: state,
        IMAGE_TAG: "lock-fixture",
        IMAGE_DIGEST: `sha256:${"c".repeat(64)}`,
        GITHUB_STEP_SUMMARY: path.join(root, "summary"),
      },
    });
    assert.equal(result.status, 0, result.stderr);
    const calls = (await readFile(log, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(JSON.parse);
    const mutations = calls.filter((args) =>
      ["create", "edit"].includes(args[1]),
    );
    assert.equal(mutations.length, 1);
    assert.equal(mutations[0][1], state === "OPEN" ? "edit" : "create");
  });
}
