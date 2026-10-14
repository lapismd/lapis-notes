import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { DEFAULT_REPO_ROOT } from "./public-packages.mjs";
import {
  validateChangelogFormatting,
  validateVersionChangelog,
} from "./check-release-config.mjs";

test("Changesets can format changelogs with every public package's actual configuration", async () => {
  await validateChangelogFormatting();
});

test("Prettier 3 used in CI can format every public changelog", async () => {
  const require = createRequire(import.meta.url);
  const storybookRequire = createRequire(
    require.resolve("storybook/preview-api"),
  );
  const prettier = storybookRequire("prettier");
  assert.match(prettier.version, /^3\./);
  await validateChangelogFormatting(DEFAULT_REPO_ROOT, prettier);
});

test("release preparation rejects an incremented version with only older notes", () => {
  assert.throws(
    () =>
      validateVersionChangelog(
        "# API\n\n## 0.1.2\n\n- Older notes.\n",
        "0.1.3",
        "@lapis-notes/api",
      ),
    /missing changelog notes for 0.1.3/,
  );
});

test("release preparation rejects an empty current section and accepts generated notes", () => {
  assert.throws(
    () =>
      validateVersionChangelog(
        "# API\n\n## 0.1.3\n\n## 0.1.2\n\n- Older notes.\n",
        "0.1.3",
        "@lapis-notes/api",
      ),
    /missing changelog notes/,
  );
  validateVersionChangelog(
    "# API\n\n## 0.1.3\n\n### Patch Changes\n\n- Signed endpoint delivery.\n\n## 0.1.2\n\n- Older notes.\n",
    "0.1.3",
    "@lapis-notes/api",
  );
});
