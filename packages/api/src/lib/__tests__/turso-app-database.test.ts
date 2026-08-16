import { connect } from "@tursodatabase/database";
import { describe, expect, it } from "vitest";

import {
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
});
