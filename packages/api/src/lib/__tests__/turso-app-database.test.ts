import { connect } from "@tursodatabase/database";
import { describe, expect, it } from "vitest";

import {
  TURSO_APP_DATABASE_SCHEMA,
  TURSO_APP_DATABASE_SCHEMA_VERSION,
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";

const TOKEN_HASH_PROVIDER = {
  kind: "token-hash" as const,
  modelId: "lapis/token-hash-v0",
  dimensions: 24,
};

function createDatabase(vaultId = "turso-test"): TursoAppDatabase {
  return new TursoAppDatabase(vaultId, {
    kind: "turso-native",
    transport: "native",
    connectionFactory: async () =>
      (await connect(":memory:", {
        experimental: ["index_method"],
      })) as TursoConnection,
  });
}

describe("TursoAppDatabase", () => {
  it("opens the Turso schema and reports probed capabilities", async () => {
    const database = createDatabase();
    await database.open();

    expect(database.kind).toBe("turso-native");
    expect(database.descriptor).toMatchObject({
      providerId: "turso-local",
      engine: "turso",
      transport: "native",
      role: "direct",
      capabilities: {
        nativeFullTextSearch: true,
        vectorSearch: true,
      },
    });
    expect(await database.getMeta("schema.version")).toBeDefined();

    await database.close();
  });

  it("uses Turso FTS and vector distance before the shared evaluator", async () => {
    const database = createDatabase("turso-search");
    await database.open();
    await database.configureSearchEmbeddingProvider(TOKEN_HASH_PROVIDER);
    await database.upsertSearchDocument({
      path: "Projects/Proxy.md",
      sourceProviderId: "markdown",
      name: "Proxy",
      extension: "md",
      checksum: "proxy-1",
      content: "delegated requests route through the database owner tab",
      tags: ["architecture/search"],
      tagParts: ["architecture", "search"],
      tagHierarchy: ["architecture", "architecture/search"],
      chunks: [
        {
          id: "Projects/Proxy.md#chunk-1",
          text: "delegated requests route through the database owner tab",
          startOffset: 0,
          endOffset: 55,
          heading: "Proxy ownership",
          kind: "paragraph",
        },
      ],
    });
    await database.upsertSearchDocument({
      path: "Projects/Canvas.md",
      sourceProviderId: "canvas",
      name: "Canvas",
      extension: "md",
      checksum: "canvas-1",
      content: "render charts after notebook execution",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "Projects/Canvas.md#chunk-1",
          text: "render charts after notebook execution",
          startOffset: 0,
          endOffset: 38,
          kind: "paragraph",
        },
      ],
    });
    await expect(
      database.searchDocuments("owner", {
        mode: "lexical",
        includeDiagnostics: true,
      }),
    ).resolves.toMatchObject([
      {
        document: { path: "Projects/Proxy.md" },
        retrievalMode: "lexical",
        diagnostics: { backendKind: "turso-native" },
      },
    ]);
    await expect(
      database.searchDocuments("render", {
        mode: "lexical",
        sourceProviderIds: ["markdown"],
      }),
    ).resolves.toEqual([]);
    await database.upsertSearchDocument({
      path: "Archive/Proxy.md",
      sourceProviderId: "markdown",
      name: "Archived Proxy",
      extension: "md",
      checksum: "archive-1",
      content: "owner owner owner archived result",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
    });
    await expect(
      database.searchDocuments("owner", {
        mode: "lexical",
        pathPrefix: "Projects",
        limit: 1,
      }),
    ).resolves.toMatchObject([
      { document: { path: "Projects/Proxy.md" } },
    ]);

    const semantic = await database.searchDocuments("delegation ownership", {
      mode: "vector",
      includeDiagnostics: true,
    });
    expect(semantic[0]).toMatchObject({
      document: { path: "Projects/Proxy.md" },
      retrievalMode: "vector",
      diagnostics: {
        backendKind: "turso-native",
        providerKind: "token-hash",
      },
    });

    await database.close();
  });

  it("persists normalized records transactionally without a fallback", async () => {
    const connection = (await connect(":memory:", {
      experimental: ["index_method"],
    })) as TursoConnection;
    const database = new TursoAppDatabase("turso-normalized", {
      kind: "turso-native",
      transport: "native",
      connectionFactory: async () => connection,
    });
    await database.open();
    await database.upsertIndexedFile({
      file: {
        path: "note.md",
        normalizedPath: "note.md",
        extension: "md",
        mtime: 1,
        size: 4,
        hash: "hash-1",
        indexed: true,
      },
      metadata: {
        path: "note.md",
        hash: "hash-1",
        parserVersion: "test",
        metadata: { frontmatter: { status: "draft" } },
      },
      links: [],
      tags: [
        {
          path: "note.md",
          tag: "#work",
          parts: ["work"],
          hierarchy: ["work"],
        },
      ],
      properties: [
        {
          path: "note.md",
          name: "status",
          inferredType: "string",
          value: "draft",
        },
      ],
    });

    await expect(
      connection.get<{ count: number }>("SELECT count(*) AS count FROM files"),
    ).resolves.toMatchObject({ count: 1 });
    await expect(
      connection.get<{ count: number }>("SELECT count(*) AS count FROM tags"),
    ).resolves.toMatchObject({ count: 1 });
    await expect(
      connection.get<{ value: string }>(
        "SELECT value FROM schema_meta WHERE key = 'schema.version'",
      ),
    ).resolves.toMatchObject({
      value: String(TURSO_APP_DATABASE_SCHEMA_VERSION),
    });

    await database.close();
  });

  it("compiles projection filter, sort, and limit in SQL", async () => {
    const database = createDatabase("turso-projections");
    await database.open();
    await database.registerProjectionDefinition({
      projectionId: "books/book",
      ownerPluginId: "books",
      schemaVersion: 1,
      configHash: "",
      visibility: "public",
      fields: {
        title: { type: "string", indexed: true, sortable: true },
        status: { type: "string", indexed: true },
      },
      active: true,
      updatedAt: 1,
    });
    await database.replaceProjectionSource({
      projectionId: "books/book",
      sourcePath: "dune.md",
      sourceHash: "h1",
      rows: [
        { id: "b1", kind: "book", data: { id: "b1", title: "Dune", status: "reading" } },
        { id: "b2", kind: "book", data: { id: "b2", title: "Dune Messiah", status: "queued" } },
      ],
    });
    const result = await database.queryProjection("books/book", {
      where: { op: "compare", field: "status", comparison: "eq", value: "reading" },
      orderBy: [{ field: "title", direction: "asc" }],
      limit: 1,
    });
    expect(result.rows).toMatchObject([{ id: "b1", title: "Dune" }]);
    await expect(
      database.queryProjection("books/book", {}, "roles"),
    ).resolves.toMatchObject({
      rows: expect.arrayContaining([expect.objectContaining({ id: "b1" })]),
    });
    await database.close();
  });

  it("keeps app_state frozen while committing row-scoped metadata revisions", async () => {
    const connection = (await connect(":memory:", {
      experimental: ["index_method"],
    })) as TursoConnection;
    const database = new TursoAppDatabase("turso-row-scoped", {
      kind: "turso-native",
      transport: "native",
      connectionFactory: async () => connection,
    });
    await database.open();
    await connection.run(
      "INSERT INTO app_state (id, state_json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json",
      JSON.stringify({ frozen: true }),
    );

    const changes: number[] = [];
    const unsubscribe = database.subscribeToChanges((change) => {
      changes.push(change.revision);
    });
    await database.upsertIndexedFile({
      file: {
        path: "Projects/Direct SQL.md",
        normalizedPath: "Projects/Direct SQL.md",
        extension: "md",
        mtime: 10,
        size: 20,
        hash: "direct-1",
        indexed: true,
      },
      metadata: {
        path: "Projects/Direct SQL.md",
        hash: "direct-1",
        parserVersion: "parser-1",
        metadata: { frontmatter: { status: "draft", priority: 2 } },
      },
      links: [{
        sourcePath: "Projects/Direct SQL.md",
        targetText: "Architecture",
        resolvedTargetPath: "Architecture.md",
        type: "link",
        count: 1,
      }],
      tags: [{
        path: "Projects/Direct SQL.md",
        tag: "#work/database",
        parts: ["work", "database"],
        hierarchy: ["work", "work/database"],
      }],
      properties: [
        { path: "Projects/Direct SQL.md", name: "status", inferredType: "string", value: "draft" },
        { path: "Projects/Direct SQL.md", name: "priority", inferredType: "number", value: 2 },
      ],
    });

    await expect(database.getIndexedFile("Projects/Direct SQL.md")).resolves.toMatchObject({
      file: { hash: "direct-1" },
      metadata: { parserVersion: "parser-1" },
    });
    await expect(database.listIndexedFileManifest({ limit: 1 })).resolves.toMatchObject({
      rows: [{ path: "Projects/Direct SQL.md", hash: "direct-1" }],
    });
    await expect(database.queryMetadataFacets({ kind: "tag" })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "work", count: 1 }),
        expect.objectContaining({ value: "work/database", count: 1 }),
      ]),
    );
    await expect(database.queryMetadataFacets({
      kind: "property-value",
      propertyName: "priority",
    })).resolves.toMatchObject([{ value: 2, valueType: "number", count: 1 }]);
    await expect(database.queryMetadataLinks({
      direction: "incoming",
      path: "Architecture.md",
      resolution: "resolved",
    })).resolves.toMatchObject([{ sourcePath: "Projects/Direct SQL.md" }]);
    await expect(database.queryIndexedMetadata({
      requiredTags: ["work"],
      propertyFilters: [{ name: "priority", op: ">=", value: 2 }],
      resolvedTargetPaths: ["Architecture.md"],
    })).resolves.toMatchObject([{ file: { path: "Projects/Direct SQL.md" } }]);
    await expect(connection.get<{ state_json: string }>(
      "SELECT state_json FROM app_state WHERE id = 1",
    )).resolves.toEqual({ state_json: JSON.stringify({ frozen: true }) });
    expect(changes).toEqual([1]);
    expect(await database.getChangeRevision()).toBe(1);

    const plan = await connection.all<{ detail: string }>(
      "EXPLAIN QUERY PLAN SELECT path FROM metadata_tag_ancestors WHERE ancestor = ?",
      "work",
    );
    expect(plan.some((row) => row.detail.includes("metadata_tag_ancestors_idx"))).toBe(true);
    unsubscribe();
    await database.close();
  });

  it("migrates v2 normalized metadata without changing History", async () => {
    const connection = (await connect(":memory:", {
      experimental: ["index_method"],
    })) as TursoConnection;
    await connection.exec(TURSO_APP_DATABASE_SCHEMA);
    await connection.run(
      "INSERT INTO schema_meta (key, value) VALUES ('schema.version', '2') ON CONFLICT(key) DO UPDATE SET value = '2'",
    );
    await connection.run(
      "INSERT INTO files (path, normalized_path, extension, mtime, size, hash, indexed, deleted) VALUES (?, ?, ?, ?, ?, ?, 1, 0)",
      "legacy.md", "legacy.md", "md", 1, 2, "legacy-1",
    );
    await connection.run(
      "INSERT INTO metadata (path, hash, parser_version, data_json) VALUES (?, ?, ?, ?)",
      "legacy.md", "legacy-1", "legacy-parser", JSON.stringify({ frontmatter: { status: "old" } }),
    );
    await connection.run(
      "INSERT INTO tags (path, ordinal, data_json) VALUES (?, 0, ?)",
      "legacy.md", JSON.stringify({ path: "legacy.md", tag: "#legacy/nested", parts: ["legacy", "nested"], hierarchy: ["legacy", "legacy/nested"] }),
    );
    await connection.run(
      "INSERT INTO properties (path, ordinal, data_json) VALUES (?, 0, ?)",
      "legacy.md", JSON.stringify({ path: "legacy.md", name: "status", inferredType: "string", value: "old" }),
    );
    await connection.run(
      "INSERT INTO history_files (file_id, data_json) VALUES (?, ?)",
      "history-1", JSON.stringify({ fileId: "history-1", currentPath: "legacy.md", deleted: false }),
    );
    await connection.run(
      "INSERT INTO history_revisions (file_id, ordinal, data_json) VALUES (?, 0, ?)",
      "history-1", JSON.stringify({ revisionId: "revision-1", fileId: "history-1", currentPath: "legacy.md", capturedPath: "legacy.md", eventType: "modify", createdAt: 1, contentHash: "h", content: "legacy" }),
    );

    const database = new TursoAppDatabase("turso-v2-migration", {
      kind: "turso-native",
      transport: "native",
      connectionFactory: async () => connection,
    });
    await database.open();

    await expect(database.queryMetadataFacets({ kind: "tag" })).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ value: "legacy/nested" })]),
    );
    await expect(connection.get<{ count: number }>(
      "SELECT count(*) AS count FROM history_revisions",
    )).resolves.toEqual({ count: 1 });
    await expect(connection.get<{ value: string }>(
      "SELECT value FROM schema_meta WHERE key = 'schema.version'",
    )).resolves.toEqual({ value: String(TURSO_APP_DATABASE_SCHEMA_VERSION) });
    await database.close();
  });
});
