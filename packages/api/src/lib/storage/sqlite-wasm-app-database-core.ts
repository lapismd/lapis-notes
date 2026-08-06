import {
  APP_DATABASE_SCHEMA_VERSION,
  MemoryAppDatabase,
  MIN_VECTOR_SEARCH_SCORE,
  SQLITE_APP_DATABASE_SCHEMA,
  type AppDatabaseIndexedMetadataQuery,
  type AppDatabaseIndexedMetadataRow,
  type AppDatabaseFileHistory,
  type AppDatabaseFileHistoryRevision,
  type AppDatabaseStoreFileHistoryRevisionInput,
  type AppDatabaseStoreFileHistoryRevisionResult,
  buildSearchResult,
  compareSearchResults,
  hasSearchPropertyNames,
  searchPropertyNames,
  rankSearchScores,
  scoreSearchDocument,
  scoreVectorDocument,
  searchTerms,
  type SearchDocumentChunk,
  type SearchEmbeddingProviderConfig,
  type AppDatabaseIndexedFile,
  type AppDatabaseSearchOptions,
  type AppDatabaseSearchResult,
  type AppDatabaseState,
  type MetadataCacheSnapshot,
  type SearchEmbeddingRuntimeStatus,
  type SearchDocumentRecord,
} from "./app-database";
import type { SearchEmbeddingProvider } from "./search-embedding-provider";
import { createSqliteFtsPrefixQueryFromTerms } from "./sqlite-fts-query";
import { isStructuredSearchQuery } from "./search-query-evaluator";

type SqliteDb = {
  exec: (options: unknown) => unknown;
  close: () => void;
};

type OpfsPoolUtil = {
  OpfsSAHPoolDb: new (filename: string) => SqliteDb;
  removeVfs?: () => Promise<void>;
};

type SqliteWasmInitOptions = {
  locateFile?: (path: string, prefix?: string) => string;
  instantiateWasm?: unknown;
};

type SqliteWasmInit = (options?: SqliteWasmInitOptions) => Promise<any>;

type VectorSearchMatch = {
  score: number;
  matchedChunkIds: string[];
};

type VectorSearchQueryResult = {
  scores: Map<string, VectorSearchMatch>;
  candidatePaths: Set<string>;
  candidateCount: number;
};

type DebugVectorSearchFixture = {
  provider: SearchEmbeddingProviderConfig;
  queryVector: number[];
  documents: Array<{
    document: SearchDocumentRecord;
    vector: number[];
  }>;
};

const SEARCH_VECTOR_TABLE = "search_vec_chunks";
const SEARCH_VECTOR_DIMENSIONS_META_KEY = "search.vector.dimensions";

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function parse<T>(value: unknown): T | null {
  if (typeof value !== "string") return null;
  return JSON.parse(value) as T;
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function toFtsPrefixQuery(query: string): string {
  return createSqliteFtsPrefixQueryFromTerms(searchTerms(query));
}

function normalizeBindParameters(bind?: Record<string, unknown>) {
  if (!bind) return bind;

  return Object.fromEntries(
    Object.entries(bind).map(([key, value]) => {
      if (/^[0-9]+$/.test(key)) {
        return [key, value];
      }
      if (/^[:@$?]/.test(key)) {
        return [key, value];
      }
      return [`:${key}`, value];
    }),
  );
}

function isSqliteCorruptionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("SQLITE_CORRUPT") ||
    message.includes("database disk image is malformed") ||
    message.includes("sqlite3 result code 11")
  );
}

const SQLITE_STALE_OPFS_MESSAGE =
  /state cached in an interface object was made but the state had changed/i;

export function isRecoverableSqliteStartupError(error: unknown): boolean {
  if (isSqliteCorruptionError(error)) {
    return true;
  }

  let current: unknown = error;
  while (current) {
    const err = current as {
      name?: string;
      message?: string;
      cause?: unknown;
    };
    if (
      err?.name === "InvalidStateError" ||
      SQLITE_STALE_OPFS_MESSAGE.test(err?.message ?? "")
    ) {
      return true;
    }
    current = err?.cause;
  }

  return false;
}

function delaySqliteStartupRetry(attempt: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 25 * (attempt + 1));
  });
}

export interface SqliteWasmAppDatabaseOptions {
  filename?: string;
  vfsName?: string;
  directory?: string;
  useWorker?: boolean;
  workerTimeoutMs?: number;
}

export class SqliteWasmAppDatabaseCore extends MemoryAppDatabase {
  private db: SqliteDb | null = null;
  private opened = false;
  private searchVectorDimensions: number | null = null;

  constructor(
    vaultId: string,
    readonly options: SqliteWasmAppDatabaseOptions = {},
  ) {
    super(vaultId);
  }

  override async open(): Promise<void> {
    if (this.opened) return;

    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.openDatabase();
        return;
      } catch (error) {
        lastError = error;
        if (!isRecoverableSqliteStartupError(error) || attempt === 2) {
          throw error;
        }

        await this.resetMalformedDatabase();
        await delaySqliteStartupRetry(attempt);
      }
    }

    throw lastError;
  }

  override async migrate(): Promise<void> {
    await super.migrate();
    this.setJson("schema.version", APP_DATABASE_SCHEMA_VERSION);
    this.persistState();
  }

  override async configureSearchEmbeddingProvider(
    provider: SearchEmbeddingProviderConfig | null,
  ): Promise<void> {
    const previousProvider = await this.getSearchEmbeddingProvider();
    await super.configureSearchEmbeddingProvider(provider);
    const providerChanged =
      JSON.stringify(previousProvider) !== JSON.stringify(provider ?? null);
    if (providerChanged) {
      for (const document of this.searchDocs.values()) {
        this.persistPreparedSearchDocument(document);
      }
    }
    this.persistState();
  }

  override async close(): Promise<void> {
    this.persistState();
    this.db?.close();
    this.db = null;
    this.opened = false;
  }

  override async setMeta(key: string, value: unknown): Promise<void> {
    await super.setMeta(key, value);
    this.setJson(`meta.${key}`, value);
    this.persistState();
  }

  override async saveMetadataSnapshot(
    snapshot: MetadataCacheSnapshot,
  ): Promise<void> {
    await super.saveMetadataSnapshot(snapshot);
    this.setJson("metadata.snapshot", snapshot);
    this.persistState();
  }

  override async getFileHistory(
    path: string,
  ): Promise<AppDatabaseFileHistory | null> {
    return super.getFileHistory(path);
  }

  override async storeFileHistoryRevision(
    input: AppDatabaseStoreFileHistoryRevisionInput,
  ): Promise<AppDatabaseStoreFileHistoryRevisionResult> {
    const result = await super.storeFileHistoryRevision(input);
    if (result.stored) {
      this.persistFileHistory(result.fileId);
      this.persistState();
    }
    return result;
  }

  override async upsertIndexedFile(
    record: AppDatabaseIndexedFile,
  ): Promise<void> {
    await super.upsertIndexedFile(record);
    this.exec(
      `INSERT INTO files
        (path, normalized_path, extension, mtime, size, hash, indexed, deleted)
       VALUES (:path, :normalizedPath, :extension, :mtime, :size, :hash, 1, 0)
       ON CONFLICT(path) DO UPDATE SET
        normalized_path = excluded.normalized_path,
        extension = excluded.extension,
        mtime = excluded.mtime,
        size = excluded.size,
        hash = excluded.hash,
        indexed = 1,
        deleted = 0`,
      {
        path: record.file.path,
        normalizedPath: record.file.normalizedPath,
        extension: record.file.extension,
        mtime: record.file.mtime,
        size: record.file.size,
        hash: record.file.hash,
      },
    );
    this.exec(
      `INSERT INTO metadata (path, hash, parser_version, data_json)
       VALUES (:path, :hash, :parserVersion, :metadata)
       ON CONFLICT(path) DO UPDATE SET
        hash = excluded.hash,
        parser_version = excluded.parser_version,
        data_json = excluded.data_json`,
      {
        path: record.metadata.path,
        hash: record.metadata.hash,
        parserVersion: record.metadata.parserVersion,
        metadata: json(record.metadata.metadata),
      },
    );
    this.exec(`DELETE FROM links WHERE source_path = :path`, {
      path: record.file.path,
    });
    for (const link of record.links) {
      this.exec(
        `INSERT INTO links
          (source_path, target_text, resolved_target_path, type, position_json, count)
         VALUES (:sourcePath, :targetText, :resolvedTargetPath, :type, :position, :count)`,
        {
          ...link,
          position: json(link.position),
        },
      );
    }
    this.exec(`DELETE FROM tags WHERE path = :path`, {
      path: record.file.path,
    });
    for (const tag of record.tags) {
      this.exec(
        `INSERT INTO tags (path, tag, parts_json, hierarchy_json, position_json)
         VALUES (:path, :tag, :parts, :hierarchy, :position)`,
        {
          path: tag.path,
          tag: tag.tag,
          parts: json(tag.parts),
          hierarchy: json(tag.hierarchy),
          position: json(tag.position),
        },
      );
    }
    this.exec(`DELETE FROM properties WHERE path = :path`, {
      path: record.file.path,
    });
    for (const property of record.properties) {
      this.exec(
        `INSERT INTO properties
          (path, name, inferred_type, declared_type, value_json)
         VALUES (:path, :name, :inferredType, :declaredType, :value)
         ON CONFLICT(path, name) DO UPDATE SET
          inferred_type = excluded.inferred_type,
          declared_type = excluded.declared_type,
          value_json = excluded.value_json`,
        {
          ...property,
          value: json(property.value),
        },
      );
    }
    this.persistState();
  }

  override async deleteIndexedFile(path: string): Promise<void> {
    await super.deleteIndexedFile(path);
    this.exec(`UPDATE files SET indexed = 0, deleted = 1 WHERE path = :path`, {
      path,
    });
    this.exec(`DELETE FROM metadata WHERE path = :path`, { path });
    this.exec(`DELETE FROM links WHERE source_path = :path`, { path });
    this.exec(`DELETE FROM tags WHERE path = :path`, { path });
    this.exec(`DELETE FROM properties WHERE path = :path`, { path });
    await this.deleteSearchDocument(path);
    this.persistState();
  }

  override async renameIndexedFile(
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    await super.renameIndexedFile(oldPath, newPath);
    this.exec(
      `UPDATE files SET path = :newPath, normalized_path = :newPath WHERE path = :oldPath`,
      { oldPath, newPath },
    );
    this.exec(`UPDATE metadata SET path = :newPath WHERE path = :oldPath`, {
      oldPath,
      newPath,
    });
    this.exec(
      `UPDATE links SET source_path = :newPath WHERE source_path = :oldPath`,
      { oldPath, newPath },
    );
    this.exec(`UPDATE tags SET path = :newPath WHERE path = :oldPath`, {
      oldPath,
      newPath,
    });
    this.exec(`UPDATE properties SET path = :newPath WHERE path = :oldPath`, {
      oldPath,
      newPath,
    });
    this.exec(`UPDATE search_docs SET path = :newPath WHERE path = :oldPath`, {
      oldPath,
      newPath,
    });
    this.exec(`DELETE FROM search_chunks WHERE path = :oldPath`, { oldPath });
    this.deleteSearchVectorEntriesForPath(oldPath);
    this.exec(`DELETE FROM search_fts WHERE path = :oldPath`, { oldPath });
    const doc = await this.getSearchDocument(newPath);
    if (doc) {
      await this.upsertSearchDocument(doc);
    }
    this.persistState();
  }

  override async queryIndexedMetadata(
    query: AppDatabaseIndexedMetadataQuery = {},
  ): Promise<AppDatabaseIndexedMetadataRow[]> {
    const candidatePaths = this.selectIndexedMetadataCandidatePaths(query);
    const rows = this.materializeIndexedMetadataRows(candidatePaths);
    return this.applyIndexedMetadataQuery(rows, query);
  }

  private selectIndexedMetadataCandidatePaths(
    query: AppDatabaseIndexedMetadataQuery,
  ): string[] | undefined {
    if (!this.db) {
      return undefined;
    }

    const where = ["files.indexed = 1", "files.deleted = 0"];
    const bind: Record<string, unknown> = {};
    let needsSql = false;

    const extensions = (query.extensions ?? [])
      .map((extension) => extension.replace(/^\.+/, "").trim().toLowerCase())
      .filter(Boolean);
    if (extensions.length > 0) {
      needsSql = true;
      const placeholders = extensions.map((extension, index) => {
        const key = `extension${index}`;
        bind[key] = extension;
        return `:${key}`;
      });
      where.push(`LOWER(files.extension) IN (${placeholders.join(", ")})`);
    }

    const prefixes = (query.pathPrefixes ?? [])
      .map((prefix) => prefix.trim().replace(/^\/+/, "").replace(/\/+$/, ""))
      .filter((prefix) => prefix.length > 0);
    if (prefixes.length > 0) {
      needsSql = true;
      const conditions = prefixes.map((prefix, index) => {
        const prefixKey = `pathPrefix${index}`;
        const likeKey = `pathPrefixLike${index}`;
        bind[prefixKey] = prefix;
        bind[likeKey] = `${escapeLike(prefix)}/%`;
        return `(files.path = :${prefixKey} OR files.path LIKE :${likeKey} ESCAPE '\\')`;
      });
      where.push(`(${conditions.join(" OR ")})`);
    }

    for (const [index, filter] of (query.propertyFilters ?? []).entries()) {
      needsSql = true;
      const key = `propertyName${index}`;
      bind[key] = filter.name;
      if (filter.op === "not-exists") {
        where.push(
          `NOT EXISTS (SELECT 1 FROM properties p${index} WHERE p${index}.path = files.path AND p${index}.name = :${key})`,
        );
      } else {
        where.push(
          `EXISTS (SELECT 1 FROM properties p${index} WHERE p${index}.path = files.path AND p${index}.name = :${key})`,
        );
      }
    }

    for (const [index, tag] of (query.requiredTags ?? []).entries()) {
      const normalized = tag.trim();
      if (!normalized.length) {
        continue;
      }
      needsSql = true;
      const candidates = normalized.startsWith("#")
        ? [normalized, normalized.slice(1)]
        : [normalized, `#${normalized}`];
      const placeholders = candidates.map((candidate, candidateIndex) => {
        const key = `tag${index}_${candidateIndex}`;
        bind[key] = candidate;
        return `:${key}`;
      });
      where.push(
        `EXISTS (SELECT 1 FROM tags t${index} WHERE t${index}.path = files.path AND t${index}.tag IN (${placeholders.join(", ")}))`,
      );
    }

    for (const [index, targetPath] of (
      query.resolvedTargetPaths ?? []
    ).entries()) {
      if (!targetPath) {
        continue;
      }
      needsSql = true;
      const key = `resolvedTarget${index}`;
      bind[key] = targetPath;
      where.push(
        `EXISTS (SELECT 1 FROM links l${index} WHERE l${index}.source_path = files.path AND l${index}.resolved_target_path = :${key})`,
      );
    }

    if (!needsSql) {
      return undefined;
    }

    const rows = this.rows<{ path: string }>(
      `SELECT DISTINCT files.path
       FROM files
       WHERE ${where.join(" AND ")}`,
      bind,
    );

    return rows.map((row) => row.path);
  }

  override async upsertSearchDocument(
    document: SearchDocumentRecord,
  ): Promise<void> {
    const persistedDocument =
      await this.prepareAndPersistSearchDocument(document);
    this.persistState();
  }

  async prepareAndPersistSearchDocument(
    document: SearchDocumentRecord,
  ): Promise<SearchDocumentRecord> {
    await super.upsertSearchDocument(document);
    const persistedDocument = this.searchDocs.get(document.path) ?? document;
    this.persistPreparedSearchDocument(persistedDocument);
    return persistedDocument;
  }

  private persistPreparedSearchDocument(
    persistedDocument: SearchDocumentRecord,
  ): void {
    this.exec(
      `INSERT INTO search_docs
        (path, name, extension, checksum, content, tags_json, tag_parts_json, tag_hierarchy_json, metadata_text)
       VALUES (:path, :name, :extension, :checksum, :content, :tags, :tagParts, :tagHierarchy, :metadataText)
       ON CONFLICT(path) DO UPDATE SET
        name = excluded.name,
        extension = excluded.extension,
        checksum = excluded.checksum,
        content = excluded.content,
        tags_json = excluded.tags_json,
        tag_parts_json = excluded.tag_parts_json,
        tag_hierarchy_json = excluded.tag_hierarchy_json,
        metadata_text = excluded.metadata_text`,
      {
        path: persistedDocument.path,
        name: persistedDocument.name,
        extension: persistedDocument.extension,
        checksum: persistedDocument.checksum,
        content: persistedDocument.content,
        tags: json(persistedDocument.tags),
        tagParts: json(persistedDocument.tagParts),
        tagHierarchy: json(persistedDocument.tagHierarchy),
        metadataText: persistedDocument.metadataText ?? "",
      },
    );
    this.exec(`DELETE FROM search_chunks WHERE path = :path`, {
      path: persistedDocument.path,
    });
    for (const [ordinal, chunk] of (persistedDocument.chunks ?? []).entries()) {
      this.exec(
        `INSERT INTO search_chunks
          (path, chunk_id, ordinal, start_offset, end_offset, heading, kind, text, embedding_json)
         VALUES (:path, :chunkId, :ordinal, :startOffset, :endOffset, :heading, :kind, :text, :embedding)`,
        {
          path: persistedDocument.path,
          chunkId: chunk.id,
          ordinal,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
          heading: chunk.heading ?? null,
          kind: chunk.kind ?? "fallback",
          text: chunk.text,
          embedding: json(chunk.embedding ?? null),
        },
      );
    }
    this.upsertSearchVectorEntries(persistedDocument);
    this.upsertSearchFts(persistedDocument);
  }

  override async deleteSearchDocument(path: string): Promise<void> {
    await super.deleteSearchDocument(path);
    this.deleteSearchVectorEntriesForPath(path);
    this.exec(`DELETE FROM search_chunks WHERE path = :path`, { path });
    this.exec(`DELETE FROM search_docs WHERE path = :path`, { path });
    this.exec(`DELETE FROM search_fts WHERE path = :path`, { path });
    this.persistState();
  }

  override async rebuildSearchIndex(): Promise<void> {
    await super.rebuildSearchIndex();
    this.exec(`DELETE FROM search_fts`);
    this.resetSearchVectorIndex();
    for (const document of this.searchDocs.values()) {
      this.upsertSearchVectorEntries(document);
      this.upsertSearchFts(document);
    }
    this.persistState();
  }

  override async searchDocuments(
    query: string,
    options: AppDatabaseSearchOptions = {},
  ): Promise<AppDatabaseSearchResult[]> {
    if (!this.db) {
      return super.searchDocuments(query, options);
    }

    if (options.caseSensitive || isStructuredSearchQuery(query)) {
      return super.searchDocuments(query, options);
    }

    const limit = options.limit ?? 100;
    const requestedMode = options.mode ?? "auto";
    const propertyNames = searchPropertyNames(query);
    const lexicalCandidates = new Set<string>();
    const ftsQuery = toFtsPrefixQuery(query);

    if (ftsQuery) {
      try {
        const rows = this.rows<{ path: string }>(
          `WITH fts_candidates AS (
             SELECT path, bm25(search_fts) AS rank
             FROM search_fts
             WHERE search_fts MATCH :match
           )
           SELECT path
           FROM fts_candidates
           ORDER BY rank, path
           LIMIT :limit`,
          { match: ftsQuery, limit },
        );
        for (const row of rows) {
          lexicalCandidates.add(row.path);
        }
      } catch {
        // Fall back to in-memory scoring when FTS rejects the query syntax.
      }
    }

    const likeTerms = searchTerms(query);
    if (likeTerms.length) {
      const bind: Record<string, string | number> = { limit };
      const clauses = likeTerms.map((term, index) => {
        const key = `like${index}`;
        bind[key] = `%${escapeLike(term)}%`;
        return `(lower(path) LIKE :${key} ESCAPE '\\'
          OR lower(name) LIKE :${key} ESCAPE '\\')`;
      });

      const rows = this.rows<{ path: string }>(
        `SELECT path
         FROM search_docs
         WHERE ${clauses.join(" AND ")}
         ORDER BY lower(path)
         LIMIT :limit`,
        bind,
      );
      for (const row of rows) {
        lexicalCandidates.add(row.path);
      }
    }
    const propertyCandidates = new Set(
      [...this.properties.entries()]
        .filter(([, properties]) =>
          hasSearchPropertyNames(properties, propertyNames),
        )
        .map(([path]) => path),
    );
    const queryVector =
      requestedMode === "lexical" || !this.searchEmbeddingProvider
        ? null
        : await this.safeEmbedQuery(query);
    const vectorQueryResult = queryVector
      ? this.querySearchVectorIndex(queryVector, limit)
      : null;
    const vectorFallbackScores =
      queryVector && !vectorQueryResult
        ? new Map(
            [...this.searchDocs.values()].map((document) => [
              document.path,
              scoreVectorDocument(document, queryVector),
            ]),
          )
        : null;
    const vectorCandidatePaths = vectorQueryResult
      ? vectorQueryResult.candidatePaths
      : new Set(
          [...(vectorFallbackScores?.entries() ?? [])]
            .filter(([, entry]) => entry.score >= MIN_VECTOR_SEARCH_SCORE)
            .map(([path]) => path),
        );
    const candidatePaths = new Set<string>([
      ...lexicalCandidates,
      ...propertyCandidates,
      ...vectorCandidatePaths,
    ]);
    const source = (
      candidatePaths.size
        ? [...candidatePaths]
            .map((path) => this.searchDocs.get(path))
            .filter((document): document is SearchDocumentRecord =>
              Boolean(document),
            )
        : [...this.searchDocs.values()]
    ).filter((document) => {
      if (!propertyNames.length) {
        return true;
      }

      const properties = this.properties.get(document.path) ?? [];
      return hasSearchPropertyNames(properties, propertyNames);
    });
    const lexicalCandidateCount =
      lexicalCandidates.size + propertyCandidates.size || source.length;
    const vectorScores = new Map(
      source.map((document) => {
        const indexed = vectorQueryResult?.scores.get(document.path);
        const fallback = vectorFallbackScores?.get(document.path);
        return [
          document.path,
          indexed ?? fallback ?? { score: 0, matchedChunkIds: [] },
        ];
      }),
    );
    const lexicalScores = new Map(
      source.map((document) => [
        document.path,
        scoreSearchDocument(
          document,
          query,
          this.properties.get(document.path) ?? [],
          options,
        ),
      ]),
    );
    const vectorCandidateCount = vectorQueryResult
      ? vectorQueryResult.candidateCount
      : [...vectorScores.values()].filter(
          (entry) => entry.score >= MIN_VECTOR_SEARCH_SCORE,
        ).length;
    const appliedMode = queryVector
      ? requestedMode === "vector"
        ? "vector"
        : vectorCandidateCount > 0
          ? "hybrid"
          : "lexical"
      : "lexical";
    const lexicalRanks = rankSearchScores(
      [...lexicalScores.entries()].map(([path, score]) => ({ path, score })),
    );
    const vectorRanks = rankSearchScores(
      [...vectorScores.entries()].map(([path, entry]) => ({
        path,
        score: entry.score,
      })),
      (score) => score >= MIN_VECTOR_SEARCH_SCORE,
    );

    return source
      .map((document) =>
        buildSearchResult(document, query, options, {
          backendKind: "sqlite-wasm",
          appliedMode,
          lexicalScore: lexicalScores.get(document.path) ?? 0,
          vectorScore: vectorScores.get(document.path)?.score ?? 0,
          lexicalCandidateCount,
          vectorCandidateCount,
          providerConfig: this.searchEmbeddingProviderConfig,
          preferredChunkIds:
            vectorScores.get(document.path)?.matchedChunkIds ?? [],
          lexicalRank: lexicalRanks.get(document.path),
          vectorRank: vectorRanks.get(document.path),
        }),
      )
      .filter((result) => {
        const lexicalHit = (result.scoreBreakdown.lexical ?? 0) > 0;
        const vectorHit =
          (result.scoreBreakdown.vector ?? 0) >= MIN_VECTOR_SEARCH_SCORE;
        if (appliedMode === "vector") {
          return vectorHit && result.snippets.length > 0;
        }
        if (appliedMode === "hybrid") {
          return (lexicalHit || vectorHit) && result.snippets.length > 0;
        }
        return lexicalHit && result.snippets.length > 0;
      })
      .sort(compareSearchResults)
      .slice(0, limit)
      .map((result) => parse<AppDatabaseSearchResult>(json(result))!);
  }

  snapshotState(): AppDatabaseState {
    return parse<AppDatabaseState>(json(this.toState()))!;
  }

  async debugSeedVectorSearchFixture(
    fixture: DebugVectorSearchFixture,
  ): Promise<Array<{ path: string; chunk_id: string }>> {
    const vectors = new Map(
      fixture.documents.map((entry) => [
        entry.document.path,
        [...entry.vector],
      ]),
    );
    const providerConfig = parse<SearchEmbeddingProviderConfig>(
      json(fixture.provider),
    );
    if (!providerConfig) {
      throw new Error(
        "Debug vector search fixture requires a valid provider config",
      );
    }
    const queryVector = [...fixture.queryVector];
    const runtimeStatus: SearchEmbeddingRuntimeStatus = {
      providerKind: fixture.provider.kind,
      phase: "ready",
      modelId: fixture.provider.modelId,
      updatedAt: Date.now(),
    };

    this.searchEmbeddingProviderConfig = providerConfig;
    this.searchEmbeddingProvider = {
      config: providerConfig,
      ready: async () => true,
      embedDocument: async (document) => {
        const vector = vectors.get(document.path) ?? queryVector;
        return (document.chunks ?? []).map((chunk) => ({
          chunkId: chunk.id,
          vector,
          fingerprint: `${document.path}:${chunk.id}`,
        }));
      },
      embedQuery: async () => queryVector,
      getRuntimeStatus: () => runtimeStatus,
    } satisfies SearchEmbeddingProvider;

    this.searchDocs.clear();
    this.exec(`DELETE FROM search_chunks`);
    this.exec(`DELETE FROM search_docs`);
    this.exec(`DELETE FROM search_fts`);
    this.resetSearchVectorIndex();

    for (const entry of fixture.documents) {
      await this.upsertSearchDocument(entry.document);
    }

    return this.debugListSearchVectorRows();
  }

  debugListSearchVectorRows(): Array<{ path: string; chunk_id: string }> {
    return this.rows<{ path: string; chunk_id: string }>(
      `SELECT path, chunk_id FROM ${SEARCH_VECTOR_TABLE} ORDER BY path, chunk_id`,
    );
  }

  private async ensureSearchIndexReady(): Promise<void> {
    const [row] = this.rows<{ count: number }>(
      `SELECT COUNT(*) as count FROM search_fts`,
    );
    if (Number(row?.count ?? 0) === 0 && this.searchDocs.size > 0) {
      await this.rebuildSearchIndex();
    }
  }

  private readyVectorChunks(document: SearchDocumentRecord): Array<
    SearchDocumentChunk & {
      embedding: NonNullable<SearchDocumentChunk["embedding"]> & {
        vector: number[];
      };
    }
  > {
    const activeModelId = this.searchEmbeddingProviderConfig?.modelId ?? null;
    return (document.chunks ?? []).filter(
      (
        chunk,
      ): chunk is SearchDocumentChunk & {
        embedding: NonNullable<SearchDocumentChunk["embedding"]> & {
          vector: number[];
        };
      } => {
        const embedding = chunk.embedding;
        return Boolean(
          embedding?.status === "ready" &&
            embedding.vector?.length &&
            (!activeModelId || embedding.modelId === activeModelId),
        );
      },
    );
  }

  private resetSearchVectorIndex(): void {
    this.exec(`DROP TABLE IF EXISTS ${SEARCH_VECTOR_TABLE}`);
    this.searchVectorDimensions = null;
    this.setJson(SEARCH_VECTOR_DIMENSIONS_META_KEY, null);
  }

  private ensureSearchVectorTable(dimensions: number): boolean {
    if (!Number.isInteger(dimensions) || dimensions <= 0) {
      return false;
    }

    if (this.searchVectorDimensions === dimensions) {
      return true;
    }

    try {
      this.exec(`DROP TABLE IF EXISTS ${SEARCH_VECTOR_TABLE}`);
      this.exec(
        `CREATE VIRTUAL TABLE IF NOT EXISTS ${SEARCH_VECTOR_TABLE} USING vec0(
          embedding float[${dimensions}] distance_metric=cosine,
          path text,
          chunk_id text
        )`,
      );
      this.searchVectorDimensions = dimensions;
      this.setJson(SEARCH_VECTOR_DIMENSIONS_META_KEY, dimensions);
      return true;
    } catch {
      this.searchVectorDimensions = null;
      this.setJson(SEARCH_VECTOR_DIMENSIONS_META_KEY, null);
      return false;
    }
  }

  private deleteSearchVectorEntriesForPath(path: string): void {
    if (this.searchVectorDimensions === null) {
      return;
    }

    this.exec(`DELETE FROM ${SEARCH_VECTOR_TABLE} WHERE path = :path`, {
      path,
    });
  }

  private upsertSearchVectorEntries(document: SearchDocumentRecord): void {
    const readyChunks = this.readyVectorChunks(document);
    if (!readyChunks.length) {
      this.deleteSearchVectorEntriesForPath(document.path);
      return;
    }

    const dimensions =
      readyChunks[0].embedding.dimensions ??
      readyChunks[0].embedding.vector.length;
    if (!this.ensureSearchVectorTable(dimensions)) {
      return;
    }

    this.deleteSearchVectorEntriesForPath(document.path);
    for (const chunk of readyChunks) {
      if (chunk.embedding.vector.length !== dimensions) {
        continue;
      }

      this.exec(
        `INSERT INTO ${SEARCH_VECTOR_TABLE} (embedding, path, chunk_id)
         VALUES (:embedding, :path, :chunkId)`,
        {
          embedding: new Float32Array(chunk.embedding.vector).buffer,
          path: document.path,
          chunkId: chunk.id,
        },
      );
    }
  }

  private rebuildSearchVectorIndexFromState(): void {
    this.searchVectorDimensions =
      this.getJson<number>(SEARCH_VECTOR_DIMENSIONS_META_KEY) ?? null;
    this.resetSearchVectorIndex();
    for (const document of this.searchDocs.values()) {
      this.upsertSearchVectorEntries(document);
    }
  }

  private querySearchVectorIndex(
    queryVector: number[],
    limit: number,
  ): VectorSearchQueryResult | null {
    if (
      this.searchVectorDimensions === null ||
      queryVector.length !== this.searchVectorDimensions
    ) {
      return null;
    }

    try {
      const rows = this.rows<{
        path: string;
        chunk_id: string;
        distance: number;
      }>(
        `SELECT path, chunk_id, distance
         FROM ${SEARCH_VECTOR_TABLE}
         WHERE embedding MATCH :query
           AND k = :limit
         ORDER BY distance
         LIMIT :limit`,
        {
          query: new Float32Array(queryVector).buffer,
          limit,
        },
      );
      const scores = new Map<string, VectorSearchMatch>();
      const candidatePaths = new Set<string>();
      for (const row of rows) {
        const score = Math.max(0, 1 - Number(row.distance ?? 0));
        if (score < MIN_VECTOR_SEARCH_SCORE) {
          continue;
        }

        candidatePaths.add(row.path);
        const existing = scores.get(row.path);
        if (!existing || score > existing.score) {
          scores.set(row.path, {
            score,
            matchedChunkIds: [row.chunk_id],
          });
          continue;
        }

        if (!existing.matchedChunkIds.includes(row.chunk_id)) {
          existing.matchedChunkIds.push(row.chunk_id);
        }
      }

      return {
        scores,
        candidatePaths,
        candidateCount: candidatePaths.size,
      };
    } catch {
      return null;
    }
  }

  private upsertSearchFts(document: SearchDocumentRecord): void {
    this.exec(`DELETE FROM search_fts WHERE path = :path`, {
      path: document.path,
    });
    this.exec(
      `INSERT INTO search_fts (path, name, content, tags, metadata_text)
       VALUES (:path, :name, :content, :tags, :metadataText)`,
      {
        path: document.path,
        name: document.name,
        content: document.content,
        tags: document.tags.join(" "),
        metadataText: document.metadataText ?? "",
      },
    );
  }

  private persistFileHistory(fileId: string): void {
    const file = this.historyFiles.get(fileId);
    if (!file) {
      return;
    }

    this.exec(`DELETE FROM history_revisions WHERE file_id = :fileId`, {
      fileId,
    });
    this.exec(
      `INSERT INTO history_files (file_id, current_path, deleted)
       VALUES (:fileId, :currentPath, :deleted)
       ON CONFLICT(file_id) DO UPDATE SET
        current_path = excluded.current_path,
        deleted = excluded.deleted`,
      {
        fileId: file.fileId,
        currentPath: file.currentPath,
        deleted: file.deleted ? 1 : 0,
      },
    );

    for (const [ordinal, revision] of (
      this.historyRevisions.get(fileId) ?? []
    ).entries()) {
      this.exec(
        `INSERT INTO history_revisions
          (revision_id, file_id, ordinal, current_path, captured_path, event_type, created_at, source_mtime, source_size, content_hash, content)
         VALUES (:revisionId, :fileId, :ordinal, :currentPath, :capturedPath, :eventType, :createdAt, :sourceMtime, :sourceSize, :contentHash, :content)`,
        {
          revisionId: revision.revisionId,
          fileId: revision.fileId,
          ordinal,
          currentPath: revision.currentPath,
          capturedPath: revision.capturedPath,
          eventType: revision.eventType,
          createdAt: revision.createdAt,
          sourceMtime: revision.sourceMtime ?? null,
          sourceSize: revision.sourceSize ?? null,
          contentHash: revision.contentHash,
          content: revision.content,
        },
      );
    }
  }

  private loadFileHistoryFromTables(): void {
    const files = this.rows<{
      file_id: string;
      current_path: string;
      deleted: number;
    }>(
      `SELECT file_id, current_path, deleted
       FROM history_files
       ORDER BY current_path`,
    );
    this.historyFiles = new Map(
      files.map((row) => [
        row.file_id,
        {
          fileId: row.file_id,
          currentPath: row.current_path,
          deleted: Boolean(row.deleted),
        },
      ]),
    );
    this.historyFileIdsByPath = new Map(
      files.map((row) => [row.current_path, row.file_id]),
    );

    const revisions = this.rows<{
      revision_id: string;
      file_id: string;
      ordinal: number;
      current_path: string;
      captured_path: string;
      event_type: AppDatabaseFileHistoryRevision["eventType"];
      created_at: number;
      source_mtime: number | null;
      source_size: number | null;
      content_hash: string;
      content: string;
    }>(
      `SELECT revision_id, file_id, ordinal, current_path, captured_path, event_type, created_at, source_mtime, source_size, content_hash, content
       FROM history_revisions
       ORDER BY file_id, ordinal`,
    );

    const revisionsByFileId = new Map<
      string,
      AppDatabaseFileHistoryRevision[]
    >();
    for (const row of revisions) {
      const entries = revisionsByFileId.get(row.file_id) ?? [];
      entries.push({
        revisionId: row.revision_id,
        fileId: row.file_id,
        currentPath: row.current_path,
        capturedPath: row.captured_path,
        eventType: row.event_type,
        createdAt: Number(row.created_at),
        sourceMtime:
          row.source_mtime === null ? undefined : Number(row.source_mtime),
        sourceSize:
          row.source_size === null ? undefined : Number(row.source_size),
        contentHash: row.content_hash,
        content: row.content,
      });
      revisionsByFileId.set(row.file_id, entries);
    }

    this.historyRevisions = revisionsByFileId;
  }

  private loadSearchDocumentsFromTables(): void {
    const docs = this.rows<{
      path: string;
      name: string;
      extension: string;
      checksum: string;
      content: string;
      tags_json: string;
      tag_parts_json: string;
      tag_hierarchy_json: string;
      metadata_text: string;
    }>(
      `SELECT path, name, extension, checksum, content, tags_json, tag_parts_json, tag_hierarchy_json, metadata_text
       FROM search_docs
       ORDER BY path`,
    );
    if (!docs.length) {
      return;
    }

    const chunkRows = this.rows<{
      path: string;
      chunk_id: string;
      ordinal: number;
      start_offset: number;
      end_offset: number;
      heading: string | null;
      kind: SearchDocumentChunk["kind"];
      text: string;
      embedding_json: string | null;
    }>(
      `SELECT path, chunk_id, ordinal, start_offset, end_offset, heading, kind, text, embedding_json
       FROM search_chunks
       ORDER BY path, ordinal`,
    );

    const chunksByPath = new Map<string, SearchDocumentChunk[]>();
    for (const row of chunkRows) {
      const chunks = chunksByPath.get(row.path) ?? [];
      chunks.push({
        id: row.chunk_id,
        startOffset: Number(row.start_offset),
        endOffset: Number(row.end_offset),
        heading: row.heading ?? undefined,
        kind: row.kind ?? "fallback",
        text: row.text,
        embedding: parse(row.embedding_json) ?? undefined,
      });
      chunksByPath.set(row.path, chunks);
    }

    this.searchDocs = new Map(
      docs.map((row) => [
        row.path,
        {
          path: row.path,
          name: row.name,
          extension: row.extension,
          checksum: row.checksum,
          content: row.content,
          tags: parse<string[]>(row.tags_json) ?? [],
          tagParts: parse<string[]>(row.tag_parts_json) ?? [],
          tagHierarchy: parse<string[]>(row.tag_hierarchy_json) ?? [],
          metadataText: row.metadata_text,
          chunks: chunksByPath.get(row.path) ?? [],
        },
      ]),
    );
  }

  private exec(sql: string, bind?: Record<string, unknown>): void {
    if (!this.db) return;
    this.db.exec({
      sql,
      bind: normalizeBindParameters(bind),
      returnValue: "this",
    });
  }

  private rows<T extends Record<string, unknown>>(
    sql: string,
    bind?: Record<string, unknown>,
  ): T[] {
    if (!this.db) return [];
    return this.db.exec({
      sql,
      bind: normalizeBindParameters(bind),
      rowMode: "object",
      returnValue: "resultRows",
    }) as T[];
  }

  private setJson(key: string, value: unknown): void {
    this.exec(
      `INSERT INTO schema_meta (key, value)
       VALUES (:metaKey, :jsonValue)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      { metaKey: key, jsonValue: json(value) },
    );
  }

  private getJson<T>(key: string): T | null {
    const [row] = this.rows<{ value: string }>(
      `SELECT value FROM schema_meta WHERE key = :metaKey`,
      { metaKey: key },
    );
    return parse<T>(row?.value);
  }

  private persistState(): void {
    if (!this.db) return;
    this.setJson("app.state", this.toState());
  }

  private async openDatabase(): Promise<void> {
    const sqliteModule = await import("@dao-xyz/sqlite3-vec/wasm");
    const initSqlite = sqliteModule.default as unknown as SqliteWasmInit;
    const sqlite3 = await initSqlite();
    const probeDb = new sqlite3.oo1.DB(":memory:");
    try {
      const [row] = probeDb.exec({
        sql: "SELECT vec_version() AS version",
        rowMode: "object",
        returnValue: "resultRows",
      }) as Array<{ version?: string }>;
      if (!row?.version) {
        throw new Error("sqlite-vec runtime loaded without vec_version()");
      }
    } finally {
      probeDb.close();
    }

    let pool: OpfsPoolUtil | null = null;
    try {
      pool = (await sqlite3.installOpfsSAHPoolVfs({
        name: this.vfsName(),
        directory: this.directoryName(),
      })) as OpfsPoolUtil;

      this.db = new pool.OpfsSAHPoolDb(this.filename()) as SqliteDb;
      this.exec(SQLITE_APP_DATABASE_SCHEMA);
      this.opened = true;
      const state = this.getJson<AppDatabaseState>("app.state");
      if (state) {
        this.fromState(state);
      }
      await this.migrate();
      this.loadFileHistoryFromTables();
      this.loadSearchDocumentsFromTables();
      this.rebuildSearchVectorIndexFromState();
      await this.ensureSearchIndexReady();
    } catch (error) {
      this.db?.close();
      this.db = null;
      this.opened = false;
      if (pool) {
        await this.removeInstalledPool(pool).catch(() => undefined);
      }
      throw error;
    }
  }

  private filename(): string {
    return this.options.filename ?? "/app-state.sqlite3";
  }

  private vfsName(): string {
    return this.options.vfsName ?? `lapis-${safeName(this.vaultId)}`;
  }

  private directoryName(): string {
    return (
      this.options.directory ?? `.lapis-notes-appdb-${safeName(this.vaultId)}`
    );
  }

  private async resetMalformedDatabase(): Promise<boolean> {
    this.db?.close();
    this.db = null;
    this.opened = false;

    if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) {
      return false;
    }

    try {
      await Promise.all([
        removeOpfsEntry(this.filename()),
        removeOpfsEntry(this.directoryName()),
      ]);
      return true;
    } catch (error) {
      console.warn("Failed to reset malformed SQLite OPFS app database", error);
      return false;
    }
  }

  private async removeInstalledPool(pool: OpfsPoolUtil): Promise<void> {
    if (typeof pool.removeVfs !== "function") {
      return;
    }

    try {
      await pool.removeVfs();
    } catch (error) {
      console.warn("Failed to remove corrupted SQLite OPFS pool", error);
    }
  }
}

async function removeOpfsEntry(path: string): Promise<void> {
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) {
    return;
  }

  let directory = await navigator.storage.getDirectory();
  for (const segment of segments.slice(0, -1)) {
    try {
      directory = await directory.getDirectoryHandle(segment);
    } catch (error) {
      if (isNotFoundError(error)) {
        return;
      }
      throw error;
    }
  }
  try {
    await directory.removeEntry(segments[segments.length - 1], {
      recursive: true,
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return;
    }
    throw error;
  }
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "NotFoundError"
    : String(error).includes("NotFoundError");
}
