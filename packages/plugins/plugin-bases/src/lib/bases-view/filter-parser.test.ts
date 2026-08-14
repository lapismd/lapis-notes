import { describe, expect, it } from "vitest";
import { generateQuery } from "./filter-parser";

describe("generateQuery", () => {
  it("does not emit a leading comma when no columns are selected", () => {
    const query = generateQuery(
      {
        type: "table",
        name: "Table",
        order: [],
        sort: [],
        filter: { and: [] },
        limit: 0,
      },
      {},
      { and: [] },
    );

    expect(query).toContain("SELECT\n  rowId as {$rowId}");
    expect(query).not.toContain("SELECT\n,\n  rowId as {$rowId}");
  });

  it("projects the groupBy property even when it is hidden from the table order", () => {
    const query = generateQuery(
      {
        type: "table",
        name: "Table",
        order: ["file.name"],
        sort: [],
        groupBy: {
          property: "file.folder",
          direction: "ASC",
        },
        filter: { and: [] },
        limit: 0,
      },
      {},
      { and: [] },
    );

    expect(query).toContain("file.name as {file.name}");
    expect(query).toContain("file.folder as {file.folder}");
  });

  it("projects a card image property even when it is hidden from the card order", () => {
    const query = generateQuery(
      {
        type: "cards",
        name: "Cards",
        order: ["file.name"],
        image: "note.cover",
        sort: [],
        filter: { and: [] },
        limit: 0,
      },
      {},
      { and: [] },
    );

    expect(query).toContain("file.name as {file.name}");
    expect(query).toContain("note.cover as {note.cover}");
  });
});
