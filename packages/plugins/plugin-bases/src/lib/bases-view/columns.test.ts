import { describe, expect, test } from "vitest";
import { columnsFor, frontMatterTypesForColumns } from "./columns";
import { buildFileColumns, deriveFileMetadata } from "./file-fields-core";

describe("Bases file-derived columns", () => {
  test("exposes documented file metadata columns", () => {
    const columns = buildFileColumns();

    expect(columns.map((column) => column.id)).toEqual(
      expect.arrayContaining([
        "file.file",
        "file.links",
        "file.embeds",
        "file.backlinks",
        "file.properties",
      ]),
    );
  });

  test("populates file-derived metadata from cache and resolved links", () => {
    const value = deriveFileMetadata(
      "note.md",
      {
        frontmatter: { status: "draft" },
        links: [{ link: "target.md" }],
        embeds: [{ link: "cover.png" }],
        tags: [{ tag: "#work" }],
      },
      {
        "other.md": { "note.md": 1 },
        "note.md": { "target.md": 1 },
      },
    );

    expect(value.tags).toEqual(["#work"]);
    expect(value.links).toEqual(["target.md"]);
    expect(value.embeds).toEqual(["cover.png"]);
    expect(value.backlinks).toEqual(["other.md"]);
    expect(value.properties).toEqual({ status: "draft" });
  });

  test("materializes explicit note properties even before metadata inference sees them", () => {
    const columns = columnsFor(
      [],
      {
        "note.status": { displayName: "Status" },
        "note.due": { displayName: "Due" },
      },
      {},
    );

    expect(columns["note.status"]).toMatchObject({
      id: "note.status",
      displayName: "Status",
    });
    expect(columns["note.due"]).toMatchObject({
      id: "note.due",
      displayName: "Due",
    });
  });

  test("maps observed raw frontmatter keys into structured note query types", () => {
    const columns = columnsFor(
      [
        {
          id: "task.md",
          checksum: "1",
          file: { path: "task.md" } as never,
          cache: {
            frontmatter: {
              status: "open",
            },
          },
        },
      ],
      {},
      {},
    );

    const types = frontMatterTypesForColumns(columns);

    expect(types).toHaveProperty("note.status", String);
  });

  test("observes checkbox and number types from string-encoded frontmatter values", () => {
    const app = {
      metadataTypeManager: {
        determinePropertyType(_key: string, value: unknown) {
          if (value === "false") return "checkbox";
          if (value === "42") return "number";
          return "text";
        },
        properties: {},
        registeredTypeWidgets: {},
      },
    } as never;

    const columns = columnsFor(
      [
        {
          id: "task.md",
          checksum: "1",
          file: { path: "task.md" } as never,
          cache: {
            frontmatter: {
              done: "false",
              count: "42",
            },
          },
        },
      ],
      {},
      {},
      app,
    );

    expect(columns.done?.type).toBe("checkbox");
    expect(columns.count?.type).toBe("number");
    expect(frontMatterTypesForColumns(columns)).toMatchObject({
      "note.done": Boolean,
      "note.count": Number,
    });
  });
});
