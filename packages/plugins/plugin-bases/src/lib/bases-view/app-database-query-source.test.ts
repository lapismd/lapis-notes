import { describe, expect, it } from "vitest";
import {
  appDatabaseRowToVaultRecord,
  buildBasesAppDatabaseQuery,
} from "./app-database-query-source";

describe("buildBasesAppDatabaseQuery", () => {
  it("lowers safe conjunctive filters plus supported sort and limit", () => {
    const query = buildBasesAppDatabaseQuery({
      documentFilter: {
        and: [
          { column: "file", op: "inFolder", value: "Projects" },
          { column: "file", op: "hasTag", value: "work" },
          { column: "file", op: "hasProperty", value: "priority" },
        ],
      },
      viewFilter: {
        and: [{ column: "note.status", op: "=", value: "draft" }],
      },
      sort: [{ property: "note.priority", direction: "ASC" }],
      limit: 25,
    });

    expect(query).toEqual({
      pathPrefixes: ["Projects"],
      requiredTags: ["work"],
      propertyFilters: [
        { name: "priority", op: "exists" },
        { name: "status", op: "=", value: "draft" },
      ],
      sort: [
        {
          field: { kind: "property", name: "priority" },
          direction: "ASC",
        },
      ],
      limit: 25,
    });
  });

  it("keeps unsupported filters and sorts out of the lowered query", () => {
    const query = buildBasesAppDatabaseQuery({
      documentFilter: {
        or: [
          { column: "file", op: "!inFolder", value: "Archive" },
          { column: "file.name", op: "contains", value: "todo" },
        ],
      },
      viewFilter: { and: [] },
      sort: [{ property: "file.name", direction: "ASC" }],
      limit: 5,
    });

    expect(query).toEqual({});
  });
});

describe("appDatabaseRowToVaultRecord", () => {
  it("hydrates frontmatter and file metadata from app-database rows", () => {
    const record = appDatabaseRowToVaultRecord(
      {
        vault: {
          getFileByPath: () => null,
        },
      },
      {
        file: {
          path: "Projects/Alpha.md",
          normalizedPath: "Projects/Alpha.md",
          extension: "md",
          mtime: 10,
          size: 20,
          hash: "alpha-1",
          indexed: true,
        },
        metadata: {
          path: "Projects/Alpha.md",
          hash: "alpha-1",
          parserVersion: "test",
          metadata: {},
        },
        properties: [
          {
            path: "Projects/Alpha.md",
            name: "status",
            inferredType: "string",
            value: "draft",
          },
        ],
        tags: [
          {
            path: "Projects/Alpha.md",
            tag: "#work",
            parts: ["work"],
            hierarchy: ["work"],
          },
        ],
        links: [
          {
            sourcePath: "Projects/Alpha.md",
            targetText: "Target.md",
            resolvedTargetPath: "Target.md",
            type: "link",
            count: 1,
          },
        ],
      },
    );

    expect(record.id).toBe("Projects/Alpha.md");
    expect(record.checksum).toBe("alpha-1");
    expect(record.cache?.frontmatter).toMatchObject({ status: "draft" });
    expect(record.cache?.tags).toMatchObject([{ tag: "#work" }]);
    expect(record.cache?.links).toMatchObject([{ link: "Target.md" }]);
    expect(record.file.path).toBe("Projects/Alpha.md");
  });
});
