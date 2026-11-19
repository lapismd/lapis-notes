import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { classifySpecFirstChanges } from "@lapismd/spec-validator";
import config from "../spec-validator.config.mjs";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";
import {
  renderVersionFacts,
  sourceVersionFacts,
  syncVersionSpec,
  versionSpecChapters,
} from "./release-spec-versions.mjs";

const profile = "packages/app-profile/package.json";
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "notes-canonical-version-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const entry of PUBLIC_PACKAGE_GRAPH) {
    const path = join(root, "packages", entry.directory, "package.json");
    await mkdir(dirname(path), { recursive: true });
    await writeFile(
      path,
      JSON.stringify({
        name: entry.name,
        version: entry.directory === "app-profile" ? "0.2.3" : "1.2.3",
      }),
    );
  }
  for (const [path, facts] of Object.entries(sourceVersionFacts(root))) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(
      join(root, path),
      `# Authored contract\n\n${renderVersionFacts(facts)}\n\nKeep this authored contract.\n`,
    );
  }
  return root;
}
async function change(root, path, update) {
  const file = join(root, path),
    value = JSON.parse(await readFile(file, "utf8"));
  update(value);
  await writeFile(file, JSON.stringify(value));
}
async function pages(root) {
  return Object.fromEntries(
    await Promise.all(
      versionSpecChapters.map(async (path) => [
        path,
        await readFile(join(root, path), "utf8"),
      ]),
    ),
  );
}
const releaseFiles = (directory) => [
  `packages/${directory}/package.json`,
  `packages/${directory}/CHANGELOG.md`,
];

test("version preparation carries current facts into its owning verification evidence", async (t) => {
  const root = await fixture(t);
  await change(root, profile, (p) => (p.version = "0.2.4"));
  const changed = await syncVersionSpec({ root, write: true });
  assert(changed.includes("spec/src/verification/pkg-02.md"));
  const evidence = await readFile(
    join(root, "spec/src/verification/pkg-02.md"),
    "utf8",
  );
  assert(evidence.includes('"@lapis-notes/app-profile": "0.2.4"'));
});

test("real Profile0.2.4 version delta changes three missing mappings to none", async (t) => {
  const root = await fixture(t),
    files = [
      ...releaseFiles("app-profile"),
      ".changeset/lapis-dependencies-6882649476db.md",
      ".changeset/notes-shared-registry-readiness.md",
    ];
  assert.equal(
    classifySpecFirstChanges(files, config.validators.specFirst).missingChapters
      .length,
    3,
  );
  await change(root, profile, (p) => (p.version = "0.2.4"));
  const before = await pages(root),
    changed = await syncVersionSpec({ root, write: true });
  assert.deepEqual(changed, [
    "spec/src/packages/release-canonical-intake.md",
    "spec/src/plugin-model/application-services.md",
    "spec/src/web-host/startup-and-plugins.md",
    "spec/src/verification/pkg-02.md",
  ]);
  assert.equal(
    classifySpecFirstChanges(
      [...files, ...changed],
      config.validators.specFirst,
    ).ok,
    true,
  );
  const after = await pages(root);
  for (const [path, source] of Object.entries(after)) {
    assert(source.startsWith("# Authored contract\n\n"));
    assert(source.endsWith("\n\nKeep this authored contract.\n"));
    if (!changed.includes(path)) assert.equal(source, before[path]);
    else assert(source.includes('"@lapis-notes/app-profile": "0.2.4"'));
  }
  assert.deepEqual(await syncVersionSpec({ root }), []);
  assert.deepEqual(await syncVersionSpec({ root, write: true }), []);
  assert.deepEqual(await pages(root), after);
});

for (const entry of PUBLIC_PACKAGE_GRAPH)
  test(`version facts cover every mapped ${entry.name} topic`, async (t) => {
    const root = await fixture(t);
    await change(
      root,
      `packages/${entry.directory}/package.json`,
      (p) =>
        (p.version = entry.directory === "app-profile" ? "0.2.4" : "1.2.4"),
    );
    const changed = await syncVersionSpec({ root, write: true });
    assert(changed.length > 0);
    assert.equal(
      classifySpecFirstChanges(
        [...releaseFiles(entry.directory), ...changed],
        config.validators.specFirst,
      ).ok,
      true,
    );
  });

test("read-only stale check refuses drift without editing any page", async (t) => {
  const root = await fixture(t),
    before = await pages(root);
  await change(root, profile, (p) => (p.version = "0.2.4"));
  await assert.rejects(syncVersionSpec({ root }), (error) => {
    assert.match(
      error.message,
      /^RELEASE-SPEC-VERSIONS LN-PKG-197 spec\/src\/packages\/release-canonical-intake\.md:1/,
    );
    assert.match(error.message, /stale canonical source versions/);
    return true;
  });
  assert.deepEqual(await pages(root), before);
});

for (const [name, transform] of Object.entries({
  "unmapped public package": (map) => ({ ...map, rules: [] }),
  "missing reviewed topic": (map) => ({
    ...map,
    rules: [
      ...map.rules,
      {
        pattern: "^packages/app-profile/package\\.json$",
        chapters: ["spec/src/unreviewed.md"],
      },
    ],
  }),
  "ambiguous reviewed topics": (map) => ({
    ...map,
    rules: [
      ...map.rules,
      {
        pattern: "^packages/app-profile/package\\.json$",
        chapterPatterns: ["^spec/src/"],
      },
    ],
  }),
}))
  test(`canonical preparation rejects ${name} before writing`, async (t) => {
    const root = await fixture(t),
      before = await pages(root),
      original = config.validators.specFirst;
    await change(root, profile, (p) => (p.version = "0.2.4"));
    try {
      config.validators.specFirst = transform(original);
      await assert.rejects(
        syncVersionSpec({ root, write: true }),
        /unmapped|topic coverage/,
      );
      assert.deepEqual(await pages(root), before);
    } finally {
      config.validators.specFirst = original;
    }
  });

for (const [name, mutate] of Object.entries({
  "missing markers": (s) =>
    s.replace("<!-- notes-release-versions:start -->", "removed"),
  "duplicate markers": (s) => s + s,
  "invalid JSON": (s) => s.replace('"schemaVersion": 1', '"schemaVersion": !'),
  "unknown schema field": (s) =>
    s.replace(
      '"schemaVersion": 1,',
      '"schemaVersion": 1,\n  "qualified": true,',
    ),
  "wrong package set": (s) =>
    s.replace("@lapis-notes/file-explorer", "@lapis-notes/unknown"),
  "manual managed content": (s) =>
    s.replace("\n```\n", "\n```\nAuthored manual repair\n"),
  "oversized bytes": (s) => s + "x".repeat(32768),
  "oversized lines": (s) => s + "line\n".repeat(400),
}))
  test(`canonical preparation rejects ${name} before any page write`, async (t) => {
    const root = await fixture(t),
      last = versionSpecChapters.at(-1),
      path = join(root, last);
    await change(root, profile, (p) => (p.version = "0.2.4"));
    await writeFile(path, mutate(await readFile(path, "utf8")));
    const before = await pages(root);
    await assert.rejects(
      syncVersionSpec({ root, write: true }),
      /Canonical release versions held/,
    );
    assert.deepEqual(await pages(root), before);
  });

for (const [name, mutate] of Object.entries({
  "version regression": (p) => (p.version = "0.2.2"),
  "private package": (p) => (p.private = true),
  "foreign package identity": (p) => (p.name = "@lapis-notes/unknown"),
  "invalid version": (p) => (p.version = "next"),
}))
  test(`canonical preparation rejects ${name}`, async (t) => {
    const root = await fixture(t),
      before = await pages(root);
    await change(root, profile, mutate);
    await assert.rejects(syncVersionSpec({ root, write: true }));
    assert.deepEqual(await pages(root), before);
  });

test("canonical preparation rejects a symlink without altering its target or other pages", async (t) => {
  const root = await fixture(t),
    target = join(root, "authored.md"),
    page = join(root, versionSpecChapters.at(-1));
  const source = await readFile(page, "utf8");
  await writeFile(target, source);
  await unlink(page);
  await symlink(target, page);
  await change(root, profile, (p) => (p.version = "0.2.4"));
  const before = await pages(root);
  await assert.rejects(
    syncVersionSpec({ root, write: true }),
    /regular owned file/,
  );
  assert.equal(await readFile(target, "utf8"), source);
  assert.deepEqual(await pages(root), before);
});
