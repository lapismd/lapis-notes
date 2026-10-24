import { expect, it } from "vitest";
import {
  buildSearchSnippets,
  type SearchDocumentRecord,
} from "../storage/app-database";
it.each([
  {
    name: "start",
    content: "aaaaaaaaaa📝  hit trailing",
    length: 9,
    offset: 10,
    text: "📝  hit tr",
  },
  {
    name: "end",
    content: "hitaaaaaa📝 trailing",
    length: 10,
    offset: 0,
    text: "hitaaaaaa📝",
  },
])("keeps a complete Unicode scalar at the snippet $name", (entry) => {
  const document: SearchDocumentRecord = {
    path: "Note.md",
    name: "Note",
    extension: "md",
    checksum: "unicode",
    content: entry.content,
    tags: [],
    tagParts: [],
    tagHierarchy: [],
  };
  const snippets = buildSearchSnippets(document, "hit", {
    snippetLength: entry.length,
  });
  expect(snippets).toHaveLength(1);
  expect(snippets[0].offset).toBe(entry.offset);
  expect(snippets[0].text).toBe(entry.text);
  expect(snippets[0].text).not.toMatch(/[\ud800-\udfff]/u);
  expect(
    snippets[0].text.slice(
      snippets[0].ranges[0].start,
      snippets[0].ranges[0].end,
    ),
  ).toBe("hit");
});
