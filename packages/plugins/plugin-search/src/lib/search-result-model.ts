import type { App, EditorPosition, TFile } from "@lapis-notes/api";
import type { SearchQueryHit } from "./search-manager";

export type SearchRange = { start: number; end: number };

export type SearchMatch = {
  id: string;
  key: string;
  text: string;
  ranges: SearchRange[];
  pos?: EditorPosition;
  context?: {
    start: number;
    end: number;
    ranges: SearchRange[];
    sourceLength: number;
  };
};

export type SearchResult = {
  file: TFile;
  title: { text: string; ranges: SearchRange[] } | null;
  matches: SearchMatch[];
  hit: SearchQueryHit;
};

function offsetPosition(content: string, offset: number): EditorPosition {
  const before = content.slice(0, Math.max(0, offset));
  const lines = before.split("\n");
  return {
    line: lines.length - 1,
    ch: lines.at(-1)?.length ?? 0,
  };
}

export function searchResultFromHit(
  app: App,
  hit: SearchQueryHit,
): SearchResult | null {
  const file = app.vault.getFileByPath(hit.id);
  if (!file) return null;
  const title = hit.snippets.find((snippet) => snippet.field === "name");
  const matches = hit.snippets
    .filter((snippet) => snippet.field !== "name")
    .map((snippet, index) => ({
      id: `${snippet.field}:${snippet.offset}:${index}`,
      key: snippet.field === "tags" ? "tag" : snippet.field,
      text: snippet.text,
      ranges: snippet.ranges,
      ...(snippet.field === "content" && snippet.ranges.length
        ? {
            pos: offsetPosition(
              hit.document.content,
              snippet.offset + snippet.ranges[0]!.start,
            ),
            context: {
              start: snippet.offset,
              end: snippet.offset + snippet.text.length,
              ranges: snippet.ranges.map((range) => ({
                start: snippet.offset + range.start,
                end: snippet.offset + range.end,
              })),
              sourceLength: hit.document.content.length,
            },
          }
        : {}),
    }));

  if (matches.length === 0) {
    matches.push({
      id: "name:0:fallback",
      key: "name",
      text: title?.text || file.name,
      ranges: title?.ranges ?? [],
    });
  }

  return {
    file,
    title: title ? { text: title.text, ranges: title.ranges } : null,
    matches,
    hit,
  };
}
