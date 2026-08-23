import { describe, expect, it, vi } from "vitest";
import {
  appDatabaseRowToVaultRecord,
  buildBasesAppDatabaseQuery,
  queryBasesAppDatabaseRows,
} from "./app-database-query-source";

function row(path: string) {
  return {
    file: {
      path,
      normalizedPath: path.toLowerCase(),
      extension: "md",
      mtime: 1,
      size: 1,
      hash: path,
      indexed: true,
    },
    metadata: null,
    properties: [],
    tags: [],
    links: [],
  };
}

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
      excludeHiddenPaths: true,
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

    expect(query).toEqual({ excludeHiddenPaths: true });
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

describe("queryBasesAppDatabaseRows", () => {
  it("pages unbounded candidates by path and leaves final sorting to PEaQL", async () => {
    const queryIndexedMetadataPage = vi
      .fn()
      .mockResolvedValueOnce({ rows: [row("A.md")], nextCursor: "A.md" })
      .mockResolvedValueOnce({ rows: [row("B.md")] });

    await expect(
      queryBasesAppDatabaseRows(
        { queryIndexedMetadataPage } as any,
        {
          requiredTags: ["work"],
          sort: [
            {
              field: { kind: "property", name: "priority" },
              direction: "ASC",
            },
          ],
        },
        1,
      ),
    ).resolves.toMatchObject([
      { file: { path: "A.md" } },
      { file: { path: "B.md" } },
    ]);
    expect(queryIndexedMetadataPage).toHaveBeenNthCalledWith(1, {
      query: {
        requiredTags: ["work"],
        sort: undefined,
        limit: undefined,
      },
      after: undefined,
      limit: 1,
    });
    expect(queryIndexedMetadataPage).toHaveBeenNthCalledWith(2, {
      query: {
        requiredTags: ["work"],
        sort: undefined,
        limit: undefined,
      },
      after: "A.md",
      limit: 1,
    });
  });

  it("pushes a fully lowered limit into one bounded page", async () => {
    const queryIndexedMetadataPage = vi.fn(async () => ({
      rows: [row("A.md")],
    }));
    await queryBasesAppDatabaseRows({ queryIndexedMetadataPage } as any, {
      limit: 25,
    });
    expect(queryIndexedMetadataPage).toHaveBeenCalledWith({
      query: { limit: 25 },
      limit: 25,
    });
  });
});
