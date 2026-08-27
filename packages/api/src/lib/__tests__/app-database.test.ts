import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APP_DATABASE_SCHEMA_VERSION,
  MemoryAppDatabase,
  type AppDatabaseIndexedMetadataQuery,
  SEARCH_RRF_K,
  setSearchEmbeddingProviderRuntimeLoaderForTests,
  type SearchEmbeddingProviderConfig,
  buildSearchResult,
} from "../storage";

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

  it("filters disposable search corpora by source provider", async () => {
    const db = new MemoryAppDatabase("vault-a");
    await db.upsertSearchDocument({
      path: "note.md",
      sourceProviderId: "markdown",
      name: "note",
      extension: "md",
      checksum: "note",
      content: "shared result",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
    });
    await db.upsertSearchDocument({
      path: "ai-conversation/root/id",
      sourceProviderId: "ai-conversations",
      name: "chat",
      extension: "ai-conversation",
      checksum: "chat",
      content: "shared result",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
    });

    await expect(
      db.searchDocuments("shared", {
        sourceProviderIds: ["ai-conversations"],
      }),
    ).resolves.toMatchObject([
      { document: { path: "ai-conversation/root/id" } },
    ]);
  });

  it("filters search paths before ranking and limiting", async () => {
    const db = new MemoryAppDatabase("vault-scope");
    for (const [path, content] of [
      ["Archive/strong.md", "needle needle needle needle"],
      ["Projects/Alpha/first.md", "needle"],
      ["Projects/Beta/second.md", "needle needle"],
    ]) {
      await db.upsertSearchDocument({
        path,
        sourceProviderId: "search:markdown",
        name: path.split("/").at(-1) ?? path,
        extension: "md",
        checksum: path,
        content,
        tags: [],
        tagParts: [],
        tagHierarchy: [],
      });
    }

    await expect(
      db.searchDocuments("needle", {
        pathPrefix: "Projects",
        limit: 1,
      }),
    ).resolves.toMatchObject([
      { document: { path: "Projects/Alpha/first.md" } },
    ]);
  });

  it("stores disposable memory checkpoints, candidates, signals, and leases", async () => {
    const db = new MemoryAppDatabase("vault-memory");
    await db.open();
    const changes: string[][] = [];
    const unsubscribe = db.subscribeToChanges((change) => {
      changes.push([...change.domains]);
    });

    await db.upsertMemorySourceState({
      sourceKey: "conversation-1",
      sourcePath: ".lapis/agents/sessions/conversation-1/transcript.jsonl",
      sourceHash: "source-hash",
      lastEntryId: "entry-1",
      lastEntryHash: "entry-hash",
      status: "ready",
      indexedAt: 100,
    });
    await db.upsertMemoryCandidate({
      candidate: {
        id: "candidate-1",
        scopeKind: "project",
        scopePath: "Projects/Alpha",
        kind: "preference",
        normalizedClaim: "Use compact headings",
        claimHash: "claim-hash",
        supersessionKey: "writing.headings",
        originClass: "owner",
        importance: 4,
        triggers: ["writing", "headings"],
        state: "staged",
        firstSeenAt: 100,
        lastSeenAt: 200,
        recurrenceCount: 1,
        conversationCount: 1,
      },
      origins: [
        {
          candidateId: "candidate-1",
          conversationId: "conversation-1",
          entryId: "entry-1",
          entryHash: "entry-hash",
          observedAt: 100,
        },
      ],
    });
    await db.recordMemoryRecallSignal({
      targetRef: "curated:memory-1:1",
      queryFingerprint: "salted-fingerprint",
      day: "2026-08-27",
      bestScore: 0.6,
      hitCount: 1,
    });
    await db.recordMemoryRecallSignal({
      targetRef: "curated:memory-1:1",
      queryFingerprint: "salted-fingerprint",
      day: "2026-08-27",
      bestScore: 0.8,
      hitCount: 2,
    });

    const job = {
      id: "ingest:conversation-1",
      kind: "ingest" as const,
      scopeKey: "project:Projects/Alpha",
      status: "queued" as const,
      attempts: 0,
      maxAttempts: 3,
      createdAt: 100,
    };
    await expect(
      db.claimMemoryJob({ job, ownerId: "tab-a", now: 200, leaseMs: 100 }),
    ).resolves.toMatchObject({
      status: "running",
      ownerId: "tab-a",
      attempts: 1,
      leaseUntil: 300,
    });
    await expect(
      db.claimMemoryJob({ job, ownerId: "tab-b", now: 250, leaseMs: 100 }),
    ).resolves.toBeNull();
    await expect(
      db.updateMemoryJob({
        jobId: job.id,
        ownerId: "tab-a",
        now: 250,
        patch: { status: "completed", finishedAt: 250 },
      }),
    ).resolves.toMatchObject({ status: "completed", finishedAt: 250 });

    await expect(db.getMemorySourceState("conversation-1")).resolves.toMatchObject({
      lastEntryHash: "entry-hash",
    });
    await expect(
      db.queryMemoryCandidates({
        scopeKind: "project",
        scopePath: "Projects/Alpha",
        states: ["staged"],
      }),
    ).resolves.toMatchObject([
      {
        candidate: { id: "candidate-1" },
        origins: [{ conversationId: "conversation-1", entryId: "entry-1" }],
      },
    ]);
    await expect(
      db.listMemoryRecallSignals("curated:memory-1:1"),
    ).resolves.toEqual([
      expect.objectContaining({ bestScore: 0.8, hitCount: 3 }),
    ]);
    expect(changes.every((domains) => domains.includes("memory"))).toBe(true);

    await db.clearMemoryDerivedState();
    await expect(db.listMemorySourceStates()).resolves.toEqual([]);
    await expect(db.queryMemoryCandidates()).resolves.toEqual([]);
    await expect(db.listMemoryJobs()).resolves.toEqual([]);
    unsubscribe();
    await db.close();
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

  it("replaces the latest file history revision when requested", async () => {
    const db = new MemoryAppDatabase("vault-replace");
    await db.open();

    await db.storeFileHistoryRevision({
      path: "note.md",
      eventType: "modify",
      createdAt: 1,
      contentHash: "hash-a",
      content: "alpha",
      maxRevisions: 10,
    });
    const replaced = await db.storeFileHistoryRevision({
      path: "note.md",
      eventType: "modify",
      createdAt: 2,
      contentHash: "hash-b",
      content: "beta",
      maxRevisions: 10,
      replaceLatest: true,
    });

    expect(replaced.stored).toBe(true);
    await expect(db.getFileHistory("note.md")).resolves.toMatchObject({
      revisions: [
        {
          eventType: "modify",
          contentHash: "hash-b",
          content: "beta",
          createdAt: 2,
        },
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
      tags: ["work/project", "project alpha"],
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

    await db.upsertSearchDocument({
      path: "CVs/sample.cv.yml",
      name: "sample.cv.yml",
      extension: "yml",
      checksum: "cv-1",
      content: "Structured CV content",
      tags: ["cv"],
      tagParts: ["cv"],
      tagHierarchy: ["cv"],
      metadataText: JSON.stringify({ technologies: ["Kubernetes", "Ray"] }),
    });

    await expect(
      db.searchDocuments("file:Daily tag:#work"),
    ).resolves.toMatchObject([{ document: { path: "Projects/Daily.md" } }]);
    await expect(db.searchDocuments("tag:#work/project")).resolves.toMatchObject(
      [{ document: { path: "Projects/Daily.md" } }],
    );
    await expect(
      db.searchDocuments('tag:"#project alpha"'),
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
      db.searchDocuments('["note.status"]:ready'),
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
    await expect(
      db.searchDocuments('["technologies"]:Kubernetes'),
    ).resolves.toMatchObject([{ document: { path: "CVs/sample.cv.yml" } }]);
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

  it("configures embeddings lazily without warming the model", async () => {
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

    const pipeline = vi.fn(async () => new Promise(() => {}));
    setSearchEmbeddingProviderRuntimeLoaderForTests(
      async () =>
        ({
          env: {},
          pipeline,
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
    expect(pipeline).not.toHaveBeenCalled();
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

  it("queries disposable task projections without scanning Markdown", async () => {
    const db = new MemoryAppDatabase("tasks-vault");
    await db.open();
    await db.upsertIndexedFile({
      file: {
        path: "buy.md",
        normalizedPath: "buy.md",
        extension: "md",
        mtime: 1,
        size: 1,
        hash: "t1",
        indexed: true,
      },
      metadata: {
        path: "buy.md",
        hash: "t1",
        parserVersion: "test",
        metadata: {},
      },
      links: [
        {
          sourcePath: "buy.md",
          targetText: "./child.md",
          resolvedTargetPath: "child.md",
          type: "link",
          count: 1,
          heading: "Development",
          kind: "task-entry",
          ordinal: 0,
        },
      ],
      tags: [],
      properties: [],
      task: {
        documentPath: "buy.md",
        documentId: "t_buy",
        kind: "task",
        title: "Buy filter",
        status: "open",
        inbox: true,
        startKind: "anytime",
        planDate: "2026-08-19",
        checklistTotal: 0,
        checklistCompleted: 0,
        commentCount: 0,
        projectionVersion: 1,
      },
    });
    await db.upsertTaskProjection({
      documentPath: "child.md",
      documentId: "t_child",
      kind: "task",
      title: "Child",
      status: "open",
      inbox: false,
      startKind: "anytime",
      checklistTotal: 0,
      checklistCompleted: 0,
      commentCount: 0,
      projectionVersion: 1,
    });

    await expect(
      db.queryTasks({ view: "inbox", today: "2026-08-20" }),
    ).resolves.toMatchObject([{ documentId: "t_buy" }]);
    await expect(
      db.queryTasks({ view: "today", today: "2026-08-20" }),
    ).resolves.toMatchObject([{ documentId: "t_buy" }]);
    await expect(
      db.listChildLinks({ sourcePath: "buy.md", kind: "task-entry" }),
    ).resolves.toMatchObject([{ resolvedTargetPath: "child.md" }]);
  });

  it("queries public projections through the shared AST", async () => {
    const db = new MemoryAppDatabase("projections");
    await db.registerProjectionDefinition({
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
    await db.replaceProjectionSource({
      projectionId: "books/book",
      sourcePath: "reading.md",
      sourceHash: "h1",
      rows: [
        {
          id: "b1",
          kind: "book",
          data: { id: "b1", title: "Dune", status: "reading" },
        },
      ],
    });
    const result = await db.queryProjection("books/book", {
      where: { op: "compare", field: "status", comparison: "eq", value: "reading" },
      limit: 10,
    });
    expect(result.rows).toMatchObject([{ id: "b1", title: "Dune" }]);
    expect(result.complete).toBe(true);
    await expect(
      db.queryProjection("books/book", {}, "roles"),
    ).resolves.toMatchObject({ rows: [expect.objectContaining({ id: "b1" })] });
  });

  it("walks projection edges in both directions", async () => {
    const db = new MemoryAppDatabase("projection-edges");
    await db.registerProjectionDefinition({
      projectionId: "tasks/task",
      ownerPluginId: "tasks",
      schemaVersion: 1,
      configHash: "",
      visibility: "public",
      fields: {
        title: { type: "string", indexed: true },
      },
      active: true,
      updatedAt: 1,
    });
    await db.replaceProjectionSource({
      projectionId: "tasks/task",
      sourcePath: "lists/home.md",
      sourceHash: "h-list",
      rows: [{ id: "list_home", kind: "task-list", data: { id: "list_home", title: "Home" } }],
      edges: [
        {
          sourceRowId: "list_home",
          relation: "task-entry",
          targetPath: "buy.md",
          ordinal: 0,
        },
      ],
    });
    await db.replaceProjectionSource({
      projectionId: "tasks/task",
      sourcePath: "buy.md",
      sourceHash: "h-buy",
      rows: [{ id: "t_buy", kind: "task", data: { id: "t_buy", title: "Buy filter" } }],
    });
    await expect(
      db.queryRelated({
        projectionId: "tasks/task",
        rowId: "list_home",
        relation: "task-entry",
      }),
    ).resolves.toMatchObject({ rows: [{ id: "t_buy" }] });
    await expect(
      db.queryRelated({
        projectionId: "tasks/task",
        rowId: "t_buy",
        relation: "task-entry",
        direction: "in",
      }),
    ).resolves.toMatchObject({ rows: [{ id: "list_home" }] });
    await expect(db.listTaskDescendants("lists/home.md")).resolves.toMatchObject([
      { id: "t_buy", title: "Buy filter" },
    ]);
  });

  it("hides stale and private projection rows", async () => {
    const db = new MemoryAppDatabase("projection-safety");
    await db.registerProjectionDefinition({
      projectionId: "notes/secret",
      ownerPluginId: "notes",
      schemaVersion: 1,
      configHash: "cfg",
      visibility: "private",
      fields: { title: { type: "string", indexed: true } },
      active: true,
      updatedAt: 1,
    });
    await db.upsertIndexedFile({
      file: {
        path: "secret.md",
        normalizedPath: "secret.md",
        extension: "md",
        mtime: 1,
        size: 1,
        hash: "new",
        indexed: true,
      },
      metadata: {
        path: "secret.md",
        hash: "new",
        parserVersion: "test",
        metadata: {},
      },
      links: [],
      tags: [],
      properties: [],
    });
    await db.replaceProjectionSource({
      projectionId: "notes/secret",
      sourcePath: "secret.md",
      sourceHash: "old",
      rows: [{ id: "s1", kind: "note", data: { id: "s1", title: "Secret" } }],
    });
    await expect(db.queryProjection("notes/secret", {}, "roles")).rejects.toThrow(
      /private/,
    );
    await expect(
      db.queryProjection("notes/secret", {}, "notes"),
    ).resolves.toMatchObject({ rows: [] });
    await db.markProjectionSourceError({
      projectionId: "notes/secret",
      sourcePath: "secret.md",
      sourceHash: "new",
      error: "bad yaml",
    });
    await expect(
      db.queryProjection("notes/secret", {}, "notes"),
    ).resolves.toMatchObject({ rows: [], indexStatus: "error" });
  });

  it("keeps core metadata when a projection write fails closed", async () => {
    const db = new MemoryAppDatabase("projection-core-metadata");
    await db.upsertIndexedFile({
      file: {
        path: "role.md",
        normalizedPath: "role.md",
        extension: "md",
        mtime: 1,
        size: 1,
        hash: "h2",
        indexed: true,
      },
      metadata: {
        path: "role.md",
        hash: "h2",
        parserVersion: "test",
        metadata: {},
      },
      links: [],
      tags: [],
      properties: [],
    });
    await db.registerProjectionDefinition({
      projectionId: "roles/role",
      ownerPluginId: "roles",
      schemaVersion: 1,
      configHash: "",
      visibility: "public",
      fields: { title: { type: "string", indexed: true } },
      active: true,
      updatedAt: 1,
    });
    await db.markProjectionSourceError({
      projectionId: "roles/role",
      sourcePath: "role.md",
      sourceHash: "h2",
      error: "bad yaml",
    });
    await expect(db.queryIndexedMetadata({ extensions: ["md"] })).resolves.toMatchObject([
      { file: { path: "role.md", hash: "h2" } },
    ]);
    await expect(db.queryProjection("roles/role")).resolves.toMatchObject({
      rows: [],
      indexStatus: "error",
    });
    await expect(
      db.replaceProjectionSource({
        projectionId: "roles/role",
        sourcePath: "role.md",
        sourceHash: "h2",
        rows: [{ id: "stolen", kind: "role", data: { title: "Nope" } }],
        writerPluginId: "tasks",
      }),
    ).rejects.toThrow(/cannot write/);
  });

  it("rebuilds the same projection rows and never writes during a query", async () => {
    const seed = async (db: MemoryAppDatabase) => {
      await db.registerProjectionDefinition({
        projectionId: "tasks/task",
        ownerPluginId: "tasks",
        schemaVersion: 1,
        configHash: "",
        visibility: "public",
        fields: { title: { type: "string", indexed: true, sortable: true } },
        active: true,
        updatedAt: 1,
      });
      await db.replaceProjectionSource({
        projectionId: "tasks/task",
        sourcePath: "a.md",
        sourceHash: "ha",
        rows: [{ id: "a", kind: "task", data: { id: "a", title: "Alpha" } }],
      });
      await db.replaceProjectionSource({
        projectionId: "tasks/task",
        sourcePath: "b.md",
        sourceHash: "hb",
        rows: [{ id: "b", kind: "task", data: { id: "b", title: "Beta" } }],
      });
    };
    const first = new MemoryAppDatabase("rebuild-a");
    const second = new MemoryAppDatabase("rebuild-b");
    await seed(first);
    await seed(second);
    const before = await first.queryProjection("tasks/task", {
      orderBy: [{ field: "title", direction: "asc" }],
    });
    const after = await second.queryProjection("tasks/task", {
      orderBy: [{ field: "title", direction: "asc" }],
    });
    expect(after.rows).toEqual(before.rows);
    const revision = after.revision;
    await second.queryProjection("tasks/task", {
      where: { op: "compare", field: "title", comparison: "eq", value: "Alpha" },
      limit: 1,
    });
    expect((await second.queryProjection("tasks/task")).revision).toBe(revision);
    await second.replaceProjectionSource({
      projectionId: "tasks/task",
      sourcePath: "a.md",
      sourceHash: "ha2",
      rows: [{ id: "a", kind: "task", data: { id: "a", title: "Changed" } }],
    });
    await expect(second.queryProjection("tasks/task")).resolves.toMatchObject({
      rows: expect.arrayContaining([
        expect.objectContaining({ id: "a", title: "Changed" }),
        expect.objectContaining({ id: "b", title: "Beta" }),
      ]),
    });
  });
});
