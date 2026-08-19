import { collectSearchQueryTerms } from "../search-query";
import {
  EMPTY_APP_DATABASE_CAPABILITIES,
  MemoryAppDatabase,
  type AppDatabase,
  type AppDatabaseDescriptor,
  type AppDatabaseIndexedFile,
  type AppDatabaseKind,
  type AppDatabaseOpenContext,
  type AppDatabaseProvider,
  type AppDatabaseSearchOptions,
  type AppDatabaseSearchResult,
  type AppDatabaseState,
  type AppDatabaseStoreFileHistoryRevisionInput,
  type AppDatabaseStoreFileHistoryRevisionResult,
  type MetadataCacheSnapshot,
  type SearchDocumentRecord,
  type SearchEmbeddingProviderConfig,
} from "./app-database";
import type {
  AppDatabaseTaskQuery,
  AppDatabaseTaskRecord,
} from "./task-projection";
import { isStructuredSearchQuery } from "./search-query-evaluator";

export interface TursoStatementInput {
  sql: string;
  args?: unknown[] | Record<string, unknown>;
}

export interface TursoConnection {
  exec(sql: string): Promise<void>;
  run(sql: string, ...args: unknown[]): Promise<unknown>;
  get<T extends Record<string, unknown>>(
    sql: string,
    ...args: unknown[]
  ): Promise<T | undefined>;
  all<T extends Record<string, unknown>>(
    sql: string,
    ...args: unknown[]
  ): Promise<T[]>;
  batch(
    statements: Array<string | TursoStatementInput>,
    options?: string,
  ): Promise<unknown>;
  close(): Promise<void>;
}

export type TursoConnectionFactory = () => Promise<TursoConnection>;

function taskRowFromSql(row: Record<string, unknown>): AppDatabaseTaskRecord {
  return {
    documentPath: String(row.document_path ?? ""),
    documentId: String(row.document_id ?? ""),
    kind: row.kind === "task-list" ? "task-list" : "task",
    title: String(row.title ?? ""),
    status: String(row.status ?? "open") as AppDatabaseTaskRecord["status"],
    inbox: Number(row.inbox) === 1,
    startKind: String(row.start_kind ?? "anytime") as AppDatabaseTaskRecord["startKind"],
    startDate: (row.start_date as string | null) ?? null,
    planDate: (row.plan_date as string | null) ?? null,
    planKind: (row.plan_kind as AppDatabaseTaskRecord["planKind"]) ?? null,
    planTime: (row.plan_time as string | null) ?? null,
    durationMinutes:
      row.duration_minutes == null ? null : Number(row.duration_minutes),
    deadline: (row.deadline as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    repeatStrategy: (row.repeat_strategy as string | null) ?? null,
    repeatFrequency: (row.repeat_frequency as string | null) ?? null,
    repeatInterval:
      row.repeat_interval == null ? null : Number(row.repeat_interval),
    repeatAnchor: (row.repeat_anchor as string | null) ?? null,
    checklistTotal: Number(row.checklist_total ?? 0),
    checklistCompleted: Number(row.checklist_completed ?? 0),
    commentCount: Number(row.comment_count ?? 0),
    projectionVersion: Number(row.projection_version ?? 1),
  };
}

export interface TursoAppDatabaseOptions {
  kind: Extract<AppDatabaseKind, "turso-native" | "turso-wasm">;
  providerId?: string;
  transport: AppDatabaseDescriptor["transport"];
  role?: AppDatabaseDescriptor["role"];
  crossTabCoordination?: boolean;
  connectionFactory: TursoConnectionFactory;
}

export const TURSO_APP_DATABASE_SCHEMA_VERSION = 1;

export const TURSO_APP_DATABASE_SCHEMA = `
CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS files (
  path TEXT PRIMARY KEY,
  normalized_path TEXT NOT NULL,
  extension TEXT NOT NULL,
  mtime INTEGER NOT NULL,
  size INTEGER NOT NULL,
  hash TEXT NOT NULL,
  indexed INTEGER NOT NULL,
  deleted INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS metadata (
  path TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  data_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS links (
  source_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  PRIMARY KEY (source_path, ordinal)
);
CREATE TABLE IF NOT EXISTS tags (
  path TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  PRIMARY KEY (path, ordinal)
);
CREATE TABLE IF NOT EXISTS properties (
  path TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  PRIMARY KEY (path, ordinal)
);
CREATE TABLE IF NOT EXISTS tasks (
  document_path TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  inbox INTEGER NOT NULL DEFAULT 0,
  start_kind TEXT NOT NULL,
  start_date TEXT,
  plan_date TEXT,
  plan_kind TEXT,
  plan_time TEXT,
  duration_minutes INTEGER,
  deadline TEXT,
  completed_at TEXT,
  repeat_strategy TEXT,
  repeat_frequency TEXT,
  repeat_interval INTEGER,
  repeat_anchor TEXT,
  checklist_total INTEGER NOT NULL DEFAULT 0,
  checklist_completed INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  projection_version INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tasks_open_plan ON tasks(status, plan_date);
CREATE INDEX IF NOT EXISTS tasks_open_deadline ON tasks(status, deadline);
CREATE INDEX IF NOT EXISTS tasks_open_start ON tasks(status, start_kind, start_date);
CREATE INDEX IF NOT EXISTS tasks_inbox ON tasks(status, inbox);
CREATE TABLE IF NOT EXISTS history_files (
  file_id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS history_revisions (
  file_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  PRIMARY KEY (file_id, ordinal)
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS search_docs (
  path TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  extension TEXT NOT NULL,
  checksum TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL,
  metadata_text TEXT NOT NULL,
  data_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS search_chunks (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  text TEXT NOT NULL,
  embedding_json TEXT,
  embedding BLOB
);
CREATE INDEX IF NOT EXISTS search_chunks_path_idx ON search_chunks(path);
`;

const TURSO_SEARCH_FTS_SCHEMA = `
CREATE INDEX IF NOT EXISTS search_docs_fts ON search_docs USING fts (
  name,
  path,
  content,
  tags,
  metadata_text
) WITH (weights = 'name=2.0,path=1.5,content=1.0,tags=1.5,metadata_text=1.0');
`;

const NOTIFICATIONS_META_KEY = "notifications.records";

function clone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return structuredClone(value);
}

function stableVaultHash(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function tursoWasmDatabasePath(vaultId: string): string {
  return `lapis-app-${stableVaultHash(vaultId)}.turso`;
}

function ftsQueryForTerms(terms: string[]): string {
  return terms
    .map((term) => `"${term.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`)
    .join(" AND ");
}

function statePersistenceStatements(
  state: AppDatabaseState,
  vectorSearch: boolean,
): Array<string | TursoStatementInput> {
  const statements: Array<string | TursoStatementInput> = [
    "DELETE FROM app_meta",
    "DELETE FROM files",
    "DELETE FROM metadata",
    "DELETE FROM links",
    "DELETE FROM tags",
    "DELETE FROM properties",
    "DELETE FROM tasks",
    "DELETE FROM history_files",
    "DELETE FROM history_revisions",
    "DELETE FROM notifications",
    "DELETE FROM search_chunks",
    "DELETE FROM search_docs",
    {
      sql: `INSERT INTO app_state (id, state_json) VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json`,
      args: [JSON.stringify(state)],
    },
  ];

  for (const [key, value] of Object.entries(state.meta)) {
    statements.push({
      sql: "INSERT INTO app_meta (key, value_json) VALUES (?, ?)",
      args: [key, JSON.stringify(value)],
    });
  }
  for (const file of state.files) {
    statements.push({
      sql: `INSERT INTO files
            (path, normalized_path, extension, mtime, size, hash, indexed, deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        file.path,
        file.normalizedPath,
        file.extension,
        file.mtime,
        file.size,
        file.hash,
        file.indexed ? 1 : 0,
        file.deleted ? 1 : 0,
      ],
    });
  }
  for (const entry of state.metadata) {
    statements.push({
      sql: `INSERT INTO metadata (path, hash, parser_version, data_json)
            VALUES (?, ?, ?, ?)`,
      args: [
        entry.path,
        entry.hash,
        entry.parserVersion,
        JSON.stringify(entry.metadata),
      ],
    });
  }
  for (const [path, entries] of state.links) {
    entries.forEach((entry, ordinal) => {
      statements.push({
        sql: "INSERT INTO links (source_path, ordinal, data_json) VALUES (?, ?, ?)",
        args: [path, ordinal, JSON.stringify(entry)],
      });
    });
  }
  for (const [path, entries] of state.tags) {
    entries.forEach((entry, ordinal) => {
      statements.push({
        sql: "INSERT INTO tags (path, ordinal, data_json) VALUES (?, ?, ?)",
        args: [path, ordinal, JSON.stringify(entry)],
      });
    });
  }
  for (const [path, entries] of state.properties) {
    entries.forEach((entry, ordinal) => {
      statements.push({
        sql: "INSERT INTO properties (path, ordinal, data_json) VALUES (?, ?, ?)",
        args: [path, ordinal, JSON.stringify(entry)],
      });
    });
  }
  for (const task of state.tasks ?? []) {
    statements.push({
      sql: `INSERT INTO tasks (
              document_path, document_id, kind, title, status, inbox,
              start_kind, start_date, plan_date, plan_kind, plan_time,
              duration_minutes, deadline, completed_at, repeat_strategy,
              repeat_frequency, repeat_interval, repeat_anchor,
              checklist_total, checklist_completed, comment_count,
              projection_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        task.documentPath,
        task.documentId,
        task.kind,
        task.title,
        task.status,
        task.inbox ? 1 : 0,
        task.startKind,
        task.startDate ?? null,
        task.planDate ?? null,
        task.planKind ?? null,
        task.planTime ?? null,
        task.durationMinutes ?? null,
        task.deadline ?? null,
        task.completedAt ?? null,
        task.repeatStrategy ?? null,
        task.repeatFrequency ?? null,
        task.repeatInterval ?? null,
        task.repeatAnchor ?? null,
        task.checklistTotal,
        task.checklistCompleted,
        task.commentCount,
        task.projectionVersion,
      ],
    });
  }
  for (const file of state.historyFiles) {
    statements.push({
      sql: "INSERT INTO history_files (file_id, data_json) VALUES (?, ?)",
      args: [file.fileId, JSON.stringify(file)],
    });
  }
  for (const [fileId, revisions] of state.historyRevisions) {
    revisions.forEach((revision, ordinal) => {
      statements.push({
        sql: `INSERT INTO history_revisions (file_id, ordinal, data_json)
              VALUES (?, ?, ?)`,
        args: [fileId, ordinal, JSON.stringify(revision)],
      });
    });
  }
  const notifications = Array.isArray(state.meta[NOTIFICATIONS_META_KEY])
    ? state.meta[NOTIFICATIONS_META_KEY]
    : [];
  for (const notification of notifications as Array<{ id?: unknown }>) {
    if (typeof notification.id !== "string") continue;
    statements.push({
      sql: "INSERT INTO notifications (id, data_json) VALUES (?, ?)",
      args: [notification.id, JSON.stringify(notification)],
    });
  }
  for (const document of state.searchDocuments) {
    statements.push({
      sql: `INSERT INTO search_docs
            (path, name, extension, checksum, content, tags, metadata_text, data_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        document.path,
        document.name,
        document.extension,
        document.checksum,
        document.content,
        document.tags.join(" "),
        document.metadataText ?? "",
        JSON.stringify(document),
      ],
    });
    for (const chunk of document.chunks ?? []) {
      const vector = chunk.embedding?.vector;
      statements.push({
        sql:
          vectorSearch && vector?.length
            ? `INSERT INTO search_chunks
               (id, path, text, embedding_json, embedding)
               VALUES (?, ?, ?, ?, vector32(?))`
            : `INSERT INTO search_chunks
               (id, path, text, embedding_json, embedding)
               VALUES (?, ?, ?, ?, NULL)`,
        args:
          vectorSearch && vector?.length
            ? [
                chunk.id,
                document.path,
                chunk.text,
                JSON.stringify(chunk.embedding ?? null),
                JSON.stringify(vector),
              ]
            : [
                chunk.id,
                document.path,
                chunk.text,
                JSON.stringify(chunk.embedding ?? null),
              ],
      });
    }
  }

  statements.push({
    sql: `INSERT INTO schema_meta (key, value) VALUES ('schema.version', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [String(TURSO_APP_DATABASE_SCHEMA_VERSION)],
  });
  return statements;
}

export class TursoAppDatabase extends MemoryAppDatabase {
  override readonly kind: Extract<
    AppDatabaseKind,
    "turso-native" | "turso-wasm"
  >;

  private connection: TursoConnection | null = null;
  private opened = false;
  private indexingBatchDepth = 0;
  private indexingBatchDirty = false;
  private nativeFullTextSearch = false;
  private nativeVectorSearch = false;

  constructor(
    vaultId: string,
    private readonly options: TursoAppDatabaseOptions,
  ) {
    super(vaultId);
    this.kind = options.kind;
  }

  override get descriptor(): AppDatabaseDescriptor {
    return {
      providerId: this.options.providerId ?? "turso-local",
      engine: "turso",
      transport: this.options.transport,
      role: this.options.role ?? "direct",
      storageMode: "local",
      capabilities: {
        ...EMPTY_APP_DATABASE_CAPABILITIES,
        nativeFullTextSearch: this.nativeFullTextSearch,
        vectorSearch: this.nativeVectorSearch,
        localEmbeddings: true,
        crossTabCoordination: this.options.crossTabCoordination ?? false,
      },
    };
  }

  override async open(): Promise<void> {
    if (this.opened) return;
    this.connection = await this.options.connectionFactory();
    await this.migrate();
    const row = await this.connection.get<{ state_json: string }>(
      "SELECT state_json FROM app_state WHERE id = 1",
    );
    if (row?.state_json) {
      this.fromState(JSON.parse(row.state_json) as AppDatabaseState);
    } else {
      await super.migrate();
      await this.persist();
    }
    this.opened = true;
  }

  override async migrate(): Promise<void> {
    const connection = this.requireConnection();
    await connection.exec(TURSO_APP_DATABASE_SCHEMA);
    try {
      await connection.exec(TURSO_SEARCH_FTS_SCHEMA);
      await connection.get(
        "SELECT fts_match(name, path, content, tags, metadata_text, '') AS matched FROM search_docs LIMIT 1",
      );
      this.nativeFullTextSearch = true;
    } catch {
      this.nativeFullTextSearch = false;
    }
    try {
      const row = await connection.get<{ distance: number }>(
        "SELECT vector_distance_cos(vector32('[1,0]'), vector32('[1,0]')) AS distance",
      );
      this.nativeVectorSearch = Math.abs(Number(row?.distance)) < 0.000001;
    } catch {
      this.nativeVectorSearch = false;
    }
  }

  override async close(): Promise<void> {
    if (!this.connection) {
      await super.close();
      return;
    }
    try {
      if (this.indexingBatchDirty) {
        this.indexingBatchDirty = false;
        await this.persist();
      }
      const connection = this.connection;
      this.connection = null;
      this.opened = false;
      await connection.close();
    } finally {
      await super.close();
    }
  }

  override async beginSearchIndexingBatch(): Promise<void> {
    this.indexingBatchDepth += 1;
  }

  override async endSearchIndexingBatch(): Promise<void> {
    if (this.indexingBatchDepth === 0) return;
    this.indexingBatchDepth -= 1;
    if (this.indexingBatchDepth === 0 && this.indexingBatchDirty) {
      this.indexingBatchDirty = false;
      await this.persist();
    }
  }

  override async configureSearchEmbeddingProvider(
    provider: SearchEmbeddingProviderConfig | null,
  ): Promise<void> {
    await super.configureSearchEmbeddingProvider(provider);
    await this.persistOrDefer();
  }

  override async setMeta(key: string, value: unknown): Promise<void> {
    await super.setMeta(key, value);
    await this.persistOrDefer();
  }

  override async deleteNotebookState(sourcePath: string): Promise<void> {
    await super.deleteNotebookState(sourcePath);
    await this.persistOrDefer();
  }

  override async saveMetadataSnapshot(
    snapshot: MetadataCacheSnapshot,
  ): Promise<void> {
    await super.saveMetadataSnapshot(snapshot);
    await this.persistOrDefer();
  }

  override async storeFileHistoryRevision(
    input: AppDatabaseStoreFileHistoryRevisionInput,
  ): Promise<AppDatabaseStoreFileHistoryRevisionResult> {
    const result = await super.storeFileHistoryRevision(input);
    if (result.stored) await this.persistOrDefer();
    return result;
  }

  override async upsertIndexedFile(
    record: AppDatabaseIndexedFile,
  ): Promise<void> {
    await super.upsertIndexedFile(record);
    await this.persistOrDefer();
  }

  override async upsertTaskProjection(
    record: AppDatabaseTaskRecord,
  ): Promise<void> {
    await super.upsertTaskProjection(record);
    await this.persistOrDefer();
  }

  override async deleteTaskProjection(path: string): Promise<void> {
    await super.deleteTaskProjection(path);
    await this.persistOrDefer();
  }

  override async queryTasks(
    query: AppDatabaseTaskQuery = {},
  ): Promise<AppDatabaseTaskRecord[]> {
    const connection = this.connection;
    if (!connection) return super.queryTasks(query);
    const clauses: string[] = [];
    const args: unknown[] = [];
    if (query.documentPath) {
      clauses.push("document_path = ?");
      args.push(query.documentPath);
    }
    if (query.documentId) {
      clauses.push("document_id = ?");
      args.push(query.documentId);
    }
    if (query.kind) {
      clauses.push("kind = ?");
      args.push(query.kind);
    }
    const today = query.today ?? new Date().toISOString().slice(0, 10);
    if (query.view === "inbox") {
      clauses.push("kind = 'task' AND status = 'open' AND inbox = 1");
    } else if (query.view === "today") {
      clauses.push(
        "kind = 'task' AND status = 'open' AND (plan_date <= ? OR deadline <= ?)",
      );
      args.push(today, today);
    } else if (query.view === "anytime") {
      clauses.push(
        "kind = 'task' AND status = 'open' AND plan_date IS NULL AND (start_kind = 'anytime' OR (start_kind = 'date' AND start_date <= ?))",
      );
      args.push(today);
    } else if (query.view === "upcoming") {
      clauses.push(
        "kind = 'task' AND status = 'open' AND (start_date > ? OR plan_date > ? OR deadline > ?)",
      );
      args.push(today, today, today);
    } else if (query.view === "someday") {
      clauses.push("kind = 'task' AND status = 'open' AND start_kind = 'someday'");
    } else if (query.view === "completed") {
      clauses.push("status = 'completed'");
    } else if (query.view === "review") {
      clauses.push("kind = 'task' AND status = 'open' AND plan_date < ?");
      args.push(today);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = query.limit ? `LIMIT ${Number(query.limit)}` : "";
    const rows = await connection.all<Record<string, unknown>>(
      `SELECT * FROM tasks ${where} ${limit}`.trim(),
      ...args,
    );
    return rows.map(taskRowFromSql);
  }

  override async deleteIndexedFile(path: string): Promise<void> {
    await super.deleteIndexedFile(path);
    await this.persistOrDefer();
  }

  override async renameIndexedFile(
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    await super.renameIndexedFile(oldPath, newPath);
    await this.persistOrDefer();
  }

  override async upsertSearchDocument(
    document: SearchDocumentRecord,
  ): Promise<void> {
    await super.upsertSearchDocument(document);
    await this.persistOrDefer();
  }

  override async deleteSearchDocument(path: string): Promise<void> {
    await super.deleteSearchDocument(path);
    await this.persistOrDefer();
  }

  override async rebuildSearchIndex(): Promise<void> {
    const documents = await this.listSearchDocuments();
    for (const document of documents) {
      await super.upsertSearchDocument(document);
    }
    await super.rebuildSearchIndex();
    await this.persistOrDefer();
  }

  override async searchDocuments(
    query: string,
    options: AppDatabaseSearchOptions = {},
  ): Promise<AppDatabaseSearchResult[]> {
    const requestedMode = options.mode ?? "auto";
    const allPathsRequired =
      options.caseSensitive ||
      isStructuredSearchQuery(query) ||
      Boolean(options.sourceProviderIds?.length) ||
      Boolean(options.pathPrefix);
    if (allPathsRequired) {
      return this.searchDocumentsForPaths(
        query,
        options,
        await this.queryAllSearchPaths(options.limit),
      );
    }

    const candidates = new Set<string>();
    const includesLexical = requestedMode !== "vector";
    const includesVector =
      requestedMode !== "lexical" &&
      this.nativeVectorSearch &&
      Boolean(this.searchEmbeddingProvider);

    if (includesLexical) {
      for (const path of await this.queryLexicalPaths(query, options.limit)) {
        candidates.add(path);
      }
    }
    if (includesVector) {
      const queryVector = await this.safeEmbedQuery(query);
      if (queryVector) {
        for (const path of await this.queryVectorPaths(
          queryVector,
          options.limit,
        )) {
          candidates.add(path);
        }
      }
    }

    if (requestedMode === "vector" && !includesVector) return [];
    return this.searchDocumentsForPaths(query, options, candidates);
  }

  private async queryAllSearchPaths(limit = 100): Promise<string[]> {
    const rows = await this.requireConnection().all<{ path: string }>(
      "SELECT path FROM search_docs ORDER BY path LIMIT ?",
      Math.max(limit, this.searchDocs.size),
    );
    return rows.map((row) => row.path);
  }

  private async queryLexicalPaths(
    query: string,
    limit = 100,
  ): Promise<string[]> {
    const terms = collectSearchQueryTerms(query);
    if (!terms.length || !this.nativeFullTextSearch) {
      return this.queryAllSearchPaths(limit);
    }
    const ftsQuery = ftsQueryForTerms(terms);
    const rows = await this.requireConnection().all<{ path: string }>(
      `SELECT path,
              fts_score(name, path, content, tags, metadata_text, ?) AS score
       FROM search_docs
       WHERE fts_match(name, path, content, tags, metadata_text, ?)
       ORDER BY score ASC
       LIMIT ?`,
      ftsQuery,
      ftsQuery,
      limit,
    );
    return rows.map((row) => row.path);
  }

  private async queryVectorPaths(
    queryVector: number[],
    limit = 100,
  ): Promise<string[]> {
    const rows = await this.requireConnection().all<{ path: string }>(
      `SELECT path,
              vector_distance_cos(embedding, vector32(?)) AS distance
       FROM search_chunks
       WHERE embedding IS NOT NULL
       ORDER BY distance ASC
       LIMIT ?`,
      JSON.stringify(queryVector),
      limit,
    );
    return [...new Set(rows.map((row) => row.path))];
  }

  private async persistOrDefer(): Promise<void> {
    if (this.indexingBatchDepth > 0) {
      this.indexingBatchDirty = true;
      return;
    }
    await this.persist();
  }

  private async persist(): Promise<void> {
    const connection = this.requireConnection();
    await connection.batch(
      statePersistenceStatements(this.toState(), this.nativeVectorSearch),
      "immediate",
    );
  }

  private requireConnection(): TursoConnection {
    if (!this.connection) throw new Error("Turso app database is not open");
    return this.connection;
  }
}

export function canUseTursoWasmDatabase(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.storage?.getDirectory === "function" &&
    typeof SharedArrayBuffer !== "undefined" &&
    typeof Atomics !== "undefined" &&
    globalThis.crossOriginIsolated === true
  );
}

export async function createTursoWasmConnection(
  path: string,
): Promise<TursoConnection> {
  // The public bundle export embeds the WASM worker, which also works from
  // non-HTTP application schemes. Version 0.7.2 does not publish declarations
  // for this export, so keep the untyped module at this narrow driver edge.
  const { connect } = (await import(
    "@tursodatabase/database-wasm/bundle" as string
  )) as {
    connect(
      databasePath: string,
      options?: { experimental?: string[] },
    ): Promise<TursoConnection>;
  };
  return (await connect(path, {
    experimental: ["index_method"],
  })) as TursoConnection;
}

export class TursoWasmAppDatabaseProvider implements AppDatabaseProvider {
  readonly id = "turso-wasm-local";

  canOpen(context: AppDatabaseOpenContext): boolean {
    return context.runtime !== "test" && canUseTursoWasmDatabase();
  }

  async open(context: AppDatabaseOpenContext): Promise<AppDatabase> {
    if (!(await this.canOpen(context))) {
      throw new Error("Turso WASM requires OPFS and cross-origin isolation");
    }
    const database = new TursoAppDatabase(context.vaultId, {
      kind: "turso-wasm",
      providerId: this.id,
      transport: "wasm-worker",
      role: context.role,
      crossTabCoordination: context.runtime === "web-pwa",
      connectionFactory: () =>
        createTursoWasmConnection(tursoWasmDatabasePath(context.vaultId)),
    });
    await database.open();
    return database;
  }
}
