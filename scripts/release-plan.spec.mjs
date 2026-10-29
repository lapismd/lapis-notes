import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  createReleasePlan,
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

test("keeps a published version selected until its GitHub release exists", () => {
  const packageRecords = records();
  const plan = planReleaseCandidates(
    packageRecords,
    packageRecords.map((record) => ({
      name: record.name,
      version: record.version,
      published: true,
      registryEmpty: false,
      releaseMissing: true,
    })),
  );
  assert.deepEqual(
    plan.selected.map((entry) => entry.name),
    packageRecords.map((record) => record.name),
  );
  assert.equal(plan.published.length, 0);
  assert.equal(plan.bootstrapRequired, false);
  assert.equal(plan.hasWork, true);
});

test("createReleasePlan selects only published packages missing GitHub releases", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "lapis-release-plan-"));
  const previousSha = process.env.GITHUB_SHA;
  process.env.GITHUB_SHA = "abc123";
  try {
    for (const definition of PUBLIC_PACKAGE_GRAPH) {
      const packageDir = path.join(repoRoot, "packages", definition.directory);
      mkdirSync(packageDir, { recursive: true });
      writeFileSync(
        path.join(packageDir, "package.json"),
        JSON.stringify({ name: definition.name, version: "0.1.0" }),
      );
    }
    const plan = await createReleasePlan({
      repoRoot,
      fetchImpl: async (url) => {
        const parsed = new URL(url);
        if (parsed.hostname === "api.github.com") {
          return {
            status: parsed.pathname.endsWith("/ui%400.1.0") ? 404 : 200,
            json: async () => ({}),
          };
        }
        return {
          status: 200,
          json: async () => ({
            dist: { integrity: "sha512-example", tarball: "https://example.test/package.tgz" },
            "dist-tags": { latest: "0.1.0" },
          }),
        };
      },
    });
    assert.deepEqual(
      plan.selected.map((entry) => entry.name),
      ["@lapis-notes/ui"],
    );
    assert.equal(plan.bootstrapRequired, false);
    assert.equal(
      plan.packages.find((entry) => entry.name === "@lapis-notes/ui")
        .releaseMissing,
      true,
    );
  } finally {
    if (previousSha === undefined) delete process.env.GITHUB_SHA;
    else process.env.GITHUB_SHA = previousSha;
    await rm(repoRoot, { recursive: true, force: true });
  }
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
