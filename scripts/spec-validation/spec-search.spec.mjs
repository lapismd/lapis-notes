import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_LIMIT,
  parseCliArgs,
  resolveQmdBinary,
  runSpecCommand,
} from "./spec-search.mjs";

function createHarness(results = []) {
  const calls = [];
  const output = { stdout: "", stderr: "" };
  const repoRoot = path.resolve("/repo/lapis-notes");
  const binaryPath = resolveQmdBinary(repoRoot, "darwin");
  const existing = new Set([
    binaryPath,
    path.join(repoRoot, ".qmd", "index.yml"),
  ]);
  return {
    calls,
    output,
    dependencies: {
      repoRoot,
      binaryPath,
      platform: "darwin",
      environment: { TEST_ENV: "present", PWD: "/wrong" },
      exists: (filePath) => existing.has(filePath),
      run: (command, args, options) => {
        calls.push({ command, args, options });
        return results.shift() ?? { status: 0, stdout: "", stderr: "" };
      },
      stdout: { write: (value) => (output.stdout += value) },
      stderr: { write: (value) => (output.stderr += value) },
    },
  };
}

test("parses lexical and semantic search options", () => {
  assert.deepEqual(parseCliArgs(["search", "LN-GOV-013"]), {
    command: "search",
    semantic: false,
    json: false,
    limit: DEFAULT_LIMIT,
    query: "LN-GOV-013",
  });
  assert.deepEqual(
    parseCliArgs([
      "search",
      "--",
      "--semantic",
      "--json",
      "--limit",
      "18",
      "panel",
      "placement",
    ]),
    {
      command: "search",
      semantic: true,
      json: true,
      limit: 18,
      query: "panel placement",
    },
  );
});

test("rejects invalid commands and arguments", () => {
  assert.throws(() => parseCliArgs(["search"]), /requires a query/);
  assert.throws(
    () => parseCliArgs(["search", "--limit", "0", "query"]),
    /positive integer/,
  );
  assert.throws(() => parseCliArgs(["index", "query"]), /only --semantic/);
  assert.throws(() => parseCliArgs(["query", "text"]), /search or index/);
});

test("refreshes quietly before repository-local lexical search", () => {
  const harness = createHarness();
  const status = runSpecCommand(
    parseCliArgs(["search", "panel", "placement"]),
    harness.dependencies,
  );

  assert.equal(status, 0);
  assert.equal(harness.calls.length, 2);
  assert.deepEqual(harness.calls[0].args, ["update"]);
  assert.deepEqual(harness.calls[0].options.stdio, ["ignore", "pipe", "pipe"]);
  assert.deepEqual(harness.calls[1].args, [
    "search",
    "panel placement",
    "-c",
    "lapis-spec",
    "-n",
    "10",
    "--format",
    "md",
    "--full-path",
    "--line-numbers",
  ]);
  for (const call of harness.calls) {
    assert.equal(call.command, harness.dependencies.binaryPath);
    assert.equal(call.options.cwd, harness.dependencies.repoRoot);
    assert.equal(call.options.env.PWD, harness.dependencies.repoRoot);
    assert.equal(call.options.env.TEST_ENV, "present");
  }
});

test("refreshes, embeds, and vector-searches in semantic mode", () => {
  const harness = createHarness();
  const status = runSpecCommand(
    parseCliArgs(["search", "--semantic", "--json", "conceptual", "query"]),
    harness.dependencies,
  );

  assert.equal(status, 0);
  assert.deepEqual(
    harness.calls.map((call) => call.args),
    [
      ["update"],
      ["embed", "-c", "lapis-spec"],
      [
        "vsearch",
        "conceptual query",
        "-c",
        "lapis-spec",
        "-n",
        "10",
        "--format",
        "json",
        "--full-path",
        "--line-numbers",
      ],
    ],
  );
});

test("explicit index refresh optionally precomputes embeddings", () => {
  const lexical = createHarness();
  assert.equal(
    runSpecCommand(parseCliArgs(["index"]), lexical.dependencies),
    0,
  );
  assert.deepEqual(lexical.calls.map((call) => call.args), [["update"]]);
  assert.equal(lexical.calls[0].options.stdio, "inherit");

  const semantic = createHarness();
  assert.equal(
    runSpecCommand(
      parseCliArgs(["index", "--semantic"]),
      semantic.dependencies,
    ),
    0,
  );
  assert.deepEqual(
    semantic.calls.map((call) => call.args),
    [["update"], ["embed", "-c", "lapis-spec"]],
  );
});

test("stops after refresh failure and propagates its status", () => {
  const harness = createHarness([
    { status: 7, stdout: "refresh output\n", stderr: "refresh error\n" },
  ]);
  const status = runSpecCommand(
    parseCliArgs(["search", "query"]),
    harness.dependencies,
  );

  assert.equal(status, 7);
  assert.equal(harness.calls.length, 1);
  assert.match(harness.output.stderr, /refresh output/);
  assert.match(harness.output.stderr, /refresh error/);
});

test("propagates search failure without a lexical fallback", () => {
  const harness = createHarness([
    { status: 0, stdout: "", stderr: "" },
    { status: 9, stdout: "", stderr: "search error\n" },
  ]);
  const status = runSpecCommand(
    parseCliArgs(["search", "query"]),
    harness.dependencies,
  );

  assert.equal(status, 9);
  assert.equal(harness.calls.length, 2);
  assert.match(harness.output.stderr, /Specification search failed/);
});

test("reports missing local configuration and binary", () => {
  const options = parseCliArgs(["search", "query"]);
  const missingConfig = createHarness();
  missingConfig.dependencies.exists = () => false;
  assert.equal(runSpecCommand(options, missingConfig.dependencies), 2);
  assert.match(missingConfig.output.stderr, /Missing \.qmd\/index\.yml/);

  const missingBinary = createHarness();
  missingBinary.dependencies.exists = (filePath) =>
    filePath.endsWith(path.join(".qmd", "index.yml"));
  assert.equal(runSpecCommand(options, missingBinary.dependencies), 2);
  assert.match(missingBinary.output.stderr, /run pnpm install/);
});
