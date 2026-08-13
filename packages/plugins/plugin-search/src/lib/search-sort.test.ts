import type { TFile } from "@lapis-notes/api";
import { describe, expect, it } from "vitest";
import { formatSearchViewSortLabel, sortSearchResults } from "./search-sort";

function item(name: string, path: string, mtime: number) {
  return {
    file: {
      name,
      path,
      stat: { ctime: mtime, mtime, size: 0 },
    } as TFile,
  };
}

describe("search result sorting", () => {
  const results = [
    item("Note 10.md", "z/Note 10.md", 20),
    item("Note 2.md", "b/Note 2.md", 30),
    item("Note 2.md", "a/Note 2.md", 10),
  ];

  it("sorts filenames naturally with stable path tie-breaks", () => {
    expect(
      sortSearchResults(results, "filename-asc").map((entry) => entry.file.path),
    ).toEqual(["a/Note 2.md", "b/Note 2.md", "z/Note 10.md"]);
    expect(
      sortSearchResults(results, "filename-desc").map((entry) => entry.file.path),
    ).toEqual(["z/Note 10.md", "a/Note 2.md", "b/Note 2.md"]);
  });

  it("sorts modification times in either direction", () => {
    expect(
      sortSearchResults(results, "modified-desc").map((entry) => entry.file.path),
    ).toEqual(["b/Note 2.md", "z/Note 10.md", "a/Note 2.md"]);
    expect(
      sortSearchResults(results, "modified-asc").map((entry) => entry.file.path),
    ).toEqual(["a/Note 2.md", "z/Note 10.md", "b/Note 2.md"]);
  });

  it("retains legacy created-time sort modes", () => {
    expect(
      sortSearchResults(results, "created-desc").map((entry) => entry.file.path),
    ).toEqual(["b/Note 2.md", "z/Note 10.md", "a/Note 2.md"]);
    expect(formatSearchViewSortLabel("created-asc")).toBe(
      "Created (old to new)",
    );
  });

  it("uses the public option labels", () => {
    expect(formatSearchViewSortLabel("modified-desc")).toBe(
      "Modified (new to old)",
    );
  });
});
