import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  readFile,
  writeFile,
  mkdtemp,
  mkdir,
  rm,
  symlink,
} from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse } from "yaml";
import { validateReleaseConfig } from "./check-release-config.mjs";

const config = JSON.parse(
  await readFile(new URL("../turbo.json", import.meta.url), "utf8"),
);
const manifest = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

test("CI Storybook tasks cache their results after package builds", () => {
  for (const name of ["ci:storybook-static", "ci:storybook-interaction"]) {
    const task = config.tasks[`//#${name}`];
    assert.ok(task, name);
    assert.notEqual(task.cache, false);
    assert.ok(
      manifest.scripts["ci:release"].includes(
        `node scripts/run-turbo.mjs ${name} --summarize`,
      ),
    );
    assert.ok(task.dependsOn.includes("^build"));
    assert.ok(task.env.includes("LAPIS_TURBO_TOOLCHAIN"));
    assert.ok(task.env.includes("CI"));
    assert.ok(task.env.includes("NODE_OPTIONS"));
    for (const input of [
      "$TURBO_DEFAULT$",
      "packages/*/src/**",
      ".github/actions/ci-setup/action.yml",
      ".ci/images.json",
    ]) {
      assert.ok(task.inputs.includes(input), input);
    }
  }
  assert.deepEqual(config.tasks["//#ci:storybook-static"].outputs, [
    "storybook-static/**",
    ".visual-delta/cache/**",
  ]);
  assert.deepEqual(config.tasks["//#ci:storybook-interaction"].outputs, []);
  assert.equal(
    manifest.scripts["ci:storybook-static"],
    "pnpm build-storybook:run && pnpm test:specification:static:run",
  );
  assert.equal(
    manifest.scripts["ci:storybook-interaction"],
    "pnpm test:storybook:run && pnpm test:specification:dev:run",
  );
});

test("CI and Pages run Storybook through the signed Turbo cache", async () => {
  validateReleaseConfig();
  for (const file of ["lapis-ci.yml", "publish-storybook-pages.yml"]) {
    const workflow = parse(
      await readFile(
        new URL(`../.github/workflows/${file}`, import.meta.url),
        "utf8",
      ),
    );
    for (const env of [
      "TURBO_API",
      "TURBO_TEAM",
      "TURBO_TOKEN",
      "TURBO_REMOTE_CACHE_SIGNATURE_KEY",
    ])
      assert.ok(workflow.env[env], env);
    const steps =
      file === "lapis-ci.yml"
        ? workflow.jobs["storybook-static"].steps
        : workflow.jobs.build.steps;
    assert.ok(
      steps.some(
        (step) =>
          step.run ===
          "node scripts/run-turbo.mjs ci:storybook-static --summarize",
      ),
    );
    if (file === "lapis-ci.yml")
      assert.ok(
        workflow.jobs["storybook-interaction"].steps.some(
          (step) =>
            step.run ===
            "node scripts/run-turbo.mjs ci:storybook-interaction --summarize",
        ),
      );
  }
});

async function cacheFixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-storybook-cache-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "scripts"));
  await mkdir(path.join(root, "stories"));
  await mkdir(path.join(root, "packages/api/src"), { recursive: true });
  await writeFile(
    path.join(root, "packages/api/src/index.js"),
    "export const built = true;",
  );
  await writeFile(
    path.join(root, "packages/api/package.json"),
    JSON.stringify({
      name: "@lapis-notes/api",
      version: "0.1.0",
      private: true,
      scripts: {
        build: `node -e "const fs=require('node:fs');fs.mkdirSync('dist',{recursive:true});fs.copyFileSync('src/index.js','dist/index.js')"`,
      },
    }),
  );
  await writeFile(path.join(root, "stories/Demo.ts"), "story-v1\n");
  await writeFile(
    path.join(root, ".gitignore"),
    ".turbo\n.task-executions\nstorybook-static\n.visual-delta/cache\npackages/**/dist\n",
  );
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - packages/*\n",
  );
  await writeFile(
    path.join(root, "pnpm-lock.yaml"),
    "lockfileVersion: '9.0'\nimporters:\n  .:\n    devDependencies:\n      '@lapis-notes/api':\n        specifier: workspace:*\n        version: link:packages/api\n  packages/api: {}\n",
  );
  const tasks = structuredClone(config.tasks);
  for (const name of ["//#ci:storybook-static", "//#ci:storybook-interaction"])
    tasks[name].env.push("FIXTURE_FAILURE");
  await writeFile(
    path.join(root, "turbo.json"),
    JSON.stringify({ ...config, tasks }),
  );
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "lapis-storybook-cache-fixture",
      private: true,
      packageManager: manifest.packageManager,
      devDependencies: { "@lapis-notes/api": "workspace:*" },
      scripts: {
        "ci:storybook-static": "node scripts/task-fixture.mjs static",
        "ci:storybook-interaction": "node scripts/task-fixture.mjs interaction",
      },
    }),
  );
  await writeFile(
    path.join(root, "scripts/task-fixture.mjs"),
    `
    import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
    readFileSync("packages/api/dist/index.js");
    const kind = process.argv[2];
    appendFileSync(".task-executions", kind + "\\n");
    if (process.env.FIXTURE_FAILURE) throw new Error("Intentional regression failure");
    if (kind === "static") {
      mkdirSync("storybook-static", { recursive: true });
      mkdirSync(".visual-delta/cache", { recursive: true });
      writeFileSync("storybook-static/index.html", readFileSync("stories/Demo.ts"));
      writeFileSync(".visual-delta/cache/preview-stats.json", "{}");
    }
  `,
  );
  return root;
}
const turbo = fileURLToPath(import.meta.resolve("turbo/bin/turbo"));
function cachedRun(root, task, overrides = {}) {
  return spawnSync(
    process.execPath,
    [turbo, "run", task, "--cache=local:rw", "--summarize"],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 30000,
      env: {
        ...process.env,
        CI: "true",
        TURBO_TELEMETRY_DISABLED: "1",
        LAPIS_TURBO_TOOLCHAIN: "fixture-v1",
        FIXTURE_FAILURE: "",
        ...overrides,
      },
    },
  );
}
async function executions(root) {
  return (await readFile(path.join(root, ".task-executions"), "utf8"))
    .trim()
    .split("\n").length;
}
for (const task of ["ci:storybook-static", "ci:storybook-interaction"]) {
  test(`${task} hits cache and invalidates story and toolchain changes`, async (t) => {
    const root = await cacheFixture(t);
    let result = cachedRun(root, task);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(await executions(root), 1);
    if (task.endsWith("static"))
      await rm(path.join(root, "storybook-static"), { recursive: true });
    result = cachedRun(root, task);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /cache hit/);
    assert.equal(await executions(root), 1);
    if (task.endsWith("static"))
      assert.equal(
        await readFile(path.join(root, "storybook-static/index.html"), "utf8"),
        "story-v1\n",
      );
    await writeFile(path.join(root, "stories/Demo.ts"), "story-v2\n");
    result = cachedRun(root, task);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(await executions(root), 2);
    result = cachedRun(root, task, { LAPIS_TURBO_TOOLCHAIN: "fixture-v2" });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(await executions(root), 3);
    await writeFile(
      path.join(root, "packages/api/src/index.js"),
      "export const built = 2;",
    );
    result = cachedRun(root, task, { LAPIS_TURBO_TOOLCHAIN: "fixture-v2" });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(await executions(root), 4);
    await writeFile(
      path.join(root, "pnpm-lock.yaml"),
      (await readFile(path.join(root, "pnpm-lock.yaml"), "utf8")) +
        "# dependency refresh\n",
    );
    result = cachedRun(root, task, { LAPIS_TURBO_TOOLCHAIN: "fixture-v2" });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(await executions(root), 5);
  });
}

test("failed Storybook interaction tasks are executed again", async (t) => {
  const root = await cacheFixture(t);
  for (const count of [1, 2]) {
    const result = cachedRun(root, "ci:storybook-interaction", {
      FIXTURE_FAILURE: "1",
    });
    assert.notEqual(result.status, 0);
    assert.match(
      result.stdout + result.stderr,
      /Intentional regression failure/,
    );
    assert.equal(await executions(root), count);
  }
});

test("real Storybook graph hashes workspace sources and the actual toolchain", () => {
  const runner = new URL("./run-turbo.mjs", import.meta.url);
  const result = spawnSync(
    process.execPath,
    [runner.pathname, "ci:storybook-static", "--dry=json"],
    {
      cwd: new URL("../", import.meta.url),
      encoding: "utf8",
      timeout: 30000,
      env: {
        ...process.env,
        LAPIS_TURBO_TOOLCHAIN: "untrusted-inherited-value",
        TURBO_TELEMETRY_DISABLED: "1",
      },
    },
  );
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const plan = JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
  const task = plan.tasks.find((task) => task.task === "ci:storybook-static");
  for (const prefix of [
    "packages/api/src/",
    "packages/workspace/src/",
    "packages/language-service/src/",
    ".storybook/",
    "stories/",
  ]) {
    assert.ok(
      Object.keys(task.inputs).some((file) => file.startsWith(prefix)),
      prefix,
    );
  }
  assert.ok(task.dependencies.includes("@lapis-notes/api#build"));
  assert.ok(task.dependencies.includes("@lapis-notes/workspace#build"));
  const expected = createHash("sha256")
    .update(`node-${process.versions.node}:${process.platform}:${process.arch}`)
    .digest("hex");
  assert.ok(
    task.environmentVariables.configured.includes(
      `LAPIS_TURBO_TOOLCHAIN=${expected}`,
    ),
  );
});

test("cached API builds restore their generated source catalogue", async (t) => {
  const root = await cacheFixture(t);
  const generated = path.join(
    root,
    "packages/api/src/lib/generated/plugin-host-modules.schema.generated.ts",
  );
  await mkdir(path.dirname(generated), { recursive: true });
  await writeFile(generated, "stale-source");
  const packagePath = path.join(root, "packages/api/package.json");
  const api = JSON.parse(await readFile(packagePath, "utf8"));
  api.scripts.build += ` && node -e "require('node:fs').writeFileSync('src/lib/generated/plugin-host-modules.schema.generated.ts','current-source')"`;
  await writeFile(packagePath, JSON.stringify(api));
  let result = cachedRun(root, "ci:storybook-static");
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.equal(await readFile(generated, "utf8"), "current-source");
  // A fresh checkout starts from its tracked catalogue and no build output.
  await writeFile(generated, "stale-source");
  await rm(path.join(root, "packages/api/dist"), { recursive: true });
  result = cachedRun(root, "ci:storybook-static");
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /cache hit/);
  assert.equal(await executions(root), 1);
  assert.equal(await readFile(generated, "utf8"), "current-source");
  assert.equal(
    await readFile(path.join(root, "packages/api/dist/index.js"), "utf8"),
    "export const built = true;",
  );
});

test("local test entry points use bounded Turbo tasks without raw-script recursion", () => {
  const names = Object.keys(manifest.scripts).filter(
    (name) =>
      (name.startsWith("test:") || name === "release:test") &&
      !name.endsWith(":run"),
  );
  for (const name of [...names, "build-storybook"]) {
    const target = `${name}:run`;
    assert.match(
      manifest.scripts[name],
      new RegExp(`scripts/run-turbo\\.mjs ${target} --task-args$`),
      name,
    );
    assert.ok(config.tasks[`//#${target}`], `${name} has a root task`);
    assert.ok(manifest.scripts[target], `${name} has a raw runner`);
    assert.ok(
      !manifest.scripts[target].includes(`pnpm ${name}`),
      `${name} must not call itself`,
    );
  }
  for (const name of [
    "test:storybook",
    "test:specification:dev",
    "test:specification:static",
    "release:test",
    "test:spec-validation",
    "test:local-plugin-consumer",
    "test:ai:smoke-harness",
  ])
    assert.notEqual(config.tasks[`//#${name}:run`].cache, false, name);
  for (const name of [
    "test:visual",
    "test:visual:update",
    "test:workspace:pointer",
    "test:desktop:packaged",
    "test:web:e2e",
  ])
    assert.equal(config.tasks[`//#${name}:run`].cache, false, name);
});

test("the bounded runner preserves test arguments and separates forced/live cache policy", async () => {
  const { resolveTurboArguments } = await import("./lib/turbo-invocation.mjs");
  assert.deepEqual(
    resolveTurboArguments(["test", "--", "--filter=@lapis-notes/api"], {}).args,
    ["test", "--filter=@lapis-notes/api"],
  );
  assert.deepEqual(
    resolveTurboArguments(
      [
        "test:specification:dev:run",
        "--task-args",
        "--",
        "--grep",
        "canonical links",
        "--force",
      ],
      {},
    ).args,
    [
      "test:specification:dev:run",
      "--force",
      "--",
      "--grep",
      "canonical links",
    ],
  );
  assert.deepEqual(
    resolveTurboArguments(["test:storybook:run", "--task-args"], {
      TURBO_TOKEN: "cache-secret",
    }).args,
    ["test:storybook:run"],
  );
  assert.equal(
    resolveTurboArguments(
      ["test:spec-validation:storybook-structure:run", "--task-args"],
      { LAPIS_AGENT_RUNTIME_URL: "live" },
    ).live,
    false,
    "source-only audits do not consume live Storybook services",
  );
  for (const key of [
    "LAPIS_AGENT_RUNTIME_URL",
    "LAPIS_AGENT_RUNTIME_TOKEN",
    "LAPIS_TERMINAL_HOST_URL",
    "LAPIS_TERMINAL_HOST_TOKEN",
    "SPECIFICATION_BASE_URL",
  ]) {
    const live = resolveTurboArguments(["test:storybook:run", "--task-args"], {
      [key]: "live",
    });
    assert.equal(live.live, true, key);
    assert.ok(live.args.includes("--cache=local:,remote:"), key);
  }
});

test("local public test routing hits cache, invalidates inputs, and reruns failures and forced/live acceptance", async (t) => {
  const root = await cacheFixture(t);
  for (const file of [
    "run-turbo.mjs",
    "lib/concurrency.mjs",
    "lib/turbo-invocation.mjs",
    "storybook-local-env.mjs",
  ]) {
    await mkdir(path.dirname(path.join(root, "scripts", file)), {
      recursive: true,
    });
    await writeFile(
      path.join(root, "scripts", file),
      await readFile(new URL(file, import.meta.url), "utf8"),
    );
  }
  await symlink(
    fileURLToPath(new URL("../node_modules", import.meta.url)),
    path.join(root, "node_modules"),
    "dir",
  );
  await writeFile(
    path.join(root, ".gitignore"),
    (await readFile(path.join(root, ".gitignore"), "utf8")) + "node_modules\n",
  );
  const fixtureManifestPath = path.join(root, "package.json");
  const fixtureManifest = JSON.parse(
    await readFile(fixtureManifestPath, "utf8"),
  );
  fixtureManifest.scripts["test:storybook"] =
    manifest.scripts["test:storybook"];
  fixtureManifest.scripts["test:storybook:run"] =
    "node scripts/task-fixture.mjs interaction";
  await writeFile(fixtureManifestPath, JSON.stringify(fixtureManifest));
  const fixtureConfigPath = path.join(root, "turbo.json");
  const fixtureConfig = JSON.parse(await readFile(fixtureConfigPath, "utf8"));
  fixtureConfig.tasks["//#test:storybook:run"].env.push("FIXTURE_FAILURE");
  await writeFile(fixtureConfigPath, JSON.stringify(fixtureConfig));
  function run(args = [], env = {}) {
    return spawnSync("pnpm", ["run", "test:storybook", ...args], {
      cwd: root,
      encoding: "utf8",
      timeout: 30000,
      env: {
        ...process.env,
        CI: "true",
        TURBO_TOKEN: "",
        TURBO_TEAM: "",
        TURBO_API: "",
        TURBO_TELEMETRY_DISABLED: "1",
        FIXTURE_FAILURE: "",
        ...env,
      },
    });
  }
  function passed(result) {
    assert.equal(result.status, 0, result.stderr + result.stdout);
  }
  passed(run());
  assert.equal(await executions(root), 1);
  let result = run();
  passed(result);
  assert.match(result.stdout, /cache hit/);
  assert.equal(await executions(root), 1);
  await writeFile(path.join(root, "stories/Demo.ts"), "local-changed-story\n");
  passed(run());
  assert.equal(await executions(root), 2);
  await writeFile(
    path.join(root, "packages/api/src/index.js"),
    "export const local = true;",
  );
  passed(run());
  assert.equal(await executions(root), 3);
  passed(run(["--", "--probe", "first"]));
  assert.equal(await executions(root), 4);
  passed(run(["--", "--probe", "first"]));
  assert.equal(await executions(root), 4);
  passed(run(["--force"]));
  assert.equal(await executions(root), 5);
  for (const count of [6, 7]) {
    const failed = run([], { FIXTURE_FAILURE: "1" });
    assert.notEqual(failed.status, 0);
    assert.match(
      failed.stdout + failed.stderr,
      /Intentional regression failure/,
    );
    assert.equal(await executions(root), count);
  }
  for (const count of [8, 9]) {
    passed(run([], { SPECIFICATION_BASE_URL: "http://127.0.0.1:9999/" }));
    assert.equal(await executions(root), count);
  }
});
