import assert from "node:assert/strict";
import test from "node:test";
import {
  specificationChapters,
  canonicalLink,
  docsHref,
} from "./specification-navigation.mjs";

const chapters = specificationChapters(
  `- [Workspace Shell](workspace-shell.md)\n  - [Workspace Shell / Panels](workspace-shell/panels.md)\n    - [Workspace Shell / Panels / Problems](workspace-shell/panels/problems.md)\n`,
);
const preview = "https://example.test/project/iframe.html?id=x&viewMode=docs";
test("reading order and parent hierarchy come from SUMMARY", () => {
  assert.deepEqual(
    chapters[2].parents,
    chapters.slice(0, 2).map(({ id }) => id),
  );
  assert.equal(chapters[1].id, "specification-workspace-shell-panels--docs");
});
test("canonical links retain deployment paths and fragments", () => {
  assert.equal(
    canonicalLink(
      "./panels/problems.md#ln-ws-001",
      chapters[1],
      chapters,
      {},
      preview,
    ),
    docsHref(chapters[2].id, "ln-ws-001", preview),
  );
  assert.equal(
    canonicalLink("../workspace-shell.md", chapters[1], chapters, {}, preview),
    docsHref(chapters[0].id, "", preview),
  );
});
test("relocated anchors resolve to their defining topic", () => {
  assert.equal(
    canonicalLink(
      "#ln-ws-001",
      chapters[0],
      chapters,
      {
        "workspace-shell.md#ln-ws-001": {
          path: chapters[2].path,
          fragment: "ln-ws-001",
        },
      },
      preview,
    ),
    docsHref(chapters[2].id, "ln-ws-001", preview),
  );
});
test("external links and same-page fragments keep their meaning", () => {
  for (const href of [
    "https://example.test/readme",
    "mailto:a@example.test",
    "#topics",
    "//example.test/path",
    "/asset.png",
  ])
    assert.equal(canonicalLink(href, chapters[0], chapters, {}, preview), href);
});
test("duplicate sources and colliding routes fail closed", () => {
  assert.throws(
    () => specificationChapters("- [A B](a.md)\n- [A-B](b.md)"),
    /Duplicate/,
  );
  assert.throws(
    () => specificationChapters("- [A](a.md)\n- [B](a.md)"),
    /Duplicate/,
  );
});
