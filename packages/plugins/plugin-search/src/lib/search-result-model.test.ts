import type { App } from "@lapis-notes/api";
import { TFile } from "@lapis-notes/api";
import { describe, expect, it } from "vitest";
import type { SearchQueryHit } from "./search-manager";
import { searchResultFromHit } from "./search-result-model";

function createHit(
  snippets: SearchQueryHit["snippets"],
  path = "Notes/FilenameOnly.md",
): SearchQueryHit {
  return {
    id: path,
    document: { id: path, path, name: "FilenameOnly", content: "Quiet body" },
    snippets,
    retrievalMode: "lexical",
  } as unknown as SearchQueryHit;
}

function createApp(path = "Notes/FilenameOnly.md"): App {
  const file = new TFile(path, { ctime: 0, mtime: 0, size: 10 }, null);
  return {
    vault: {
      getFileByPath: (candidate: string) => (candidate === path ? file : null),
    },
  } as unknown as App;
}

describe("searchResultFromHit", () => {
  it("turns a filename-only hit into an expandable name child", () => {
    const result = searchResultFromHit(
      createApp(),
      createHit([
        {
          field: "name",
          text: "FilenameOnly",
          ranges: [{ start: 0, end: 12 }],
          offset: 0,
        },
      ]),
    );

    expect(result?.matches).toEqual([
      {
        id: "name:0:fallback",
        key: "name",
        text: "FilenameOnly",
        ranges: [{ start: 0, end: 12 }],
      },
    ]);
  });

  it("uses the file name when a hit has no snippets", () => {
    expect(searchResultFromHit(createApp(), createHit([]))?.matches[0]).toEqual(
      {
        id: "name:0:fallback",
        key: "name",
        text: "FilenameOnly.md",
        ranges: [],
      },
    );
  });

  it("keeps explicit non-name snippets as the child rows", () => {
    expect(
      searchResultFromHit(
        createApp(),
        createHit([
          {
            field: "content",
            text: "Quiet body",
            ranges: [{ start: 0, end: 5 }],
            offset: 0,
          },
        ]),
      )?.matches,
    ).toHaveLength(1);
  });
});
