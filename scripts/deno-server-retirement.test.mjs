import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = new URL("..", import.meta.url).pathname;
const invocation =
  /@lapis-notes\/server-deno|packages\/server-deno|filter=.*server-deno|--filter[^\n]*deno-server/u;

function filesUnder(directory, suffix) {
  const found = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) found.push(...filesUnder(path, suffix));
    else if (name.endsWith(suffix)) found.push(path);
  }
  return found;
}

test("retired deno-server package is not a workspace member and is not selected by checks", () => {
  assert.equal(
    statSync(join(root, "packages/server-deno/package.json"), {
      throwIfNoEntry: false,
    }),
    undefined,
  );
  const manifests = [
    join(root, "package.json"),
    join(root, "scripts/validation/lanes.json"),
    join(root, "turbo.json"),
    join(root, "deno.json"),
    ...filesUnder(join(root, ".github/workflows"), ".yml"),
  ];
  for (const path of manifests) {
    assert.equal(
      invocation.test(readFileSync(path, "utf8")),
      false,
      path,
    );
  }
});
