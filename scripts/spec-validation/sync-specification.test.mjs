import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("./sync-specification.mjs", import.meta.url),
);

function fixture(t, order = "Introduction") {
  const root = mkdtempSync(path.join(tmpdir(), "lapis-specification-sync-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const directory of ["spec/src", "stories/spec", ".storybook"])
    mkdirSync(path.join(root, directory), { recursive: true });
  writeFileSync(
    path.join(root, "spec/src/SUMMARY.md"),
    "- [Introduction](index.md)\n",
  );
  writeFileSync(path.join(root, "spec/src/index.md"), "# Introduction\n");
  writeFileSync(
    path.join(root, "stories/spec/index.mdx"),
    'import { Markdown, Meta } from "@storybook/addon-docs/blocks";\nimport content from "../../spec/src/index.md?raw";\n\n<Meta title="Specification/Introduction" />\n\n<Markdown>{content}</Markdown>\n',
  );
  writeFileSync(
    path.join(root, ".storybook/preview.ts"),
    `const preview = { parameters: { options: { storySort: { order: ["Specification", ["${order}"]] } } } };\n`,
  );
  return root;
}

function run(root, ...args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

test("accepts sidebar order generated from SUMMARY", (t) => {
  const result = run(fixture(t));
  assert.equal(result.status, 0, result.stderr);
});

test("rejects stale sidebar order and regenerates it from SUMMARY", (t) => {
  const root = fixture(t, "Obsolete chapter");
  const stale = run(root);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /SPEC-ORDER-SYNC LN-CAT-115/);
  assert.equal(run(root, "--write").status, 0);
  const repaired = run(root);
  assert.equal(repaired.status, 0, repaired.stderr);
});

test("rejects a stale mirror outside SUMMARY", (t) => {
  const root = fixture(t);
  writeFileSync(path.join(root, "stories/spec/obsolete.mdx"), "<p>Stale</p>\n");
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /SPEC-MIRROR-STALE LN-CAT-115/);
});
