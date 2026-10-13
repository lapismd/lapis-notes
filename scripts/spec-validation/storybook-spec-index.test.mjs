import assert from "node:assert/strict";
import test from "node:test";

import {
  auditStorybookIndex,
  expectedSpecificationTitles,
} from "./storybook-spec-index.mjs";
import { specificationChapters } from "./specification-navigation.mjs";

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
      specificationChapters(summary).map(({ title, id }, index) => [
        index,
        { title, id, type: "docs" },
      ]),
    ),
  });
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.routes, []);
  assert.deepEqual(result.stale, []);
  assert.deepEqual(result.duplicate, []);
});

test("rejects duplicate and stale specification mirrors", () => {
  const chapter = specificationChapters(summary)[0];
  const entry = { title: chapter.title, id: chapter.id, type: "docs" };
  const result = auditStorybookIndex(summary, {
    entries: {
      one: entry,
      two: entry,
      stale: {
        title: "Specification/Retired",
        id: "retired--docs",
        type: "docs",
      },
    },
  });
  assert.deepEqual(result.duplicate, [chapter.title]);
  assert.deepEqual(result.stale, ["Specification/Retired"]);
});

test("rejects malformed routes and non-Docs entries", () => {
  const chapter = specificationChapters(summary)[0];
  for (const entry of [
    { title: chapter.title },
    { title: chapter.title, id: "wrong", type: "docs" },
    { title: chapter.title, id: chapter.id, type: "story" },
  ]) {
    assert.deepEqual(
      auditStorybookIndex(summary, { entries: { one: entry } }).routes,
      [chapter.title],
    );
  }
});
