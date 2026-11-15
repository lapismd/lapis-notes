import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const producer = () =>
  readFile(
    new URL("../.github/workflows/dependency-image.yml", import.meta.url),
    "utf8",
  );

test("image producer delegates staging, signature verification and immutable promotion", async () => {
  const source = await producer();
  assert.match(
    source,
    /uses: lapismd\/lapis-ci\/actions\/publish-dependency-image@[a-f0-9]{40}/,
  );
  assert.match(source, /context: \.ci\/dependency-context/);
  assert.match(
    source,
    /base-image: \$\{\{ steps\.context\.outputs\.base_image \}\}/,
  );
  assert.match(
    source,
    /image: \$\{\{ steps\.context\.outputs\.dependency_image \}\}/,
  );
  assert.match(source, /GH_TOKEN: \$\{\{ github\.token \}\}/);
});

test("failed and repeated publications retain only bounded immutable receipts", async () => {
  const source = await producer();
  assert.match(source, /if: always\(\)/);
  assert.match(source, /retention-days: 14/);
  const paths = source
    .match(/          path: \|\n((?:            [^\n]+\n)+)/)?.[1]
    .trim()
    .split(/\n\s*/);
  assert.deepEqual(paths, [
    ".ci/dependency-image-receipt.json",
    ".ci/dependency-image-resolution.json",
    ".ci/dependency-image-publication.json",
  ]);
  assert.doesNotMatch(source, /\.pem|private-key|\.release\//);
});

test("all external publisher actions are reviewed immutable references", async () => {
  const source = await producer();
  for (const [, action, revision] of source.matchAll(
    /uses: ([^\s@]+)@([^\s]+)/g,
  ))
    assert.match(revision, /^[a-f0-9]{40}$/, action);
});
