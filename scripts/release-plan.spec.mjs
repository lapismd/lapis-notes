import assert from "node:assert/strict";
import { test } from "node:test";
import {
  planReleaseCandidates,
  resolveReleaseCommit,
} from "./release-plan.mjs";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

function records() {
  return PUBLIC_PACKAGE_GRAPH.map((definition) => ({
    ...definition,
    version: "0.1.0",
    manifest: {
      name: definition.name,
      version: "0.1.0",
    },
  }));
}

test("selects unpublished public packages in graph order", () => {
  const packageRecords = records();
  const plan = planReleaseCandidates(
    packageRecords,
    packageRecords.map((record) => ({
      name: record.name,
      version: record.version,
      published: false,
      registryEmpty: true,
    })),
  );
  assert.deepEqual(
    plan.selected.map((entry) => entry.name),
    [
      "@lapis-notes/ui",
      "@lapis-notes/api",
      "@lapis-notes/language-service",
      "@lapis-notes/file-explorer",
      "@lapis-notes/workspace",
    ],
  );
  assert.equal(plan.bootstrapRequired, true);
});

test("skips versions already present on npm", () => {
  const packageRecords = records();
  const plan = planReleaseCandidates(
    packageRecords,
    packageRecords.map((record) => ({
      name: record.name,
      version: record.version,
      published: true,
      registryEmpty: false,
      integrity: "sha512-example",
    })),
  );
  assert.equal(plan.selected.length, 0);
  assert.equal(plan.published.length, PUBLIC_PACKAGE_GRAPH.length);
});

test("resolves the latest non-empty Jujutsu commit for local release provenance", () => {
  const calls = [];
  const commit = resolveReleaseCommit("/repo", {
    env: {},
    exec(command, args, cwd) {
      calls.push({ command, args, cwd });
      if (command !== "jj") return "";
      if (args[0] === "root") return "/repo";
      if (args.includes("empty")) return "true";
      return "committed-source";
    },
  });
  assert.equal(commit, "committed-source");
  assert.deepEqual(calls[0], {
    command: "jj",
    args: ["root"],
    cwd: "/repo",
  });
  assert.deepEqual(calls[1], {
    command: "jj",
    args: ["log", "-r", "@", "--no-graph", "-T", "empty"],
    cwd: "/repo",
  });
  assert.deepEqual(calls[2], {
    command: "jj",
    args: [
      "log",
      "-r",
      "latest(::@ & ~empty(), 1)",
      "--no-graph",
      "-T",
      "commit_id",
    ],
    cwd: "/repo",
  });
});

test("rejects a non-empty Jujutsu working-copy commit", () => {
  assert.throws(
    () =>
      resolveReleaseCommit("/repo", {
        env: {},
        exec(command, args) {
          if (command !== "jj") return "";
          if (args[0] === "root") return "/repo";
          if (args.includes("empty")) return "false";
          return "ephemeral-source";
        },
      }),
    /requires an empty Jujutsu working-copy commit/,
  );
});

test("uses the workflow source commit without invoking local VCS", () => {
  const commit = resolveReleaseCommit("/repo", {
    env: { GITHUB_SHA: "workflow-source" },
    exec() {
      throw new Error("VCS must not run when GITHUB_SHA is present");
    },
  });
  assert.equal(commit, "workflow-source");
});
