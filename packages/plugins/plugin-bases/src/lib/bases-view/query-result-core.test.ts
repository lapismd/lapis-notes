import { describe, expect, test } from "vitest";
import { groupEntries } from "./query-result-core";

describe("Bases grouped query results", () => {
  test("groups entries by the selected property", () => {
    const entries = [
      {
        id: "a",
        getValue(propertyId: "note.status") {
          return propertyId === "note.status" ? "open" : null;
        },
      },
      {
        id: "b",
        getValue(propertyId: "note.status") {
          return propertyId === "note.status" ? "open" : null;
        },
      },
      {
        id: "c",
        getValue(propertyId: "note.status") {
          return propertyId === "note.status" ? "done" : null;
        },
      },
    ];

    const groups = groupEntries(entries, "note.status");

    expect(groups.map((group) => [group.key, group.entries.length])).toEqual([
      ["open", 2],
      ["done", 1],
    ]);
  });

  test("returns a single group when no group key is configured", () => {
    const entries = [
      {
        id: "a",
        getValue() {
          return null;
        },
      },
    ];

    expect(groupEntries(entries)).toEqual([{ entries, key: null }]);
  });
});
