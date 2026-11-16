import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse, stringify } from "yaml";
import {
  validateReleaseWorkflows,
  validateDependencyImageResolver,
} from "./check-release-workflow.mjs";

const workflow = (name) =>
  readFile(
    new URL(`../.github/workflows/${name}.yml`, import.meta.url),
    "utf8",
  );
const jobs = (source) => [
  ...source.matchAll(/^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:|$(?![\s\S]))/gm),
];

test("every active validation, release and Pages container consumes its current verified resolution", async () => {
  for (const name of ["lapis-ci", "release", "publish-storybook-pages"]) {
    const source = await workflow(name);
    const resolver = jobs(source).find(([, id]) => id === "resolve-image");
    assert.match(
      resolver?.[2] ?? "",
      /uses: \.\/\.github\/workflows\/resolve-dependency-image\.yml/,
    );
    for (const [, id, body] of jobs(source)) {
      if (!body.includes("    container:")) continue;
      assert.match(
        body,
        /image: \$\{\{ needs\.resolve-image\.outputs\.reference \}\}/,
        `${name}/${id}`,
      );
      assert.match(
        body,
        /needs:(?: resolve-image|[\s\S]*?- resolve-image\n)/,
        `${name}/${id}`,
      );
    }
  }
});

test("blocking CI requires image resolution without dropping its existing lanes", async () => {
  const source = await workflow("lapis-ci");
  const gate = jobs(source).find(([, id]) => id === "validate")?.[2] ?? "";
  assert.match(gate, /- resolve-image\n/);
  assert.match(
    gate,
    /IMAGE_RESOLUTION: \$\{\{ needs\.resolve-image\.result \}\}/,
  );
  assert.match(gate, /"\$IMAGE_RESOLUTION"/);
  for (const id of [
    "build-cache",
    "governance",
    "quality",
    "unit",
    "storybook-static",
    "storybook-specification",
    "web-acceptance",
    "web-cloudflare",
    "registry-fixture",
    "release-artifacts",
  ])
    assert(gate.includes(`      - ${id}\n`), id);
});

test("read-only resolver validates scope and retains current receipt evidence", async () => {
  const source = await workflow("resolve-dependency-image");
  assert.match(source, /contents: read/);
  assert.match(source, /packages: read/);
  assert.doesNotMatch(
    source,
    /: write|create-github-app-token|secrets: inherit/,
  );
  assert.match(source, /repository: lapismd\/lapis-notes/);
  assert.match(
    source,
    /image: \$\{\{ steps\.context\.outputs\.dependency_image \}\}/,
  );
  assert.match(source, /if: always\(\)/);
  assert.match(source, /persist-credentials: false/);
});

test("producer is serialized on trusted main and cannot write pin PRs", async () => {
  const source = await workflow("dependency-image");
  assert.match(
    source,
    /github\.repository == 'lapismd\/lapis-notes'.*github\.ref == 'refs\/heads\/main'/,
  );
  assert.match(source, /cancel-in-progress: false/);
  assert.match(
    source,
    /group: dependency-image-\$\{\{ github\.repository \}\}/,
  );
  assert.match(source, /contents: read/);
  assert.match(source, /attestations: write/);
  assert.match(source, /id-token: write/);
  assert.match(source, /packages: write/);
  assert.doesNotMatch(
    source,
    /contents: write|pull-requests: write|gh pr |git (?:push|commit|switch)|PRIVATE_KEY/,
  );
  for (const file of [
    "package.json",
    "packages/**/package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "patches/**",
    ".ci/images.json",
    ".ci/dependency-image.Dockerfile",
    "scripts/lib/ci-images.mjs",
    "scripts/prepare-ci-dependency-context.mjs",
  ])
    assert(source.includes(`      - ${file}\n`), file);
});

test("producer and resolver use a single reviewed immutable helper cohort", async () => {
  const source =
    (await workflow("dependency-image")) +
    (await workflow("resolve-dependency-image"));
  const pins = [
    ...source.matchAll(
      /uses: lapismd\/lapis-ci\/actions\/[^\s@]+@([a-f0-9]{40})/g,
    ),
  ].map((m) => m[1]);
  assert.equal(pins.length, 4);
  assert.equal(new Set(pins).size, 1);
});

test("candidate frozen install always executes after selecting either cache or base", async () => {
  const source = await readFile(
    new URL("../.github/actions/ci-setup/action.yml", import.meta.url),
    "utf8",
  );
  const install = source.split("    - name: Install frozen workspace\n")[1];
  assert.match(
    install ?? "",
    /pnpm install --frozen-lockfile --prefer-offline/,
  );
  assert.doesNotMatch(install, /if:|cache-hit|outputs\.state/);
});

test("release policy rejects unverified dynamic containers and widened resolver authority", async () => {
  const ci = await workflow("lapis-ci"),
    release = await workflow("release"),
    pages = await workflow("publish-storybook-pages");
  assert.doesNotThrow(() => validateReleaseWorkflows({ ci, release, pages }));
  const candidate = ci.replace("    needs: resolve-image\n", "");
  assert.throws(
    () => validateReleaseWorkflows({ ci: candidate, release, pages }),
    /verified current-input resolver/,
  );
  const resolver = await workflow("resolve-dependency-image"),
    producer = await workflow("dependency-image");
  assert.doesNotThrow(() =>
    validateDependencyImageResolver(resolver, producer),
  );
  const wide = parse(resolver);
  wide.permissions.contents = "write";
  assert.throws(
    () => validateDependencyImageResolver(stringify(wide), producer),
    /read-only authority/,
  );
  assert.throws(
    () =>
      validateDependencyImageResolver(
        resolver.replace("29d83b5a61c0cf2b895873489de43f0d85e38e48", "main"),
        producer,
      ),
    /reviewed verification/,
  );
});
