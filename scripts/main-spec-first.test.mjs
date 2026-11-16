import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";

const workflow = (name) =>
  parse(
    readFileSync(
      new URL(`../.github/workflows/${name}.yml`, import.meta.url),
      "utf8",
    ),
  );
test("main/manual governance and standalone Pages execute exact-range spec-first", () => {
  for (const [name, job] of [
    ["lapis-ci", "governance"],
    ["publish-storybook-pages", "build"],
  ]) {
    const steps = workflow(name).jobs[job].steps;
    const gate = steps.find((step) => step.name === "Main spec-first gate");
    assert.equal(gate?.run, "node scripts/main-spec-first.mjs", name);
    assert.equal(gate.if, "github.event_name != 'pull_request'");
    assert.equal(
      steps.find((step) => step.uses?.startsWith("actions/checkout@"))?.with?.[
        "fetch-depth"
      ],
      0,
    );
  }
});

import { mainSpecFirstRange, runMainSpecFirst } from "./main-spec-first.mjs";
import { botSpecificationExemption } from "./dependency-automation/spec-policy.mjs";
const base = "a".repeat(40),
  head = "b".repeat(40),
  secondParent = "c".repeat(40);
function fixture() {
  const env = {
    CI: "true",
    GITHUB_ACTIONS: "true",
    GITHUB_REPOSITORY: "lapismd/lapis-notes",
    GITHUB_REF: "refs/heads/main",
    GITHUB_SHA: head,
    GITHUB_EVENT_NAME: "push",
    GITHUB_EVENT_PATH: "/event.json",
  };
  const event = {
    ref: "refs/heads/main",
    deleted: false,
    forced: false,
    before: base,
    after: head,
    repository: {
      full_name: "lapismd/lapis-notes",
      default_branch: "main",
      private: false,
      fork: false,
    },
    sender: { login: "lapismd-dependency-bot[bot]", type: "Bot" },
  };
  const calls = [];
  const git = (args) => {
    calls.push(args);
    if (args[0] === "rev-list") return `${head} ${base} ${secondParent}`;
    if (args[0] === "merge-base") return "";
    if (args[2] === "HEAD") return head;
    return args[2].replace("^{commit}", "");
  };
  return { env, event, git, calls };
}
test("bot push checks the exact multi-commit event range and cannot use PR exemption", () => {
  const f = fixture();
  Object.assign(f.env, {
    LAPIS_CI_PR_AUTHOR_TYPE: "Bot",
    LAPIS_CI_PR_AUTHOR: "lapismd-dependency-bot[bot]",
  });
  assert.equal(botSpecificationExemption(f.env), false);
  assert.deepEqual(mainSpecFirstRange(f), { base, head });
  assert.ok(
    f.calls.some(
      (args) => args.join(" ") === `merge-base --is-ancestor ${base} ${head}`,
    ),
  );
  assert.ok(!f.calls.some((args) => args[0] === "rev-list"));
});
test("manual main uses its immutable first parent, ignoring actor and baseline input", () => {
  const f = fixture();
  f.env.GITHUB_EVENT_NAME = "workflow_dispatch";
  f.event.inputs = { base: secondParent };
  f.event.sender = { login: "human" };
  delete f.event.before;
  assert.deepEqual(mainSpecFirstRange(f), { base, head });
});
for (const [name, mutate] of Object.entries({
  "missing actions context": (f) => delete f.env.GITHUB_ACTIONS,
  "foreign repository": (f) => (f.event.repository.full_name = "other/repo"),
  "private source": (f) => (f.event.repository.private = true),
  fork: (f) => (f.event.repository.fork = true),
  "unknown default branch": (f) => delete f.event.repository.default_branch,
  "non-main checkout": (f) => (f.env.GITHUB_REF = "refs/heads/feature"),
  "missing head": (f) => delete f.env.GITHUB_SHA,
  "zero head": (f) => (f.env.GITHUB_SHA = "0".repeat(40)),
  "missing before": (f) => delete f.event.before,
  "zero before": (f) => (f.event.before = "0".repeat(40)),
  "mutable before": (f) => (f.event.before = "origin/main"),
  "empty range": (f) => (f.event.before = head),
  "wrong after": (f) => (f.event.after = secondParent),
  "missing after": (f) => delete f.event.after,
  "wrong push ref": (f) => (f.event.ref = "refs/heads/feature"),
  "deleted branch": (f) => (f.event.deleted = true),
  "forced push": (f) => (f.event.forced = true),
  "PR context": (f) => (f.env.GITHUB_EVENT_NAME = "pull_request"),
  "unknown caller": (f) => (f.env.GITHUB_EVENT_NAME = "workflow_call"),
  "unrelated base": (f) => {
    const git = f.git;
    f.git = (args) => {
      if (args[0] === "merge-base") throw Error("not an ancestor");
      return git(args);
    };
  },
  "missing commit": (f) => {
    const git = f.git;
    f.git = (args) => (args[2] === `${base}^{commit}` ? "" : git(args));
  },
  "substituted commit": (f) => {
    const git = f.git;
    f.git = (args) =>
      args[2] === `${base}^{commit}` ? secondParent : git(args);
  },
  "moved checkout": (f) => {
    const git = f.git;
    f.git = (args) => (args[2] === "HEAD" ? secondParent : git(args));
  },
  "manual root commit": (f) => {
    f.env.GITHUB_EVENT_NAME = "workflow_dispatch";
    const git = f.git;
    f.git = (args) => (args[0] === "rev-list" ? head : git(args));
  },
  "manual non-main": (f) => {
    f.env.GITHUB_EVENT_NAME = "workflow_dispatch";
    f.env.GITHUB_REF = "refs/heads/feature";
  },
}))
  test(`main range holds ${name} before executing validation`, () => {
    const f = fixture();
    mutate(f);
    let executed = false;
    assert.throws(() =>
      runMainSpecFirst({
        ...f,
        read: () => JSON.stringify(f.event),
        run: () => {
          executed = true;
          return { status: 0 };
        },
      }),
    );
    assert.equal(executed, false);
  });
test("missing or malformed event payload holds", () => {
  const f = fixture();
  delete f.env.GITHUB_EVENT_PATH;
  assert.throws(
    () => runMainSpecFirst({ ...f, run: () => assert.fail("executed") }),
    /missing event payload/,
  );
  assert.throws(() =>
    runMainSpecFirst({
      ...fixture(),
      read: () => "{",
      run: () => assert.fail("executed"),
    }),
  );
});
test("validator receives exact refs and bot push bypasses no canonical checks", () => {
  const f = fixture();
  // Even a stale caller variable cannot activate the separate PR policy wrapper.
  f.env.LAPIS_CI_EVENT = "pull_request";
  assert.deepEqual(
    runMainSpecFirst({
      ...f,
      read: () => JSON.stringify(f.event),
      run: (command, args) => {
        assert.equal(command, "pnpm");
        assert.deepEqual(args, [
          "exec",
          "spec-validator",
          "first",
          "--base",
          base,
          "--head",
          head,
        ]);
        return { status: 0 };
      },
    }),
    { base, head },
  );
});
test("canonical validation failures remain blocking", () => {
  const f = fixture();
  assert.throws(
    () =>
      runMainSpecFirst({
        ...f,
        read: () => JSON.stringify(f.event),
        run: () => ({ status: 1 }),
      }),
    /canonical coverage failed/,
  );
});
test("checkout moves immediately before or during validation remain blocking", () => {
  for (const movedAt of [2, 3]) {
    const f = fixture();
    let reads = 0,
      executions = 0;
    const git = f.git;
    f.git = (args) =>
      args[2] === "HEAD" && ++reads >= movedAt ? secondParent : git(args);
    assert.throws(
      () =>
        runMainSpecFirst({
          ...f,
          read: () => JSON.stringify(f.event),
          run: () => {
            executions++;
            return { status: 0 };
          },
        }),
      /checkout differs/,
    );
    assert.equal(executions, movedAt === 2 ? 0 : 1);
  }
});
test("release and PWA retain reusable validation; governance still blocks the aggregate", () => {
  for (const name of ["release", "publish-web-cloudflare"]) {
    assert.equal(
      workflow(name).jobs.validation.uses,
      "./.github/workflows/lapis-ci.yml",
    );
  }
  const ci = workflow("lapis-ci");
  assert.ok(ci.jobs.validate.needs.includes("governance"));
  const aggregate = ci.jobs.validate.steps[0];
  assert.equal(aggregate.env.GOVERNANCE, "${{ needs.governance.result }}");
  assert.ok(aggregate.run.includes("$GOVERNANCE"));
  assert.ok(aggregate.run.includes('"$result" != "success"'));
});

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
test("real isolated Git history distinguishes push range, manual first parent and unrelated base", () => {
  const root = mkdtempSync(join(tmpdir(), "notes-main-first-"));
  try {
    // Disposable fixture only; no workspace Git writes, user config or hooks.
    const env = {
      PATH: process.env.PATH,
      HOME: root,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_AUTHOR_NAME: "Fixture",
      GIT_AUTHOR_EMAIL: "fixture@example.invalid",
      GIT_COMMITTER_NAME: "Fixture",
      GIT_COMMITTER_EMAIL: "fixture@example.invalid",
    };
    const git = (args, input) => {
      const result = spawnSync(
        "git",
        [
          "--no-replace-objects",
          "-c",
          "core.hooksPath=/dev/null",
          "-c",
          "commit.gpgSign=false",
          ...args,
        ],
        { cwd: root, env, encoding: "utf8", input },
      );
      if (result.status !== 0) throw Error(`fixture Git ${args[0]} failed`);
      return result.stdout.trim();
    };
    git(["init", "--quiet"]);
    const tree = git(["mktree"], "");
    const a = git(["commit-tree", tree, "-m", "base"]);
    const b = git(["commit-tree", tree, "-p", a, "-m", "middle"]);
    const c = git(["commit-tree", tree, "-p", b, "-m", "head"]);
    const unrelated = git(["commit-tree", tree, "-m", "unrelated"]);
    git(["update-ref", "HEAD", c]);
    const f = fixture();
    f.git = git;
    f.env.GITHUB_SHA = c;
    Object.assign(f.event, { before: a, after: c });
    assert.deepEqual(mainSpecFirstRange(f), { base: a, head: c });
    f.env.GITHUB_EVENT_NAME = "workflow_dispatch";
    assert.deepEqual(mainSpecFirstRange(f), { base: b, head: c });
    f.env.GITHUB_EVENT_NAME = "push";
    f.event.before = unrelated;
    assert.throws(() => mainSpecFirstRange(f), /fixture Git merge-base failed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

import config from "../spec-validator.config.mjs";
test("the main-range guard remains protected by all three governance owner families", () => {
  const rule = config.validators.specFirst.rules.find((entry) =>
    new RegExp(entry.pattern).test("scripts/main-spec-first.mjs"),
  );
  assert.ok(rule, "main guard must be mapped");
  for (const chapter of [
    "architecture/build-and-validation",
    "packages/core-contract",
    "spec-governance/validation-and-ci",
  ]) {
    assert.ok(
      rule.chapterPatterns.some((pattern) =>
        new RegExp(pattern).test(`spec/src/${chapter}.md`),
      ),
      chapter,
    );
  }
});
