import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APP_DATABASE_SCHEMA_VERSION,
  IndexedDbAppDatabase,
  MemoryAppDatabase,
  MemoryKeyValueStore,
  type AppDatabaseIndexedMetadataQuery,
  SEARCH_RRF_K,
  NativeDesktopAppDatabase,
  setNativeDesktopBridge,
  setSearchEmbeddingProviderRuntimeLoaderForTests,
  type SearchEmbeddingProviderConfig,
  SqliteWasmAppDatabase,
  buildSearchResult,
  createDefaultAppDatabase,
} from "../storage";
import { SqliteWasmAppDatabaseCore } from "../storage/sqlite-wasm-app-database-core";
import { isRecoverableSqliteStartupError } from "../storage/sqlite-wasm-app-database-core";

type ExecCall = {
  sql: string;
  bind?: Record<string, unknown>;
  returnValue?: string;
};

function extractNamedParameters(sql: string): Set<string> {
  return new Set(sql.match(/[:@$][A-Za-z_][A-Za-z0-9_]*/g) ?? []);
}

function createValidatingSqliteDb(execCalls: ExecCall[] = []) {
  const db = {
    close() {},
    exec(options: ExecCall & { rowMode?: string }) {
      execCalls.push(options);

      const bind = options.bind;
      if (bind) {
        const parameters = extractNamedParameters(options.sql);
        for (const key of Object.keys(bind)) {
          if (/^[0-9]+$/.test(key)) {
            continue;
          }
          if (!/^[:@$?]/.test(key) || !parameters.has(key)) {
            throw new Error(`Invalid bind() parameter name: ${key}`);
          }
        }
      }

      return options.returnValue === "resultRows" ? [] : db;
    },
  };

  return db;
}

async function exerciseDatabase(db: MemoryAppDatabase) {
  await db.open();
  await db.setNotebookState("note.md", {
    sourcePath: "note.md",
    mtime: 1,
    updatedAt: 10,
    cells: {
      load: {
        state: "completed",
        outputs: [{ kind: "markdown", markdown: "hello" }],
      },
    },
  });
  await db.saveMetadataSnapshot({
    fileCache: {
      "note.md": { mtime: 1, size: 5, hash: "abc" },
    },
    metadataCache: {
      abc: { headings: [{ heading: "Note" }] },
    },
    resolvedLinks: {
      "note.md": { "target.md": 1 },
    },
    unresolvedLinks: {},
  });
  await db.upsertIndexedFile({
    file: {
      path: "note.md",
      normalizedPath: "note.md",
      extension: "md",
      mtime: 1,
      size: 5,
      hash: "abc",
      indexed: true,
    },
    metadata: {
      path: "note.md",
      hash: "abc",
      parserVersion: "test",
      metadata: { headings: [] },
    },
    links: [
      {
        sourcePath: "note.md",
        targetText: "target",
        resolvedTargetPath: "target.md",
        type: "link",
        count: 1,
      },
    ],
    tags: [
      {
        path: "note.md",
        tag: "#work/project",
        parts: ["work", "project"],
        hierarchy: ["work", "work/project"],
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
  await db.upsertSearchDocument({
    path: "note.md",
    name: "note",
    extension: "md",
    checksum: "abc",
    content: "hello sqlite",
    tags: ["work/project"],
    tagParts: ["work", "project"],
    tagHierarchy: ["work", "work/project"],
    chunks: [
      {
        id: "note.md#chunk-1",
        text: "hello sqlite",
        startOffset: 0,
        endOffset: 12,
        heading: "Note",
        kind: "paragraph",
        embedding: {
          status: "ready",
          modelId: "intfloat/multilingual-e5-small",
          modelVersion: "1",
          dimensions: 384,
          fingerprint: "abc:chunk-1",
        },
      },
    ],
  });
}

const TOKEN_HASH_PROVIDER: SearchEmbeddingProviderConfig = {
  kind: "token-hash",
  modelId: "lapis/token-hash-v0",
  dimensions: 24,
};

afterEach(() => {
  setSearchEmbeddingProviderRuntimeLoaderForTests(null);
  setNativeDesktopBridge(null);
});

describe("AppDatabase", () => {
  it("stores metadata snapshots and generated search documents", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await exerciseDatabase(db);

    expect(await db.getMeta("schema.version")).toBe(
      APP_DATABASE_SCHEMA_VERSION,
    );
    expect(await db.loadMetadataSnapshot()).toMatchObject({
      fileCache: { "note.md": { hash: "abc" } },
    });
    expect(await db.getNotebookState("note.md")).toMatchObject({
      cells: {
        load: {
          state: "completed",
        },
      },
    });
    expect(await db.getSearchDocument("note.md")).toMatchObject({
      path: "note.md",
      checksum: "abc",
    });
    await expect(db.getSearchIndexStats()).resolves.toEqual({
      documentCount: 1,
      chunkCount: 1,
      readyChunkCount: 1,
      pendingChunkCount: 0,
      errorChunkCount: 0,
      lastError: null,
    });
    await expect(db.searchDocuments("sqlite")).resolves.toMatchObject([
      {
        document: {
          path: "note.md",
        },
        snippets: [
          {
            field: "content",
          },
        ],
      },
    ]);
  });

  it("persists indexed fallback state by vault id", async () => {
    const store = new MemoryKeyValueStore();
    const first = new IndexedDbAppDatabase("vault-a", store);
    await exerciseDatabase(first);
    await first.close();

    const second = new IndexedDbAppDatabase("vault-a", store);
    await second.open();

    expect(await second.loadMetadataSnapshot()).toMatchObject({
      fileCache: { "note.md": { hash: "abc" } },
    });
    expect(await second.getNotebookState("note.md")).toMatchObject({
      sourcePath: "note.md",
    });
    await expect(second.listSearchDocuments()).resolves.toMatchObject([
      {
        path: "note.md",
        chunks: [
          {
            id: "note.md#chunk-1",
            heading: "Note",
          },
        ],
      },
    ]);
  });

  it("persists native sqlite state by vault id through the desktop bridge", async () => {
    const state = new Map<string, string>();
    setNativeDesktopBridge({
      runtime: "electron-desktop",
      invoke: async (command, payload = {}) => {
        if (command === "desktop_db_load_state") {
          return (state.get(String(payload.vaultId)) ?? null) as never;
        }
        if (command === "desktop_db_save_state") {
          state.set(String(payload.vaultId), String(payload.stateJson));
          return undefined as never;
        }
        if (command === "desktop_db_replace_search_documents") {
          return undefined as never;
        }
        if (command === "desktop_db_upsert_search_document") {
          return undefined as never;
        }
        if (command === "desktop_db_delete_search_document") {
          return undefined as never;
        }
        throw new Error(`Unexpected command: ${command}`);
      },
      toFileUrl: (path) => `file://${path}`,
    });

    const first = new NativeDesktopAppDatabase("vault-a");
    await exerciseDatabase(first);
    await first.close();

    const second = new NativeDesktopAppDatabase("vault-a");
    await second.open();

    expect(await second.loadMetadataSnapshot()).toMatchObject({
      fileCache: { "note.md": { hash: "abc" } },
    });
    expect(await second.getNotebookState("note.md")).toMatchObject({
      sourcePath: "note.md",
    });
    await expect(second.listSearchDocuments()).resolves.toMatchObject([
      {
        path: "note.md",
        chunks: [
          {
            id: "note.md#chunk-1",
            heading: "Note",
          },
        ],
      },
    ]);
  });

  it("stores deduplicated file history with rename delete and restore semantics", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();

    await expect(
      db.storeFileHistoryRevision({
        path: "note.md",
        eventType: "baseline",
        createdAt: 1,
        sourceMtime: 1,
        sourceSize: 5,
        contentHash: "hash-a",
        content: "alpha",
        maxRevisions: 10,
      }),
    ).resolves.toMatchObject({ stored: true, deduplicated: false });

    await expect(
      db.storeFileHistoryRevision({
        path: "note.md",
        eventType: "modify",
        createdAt: 2,
        sourceMtime: 2,
        sourceSize: 5,
        contentHash: "hash-a",
        content: "alpha",
        maxRevisions: 10,
      }),
    ).resolves.toMatchObject({ stored: false, deduplicated: true });

    await db.storeFileHistoryRevision({
      path: "renamed.md",
      previousPath: "note.md",
      eventType: "rename",
      createdAt: 3,
      sourceMtime: 3,
      sourceSize: 5,
      contentHash: "hash-a",
      content: "alpha",
      maxRevisions: 10,
    });

    await db.storeFileHistoryRevision({
      path: "renamed.md",
      eventType: "delete",
      createdAt: 4,
      maxRevisions: 10,
    });

    await db.storeFileHistoryRevision({
      path: "renamed.md",
      eventType: "restore",
      createdAt: 5,
      sourceMtime: 5,
      sourceSize: 5,
      contentHash: "hash-a",
      content: "alpha",
      maxRevisions: 10,
    });

    expect(await db.getFileHistory("note.md")).toBeNull();
    await expect(db.getFileHistory("renamed.md")).resolves.toMatchObject({
      file: {
        currentPath: "renamed.md",
        deleted: false,
      },
      revisions: [
        {
          eventType: "baseline",
          capturedPath: "note.md",
          currentPath: "note.md",
          contentHash: "hash-a",
        },
        {
          eventType: "rename",
          capturedPath: "note.md",
          currentPath: "renamed.md",
          contentHash: "hash-a",
        },
        {
          eventType: "delete",
          currentPath: "renamed.md",
          contentHash: "hash-a",
          content: "alpha",
        },
        {
          eventType: "restore",
          currentPath: "renamed.md",
          contentHash: "hash-a",
        },
      ],
    });
  });

  it("persists file history in indexeddb fallback state", async () => {
    const store = new MemoryKeyValueStore();
    const first = new IndexedDbAppDatabase("vault-a", store);
    await first.open();
    await first.storeFileHistoryRevision({
      path: "note.md",
      eventType: "baseline",
      createdAt: 1,
      contentHash: "hash-a",
      content: "alpha",
    });
    await first.storeFileHistoryRevision({
      path: "renamed.md",
      previousPath: "note.md",
      eventType: "rename",
      createdAt: 2,
      contentHash: "hash-a",
      content: "alpha",
    });
    await first.close();

    const second = new IndexedDbAppDatabase("vault-a", store);
    await second.open();

    expect(await second.getFileHistory("note.md")).toBeNull();
    await expect(second.getFileHistory("renamed.md")).resolves.toMatchObject({
      file: {
        currentPath: "renamed.md",
      },
      revisions: [
        { eventType: "baseline" },
        { eventType: "rename", capturedPath: "note.md" },
      ],
    });
  });

  it("returns chunk-aware snippets and search diagnostics", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await exerciseDatabase(db);

    await expect(
      db.searchDocuments("sqlite", {
        includeDiagnostics: true,
        mode: "hybrid",
      }),
    ).resolves.toMatchObject([
      {
        document: {
          path: "note.md",
        },
        retrievalMode: "lexical",
        matchedChunkIds: ["note.md#chunk-1"],
        snippets: [
          {
            field: "content",
            chunkId: "note.md#chunk-1",
            chunkLabel: "Note",
            offset: 0,
          },
        ],
        diagnostics: {
          requestedMode: "hybrid",
          appliedMode: "lexical",
          backendKind: "memory",
          modelId: "intfloat/multilingual-e5-small",
          modelReady: true,
        },
      },
    ]);
  });

  it("explains hybrid score fusion with reciprocal ranks", () => {
    const result = buildSearchResult(
      {
        path: "note.md",
        name: "note",
        extension: "md",
        checksum: "abc",
        content: "hello sqlite",
        tags: [],
        tagParts: [],
        tagHierarchy: [],
        chunks: [
          {
            id: "note.md#chunk-1",
            text: "hello sqlite",
            startOffset: 0,
            endOffset: 12,
          },
        ],
      },
      "sqlite",
      { mode: "hybrid" },
      {
        backendKind: "memory",
        appliedMode: "hybrid",
        lexicalScore: 25,
        vectorScore: 0.8,
        lexicalRank: 2,
        vectorRank: 1,
        preferredChunkIds: ["note.md#chunk-1"],
      },
    );

    expect(result.scoreBreakdown.fusion).toMatchObject({
      algorithm: "reciprocal-rank-fusion",
      k: SEARCH_RRF_K,
      lexicalRank: 2,
      vectorRank: 1,
    });
    expect(result.scoreBreakdown.fusion?.lexicalContribution).toBeCloseTo(
      1 / (SEARCH_RRF_K + 2),
    );
    expect(result.scoreBreakdown.fusion?.vectorContribution).toBeCloseTo(
      1 / (SEARCH_RRF_K + 1),
    );
    expect(result.scoreBreakdown.fused).toBeCloseTo(
      1 / (SEARCH_RRF_K + 2) + 1 / (SEARCH_RRF_K + 1),
    );
  });

  it("matches bare property-existence queries against stored frontmatter metadata", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();

    await db.upsertIndexedFile({
      file: {
        path: "canvas.md",
        normalizedPath: "canvas.md",
        extension: "md",
        mtime: 1,
        size: 5,
        hash: "canvas-1",
        indexed: true,
      },
      metadata: {
        path: "canvas.md",
        hash: "canvas-1",
        parserVersion: "test",
        metadata: {},
      },
      links: [],
      tags: [],
      properties: [
        {
          path: "canvas.md",
          name: "notebook",
          inferredType: "boolean",
          value: true,
        },
      ],
    });
    await db.upsertSearchDocument({
      path: "canvas.md",
      name: "canvas",
      extension: "md",
      checksum: "frontmatter-1",
      content: "plain note body",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      metadataText: JSON.stringify({ notebook: true, status: "draft" }),
    });

    await db.upsertIndexedFile({
      file: {
        path: "notebook-guide.md",
        normalizedPath: "notebook-guide.md",
        extension: "md",
        mtime: 1,
        size: 5,
        hash: "guide-1",
        indexed: true,
      },
      metadata: {
        path: "notebook-guide.md",
        hash: "guide-1",
        parserVersion: "test",
        metadata: {},
      },
      links: [],
      tags: [],
      properties: [
        {
          path: "notebook-guide.md",
          name: "status",
          inferredType: "string",
          value: "draft",
        },
      ],
    });
    await db.upsertSearchDocument({
      path: "notebook-guide.md",
      name: "notebook-guide",
      extension: "md",
      checksum: "guide-1",
      content: "plain note body",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      metadataText: JSON.stringify({ status: "draft" }),
    });

    const results = await db.searchDocuments("[notebook]");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      document: {
        path: "canvas.md",
      },
      retrievalMode: "lexical",
    });
    expect(results[0]?.snippets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "metadata",
        }),
      ]),
    );
  });

  it("executes structured query operators against indexed search documents", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();

    await db.upsertIndexedFile({
      file: {
        path: "Projects/Daily.md",
        normalizedPath: "Projects/Daily.md",
        extension: "md",
        mtime: 1,
        size: 5,
        hash: "daily-1",
        indexed: true,
      },
      metadata: {
        path: "Projects/Daily.md",
        hash: "daily-1",
        parserVersion: "test",
        metadata: {},
      },
      links: [],
      tags: [
        {
          path: "Projects/Daily.md",
          tag: "#work/project",
          parts: ["work", "project"],
          hierarchy: ["work", "work/project"],
        },
      ],
      properties: [
        {
          path: "Projects/Daily.md",
          name: "status",
          inferredType: "string",
          value: "draft",
        },
        {
          path: "Projects/Daily.md",
          name: "duration",
          inferredType: "number",
          value: 4,
        },
        {
          path: "Projects/Daily.md",
          name: "tags",
          inferredType: "array",
          value: ["work/project"],
        },
        {
          path: "Projects/Daily.md",
          name: "note.status",
          inferredType: "string",
          value: "ready",
        },
        {
          path: "Projects/Daily.md",
          name: "project",
          inferredType: "object",
          value: {
            name: "Atlas",
            owner: { name: "Mira" },
          },
        },
        {
          path: "Projects/Daily.md",
          name: "milestones",
          inferredType: "array",
          value: [
            { name: "Design", done: false },
            { name: "Ship", done: true },
          ],
        },
        {
          path: "Projects/Daily.md",
          name: "notebook",
          inferredType: "object",
          value: {
            version: "1.2.3",
          },
        },
      ],
    });
    await db.upsertSearchDocument({
      path: "Projects/Daily.md",
      name: "Daily",
      extension: "md",
      checksum: "daily-1",
      content: [
        "# Plan",
        "Alpha beta",
        "",
        "Gamma alone",
        "",
        "## Tasks",
        "- [ ] Write parity tests",
        "- [x] Ship search",
      ].join("\n"),
      tags: ["work/project"],
      tagParts: ["work", "project"],
      tagHierarchy: ["work", "work/project"],
      metadataText: JSON.stringify({ status: "draft", duration: 4 }),
    });

    await db.upsertSearchDocument({
      path: "Archive/Other.md",
      name: "Other",
      extension: "md",
      checksum: "other-1",
      content: "Alpha\nBeta",
      tags: ["personal"],
      tagParts: ["personal"],
      tagHierarchy: ["personal"],
      metadataText: "{}",
    });

    await expect(
      db.searchDocuments("file:Daily tag:#work"),
    ).resolves.toMatchObject([{ document: { path: "Projects/Daily.md" } }]);
    await expect(db.searchDocuments("Alpha OR personal")).resolves.toHaveLength(
      2,
    );
    await expect(db.searchDocuments("Alpha -personal")).resolves.toMatchObject([
      { document: { path: "Projects/Daily.md" } },
    ]);
    await expect(db.searchDocuments("/Ship\\s+search/")).resolves.toMatchObject(
      [{ document: { path: "Projects/Daily.md" } }],
    );
    await expect(
      db.searchDocuments("[status:draft] [duration:<5]"),
    ).resolves.toMatchObject([{ document: { path: "Projects/Daily.md" } }]);
    await expect(db.searchDocuments("[tags]")).resolves.toMatchObject([
      { document: { path: "Projects/Daily.md" } },
    ]);
    await expect(db.searchDocuments('["tags"]')).resolves.toMatchObject([
      { document: { path: "Projects/Daily.md" } },
    ]);
    await expect(
      db.searchDocuments('["note.status":ready]'),
    ).resolves.toMatchObject([{ document: { path: "Projects/Daily.md" } }]);
    await expect(
      db.searchDocuments('["project.name":Atlas]'),
    ).resolves.toMatchObject([{ document: { path: "Projects/Daily.md" } }]);
    await expect(
      db.searchDocuments('["project.owner.name":Mira]'),
    ).resolves.toMatchObject([{ document: { path: "Projects/Daily.md" } }]);
    await expect(
      db.searchDocuments('["milestones.name":Ship]'),
    ).resolves.toMatchObject([{ document: { path: "Projects/Daily.md" } }]);
    await expect(
      db.searchDocuments('["milestones.done":true]'),
    ).resolves.toMatchObject([{ document: { path: "Projects/Daily.md" } }]);
    await expect(
      db.searchDocuments('["notebook.version":"1.2.3"]'),
    ).resolves.toMatchObject([{ document: { path: "Projects/Daily.md" } }]);
  });

  it("queries indexed metadata rows with filters sort and limit", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();

    await db.upsertIndexedFile({
      file: {
        path: "Projects/Alpha.md",
        normalizedPath: "Projects/Alpha.md",
        extension: "md",
        mtime: 3,
        size: 12,
        hash: "alpha-1",
        indexed: true,
      },
      metadata: {
        path: "Projects/Alpha.md",
        hash: "alpha-1",
        parserVersion: "test",
        metadata: { headings: [{ heading: "Alpha" }] },
      },
      links: [
        {
          sourcePath: "Projects/Alpha.md",
          targetText: "target",
          resolvedTargetPath: "Targets/One.md",
          type: "link",
          count: 1,
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
      properties: [
        {
          path: "Projects/Alpha.md",
          name: "status",
          inferredType: "string",
          value: "draft",
        },
        {
          path: "Projects/Alpha.md",
          name: "priority",
          inferredType: "number",
          value: 3,
        },
      ],
    });

    await db.upsertIndexedFile({
      file: {
        path: "Projects/Beta.md",
        normalizedPath: "Projects/Beta.md",
        extension: "md",
        mtime: 4,
        size: 9,
        hash: "beta-1",
        indexed: true,
      },
      metadata: {
        path: "Projects/Beta.md",
        hash: "beta-1",
        parserVersion: "test",
        metadata: { headings: [{ heading: "Beta" }] },
      },
      links: [
        {
          sourcePath: "Projects/Beta.md",
          targetText: "target",
          resolvedTargetPath: "Targets/One.md",
          type: "link",
          count: 1,
        },
      ],
      tags: [
        {
          path: "Projects/Beta.md",
          tag: "#work",
          parts: ["work"],
          hierarchy: ["work"],
        },
      ],
      properties: [
        {
          path: "Projects/Beta.md",
          name: "status",
          inferredType: "string",
          value: "draft",
        },
        {
          path: "Projects/Beta.md",
          name: "priority",
          inferredType: "number",
          value: 1,
        },
      ],
    });

    await db.upsertIndexedFile({
      file: {
        path: "Archive/Gamma.canvas",
        normalizedPath: "Archive/Gamma.canvas",
        extension: "canvas",
        mtime: 5,
        size: 20,
        hash: "gamma-1",
        indexed: true,
      },
      metadata: {
        path: "Archive/Gamma.canvas",
        hash: "gamma-1",
        parserVersion: "test",
        metadata: {},
      },
      links: [],
      tags: [
        {
          path: "Archive/Gamma.canvas",
          tag: "#archive",
          parts: ["archive"],
          hierarchy: ["archive"],
        },
      ],
      properties: [
        {
          path: "Archive/Gamma.canvas",
          name: "status",
          inferredType: "string",
          value: "done",
        },
      ],
    });

    const query: AppDatabaseIndexedMetadataQuery = {
      extensions: [".md"],
      pathPrefixes: ["Projects"],
      propertyFilters: [
        { name: "status", op: "=", value: "draft" },
        { name: "priority", op: ">=", value: 1 },
      ],
      requiredTags: ["work"],
      resolvedTargetPaths: ["Targets/One.md"],
      sort: [
        {
          field: { kind: "property", name: "priority" },
          direction: "ASC",
        },
      ],
      limit: 1,
    };

    await expect(db.queryIndexedMetadata(query)).resolves.toMatchObject([
      {
        file: {
          path: "Projects/Beta.md",
        },
        properties: [
          expect.objectContaining({ name: "status", value: "draft" }),
          expect.objectContaining({ name: "priority", value: 1 }),
        ],
      },
    ]);
  });

  it("matches indexed metadata queries between memory and sqlite core", async () => {
    const execCalls: ExecCall[] = [];
    const validator = createValidatingSqliteDb(execCalls);
    const sqlite = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    sqlite.db = {
      close() {},
      exec(options: ExecCall & { rowMode?: string }) {
        execCalls.push(options);
        if (options.sql.includes("SELECT DISTINCT files.path")) {
          return [{ path: "Projects/Beta.md" }, { path: "Projects/Alpha.md" }];
        }
        return validator.exec(options as never);
      },
    };

    const memory = new MemoryAppDatabase("vault-memory");
    await memory.open();

    for (const db of [memory, sqlite] as MemoryAppDatabase[]) {
      await db.upsertIndexedFile({
        file: {
          path: "Projects/Alpha.md",
          normalizedPath: "Projects/Alpha.md",
          extension: "md",
          mtime: 3,
          size: 12,
          hash: "alpha-1",
          indexed: true,
        },
        metadata: {
          path: "Projects/Alpha.md",
          hash: "alpha-1",
          parserVersion: "test",
          metadata: {},
        },
        links: [
          {
            sourcePath: "Projects/Alpha.md",
            targetText: "target",
            resolvedTargetPath: "Targets/One.md",
            type: "link",
            count: 1,
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
        properties: [
          {
            path: "Projects/Alpha.md",
            name: "status",
            inferredType: "string",
            value: "draft",
          },
          {
            path: "Projects/Alpha.md",
            name: "priority",
            inferredType: "number",
            value: 3,
          },
        ],
      });

      await db.upsertIndexedFile({
        file: {
          path: "Projects/Beta.md",
          normalizedPath: "Projects/Beta.md",
          extension: "md",
          mtime: 4,
          size: 9,
          hash: "beta-1",
          indexed: true,
        },
        metadata: {
          path: "Projects/Beta.md",
          hash: "beta-1",
          parserVersion: "test",
          metadata: {},
        },
        links: [
          {
            sourcePath: "Projects/Beta.md",
            targetText: "target",
            resolvedTargetPath: "Targets/One.md",
            type: "link",
            count: 1,
          },
        ],
        tags: [
          {
            path: "Projects/Beta.md",
            tag: "#work",
            parts: ["work"],
            hierarchy: ["work"],
          },
        ],
        properties: [
          {
            path: "Projects/Beta.md",
            name: "status",
            inferredType: "string",
            value: "draft",
          },
          {
            path: "Projects/Beta.md",
            name: "priority",
            inferredType: "number",
            value: 1,
          },
        ],
      });
    }

    const query: AppDatabaseIndexedMetadataQuery = {
      extensions: ["md"],
      pathPrefixes: ["Projects"],
      propertyFilters: [{ name: "status", op: "=", value: "draft" }],
      requiredTags: ["#work"],
      resolvedTargetPaths: ["Targets/One.md"],
      sort: [
        {
          field: { kind: "property", name: "priority" },
          direction: "ASC",
        },
      ],
    };

    const [memoryRows, sqliteRows] = await Promise.all([
      memory.queryIndexedMetadata(query),
      sqlite.queryIndexedMetadata(query),
    ]);

    expect(sqliteRows).toEqual(memoryRows);
    expect(
      execCalls.some((call) => call.sql.includes("SELECT DISTINCT files.path")),
    ).toBe(true);
  });

  it("executes scoped line block section and task operators", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();

    await db.upsertSearchDocument({
      path: "scopes.md",
      name: "scopes",
      extension: "md",
      checksum: "scope-1",
      content: [
        "# First",
        "alpha beta",
        "",
        "alpha",
        "",
        "beta",
        "",
        "## Tasks",
        "- [ ] draft the query compiler",
        "- [x] document search parity",
      ].join("\n"),
      tags: [],
      tagParts: [],
      tagHierarchy: [],
    });

    await expect(
      db.searchDocuments("line:(alpha beta)"),
    ).resolves.toMatchObject([{ document: { path: "scopes.md" } }]);
    await expect(
      db.searchDocuments("block:(alpha beta)"),
    ).resolves.toMatchObject([{ document: { path: "scopes.md" } }]);
    await expect(
      db.searchDocuments("section:(draft parity)"),
    ).resolves.toMatchObject([{ document: { path: "scopes.md" } }]);
    await expect(
      db.searchDocuments("task-todo:compiler"),
    ).resolves.toMatchObject([{ document: { path: "scopes.md" } }]);
    await expect(db.searchDocuments("task-done:parity")).resolves.toMatchObject(
      [{ document: { path: "scopes.md" } }],
    );
  });

  it("honors case-sensitive search options and match-case operators", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();

    await db.upsertSearchDocument({
      path: "case.md",
      name: "case",
      extension: "md",
      checksum: "case-1",
      content: "Daily daily",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
    });

    await expect(
      db.searchDocuments("daily", { caseSensitive: true }),
    ).resolves.toHaveLength(1);
    await expect(
      db.searchDocuments("DAILY", { caseSensitive: true }),
    ).resolves.toHaveLength(0);
    await expect(db.searchDocuments("match-case:Daily")).resolves.toHaveLength(
      1,
    );
    await expect(db.searchDocuments("match-case:DAILY")).resolves.toHaveLength(
      0,
    );
  });

  it("requires indexed frontmatter properties for bare property queries in sqlite-backed search", async () => {
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = {
      close() {},
      exec({ sql, returnValue }: { sql: string; returnValue?: string }) {
        if (returnValue !== "resultRows") {
          return this;
        }
        if (sql.includes("FROM search_fts")) {
          return [];
        }
        if (sql.includes("FROM search_docs")) {
          return [{ path: "notebook-guide.md" }];
        }
        return [];
      },
    };

    await db.upsertIndexedFile({
      file: {
        path: "canvas.md",
        normalizedPath: "canvas.md",
        extension: "md",
        mtime: 1,
        size: 5,
        hash: "canvas-1",
        indexed: true,
      },
      metadata: {
        path: "canvas.md",
        hash: "canvas-1",
        parserVersion: "test",
        metadata: {},
      },
      links: [],
      tags: [],
      properties: [
        {
          path: "canvas.md",
          name: "notebook",
          inferredType: "boolean",
          value: true,
        },
      ],
    });
    await db.upsertSearchDocument({
      path: "canvas.md",
      name: "canvas",
      extension: "md",
      checksum: "canvas-1",
      content: "plain note body",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      metadataText: JSON.stringify({ notebook: true }),
    });

    await db.upsertIndexedFile({
      file: {
        path: "notebook-guide.md",
        normalizedPath: "notebook-guide.md",
        extension: "md",
        mtime: 1,
        size: 5,
        hash: "guide-1",
        indexed: true,
      },
      metadata: {
        path: "notebook-guide.md",
        hash: "guide-1",
        parserVersion: "test",
        metadata: {},
      },
      links: [],
      tags: [],
      properties: [
        {
          path: "notebook-guide.md",
          name: "status",
          inferredType: "string",
          value: "draft",
        },
      ],
    });
    await db.upsertSearchDocument({
      path: "notebook-guide.md",
      name: "notebook-guide",
      extension: "md",
      checksum: "guide-1",
      content: "plain note body",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      metadataText: JSON.stringify({ status: "draft" }),
    });

    await expect(db.searchDocuments("[notebook]")).resolves.toMatchObject([
      {
        document: {
          path: "canvas.md",
        },
      },
    ]);
  });

  it("derives search chunks and tags from source metadata during upsert", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();

    await db.upsertSearchDocument({
      path: "note.md",
      name: "note",
      extension: "md",
      checksum: "abc",
      content: "hello sqlite",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      sourceMetadata: {
        rawTags: ["#work/project"],
        frontmatter: { status: "draft" },
        frontmatterEndOffset: 0,
        headings: [
          {
            heading: "Note",
            level: 1,
            position: {
              start: { offset: 0 },
              end: { offset: 4 },
            },
          },
        ],
        sections: [
          {
            type: "paragraph",
            position: {
              start: { offset: 0 },
              end: { offset: 12 },
            },
          },
        ],
        chunking: {
          targetChars: 1200,
          breakpointWindowChars: 320,
          breakpointDecay: 0.7,
        },
      },
    });

    await expect(db.getSearchDocument("note.md")).resolves.toMatchObject({
      tags: ["work/project"],
      tagParts: ["work", "project"],
      tagHierarchy: ["work", "work/project"],
      metadataText: JSON.stringify({ status: "draft" }),
      chunks: [
        {
          id: "note.md#chunk-0-12",
          text: "hello sqlite",
          startOffset: 0,
          endOffset: 12,
          heading: "Note",
          kind: "paragraph",
        },
      ],
    });
  });

  it("uses scored breakpoints in app-database document preparation", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();

    const targetChars = 1200;
    const intro = "A".repeat(targetChars - 260);
    const heading = "# Heading\n";
    const middle = "B".repeat(220);
    const nearParagraph = "\n\nNear cutoff paragraph\n";
    const tail = "C".repeat(120);
    const content = `${intro}\n${heading}${middle}${nearParagraph}${tail}`;

    const introEnd = content.indexOf("\n# Heading");
    const headingStart = content.indexOf("# Heading");
    const middleStart = headingStart + heading.length;
    const nearParagraphStart = content.indexOf("Near cutoff paragraph");

    await db.upsertSearchDocument({
      path: "note.md",
      name: "note",
      extension: "md",
      checksum: "checksum",
      content,
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      sourceMetadata: {
        rawTags: [],
        frontmatter: {},
        frontmatterEndOffset: 0,
        headings: [
          {
            heading: "Heading",
            level: 1,
            position: {
              start: { offset: headingStart },
              end: { offset: headingStart + 9 },
            },
          },
        ],
        sections: [
          {
            type: "paragraph",
            position: {
              start: { offset: 0 },
              end: { offset: intro.length },
            },
          },
          {
            type: "heading",
            position: {
              start: { offset: headingStart },
              end: { offset: headingStart + 9 },
            },
          },
          {
            type: "paragraph",
            position: {
              start: { offset: middleStart },
              end: { offset: middleStart + middle.length },
            },
          },
          {
            type: "paragraph",
            position: {
              start: { offset: nearParagraphStart },
              end: { offset: content.length },
            },
          },
        ],
        chunking: {
          targetChars,
          breakpointWindowChars: 320,
          breakpointDecay: 0.7,
        },
      },
    });

    await expect(db.getSearchDocument("note.md")).resolves.toMatchObject({
      chunks: [
        {
          id: `note.md#chunk-0-${introEnd}`,
          text: intro,
          startOffset: 0,
          endOffset: introEnd,
          kind: "paragraph",
        },
        {
          id: `note.md#chunk-${headingStart}-${content.length}`,
          text: content.slice(headingStart),
          startOffset: headingStart,
          endOffset: content.length,
          heading: "Heading",
          kind: "heading",
        },
      ],
    });
  });

  it("supports provider-backed vector retrieval with preview snippets", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();
    await db.configureSearchEmbeddingProvider(TOKEN_HASH_PROVIDER);

    await db.upsertSearchDocument({
      path: "proxy.md",
      name: "proxy",
      extension: "md",
      checksum: "proxy",
      content: "delegated requests route through the owner tab",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "proxy.md#chunk-1",
          text: "delegated requests route through the owner tab",
          startOffset: 0,
          endOffset: 45,
          heading: "Proxy",
          kind: "paragraph",
        },
      ],
    });
    await db.upsertSearchDocument({
      path: "notebook.md",
      name: "notebook",
      extension: "md",
      checksum: "notebook",
      content: "chart outputs render after execution",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "notebook.md#chunk-1",
          text: "chart outputs render after execution",
          startOffset: 0,
          endOffset: 36,
          heading: "Notebook",
          kind: "paragraph",
        },
      ],
    });

    const results = await db.searchDocuments("delegation owner", {
      mode: "vector",
      includeDiagnostics: true,
    });

    expect(results[0]).toMatchObject({
      document: {
        path: "proxy.md",
      },
      retrievalMode: "vector",
      matchedChunkIds: ["proxy.md#chunk-1"],
      diagnostics: {
        providerKind: "token-hash",
        modelId: "lapis/token-hash-v0",
        appliedMode: "vector",
      },
    });
    expect(results[0]?.snippets[0]).toMatchObject({
      field: "content",
      chunkId: "proxy.md#chunk-1",
      chunkLabel: "Proxy",
    });
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });

  it("marks chunks with embedding errors instead of failing indexing", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();
    setSearchEmbeddingProviderRuntimeLoaderForTests(
      async () =>
        ({
          env: {},
          pipeline: async () => {
            throw new Error("model fetch failed");
          },
        }) as never,
    );

    await db.configureSearchEmbeddingProvider({
      kind: "transformers-js",
      modelId: "Xenova/all-MiniLM-L6-v2",
      allowRemoteModels: true,
    });

    await db.upsertSearchDocument({
      path: "error.md",
      name: "error",
      extension: "md",
      checksum: "err",
      content: "semantic search test",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "error.md#chunk-1",
          text: "semantic search test",
          startOffset: 0,
          endOffset: 20,
        },
      ],
    });

    await expect(db.getSearchDocument("error.md")).resolves.toMatchObject({
      chunks: [
        {
          id: "error.md#chunk-1",
          embedding: {
            status: "error",
            modelId: "Xenova/all-MiniLM-L6-v2",
            error: "model fetch failed",
          },
        },
      ],
    });
  });

  it("reconfigures embeddings without blocking on model warmup", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.open();
    await db.configureSearchEmbeddingProvider(TOKEN_HASH_PROVIDER);
    await db.upsertSearchDocument({
      path: "note.md",
      name: "note",
      extension: "md",
      checksum: "abc",
      content: "semantic search test",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "note.md#chunk-1",
          text: "semantic search test",
          startOffset: 0,
          endOffset: 20,
        },
      ],
    });

    setSearchEmbeddingProviderRuntimeLoaderForTests(
      async () =>
        ({
          env: {},
          pipeline: async () => new Promise(() => {}),
        }) as never,
    );

    const result = await Promise.race([
      db
        .configureSearchEmbeddingProvider({
          kind: "transformers-js",
          modelId: "Xenova/all-MiniLM-L6-v2",
          allowRemoteModels: true,
        })
        .then(() => "configured"),
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 50)),
    ]);

    expect(result).toBe("configured");
    await expect(db.getSearchDocument("note.md")).resolves.toMatchObject({
      chunks: [
        {
          id: "note.md#chunk-1",
          embedding: {
            status: "pending",
            modelId: "Xenova/all-MiniLM-L6-v2",
            dirty: true,
          },
        },
      ],
    });
  });

  it("renames and deletes notebook generated state with the owning note", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await exerciseDatabase(db);

    await db.renameIndexedFile("note.md", "renamed.md");
    expect(await db.getNotebookState("note.md")).toBeUndefined();
    expect(await db.getNotebookState("renamed.md")).toMatchObject({
      sourcePath: "renamed.md",
    });

    await db.deleteIndexedFile("renamed.md");
    expect(await db.getNotebookState("renamed.md")).toBeUndefined();
  });

  it("has a native sqlite contract placeholder", async () => {
    setNativeDesktopBridge({
      runtime: "electron-desktop",
      invoke: async (command) => {
        if (command === "desktop_db_load_state") {
          return null as never;
        }
        if (command === "desktop_db_save_state") {
          return undefined as never;
        }
        if (command === "desktop_db_replace_search_documents") {
          return undefined as never;
        }
        throw new Error(`Unexpected command: ${command}`);
      },
      toFileUrl: (path) => `file://${path}`,
    });

    const db = new NativeDesktopAppDatabase("vault-desktop");
    await db.open();

    expect(db.kind).toBe("sqlite-native");
    expect(await db.getMeta("schema.version")).toBe(
      APP_DATABASE_SCHEMA_VERSION,
    );
  });

  it("uses memory when no browser IndexedDB global exists", () => {
    vi.stubGlobal("indexedDB", undefined);
    expect(createDefaultAppDatabase("test-vault").kind).toBe("memory");
  });

  it("prefers SQLite FTS candidates when available", async () => {
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = {
      close() {},
      exec({ sql, returnValue }: { sql: string; returnValue?: string }) {
        if (returnValue !== "resultRows") {
          return this;
        }
        if (sql.includes("FROM search_fts")) {
          return [{ path: "note.md" }];
        }
        if (sql.includes("FROM search_docs")) {
          return [];
        }
        return [];
      },
    };

    await db.upsertSearchDocument({
      path: "note.md",
      name: "note",
      extension: "md",
      checksum: "abc",
      content: "hello sqlite",
      tags: ["work/project"],
      tagParts: ["work", "project"],
      tagHierarchy: ["work", "work/project"],
    });

    await expect(db.searchDocuments("sqlite")).resolves.toMatchObject([
      {
        document: {
          path: "note.md",
        },
        snippets: [
          {
            field: "content",
          },
        ],
      },
    ]);
  });

  it("normalizes named bind keys for sqlite-wasm", async () => {
    const execCalls: ExecCall[] = [];
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = createValidatingSqliteDb(execCalls);

    await db.upsertIndexedFile({
      file: {
        path: "note.md",
        normalizedPath: "note.md",
        extension: "md",
        mtime: 1,
        size: 5,
        hash: "abc",
        indexed: true,
      },
      metadata: {
        path: "note.md",
        hash: "abc",
        parserVersion: "test",
        metadata: { headings: [] },
      },
      links: [],
      tags: [],
      properties: [],
    });

    const fileInsert = execCalls.find((call) =>
      call.sql.includes("INSERT INTO files"),
    );

    expect(fileInsert?.bind).toMatchObject({
      ":path": "note.md",
      ":normalizedPath": "note.md",
      ":hash": "abc",
    });
    expect(fileInsert?.bind).not.toHaveProperty("path");
    expect(fileInsert?.bind).not.toHaveProperty(":indexed");
    expect(fileInsert?.bind).not.toHaveProperty("indexed");
  });

  it("avoids reserved bind names when persisting schema metadata", async () => {
    const execCalls: ExecCall[] = [];
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = createValidatingSqliteDb(execCalls);

    await db.migrate();

    const schemaMetaInsert = execCalls.find((call) =>
      call.sql.includes("INSERT INTO schema_meta"),
    );

    expect(schemaMetaInsert?.bind).toMatchObject({
      ":metaKey": "schema.version",
      ":jsonValue": String(APP_DATABASE_SCHEMA_VERSION),
    });
    expect(schemaMetaInsert?.bind).not.toHaveProperty("key");
    expect(schemaMetaInsert?.bind).not.toHaveProperty("metaKey");
  });

  it("rejects malformed or unused bind names across sqlite app database operations", async () => {
    const execCalls: ExecCall[] = [];
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = createValidatingSqliteDb(execCalls);

    await db.migrate();
    await db.saveMetadataSnapshot({
      fileCache: {
        "note.md": { mtime: 1, size: 5, hash: "abc" },
      },
      metadataCache: {
        abc: { headings: [{ heading: "Note" }] },
      },
      resolvedLinks: {
        "note.md": { "target.md": 1 },
      },
      unresolvedLinks: {},
    });
    await db.upsertIndexedFile({
      file: {
        path: "note.md",
        normalizedPath: "note.md",
        extension: "md",
        mtime: 1,
        size: 5,
        hash: "abc",
        indexed: true,
      },
      metadata: {
        path: "note.md",
        hash: "abc",
        parserVersion: "test",
        metadata: { headings: [] },
      },
      links: [
        {
          sourcePath: "note.md",
          targetText: "target",
          resolvedTargetPath: "target.md",
          type: "link",
          count: 1,
        },
      ],
      tags: [
        {
          path: "note.md",
          tag: "#work/project",
          parts: ["work", "project"],
          hierarchy: ["work", "work/project"],
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
    await db.upsertSearchDocument({
      path: "note.md",
      name: "note",
      extension: "md",
      checksum: "abc",
      content: "hello sqlite",
      tags: ["work/project"],
      tagParts: ["work", "project"],
      tagHierarchy: ["work", "work/project"],
    });
    await db.searchDocuments("sqlite", { limit: 5 });
    await db.renameIndexedFile("note.md", "renamed.md");
    await db.deleteSearchDocument("renamed.md");
    await db.deleteIndexedFile("renamed.md");
    await db.rebuildSearchIndex();

    expect(execCalls.length).toBeGreaterThan(0);
  });

  it("persists search chunks explicitly in sqlite tables", async () => {
    const execCalls: ExecCall[] = [];
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = createValidatingSqliteDb(execCalls);

    await db.configureSearchEmbeddingProvider(TOKEN_HASH_PROVIDER);
    await db.upsertSearchDocument({
      path: "note.md",
      name: "note",
      extension: "md",
      checksum: "abc",
      content: "hello sqlite",
      tags: ["work/project"],
      tagParts: ["work", "project"],
      tagHierarchy: ["work", "work/project"],
      chunks: [
        {
          id: "note.md#chunk-1",
          text: "hello sqlite",
          startOffset: 0,
          endOffset: 12,
          heading: "Note",
          kind: "paragraph",
        },
      ],
    });

    const chunkInsert = execCalls.find((call) =>
      call.sql.includes("INSERT INTO search_chunks"),
    );

    expect(chunkInsert?.bind).toMatchObject({
      ":path": "note.md",
      ":chunkId": "note.md#chunk-1",
      ":ordinal": 0,
      ":startOffset": 0,
      ":endOffset": 12,
      ":heading": "Note",
      ":kind": "paragraph",
      ":text": "hello sqlite",
    });

    const vecInsert = execCalls.find((call) =>
      call.sql.includes("INSERT INTO search_vec_chunks"),
    );

    expect(vecInsert?.bind).toMatchObject({
      ":path": "note.md",
      ":chunkId": "note.md#chunk-1",
    });
    expect(vecInsert?.bind?.[":embedding"]).toBeInstanceOf(ArrayBuffer);
  });

  it("persists file history explicitly in sqlite tables", async () => {
    const execCalls: ExecCall[] = [];
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = createValidatingSqliteDb(execCalls);

    const stored = await db.storeFileHistoryRevision({
      path: "note.md",
      eventType: "baseline",
      createdAt: 1,
      sourceMtime: 2,
      sourceSize: 5,
      contentHash: "hash-a",
      content: "alpha",
      maxRevisions: 10,
    });

    expect(stored).toMatchObject({ stored: true, deduplicated: false });

    const fileInsert = execCalls.find((call) =>
      call.sql.includes("INSERT INTO history_files"),
    );
    expect(fileInsert?.bind).toMatchObject({
      ":currentPath": "note.md",
      ":deleted": 0,
    });

    const revisionInsert = execCalls.find((call) =>
      call.sql.includes("INSERT INTO history_revisions"),
    );
    expect(revisionInsert?.bind).toMatchObject({
      ":ordinal": 0,
      ":currentPath": "note.md",
      ":capturedPath": "note.md",
      ":eventType": "baseline",
      ":createdAt": 1,
      ":sourceMtime": 2,
      ":sourceSize": 5,
      ":contentHash": "hash-a",
      ":content": "alpha",
    });
  });

  it("reuses worker-prepared search documents without re-embedding on the main thread", async () => {
    const db = new SqliteWasmAppDatabase("vault-sqlite", {
      useWorker: false,
    }) as any;
    const preparedDocument = {
      path: "note.md",
      name: "note",
      extension: "md",
      checksum: "abc",
      content: "hello sqlite",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "note.md#chunk-1",
          text: "hello sqlite",
          startOffset: 0,
          endOffset: 12,
          embedding: {
            status: "ready",
            modelId: "Xenova/all-MiniLM-L6-v2",
            dimensions: 1,
            vector: [1],
            fingerprint: "prepared",
            dirty: false,
          },
        },
      ],
    };
    const embedDocument = vi.fn(async () => [
      {
        chunkId: "note.md#chunk-1",
        vector: [2],
        fingerprint: "renderer",
      },
    ]);

    db.opened = true;
    db.core = {
      prepareAndPersistSearchDocument: vi.fn(async () => preparedDocument),
    };
    db.searchEmbeddingProvider = {
      config: {
        kind: "transformers-js",
        modelId: "Xenova/all-MiniLM-L6-v2",
      },
      ready: vi.fn(async () => true),
      embedDocument,
      embedQuery: vi.fn(async () => [1]),
      getRuntimeStatus: vi.fn(() => null),
    };

    await db.upsertSearchDocument({
      path: "note.md",
      name: "note",
      extension: "md",
      checksum: "abc",
      content: "hello sqlite",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "note.md#chunk-1",
          text: "hello sqlite",
          startOffset: 0,
          endOffset: 12,
        },
      ],
    });

    expect(embedDocument).not.toHaveBeenCalled();
    await expect(db.getSearchDocument("note.md")).resolves.toMatchObject({
      chunks: [
        {
          id: "note.md#chunk-1",
          embedding: {
            status: "ready",
            fingerprint: "prepared",
          },
        },
      ],
    });
  });

  it("hydrates file history from explicit sqlite history rows", async () => {
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = {
      close() {},
      exec({ sql, returnValue }: { sql: string; returnValue?: string }) {
        if (returnValue !== "resultRows") {
          return this;
        }
        if (sql.includes("FROM history_files")) {
          return [
            {
              file_id: "history-file-1",
              current_path: "renamed.md",
              deleted: 0,
            },
          ];
        }
        if (sql.includes("FROM history_revisions")) {
          return [
            {
              revision_id: "history-revision-1",
              file_id: "history-file-1",
              ordinal: 0,
              current_path: "note.md",
              captured_path: "note.md",
              event_type: "baseline",
              created_at: 1,
              source_mtime: 1,
              source_size: 5,
              content_hash: "hash-a",
              content: "alpha",
            },
            {
              revision_id: "history-revision-2",
              file_id: "history-file-1",
              ordinal: 1,
              current_path: "renamed.md",
              captured_path: "note.md",
              event_type: "rename",
              created_at: 2,
              source_mtime: 2,
              source_size: 5,
              content_hash: "hash-a",
              content: "alpha",
            },
          ];
        }
        return [];
      },
    };

    db.loadFileHistoryFromTables();

    await expect(db.getFileHistory("renamed.md")).resolves.toMatchObject({
      file: {
        fileId: "history-file-1",
        currentPath: "renamed.md",
      },
      revisions: [
        {
          revisionId: "history-revision-1",
          eventType: "baseline",
        },
        {
          revisionId: "history-revision-2",
          eventType: "rename",
          capturedPath: "note.md",
        },
      ],
    });
  });

  it("hydrates search documents from explicit sqlite chunk rows", async () => {
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = {
      close() {},
      exec({ sql, returnValue }: { sql: string; returnValue?: string }) {
        if (returnValue !== "resultRows") {
          return this;
        }
        if (sql.includes("FROM search_docs")) {
          return [
            {
              path: "note.md",
              name: "note",
              extension: "md",
              checksum: "abc",
              content: "hello sqlite",
              tags_json: '["work/project"]',
              tag_parts_json: '["work","project"]',
              tag_hierarchy_json: '["work","work/project"]',
              metadata_text: '{"status":"draft"}',
            },
          ];
        }
        if (sql.includes("FROM search_chunks")) {
          return [
            {
              path: "note.md",
              chunk_id: "note.md#chunk-1",
              ordinal: 0,
              start_offset: 0,
              end_offset: 12,
              heading: "Note",
              kind: "paragraph",
              text: "hello sqlite",
              embedding_json:
                '{"status":"ready","modelId":"lapis/token-hash-v0","dimensions":2,"vector":[1,0],"fingerprint":"fp"}',
            },
          ];
        }
        return [];
      },
    };

    db.loadSearchDocumentsFromTables();

    await expect(db.getSearchDocument("note.md")).resolves.toMatchObject({
      path: "note.md",
      chunks: [
        {
          id: "note.md#chunk-1",
          heading: "Note",
          embedding: {
            modelId: "lapis/token-hash-v0",
          },
        },
      ],
    });
  });

  it("includes sqlite vec semantic candidates even when lexical FTS finds other files", async () => {
    const db = new SqliteWasmAppDatabaseCore("vault-sqlite") as any;
    db.db = {
      close() {},
      exec({ sql, returnValue }: { sql: string; returnValue?: string }) {
        if (returnValue !== "resultRows") {
          return this;
        }
        if (sql.includes("FROM search_fts")) {
          return [{ path: "lexical.md" }];
        }
        if (sql.includes("FROM search_docs")) {
          return [];
        }
        if (sql.includes("FROM search_vec_chunks")) {
          return [
            {
              path: "semantic.md",
              chunk_id: "semantic.md#chunk-1",
              distance: 0.1,
            },
          ];
        }
        return [];
      },
    };

    await db.configureSearchEmbeddingProvider(TOKEN_HASH_PROVIDER);
    await db.upsertSearchDocument({
      path: "lexical.md",
      name: "lexical",
      extension: "md",
      checksum: "lex",
      content: "owner logs and sqlite fallback",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "lexical.md#chunk-1",
          text: "owner logs and sqlite fallback",
          startOffset: 0,
          endOffset: 30,
        },
      ],
    });
    await db.upsertSearchDocument({
      path: "semantic.md",
      name: "semantic",
      extension: "md",
      checksum: "sem",
      content: "delegated requests route through the owner tab",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      chunks: [
        {
          id: "semantic.md#chunk-1",
          text: "delegated requests route through the owner tab",
          startOffset: 0,
          endOffset: 45,
          heading: "Semantic",
          embedding: {
            status: "pending",
            modelId: TOKEN_HASH_PROVIDER.modelId,
          },
        },
      ],
    });

    const results = await db.searchDocuments("delegation owner", {
      mode: "hybrid",
      includeDiagnostics: true,
    });

    expect(
      results.map(
        (entry: { document: { path: string } }) => entry.document.path,
      ),
    ).toContain("semantic.md");
    expect(
      results.find(
        (entry: { document: { path: string } }) =>
          entry.document.path === "semantic.md",
      ),
    ).toMatchObject({
      retrievalMode: "hybrid",
      matchedChunkIds: ["semantic.md#chunk-1"],
    });
  });
});

describe("isRecoverableSqliteStartupError", () => {
  it("treats stale OPFS InvalidStateError as recoverable", () => {
    expect(
      isRecoverableSqliteStartupError(
        Object.assign(
          new Error(
            "An operation that depends on state cached in an interface object was made but the state had changed since it was read from disk.",
          ),
          { name: "InvalidStateError" },
        ),
      ),
    ).toBe(true);
  });
});
