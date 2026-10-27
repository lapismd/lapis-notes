import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const config = JSON.parse(
  await readFile(new URL("../turbo.json", import.meta.url), "utf8"),
);
const lanes = JSON.parse(
  await readFile(new URL("./validation/lanes.json", import.meta.url), "utf8"),
);
const manifest = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

test("local test entry points use bounded Turbo tasks without raw-script recursion", () => {
  const names = Object.keys(manifest.scripts).filter(
    (name) =>
      (name.startsWith("test:") || name === "release:test") &&
      !name.endsWith(":run"),
  );
  for (const name of [...names, "build-storybook"]) {
    const target = `${name}:run`;
    if (lanes[name])
      assert.equal(
        manifest.scripts[name],
        `node scripts/validation.mjs run ${name}`,
      );
    assert.match(
      lanes[name] ?? manifest.scripts[name],
      new RegExp(`scripts/run-turbo\\.mjs ${target} --task-args$`),
      name,
    );
    assert.ok(config.tasks[`//#${target}`], `${name} has a root task`);
    assert.ok(manifest.scripts[target], `${name} has a raw runner`);
    assert.ok(
      !manifest.scripts[target].includes(`pnpm ${name}`),
      `${name} must not call itself`,
    );
    assert.doesNotMatch(
      manifest.scripts[target],
      /\bturbo\s+(?:run\b|build\b|test\b|check\b)/,
      `${name}: declare package build dependencies instead of invoking Turbo inside a raw task`,
    );
  }
  for (const name of [
    "test:web:native-tasks",
    "test:web:native-editing-intents",
  ])
    assert.deepEqual(config.tasks[`//#${name}:run`].dependsOn, [
      "@lapis-notes/api#build",
    ]);
  for (const name of [
    "test:server:tasks",
    "test:server:tasks:recovery",
    "test:server:tasks:references",
    "test:server:tasks:editors",
    "test:server:tasks:leave",
  ])
    assert.deepEqual(config.tasks[`//#${name}:run`].dependsOn, [
      "@lapis-notes/app-profile#build",
      "@lapis-notes/workspace#build",
    ]);
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
    "test:server",
    "test:server:e2e",
    "test:server:e2e:host",
    "test:server:native",
    "test:rust-core",
    "test:search:onnx",
    "test:native-daily-reference",
    "test:api:native-tasks",
    "test:native-daily-locales-reference",
    "test:web:native-tasks",
    "test:server:tasks",
    "test:web:native-editing-intents",
    "test:server:tasks:recovery",
    "test:server:tasks:references",
    "test:server:tasks:editors",
    "test:server:tasks:leave",
    "test:web:workspace-leave",
  ])
    assert.equal(config.tasks[`//#${name}:run`].cache, false, name);
});
