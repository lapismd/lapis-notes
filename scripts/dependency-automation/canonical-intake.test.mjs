import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, mkdtempSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import {
  verifyCanonicalIntake,
  checkCanonicalIntake,
  expectedPolicy as policy,
  policyPath,
} from "./check-canonical-intake.mjs";
import { runFunctionalCheckLanes, skipSpecification } from "./spec-policy.mjs";

const root = new URL("../../", import.meta.url);
const frozen = JSON.parse(
  readFileSync(new URL("./fixtures/core0135.json", import.meta.url), "utf8"),
);
const fixture = () => structuredClone(frozen.files);
const verify = (files) =>
  verifyCanonicalIntake({ read: (path) => files[path] });
const edit = (files, path, fn) => {
  const value = JSON.parse(files[path]);
  fn(value);
  files[path] = JSON.stringify(value);
};
const lockEdit = (files, fn) => {
  const lock = YAML.parse(files["pnpm-lock.yaml"]);
  fn(lock);
  files["pnpm-lock.yaml"] = YAML.stringify(lock);
};
const core = "@lapismd/design-core";

test("frozen seven-area Core intake agrees without any writes or network", () => {
  const files = fixture(),
    before = structuredClone(files);
  const result = verify(files);
  assert.equal(result.chapters, 7);
  assert.equal(Object.keys(result.facts.manifests).length, 7);
  assert.equal(
    result.facts.manifests["packages/api/package.json"].dependencies[core]
      .version,
    "0.13.5",
  );
  assert.deepEqual(files, before);
});

test("actual source independently agrees without pinning future patches", () => {
  assert.equal(checkCanonicalIntake(fileURLToPath(root)).chapters, 7);
});

for (const path of policy.chapters)
  test(`stale actual range is rejected in ${path}`, () => {
    const files = fixture();
    files[path] = files[path].replace("`^0.13.5`", "`^0.13.4`");
    assert.throws(() => verify(files), /stale or malformed facts/);
  });

for (const [name, mutate, error] of [
  [
    "changed source policy",
    (f) => edit(f, policyPath, (p) => p.chapters.pop()),
    /source opt-in/,
  ],
  [
    "unmapped importer",
    (f) =>
      lockEdit(f, (l) => {
        l.importers["packages/unknown"] = l.importers["packages/web"];
      }),
    /undeclared active/,
  ],
  [
    "missing active importer",
    (f) =>
      lockEdit(f, (l) => {
        delete l.importers["packages/api"];
      }),
    /coordinates disagree/,
  ],
  [
    "range-only drift",
    (f) =>
      edit(f, "packages/api/package.json", (p) => {
        p.dependencies[core] = "^0.13.4";
      }),
    /coordinates disagree/,
  ],
  [
    "changed peer support",
    (f) =>
      edit(f, "packages/api/package.json", (p) => {
        p.peerDependencies[core] = "^0.13.0";
      }),
    /stale or malformed/,
  ],
  [
    "source redirect",
    (f) =>
      edit(f, "packages/api/package.json", (p) => {
        p.dependencies[core] = "file:../core";
      }),
    /invalid range/,
  ],
  [
    "multiple Core identities",
    (f) =>
      lockEdit(f, (l) => {
        l.importers["."].devDependencies[core].version = "0.13.4";
        l.packages[`${core}@0.13.4`] = l.packages[`${core}@0.13.5`];
      }),
    /multiple or missing/,
  ],
  [
    "missing integrity",
    (f) =>
      lockEdit(f, (l) => {
        delete l.packages[`${core}@0.13.5`].resolution.integrity;
      }),
    /coordinates disagree/,
  ],
  [
    "changed integrity",
    (f) =>
      lockEdit(f, (l) => {
        l.packages[`${core}@0.13.5`].resolution.integrity =
          "sha512-" + "A".repeat(86) + "==";
      }),
    /stale or malformed/,
  ],
  [
    "external tarball",
    (f) =>
      lockEdit(f, (l) => {
        l.packages[`${core}@0.13.5`].resolution.tarball =
          "https://example.invalid/core.tgz";
      }),
    /coordinates disagree/,
  ],
  [
    "missing slot",
    (f) => {
      f[policy.chapters[0]] = "# Missing\n";
    },
    /missing or ambiguous/,
  ],
  [
    "duplicate slot",
    (f) => {
      f[policy.chapters[0]] += f[policy.chapters[0]];
    },
    /missing or ambiguous/,
  ],
  [
    "manual slot prose",
    (f) => {
      f[policy.chapters[0]] = f[policy.chapters[0]].replace(
        "<!-- prettier-ignore -->",
        "Hand-edited prose\n<!-- prettier-ignore -->",
      );
    },
    /manual content/,
  ],
  [
    "oversized chapter",
    (f) => {
      f[policy.chapters[0]] += "\n".repeat(401);
    },
    /oversized chapter/,
  ],
])
  test(`${name} fails closed`, () => {
    const files = fixture();
    mutate(files);
    assert.throws(() => verify(files), error);
  });

test("named catalogs retain source routing and resolved lock specifiers", () => {
  const files = fixture();
  edit(files, "packages/api/package.json", (p) => {
    p.dependencies[core] = "catalog:framework";
  });
  const workspace = YAML.parse(files["pnpm-workspace.yaml"]);
  workspace.catalogs = {
    ...workspace.catalogs,
    framework: { [core]: "^0.13.5" },
  };
  files["pnpm-workspace.yaml"] = YAML.stringify(workspace);
  // The same displayed range is insufficient: the fingerprint binds routing too.
  assert.throws(() => verify(files), /stale or malformed facts/);
  delete workspace.catalogs.framework;
  files["pnpm-workspace.yaml"] = YAML.stringify(workspace);
  assert.throws(() => verify(files), /invalid range/);
});

test("functional lane remains enabled for the exact trusted bot exemption", async () => {
  assert.equal(
    skipSpecification("spec:check", {
      CI: "true",
      LAPIS_CI_EVENT: "pull_request",
      LAPIS_CI_PR_AUTHOR: "lapismd-dependency-bot[bot]",
      LAPIS_CI_PR_AUTHOR_TYPE: "Bot",
    }),
    true,
  );
  const { default: config } = await import("../../spec-validator.config.mjs");
  const lane = config.check.lanes.find(
    (l) => l.name === "canonical-dependency-intake",
  );
  assert.deepEqual(lane.args, ["check:dependency-intake"]);
  const runs = [];
  const code = await runFunctionalCheckLanes({
    loadConfig: async () => config,
    run(command, args) {
      runs.push([command, args]);
      return { status: args.includes("check:dependency-intake") ? 71 : 0 };
    },
  });
  assert.equal(code, 71);
  assert.equal(runs.length, 1);
  const lanes = JSON.parse(
    readFileSync(new URL("scripts/validation/lanes.json", root)),
  );
  assert.match(lanes.check, /^pnpm check:dependency-intake &&/);
  assert.doesNotMatch(lanes["check:dependency-intake"], /spec-policy/);
  const workflow = YAML.parse(
    readFileSync(new URL(".github/workflows/lapis-ci.yml", root), "utf8"),
  );
  const step = workflow.jobs.quality.steps.find(
    (s) => s.run === "pnpm check:dependency-intake",
  );
  assert.ok(step, "hosted quality executes the functional guard");
  assert.equal(step.if, undefined, "bot PRs retain the hosted guard");
});

test("symlinked source is rejected before reading", () => {
  const directory = mkdtempSync(join(tmpdir(), "notes-intake-symlink-"));
  try {
    symlinkSync(new URL(".github", root), join(directory, ".github"));
    assert.throws(
      () => checkCanonicalIntake(directory),
      /non-regular source input/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
