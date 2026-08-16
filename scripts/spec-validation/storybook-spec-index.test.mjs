import assert from "node:assert/strict";
import test from "node:test";

import {
  auditStorybookIndex,
  expectedSpecificationTitles,
} from "./storybook-spec-index.mjs";

const summary = `# Summary

- [Introduction](./index.md)
- [Plugins](./plugins/index.md)
  - [Plugins / AI](./plugins/ai/index.md)
`;

test("derives exact specification titles from SUMMARY order", () => {
  assert.deepEqual(expectedSpecificationTitles(summary), [
    "Specification/Introduction",
    "Specification/Plugins",
    "Specification/Plugins/AI",
  ]);
});

test("reports source chapters missing from a built Storybook index", () => {
  const result = auditStorybookIndex(summary, {
    entries: {
      intro: { title: "Specification/Introduction" },
      plugins: { title: "Specification/Plugins" },
    },
  });
  assert.deepEqual(result.missing, ["Specification/Plugins/AI"]);
});

test("accepts a complete built index", () => {
  const result = auditStorybookIndex(summary, {
    entries: Object.fromEntries(
      expectedSpecificationTitles(summary).map((title, index) => [index, { title }]),
    ),
  });
  assert.deepEqual(result.missing, []);
});
