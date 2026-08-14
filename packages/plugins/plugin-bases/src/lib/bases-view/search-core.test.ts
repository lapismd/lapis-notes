import { describe, expect, it } from "vitest";
import { filterEntriesBySearch } from "./search-core";

function entry(id: string, values: Record<string, string>) {
  return {
    id,
    getValue(propertyId: string) {
      const value = values[propertyId];
      return value === undefined ? null : { toString: () => value };
    },
  } as any;
}

describe("Bases search", () => {
  it("filters rows using the current view's displayed properties", () => {
    const visibleOnly = entry("1", {
      "file.name": "Alpha",
      "note.status": "In Progress",
      "note.hidden": "secret-match",
    });
    const listMatch = entry("2", {
      "file.name": "Beta",
      "note.tags": "Project, Urgent",
      "note.count": "3",
    });

    expect(
      filterEntriesBySearch(
        [visibleOnly, listMatch],
        ["file.name", "note.status", "note.tags"],
        "progress",
      ).map((entry) => entry.id),
    ).toEqual(["1"]);

    expect(
      filterEntriesBySearch(
        [visibleOnly, listMatch],
        ["file.name", "note.status", "note.tags"],
        "urgent",
      ).map((entry) => entry.id),
    ).toEqual(["2"]);

    expect(
      filterEntriesBySearch(
        [visibleOnly, listMatch],
        ["file.name", "note.status"],
        "secret-match",
      ),
    ).toEqual([]);
  });

  it("returns all rows when the search query is empty", () => {
    const entries = [
      entry("1", {
        "file.name": "Alpha",
      }),
      entry("2", {
        "file.name": "Beta",
      }),
    ];

    expect(filterEntriesBySearch(entries, ["file.name"], "   ")).toBe(entries);
  });
});
