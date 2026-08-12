import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  app,
  BrowserWindow,
  ipcMain as electronIpcMain,
  dialog,
  Menu,
  shell,
  protocol,
  net,
  Notification,
  nativeImage,
  nativeTheme,
} from "electron";
import type {
  BrowserWindowConstructorOptions,
  IpcMainInvokeEvent,
  WebContents,
} from "electron";
import chokidar from "chokidar";
import type { SearchDocumentRecord } from "@lapis-notes/api";
import { LanguageServiceSidecarManager } from "./language-service-sidecar";
import { ensureLanguageServiceIpc } from "./language-service-desktop-ipc";
import { ElectronPluginCapabilityBroker } from "./plugin-capability-broker";
import { PluginSidecarManager } from "./plugin-sidecar";
import {
  makeFsError,
  normalizeRootPath,
  normalizeSeparators,
  normalizeVaultPath,
  resolveAbsolutePath,
} from "./native-paths";

const VAULT_RESOURCE_SCHEME = "lapis-vault-resource";
const PLUGIN_ASSET_SCHEME = "lapis-plugin";
const APP_URL_SCHEMES = ["lapis", "lapis-notes"] as const;
const SEARCH_VECTOR_TABLE = "search_vec_chunks";
const SEARCH_VECTOR_DIMENSIONS_KEY = "search.vector.dimensions";
const SQLITE_VEC_ENTRY_POINTS = [
  "sqlite3_extension_init",
  "sqlite3_sqlitevec_init",
  "sqlite3_vec_init",
];

type NativeVectorCapability =
  | { status: "unknown" }
  | { status: "available"; extensionPath: string; version: string }
  | { status: "unavailable"; reason: string; extensionPath?: string };

type NativeVectorSearchResult =
  | {
      available: true;
      candidates: Array<{
        path: string;
        score: number;
        matchedChunkIds: string[];
      }>;
    }
  | { available: false; reason: string };

type DesktopNotificationPayload = {
  id?: unknown;
  title?: unknown;
  message?: unknown;
  severity?: unknown;
  source?: unknown;
};

type PluginAssetFileMetadata = {
  path: string;
  sha256: string;
  size: number;
};

type RegisteredPluginAssetContext = {
  ownerWindowIds: Set<number>;
  vaultId: string;
  pluginId: string;
  version: string;
  rootPath: string;
  pluginsPath: string;
  files: Map<string, PluginAssetFileMetadata>;
};

let nativeVectorCapability: NativeVectorCapability = { status: "unknown" };
const nodeRequire = createRequire(path.join(process.cwd(), "package.json"));
const languageServiceSidecarManager = new LanguageServiceSidecarManager();
const pluginSidecars = new Map<string, PluginSidecarManager>();
const pluginCapabilityBroker = new ElectronPluginCapabilityBroker();
const pendingStartupAppUrls: string[] = [];
const pendingAppUrlsByWindowId = new Map<number, string[]>();
const activeWatchesByWindowId = new Map<
  number,
  Map<string, ActiveDesktopWatch>
>();
const shownNativeNotificationIdsByWindowId = new Map<number, Set<string>>();
const pluginAssetContexts = new Map<string, RegisteredPluginAssetContext>();
const appHostWindowIds = new Set<number>();
const trackedWindowIds = new Set<number>();
const rendererClosePendingWindowIds = new Set<number>();
const rendererCloseReadyWindowIds = new Set<number>();
const rendererCloseTimersByWindowId = new Map<
  number,
  ReturnType<typeof setTimeout>
>();
let appQuitRequested = false;
let ipcHandlersRegistered = false;
const MAX_IPC_PAYLOAD_BYTES = 64 * 1024 * 1024;
const RENDERER_CLOSE_TIMEOUT_MS = 5_000;

function traceRendererClose(message: string): void {
  if (process.env["LAPIS_DESKTOP_TRACE_CLOSE"] === "1") {
    process.stderr.write(`[desktop-close] ${message}\n`);
  }
}

function assertOwnedIpcSender(event: IpcMainInvokeEvent): void {
  const owner = BrowserWindow.fromWebContents(event.sender);
  if (
    !owner ||
    owner.isDestroyed() ||
    !trackedWindowIds.has(owner.id) ||
    event.senderFrame !== event.sender.mainFrame
  ) {
    throw new Error("Rejected desktop IPC from an unowned renderer");
  }
}

type OwnedIpcHandler = (
  event: IpcMainInvokeEvent,
  ...args: any[]
) => unknown | Promise<unknown>;

const ipcMain = {
  handle(channel: string, handler: OwnedIpcHandler): void {
    electronIpcMain.handle(channel, async (event, ...args) => {
      assertOwnedIpcSender(event);
      let encoded: string;
      try {
        encoded = JSON.stringify(args);
      } catch {
        throw makeFsError("EINVAL", `${channel}.payload`);
      }
      if (Buffer.byteLength(encoded, "utf8") > MAX_IPC_PAYLOAD_BYTES) {
        throw makeFsError("E2BIG", `${channel}.payload`);
      }
      return handler(event, ...args);
    });
  },
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: VAULT_RESOURCE_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
  {
    scheme: PLUGIN_ASSET_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const APP_DISPLAY_NAME = "Lapis Notes";
const APP_COPYRIGHT = "Copyright © Lapis Notes contributors.";

const configuredUserDataDir =
  process.env["LAPIS_DESKTOP_USER_DATA_DIR"]?.trim();
if (configuredUserDataDir) {
  app.setPath("userData", configuredUserDataDir);
}

app.setName(APP_DISPLAY_NAME);

function isAppUrl(value: string): boolean {
  return APP_URL_SCHEMES.some((scheme) =>
    value.toLowerCase().startsWith(`${scheme}://`),
  );
}

function collectAppUrls(argv: string[]): string[] {
  return argv.filter(isAppUrl);
}

function getFirstAppHostWindow(): BrowserWindow | null {
  for (const windowId of appHostWindowIds) {
    const win = BrowserWindow.fromId(windowId);
    if (win && !win.isDestroyed()) {
      return win;
    }
  }

  return null;
}

function getAppHostWindow(
  preferredWindow?: { id: number } | null,
): BrowserWindow | null {
  if (preferredWindow && appHostWindowIds.has(preferredWindow.id)) {
    const targetWindow = BrowserWindow.fromId(preferredWindow.id);
    if (targetWindow && !targetWindow.isDestroyed()) {
      return targetWindow;
    }
  }

  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow && appHostWindowIds.has(focusedWindow.id)) {
    return focusedWindow;
  }

  return getFirstAppHostWindow();
}

function getPendingAppUrlsForWindow(windowId: number): string[] {
  let pendingUrls = pendingAppUrlsByWindowId.get(windowId);
  if (!pendingUrls) {
    pendingUrls = [];
    pendingAppUrlsByWindowId.set(windowId, pendingUrls);
  }

  return pendingUrls;
}

function notifyAppUrlAvailable(win: BrowserWindow): void {
  if (!win.isDestroyed()) {
    win.webContents.send("desktop_app_url_available");
  }
}

function assignStartupAppUrlsToWindow(win: BrowserWindow): void {
  if (!pendingStartupAppUrls.length) {
    return;
  }

  getPendingAppUrlsForWindow(win.id).push(...pendingStartupAppUrls.splice(0));
  notifyAppUrlAvailable(win);
}

function queueAppUrls(
  urls: string[],
  preferredWindow?: BrowserWindow | null,
): void {
  if (!urls.length) {
    return;
  }

  const targetWindow = getAppHostWindow(preferredWindow);
  if (!targetWindow) {
    pendingStartupAppUrls.push(...urls);
    return;
  }

  getPendingAppUrlsForWindow(targetWindow.id).push(...urls);
  notifyAppUrlAvailable(targetWindow);
}

function takePendingAppUrlsForWindow(win: BrowserWindow): string[] {
  const pendingUrls = pendingAppUrlsByWindowId.get(win.id) ?? [];
  pendingAppUrlsByWindowId.delete(win.id);
  return pendingUrls;
}

function requeuePendingAppUrls(windowId: number): void {
  const pendingUrls = pendingAppUrlsByWindowId.get(windowId);
  pendingAppUrlsByWindowId.delete(windowId);
  if (pendingUrls?.length) {
    queueAppUrls(pendingUrls);
  }
}

function registerAppUrlProtocols(): void {
  for (const scheme of APP_URL_SCHEMES) {
    if (process.defaultApp && process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(scheme, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    } else {
      app.setAsDefaultProtocolClient(scheme);
    }
  }
}

registerAppUrlProtocols();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  queueAppUrls(collectAppUrls(process.argv));

  app.on("second-instance", (_event, argv) => {
    const win = getAppHostWindow();
    queueAppUrls(collectAppUrls(argv), win);
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
    } else if (app.isReady()) {
      createWindow();
    }
  });
}

app.on("open-url", (event, url) => {
  event.preventDefault();
  if (isAppUrl(url)) {
    queueAppUrls([url], getAppHostWindow());
  }
});

function getConfiguredTestVaultPath(): string | null {
  const candidate = process.env["LAPIS_DESKTOP_TEST_VAULT_PATH"]?.trim();
  if (!candidate) {
    return null;
  }

  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) {
    throw makeFsError("ENOENT", candidate);
  }

  return candidate;
}

// ─── Generated-state persistence ─────────────────────────────────────────────

function getStateDir(): string {
  return path.join(app.getPath("userData"), "vault-state");
}

function legacyStateFilePath(vaultId: string): string {
  const safe = Buffer.from(vaultId).toString("base64url");
  return path.join(getStateDir(), `${safe}.json`);
}

function stateDatabasePath(vaultId: string): string {
  const safe = Buffer.from(vaultId).toString("base64url");
  return path.join(getStateDir(), `${safe}.sqlite3`);
}

function stateDatabaseExists(vaultId: string): boolean {
  return fs.existsSync(stateDatabasePath(vaultId));
}

function buildDesktopVaultId(rootPath: string): string {
  return `desktop-folder:${normalizeSeparators(normalizeRootPath(rootPath))}`;
}

function movePathSync(sourcePath: string, targetPath: string): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  try {
    fs.renameSync(sourcePath, targetPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") {
      throw error;
    }

    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      fs.cpSync(sourcePath, targetPath, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
      fs.rmSync(sourcePath, { recursive: true, force: false });
      return;
    }

    fs.copyFileSync(sourcePath, targetPath, fs.constants.COPYFILE_EXCL);
    fs.rmSync(sourcePath, { force: false });
  }
}

function migrateVaultStateFiles(oldVaultId: string, newVaultId: string): void {
  if (!oldVaultId || !newVaultId || oldVaultId === newVaultId) {
    return;
  }

  const moves: Array<{ sourcePath: string; targetPath: string }> = [];
  const databaseSourcePath = stateDatabasePath(oldVaultId);
  if (fs.existsSync(databaseSourcePath)) {
    moves.push({
      sourcePath: databaseSourcePath,
      targetPath: stateDatabasePath(newVaultId),
    });
  }

  const legacySourcePath = legacyStateFilePath(oldVaultId);
  if (fs.existsSync(legacySourcePath)) {
    moves.push({
      sourcePath: legacySourcePath,
      targetPath: legacyStateFilePath(newVaultId),
    });
  }

  const moved: Array<{ sourcePath: string; targetPath: string }> = [];
  try {
    for (const entry of moves) {
      if (fs.existsSync(entry.targetPath)) {
        throw new Error(
          `Generated state already exists for destination vault: ${entry.targetPath}`,
        );
      }
      movePathSync(entry.sourcePath, entry.targetPath);
      moved.push(entry);
    }
  } catch (error) {
    for (const entry of moved.reverse()) {
      if (fs.existsSync(entry.targetPath) && !fs.existsSync(entry.sourcePath)) {
        movePathSync(entry.targetPath, entry.sourcePath);
      }
    }
    throw error;
  }
}

function platformExtensionToken(): string {
  if (process.platform === "linux") {
    return `linux-${process.arch}`;
  }
  return `${process.platform}-${process.arch}`;
}

function nativeExtensionFileExtension(): string {
  if (process.platform === "darwin") {
    return "dylib";
  }
  if (process.platform === "win32") {
    return "dll";
  }
  return "so";
}

function resolveSqliteVecPackageRoot(): string | null {
  try {
    return path.dirname(
      nodeRequire.resolve("@dao-xyz/sqlite3-vec/package.json"),
    );
  } catch {
    return null;
  }
}

function resolveCompatibleVecExtensionPath(): string | null {
  const packageRoot = resolveSqliteVecPackageRoot();
  if (!packageRoot) {
    nativeVectorCapability = {
      status: "unavailable",
      reason: "sqlite-vec package is not installed",
    };
    return null;
  }

  const nativeDir = path.join(packageRoot, "dist", "native");
  const extension = nativeExtensionFileExtension();
  const token = platformExtensionToken().toLowerCase();
  const extensionPath = fs.existsSync(nativeDir)
    ? fs
        .readdirSync(nativeDir)
        .find(
          (entry) =>
            entry.toLowerCase().includes(token) &&
            entry.toLowerCase().endsWith(`.${extension}`),
        )
    : null;

  if (!extensionPath) {
    nativeVectorCapability = {
      status: "unavailable",
      reason: `sqlite-vec native extension does not match ${process.platform}/${process.arch}`,
    };
    return null;
  }

  return path.join(nativeDir, extensionPath);
}

function ensureNativeVec(database: DatabaseSync): boolean {
  if (nativeVectorCapability.status === "unavailable") {
    return false;
  }

  const extensionPath =
    nativeVectorCapability.status === "available"
      ? nativeVectorCapability.extensionPath
      : resolveCompatibleVecExtensionPath();
  if (!extensionPath) {
    return false;
  }

  try {
    database.enableLoadExtension(true);
    let lastError: unknown;
    const loadExtension = database.loadExtension as unknown as (
      path: string,
      entryPoint?: string,
    ) => void;
    for (const entryPoint of SQLITE_VEC_ENTRY_POINTS) {
      try {
        loadExtension(extensionPath, entryPoint);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) {
      loadExtension(extensionPath);
    }
    database.enableLoadExtension(false);

    const row = database.prepare(`SELECT vec_version() AS version`).get() as
      | { version?: string }
      | undefined;
    if (!row?.version) {
      throw new Error("sqlite-vec loaded without vec_version()");
    }

    nativeVectorCapability = {
      status: "available",
      extensionPath,
      version: row.version,
    };
    return true;
  } catch (error) {
    try {
      database.enableLoadExtension(false);
    } catch {
      // Ignore cleanup errors after a failed extension load.
    }
    nativeVectorCapability = {
      status: "unavailable",
      reason: error instanceof Error ? error.message : "sqlite-vec load failed",
      extensionPath,
    };
    return false;
  }
}

function parseJson<T>(value: unknown): T | null {
  if (typeof value !== "string") {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getStateJson<T>(database: DatabaseSync, key: string): T | null {
  const row = database
    .prepare(`SELECT value FROM app_state WHERE key = ?`)
    .get(key) as { value?: string } | undefined;
  return parseJson<T>(row?.value);
}

function setStateJson(
  database: DatabaseSync,
  key: string,
  value: unknown,
): void {
  database
    .prepare(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at`,
    )
    .run(key, json(value), Date.now());
}

function openStateDatabase(vaultId: string): DatabaseSync {
  fs.mkdirSync(getStateDir(), { recursive: true });
  const database = new DatabaseSync(stateDatabasePath(vaultId), {
    allowExtension: true,
  });
  ensureNativeVec(database);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS search_docs (
      path TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      extension TEXT NOT NULL,
      checksum TEXT NOT NULL,
      content TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      tag_parts_json TEXT NOT NULL,
      tag_hierarchy_json TEXT NOT NULL,
      metadata_text TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS search_chunks (
      path TEXT NOT NULL,
      chunk_id TEXT NOT NULL,
      ordinal INTEGER NOT NULL,
      start_offset INTEGER NOT NULL,
      end_offset INTEGER NOT NULL,
      heading TEXT,
      kind TEXT NOT NULL DEFAULT 'fallback',
      text TEXT NOT NULL,
      embedding_json TEXT,
      PRIMARY KEY(path, chunk_id)
    );

    CREATE INDEX IF NOT EXISTS search_chunks_path_idx ON search_chunks(path, ordinal);

    CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
      path UNINDEXED,
      name,
      content,
      tags,
      metadata_text
    );
  `);
  return database;
}

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function normalizeSearchTerms(terms: string[]): string[] {
  return [
    ...new Set(
      terms
        .flatMap(
          (term) =>
            term
              .normalize("NFKC")
              .toLowerCase()
              .match(/[\p{L}\p{N}]+/gu) ?? [],
        )
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length > 0),
    ),
  ];
}

function toFtsPrefixQuery(terms: string[]): string {
  return normalizeSearchTerms(terms)
    .map((term) => `"${term.replace(/"/gu, '""')}"*`)
    .join(" AND ");
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/gu, (match) => `\\${match}`);
}

function readyVectorChunks(document: SearchDocumentRecord) {
  return (document.chunks ?? []).filter((chunk) => {
    const embedding = chunk.embedding;
    return Boolean(
      embedding?.status === "ready" &&
        embedding.vector?.length &&
        Number.isInteger(embedding.dimensions ?? embedding.vector.length),
    );
  });
}

function resetSearchVectorIndex(database: DatabaseSync): void {
  if (!ensureNativeVec(database)) {
    return;
  }
  database.exec(`DROP TABLE IF EXISTS ${SEARCH_VECTOR_TABLE}`);
  setStateJson(database, SEARCH_VECTOR_DIMENSIONS_KEY, null);
}

function ensureSearchVectorTable(
  database: DatabaseSync,
  dimensions: number,
): boolean {
  if (!Number.isInteger(dimensions) || dimensions <= 0) {
    return false;
  }
  if (!ensureNativeVec(database)) {
    return false;
  }

  const existingDimensions = getStateJson<number>(
    database,
    SEARCH_VECTOR_DIMENSIONS_KEY,
  );
  if (existingDimensions === dimensions) {
    return true;
  }

  try {
    database.exec(`DROP TABLE IF EXISTS ${SEARCH_VECTOR_TABLE}`);
    database.exec(
      `CREATE VIRTUAL TABLE IF NOT EXISTS ${SEARCH_VECTOR_TABLE} USING vec0(
        embedding float[${dimensions}] distance_metric=cosine,
        path text,
        chunk_id text
      )`,
    );
    setStateJson(database, SEARCH_VECTOR_DIMENSIONS_KEY, dimensions);
    return true;
  } catch {
    setStateJson(database, SEARCH_VECTOR_DIMENSIONS_KEY, null);
    return false;
  }
}

function deleteSearchVectorEntriesForPath(
  database: DatabaseSync,
  documentPath: string,
): void {
  if (!ensureNativeVec(database)) {
    return;
  }

  try {
    database
      .prepare(`DELETE FROM ${SEARCH_VECTOR_TABLE} WHERE path = ?`)
      .run(documentPath);
  } catch {
    // The vec table may not exist yet or may be unavailable on this host.
  }
}

function upsertSearchVectorEntries(
  database: DatabaseSync,
  document: SearchDocumentRecord,
): void {
  const chunks = readyVectorChunks(document);
  if (!chunks.length) {
    deleteSearchVectorEntriesForPath(database, document.path);
    return;
  }

  const firstEmbedding = chunks[0]?.embedding;
  const dimensions =
    firstEmbedding?.dimensions ?? firstEmbedding?.vector?.length;
  if (!dimensions || !ensureSearchVectorTable(database, dimensions)) {
    return;
  }

  deleteSearchVectorEntriesForPath(database, document.path);
  const insert = database.prepare(
    `INSERT INTO ${SEARCH_VECTOR_TABLE} (embedding, path, chunk_id)
     VALUES (?, ?, ?)`,
  );
  for (const chunk of chunks) {
    const vector = chunk.embedding?.vector ?? [];
    if (vector.length !== dimensions) {
      continue;
    }
    insert.run(
      Buffer.from(new Float32Array(vector).buffer),
      document.path,
      chunk.id,
    );
  }
}

function searchVectorDocuments(
  vaultId: string,
  queryVector: number[],
  limit: number,
): NativeVectorSearchResult {
  const database = openStateDatabase(vaultId);
  try {
    if (!ensureNativeVec(database)) {
      return {
        available: false,
        reason:
          nativeVectorCapability.status === "unavailable"
            ? nativeVectorCapability.reason
            : "sqlite-vec unavailable",
      };
    }

    const dimensions = getStateJson<number>(
      database,
      SEARCH_VECTOR_DIMENSIONS_KEY,
    );
    if (!dimensions || queryVector.length !== dimensions) {
      return { available: false, reason: "vector dimension mismatch" };
    }

    const rows = database
      .prepare(
        `SELECT path, chunk_id, distance
         FROM ${SEARCH_VECTOR_TABLE}
         WHERE embedding MATCH ?
           AND k = ?
         ORDER BY distance
         LIMIT ?`,
      )
      .all(
        Buffer.from(new Float32Array(queryVector).buffer),
        limit,
        limit,
      ) as Array<{ path: string; chunk_id: string; distance: number }>;

    const candidates = new Map<
      string,
      { path: string; score: number; matchedChunkIds: string[] }
    >();
    for (const row of rows) {
      const score = Math.max(0, 1 - Number(row.distance ?? 0));
      const existing = candidates.get(row.path);
      if (!existing || score > existing.score) {
        candidates.set(row.path, {
          path: row.path,
          score,
          matchedChunkIds: [row.chunk_id],
        });
        continue;
      }
      if (!existing.matchedChunkIds.includes(row.chunk_id)) {
        existing.matchedChunkIds.push(row.chunk_id);
      }
    }

    return { available: true, candidates: [...candidates.values()] };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "vector search failed",
    };
  } finally {
    database.close();
  }
}

function persistSearchDocument(
  database: DatabaseSync,
  document: SearchDocumentRecord,
): void {
  database
    .prepare(
      `INSERT INTO search_docs
        (path, name, extension, checksum, content, tags_json, tag_parts_json, tag_hierarchy_json, metadata_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(path) DO UPDATE SET
        name = excluded.name,
        extension = excluded.extension,
        checksum = excluded.checksum,
        content = excluded.content,
        tags_json = excluded.tags_json,
        tag_parts_json = excluded.tag_parts_json,
        tag_hierarchy_json = excluded.tag_hierarchy_json,
        metadata_text = excluded.metadata_text`,
    )
    .run(
      document.path,
      document.name,
      document.extension,
      document.checksum,
      document.content,
      json(document.tags),
      json(document.tagParts),
      json(document.tagHierarchy),
      document.metadataText ?? "",
    );

  database
    .prepare(`DELETE FROM search_chunks WHERE path = ?`)
    .run(document.path);
  const insertChunk = database.prepare(
    `INSERT INTO search_chunks
      (path, chunk_id, ordinal, start_offset, end_offset, heading, kind, text, embedding_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const [ordinal, chunk] of (document.chunks ?? []).entries()) {
    insertChunk.run(
      document.path,
      chunk.id,
      ordinal,
      chunk.startOffset,
      chunk.endOffset,
      chunk.heading ?? null,
      chunk.kind ?? "fallback",
      chunk.text,
      json(chunk.embedding ?? null),
    );
  }

  database.prepare(`DELETE FROM search_fts WHERE path = ?`).run(document.path);
  database
    .prepare(
      `INSERT INTO search_fts (path, name, content, tags, metadata_text)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      document.path,
      document.name,
      document.content,
      document.tags.join(" "),
      document.metadataText ?? "",
    );
  upsertSearchVectorEntries(database, document);
}

function replaceSearchDocuments(
  vaultId: string,
  documents: SearchDocumentRecord[],
): void {
  const database = openStateDatabase(vaultId);
  try {
    database.exec("BEGIN");
    database.exec("DELETE FROM search_chunks");
    database.exec("DELETE FROM search_docs");
    database.exec("DELETE FROM search_fts");
    resetSearchVectorIndex(database);
    for (const document of documents) {
      persistSearchDocument(database, document);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.close();
  }
}

function upsertSearchDocument(
  vaultId: string,
  document: SearchDocumentRecord,
): void {
  const database = openStateDatabase(vaultId);
  try {
    persistSearchDocument(database, document);
  } finally {
    database.close();
  }
}

function deleteSearchDocument(vaultId: string, documentPath: string): void {
  const database = openStateDatabase(vaultId);
  try {
    database
      .prepare(`DELETE FROM search_chunks WHERE path = ?`)
      .run(documentPath);
    database
      .prepare(`DELETE FROM search_docs WHERE path = ?`)
      .run(documentPath);
    database.prepare(`DELETE FROM search_fts WHERE path = ?`).run(documentPath);
    deleteSearchVectorEntriesForPath(database, documentPath);
  } finally {
    database.close();
  }
}

function searchDocuments(
  vaultId: string,
  terms: string[],
  limit: number,
): Array<{ path: string; rank: number }> {
  const normalizedTerms = normalizeSearchTerms(terms);
  if (!normalizedTerms.length) {
    return [];
  }

  const database = openStateDatabase(vaultId);
  try {
    const candidates = new Map<string, number>();
    const ftsQuery = toFtsPrefixQuery(normalizedTerms);
    if (ftsQuery) {
      try {
        const rows = database
          .prepare(
            `WITH fts_candidates AS (
               SELECT path, bm25(search_fts) AS rank
               FROM search_fts
               WHERE search_fts MATCH ?
             )
             SELECT path, rank
             FROM fts_candidates
             ORDER BY rank, path
             LIMIT ?`,
          )
          .all(ftsQuery, limit) as Array<{ path: string; rank: number }>;
        for (const row of rows) {
          candidates.set(row.path, Number(row.rank ?? 0));
        }
      } catch {
        candidates.clear();
      }
    }

    const clauses = normalizedTerms.map(
      () => `(lower(path) LIKE ? ESCAPE '\\'
        OR lower(name) LIKE ? ESCAPE '\\'
        OR lower(content) LIKE ? ESCAPE '\\'
        OR lower(tags_json) LIKE ? ESCAPE '\\'
        OR lower(metadata_text) LIKE ? ESCAPE '\\')`,
    );
    const values = normalizedTerms.flatMap((term) => {
      const like = `%${escapeLike(term)}%`;
      return [like, like, like, like, like];
    });
    const rows = database
      .prepare(
        `SELECT path
         FROM search_docs
         WHERE ${clauses.join(" AND ")}
        ORDER BY lower(path)
         LIMIT ?`,
      )
      .all(...values, limit) as Array<{ path: string }>;
    for (const [index, row] of rows.entries()) {
      candidates.set(row.path, candidates.get(row.path) ?? index + 1);
    }

    return [...candidates.entries()]
      .sort((left, right) => left[1] - right[1])
      .slice(0, limit)
      .map(([path, rank]) => ({ path, rank }));
  } finally {
    database.close();
  }
}

function normalizePluginSidecarContextId(contextId: unknown): string {
  return typeof contextId === "string" && contextId.trim()
    ? contextId.trim()
    : "default";
}

function readPluginSidecarContextId(payload: unknown): string {
  return normalizePluginSidecarContextId(
    typeof payload === "object" && payload !== null
      ? (payload as { contextId?: unknown }).contextId
      : undefined,
  );
}

function readPluginSidecarPluginId(payload: unknown): string {
  const pluginId =
    typeof payload === "object" && payload !== null
      ? (payload as { pluginId?: unknown }).pluginId
      : undefined;
  return typeof pluginId === "string" && pluginId.trim()
    ? pluginId.trim()
    : "shared";
}

function pluginSidecarKey(contextId: unknown, pluginId: unknown): string {
  return `${normalizePluginSidecarContextId(contextId)}::${
    typeof pluginId === "string" && pluginId.trim() ? pluginId.trim() : "shared"
  }`;
}

function getPluginSidecar(payload: unknown): PluginSidecarManager {
  const key = pluginSidecarKey(
    readPluginSidecarContextId(payload),
    readPluginSidecarPluginId(payload),
  );
  const existing = pluginSidecars.get(key);
  if (existing) {
    return existing;
  }

  const sidecar = new PluginSidecarManager(pluginCapabilityBroker, key);
  pluginSidecars.set(key, sidecar);
  return sidecar;
}

async function shutdownPluginSidecar(payload: unknown): Promise<void> {
  const contextId = readPluginSidecarContextId(payload);
  const pluginId = readPluginSidecarPluginId(payload);
  if (pluginId === "shared") {
    const entries = [...pluginSidecars.entries()].filter(([key]) =>
      key.startsWith(`${contextId}::`),
    );
    for (const [key] of entries) {
      pluginSidecars.delete(key);
    }
    pluginCapabilityBroker.deleteContext(contextId);
    await Promise.all(entries.map(([, sidecar]) => sidecar.shutdown()));
    return;
  }

  const key = pluginSidecarKey(contextId, pluginId);
  const sidecar = pluginSidecars.get(key);
  pluginSidecars.delete(key);
  await sidecar?.shutdown();
}

async function shutdownPluginSidecars(): Promise<void> {
  const entries = [...pluginSidecars.entries()];
  pluginSidecars.clear();
  for (const [key] of entries) {
    pluginCapabilityBroker.deleteContext(key.split("::", 1)[0] ?? key);
  }
  await Promise.all(entries.map(([, sidecar]) => sidecar.shutdown()));
}

function saveStateJson(vaultId: string, stateJson: string): void {
  const database = openStateDatabase(vaultId);
  try {
    database
      .prepare(
        `INSERT INTO app_state (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at`,
      )
      .run("state", stateJson, Date.now());
  } finally {
    database.close();
  }
}

function loadStateJson(vaultId: string): string | null {
  if (stateDatabaseExists(vaultId)) {
    const database = openStateDatabase(vaultId);
    try {
      const row = database
        .prepare(`SELECT value FROM app_state WHERE key = ?`)
        .get("state") as { value?: string } | undefined;
      if (typeof row?.value === "string") {
        return row.value;
      }
    } finally {
      database.close();
    }
  }

  const legacyPath = legacyStateFilePath(vaultId);
  if (!fs.existsSync(legacyPath)) {
    return null;
  }

  return fs.readFileSync(legacyPath, "utf-8");
}

type DesktopWatchEvent =
  | { type: "create" | "modify" | "delete"; path: string }
  | { type: "error"; path: string; error: string };

type ActiveDesktopWatch = {
  rootPath: string;
  close(): Promise<void>;
};

function toVaultRelativePath(
  rootPath: string,
  absolutePath: string,
): string | null {
  const basePath = normalizeSeparators(normalizeRootPath(rootPath));
  const targetPath = normalizeSeparators(absolutePath);
  if (targetPath === basePath) {
    return "/";
  }
  if (!targetPath.startsWith(`${basePath}/`)) {
    return null;
  }
  return targetPath.slice(basePath.length + 1);
}

function toVaultRelativePathFromAbsolute(
  rootPath: string,
  absolutePath: string,
): string | null {
  const pathModule = rootPath.includes("\\") ? path.win32 : path;
  const basePath = pathModule.resolve(normalizeRootPath(rootPath));
  const targetPath = pathModule.resolve(absolutePath);
  const relativePath = pathModule.relative(basePath, targetPath);
  if (!relativePath) {
    return "/";
  }
  if (relativePath.startsWith("..") || pathModule.isAbsolute(relativePath)) {
    return null;
  }
  return normalizeSeparators(relativePath);
}

function sendWatchEvent(
  win: BrowserWindow,
  watchId: string,
  event: DesktopWatchEvent,
): void {
  if (win.isDestroyed()) {
    return;
  }
  win.webContents.send("desktop_fs_watch_event", { watchId, event });
}

function encodeResourcePart(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeResourcePart(value: string | null, label: string): string {
  if (!value) {
    throw makeFsError("EINVAL", label);
  }
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    throw makeFsError("EINVAL", label);
  }
}

function encodeResourcePath(normalizedPath: string): string {
  const path = normalizeVaultPath(normalizedPath);
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

function decodeResourcePath(pathname: string): string {
  const encoded = pathname.replace(/^\/+/, "");
  if (!encoded) {
    return "";
  }
  return normalizeVaultPath(
    encoded.split("/").map(decodeURIComponent).join("/"),
  );
}

function createVaultResourceUrl(
  rootPath: string,
  normalizedPath: string,
): string {
  const resourcePath = normalizeVaultPath(normalizedPath);
  const absolutePath = resolveAbsolutePath(rootPath, resourcePath);
  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    throw makeFsError("EISDIR", absolutePath);
  }

  const query = new URLSearchParams({
    root: encodeResourcePart(normalizeRootPath(rootPath)),
    mtime: String(Math.trunc(stat.mtimeMs)),
    size: String(stat.size),
  });
  const encodedPath = encodeResourcePath(resourcePath);
  return `${VAULT_RESOURCE_SCHEME}://vault/${encodedPath}?${query.toString()}`;
}

function parseVaultResourceUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  if (
    url.protocol !== `${VAULT_RESOURCE_SCHEME}:` ||
    url.hostname !== "vault"
  ) {
    throw makeFsError("EINVAL", requestUrl);
  }

  const rootPath = decodeResourcePart(url.searchParams.get("root"), "root");
  const resourcePath = decodeResourcePath(url.pathname);
  return resolveAbsolutePath(rootPath, resourcePath);
}

function registerVaultResourceProtocol(): void {
  protocol.handle(VAULT_RESOURCE_SCHEME, async (request) => {
    try {
      const absolutePath = parseVaultResourceUrl(request.url);
      const stat = fs.statSync(absolutePath);
      if (!stat.isFile()) {
        throw makeFsError("EISDIR", absolutePath);
      }
      return net.fetch(pathToFileURL(absolutePath).toString());
    } catch (error) {
      const code = (error as { code?: string }).code;
      const status = code === "ENOENT" || code === "EISDIR" ? 404 : 400;
      return new Response(code ?? "Invalid vault resource", { status });
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(
  value: unknown,
  label: string,
  maxLength = 2_000,
): string {
  if (typeof value !== "string") {
    throw makeFsError("EINVAL", label);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || trimmed.includes("\0")) {
    throw makeFsError("EINVAL", label);
  }
  return trimmed;
}

function normalizePluginAssetSegment(value: unknown, label: string): string {
  const segment = readRequiredString(value, label, 500);
  if (
    segment === "." ||
    segment === ".." ||
    segment.includes("/") ||
    segment.includes("\\")
  ) {
    throw makeFsError("EINVAL", label);
  }
  return segment;
}

function normalizePluginAssetPath(value: unknown): string {
  const rawPath = readRequiredString(value, "plugin asset path", 2_000);
  const candidate = normalizeSeparators(rawPath);
  if (
    candidate.startsWith("/") ||
    candidate.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw makeFsError("EINVAL", rawPath);
  }
  const normalized = path.posix.normalize(candidate);
  if (!normalized || normalized === "." || normalized.startsWith("../")) {
    throw makeFsError("EINVAL", rawPath);
  }
  return normalized;
}

function isSupportedPluginAssetPath(assetPath: string): boolean {
  return /\.(?:mjs|js|cjs|css|json|wasm|svg|png|jpg|jpeg|gif)$/iu.test(
    assetPath,
  );
}

function getPluginAssetContentType(assetPath: string): string | null {
  const lowerPath = assetPath.toLowerCase();
  if (/\.(?:mjs|js|cjs)$/u.test(lowerPath)) {
    return "text/javascript; charset=utf-8";
  }
  if (lowerPath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (lowerPath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  if (lowerPath.endsWith(".wasm")) {
    return "application/wasm";
  }
  if (lowerPath.endsWith(".svg")) {
    return "image/svg+xml";
  }
  if (lowerPath.endsWith(".png")) {
    return "image/png";
  }
  if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerPath.endsWith(".gif")) {
    return "image/gif";
  }
  return null;
}

function pluginAssetContextKey(
  vaultId: string,
  pluginId: string,
  version: string,
): string {
  return `${vaultId}\0${pluginId}\0${version}`;
}

function decodePluginAssetUrlSegment(value: string, label: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw makeFsError("EINVAL", label);
  }
}

function parsePluginAssetRequestUrl(requestUrl: string): {
  vaultId: string;
  pluginId: string;
  version: string;
  sha256: string;
  assetPath: string;
} {
  const url = new URL(requestUrl);
  if (url.protocol !== `${PLUGIN_ASSET_SCHEME}:` || !url.hostname) {
    throw makeFsError("EINVAL", requestUrl);
  }
  const pathParts = url.pathname.replace(/^\/+/, "").split("/");
  const usesPathVaultId = url.hostname === "asset-v1";
  if (pathParts.length < (usesPathVaultId ? 5 : 4)) {
    throw makeFsError("EINVAL", requestUrl);
  }
  const [pathVaultId, pluginId, version, sha256, ...assetPathParts] =
    usesPathVaultId ? pathParts : [url.hostname, ...pathParts];
  const decodedSha256 = decodePluginAssetUrlSegment(
    sha256,
    "plugin asset sha256",
  ).toLowerCase();
  if (!/^[a-f0-9]{64}$/u.test(decodedSha256)) {
    throw makeFsError("EINVAL", "plugin asset sha256");
  }
  return {
    vaultId: decodePluginAssetUrlSegment(pathVaultId, "plugin asset vault"),
    pluginId: normalizePluginAssetSegment(
      decodePluginAssetUrlSegment(pluginId, "plugin asset plugin id"),
      "plugin asset plugin id",
    ),
    version: normalizePluginAssetSegment(
      decodePluginAssetUrlSegment(version, "plugin asset version"),
      "plugin asset version",
    ),
    sha256: decodedSha256,
    assetPath: normalizePluginAssetPath(
      assetPathParts
        .map((part) => decodePluginAssetUrlSegment(part, "plugin asset path"))
        .join("/"),
    ),
  };
}

function parsePluginAssetFiles(
  value: unknown,
): Map<string, PluginAssetFileMetadata> {
  if (!Array.isArray(value)) {
    throw makeFsError("EINVAL", "plugin asset files");
  }

  const files = new Map<string, PluginAssetFileMetadata>();
  for (const file of value) {
    if (!isRecord(file)) {
      throw makeFsError("EINVAL", "plugin asset file");
    }
    const filePath = normalizePluginAssetPath(file.path);
    if (!isSupportedPluginAssetPath(filePath)) {
      continue;
    }
    const size = file.size;
    const sha256 = readRequiredString(file.sha256, "plugin asset sha256", 100);
    if (
      typeof size !== "number" ||
      !Number.isSafeInteger(size) ||
      size < 0 ||
      !/^[a-f0-9]{64}$/iu.test(sha256)
    ) {
      throw makeFsError("EINVAL", filePath);
    }
    files.set(filePath, {
      path: filePath,
      sha256: sha256.toLowerCase(),
      size,
    });
  }
  return files;
}

function registerPluginAssetContext(
  event: IpcMainInvokeEvent,
  payload: unknown,
): { registered: true } {
  const win = getEventWindow(event);
  if (!win) {
    throw makeFsError("EINVAL", "desktop_plugin_assets_register.window");
  }
  if (!isRecord(payload) || !isRecord(payload.installedPlugin)) {
    throw makeFsError("EINVAL", "desktop_plugin_assets_register.payload");
  }

  const vaultId = readRequiredString(payload.vaultId, "plugin asset vault id");
  const rootPath = normalizeRootPath(
    readRequiredString(payload.rootPath, "plugin asset root path", 4_000),
  );
  const pluginId = normalizePluginAssetSegment(
    payload.pluginId,
    "plugin asset plugin id",
  );
  const version = normalizePluginAssetSegment(
    payload.version,
    "plugin asset version",
  );
  const installedPlugin = payload.installedPlugin;
  const installedPluginId = normalizePluginAssetSegment(
    installedPlugin.pluginId,
    "plugin asset installed plugin id",
  );
  const installedVersion = normalizePluginAssetSegment(
    installedPlugin.installedVersion,
    "plugin asset installed version",
  );
  if (installedPluginId !== pluginId || installedVersion !== version) {
    throw makeFsError("EINVAL", "plugin asset installed metadata mismatch");
  }

  const pluginsPath = normalizeVaultPath(
    typeof payload.pluginsPath === "string"
      ? payload.pluginsPath
      : ".obsidian/plugins",
  );
  const files = parsePluginAssetFiles(installedPlugin.files);
  const pluginDirectoryPath = resolveAbsolutePath(
    rootPath,
    path.posix.join(pluginsPath, pluginId),
  );
  if (!fs.existsSync(pluginDirectoryPath)) {
    throw makeFsError("ENOENT", pluginDirectoryPath);
  }
  const pluginDirectoryStat = fs.statSync(pluginDirectoryPath);
  if (!pluginDirectoryStat.isDirectory()) {
    throw makeFsError("ENOTDIR", pluginDirectoryPath);
  }

  const key = pluginAssetContextKey(vaultId, pluginId, version);
  const ownerWindowIds = pluginAssetContexts.get(key)?.ownerWindowIds;
  ownerWindowIds?.add(win.id);
  pluginAssetContexts.set(key, {
    ownerWindowIds: ownerWindowIds ?? new Set([win.id]),
    vaultId,
    pluginId,
    version,
    rootPath,
    pluginsPath,
    files,
  });
  return { registered: true };
}

function cleanupPluginAssetContextsForWindow(windowId: number): void {
  for (const [key, context] of pluginAssetContexts) {
    context.ownerWindowIds.delete(windowId);
    if (!context.ownerWindowIds.size) {
      pluginAssetContexts.delete(key);
    }
  }
}

function createPluginAssetResponse(requestUrl: string): Response {
  const request = parsePluginAssetRequestUrl(requestUrl);
  const context = pluginAssetContexts.get(
    pluginAssetContextKey(request.vaultId, request.pluginId, request.version),
  );
  if (!context) {
    throw makeFsError("ENOENT", requestUrl);
  }
  const metadata = context.files.get(request.assetPath);
  const contentType = getPluginAssetContentType(request.assetPath);
  if (!metadata || !contentType) {
    throw makeFsError("ENOENT", request.assetPath);
  }
  if (request.sha256 !== metadata.sha256) {
    throw makeFsError("EINVAL", request.assetPath);
  }

  const absolutePath = resolveAbsolutePath(
    context.rootPath,
    path.posix.join(context.pluginsPath, context.pluginId, request.assetPath),
  );
  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    throw makeFsError("EISDIR", absolutePath);
  }
  if (stat.size !== metadata.size) {
    throw makeFsError("EINVAL", absolutePath);
  }

  const bytes = fs.readFileSync(absolutePath);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (actualSha256 !== metadata.sha256) {
    throw makeFsError("EINVAL", absolutePath);
  }

  return new Response(bytes, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
      "X-Lapis-Plugin-Asset-Sha256": metadata.sha256,
    },
  });
}

function registerPluginAssetProtocol(): void {
  protocol.handle(PLUGIN_ASSET_SCHEME, async (request) => {
    try {
      return createPluginAssetResponse(request.url);
    } catch (error) {
      const code = (error as { code?: string }).code;
      const status = code === "ENOENT" || code === "EISDIR" ? 404 : 400;
      return new Response(code ?? "Invalid plugin asset", { status });
    }
  });
}

function asBoundedString(
  value: unknown,
  maxLength: number,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, maxLength);
}

function normalizeDesktopNotificationPayload(
  payload: DesktopNotificationPayload,
): {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "error";
} {
  const id = asBoundedString(payload.id, 200);
  const message = asBoundedString(payload.message, 2000);
  if (!id || !message) {
    throw makeFsError("EINVAL", "desktop notification payload");
  }

  const title =
    asBoundedString(payload.title, 200) ??
    asBoundedString(payload.source, 80) ??
    "Lapis Notes";
  const severity =
    payload.severity === "warning" || payload.severity === "error"
      ? payload.severity
      : "info";

  return { id, title, body: message, severity };
}

const VAULT_BOOTSTRAP_KV_FILENAME = "vault-bootstrap-kv.json";

function vaultBootstrapKvFilePath(): string {
  return path.join(app.getPath("userData"), VAULT_BOOTSTRAP_KV_FILENAME);
}

function readVaultBootstrapKv(): Record<string, unknown> {
  const filePath = vaultBootstrapKvFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    }
  } catch {
    // Corrupt or partial file: start fresh rather than blocking startup.
  }
  return {};
}

function writeVaultBootstrapKv(data: Record<string, unknown>): void {
  const filePath = vaultBootstrapKvFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(data)}\n`, "utf8");
  fs.renameSync(tmpPath, filePath);
}

// ─── IPC handlers ────────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  if (ipcHandlersRegistered) {
    return;
  }

  ipcHandlersRegistered = true;
  ensureLanguageServiceIpc(
    languageServiceSidecarManager,
    assertOwnedIpcSender,
  );

  ipcMain.handle("desktop_app_info_get", async () => getDesktopAppInfo());

  ipcMain.handle("desktop_renderer_close_ready", async (event) => {
    const win = getEventWindow(event);
    traceRendererClose(`ready:${String(win?.id ?? "none")}`);
    if (!win || !rendererClosePendingWindowIds.has(win.id)) {
      return;
    }
    rendererClosePendingWindowIds.delete(win.id);
    rendererCloseReadyWindowIds.add(win.id);
    const timer = rendererCloseTimersByWindowId.get(win.id);
    if (timer) clearTimeout(timer);
    rendererCloseTimersByWindowId.delete(win.id);
    setTimeout(() => {
      if (!win.isDestroyed()) win.close();
    }, 0);
  });

  ipcMain.handle("desktop_app_url_take_pending", async (event) => {
    const sourceWindow = getEventWindow(event);
    if (!sourceWindow) {
      return pendingStartupAppUrls.splice(0);
    }

    return takePendingAppUrlsForWindow(sourceWindow);
  });

  // Vault bootstrap key-value (vault profiles, current profile pointer): main
  // process JSON file so renderer IndexedDB/Chromium profile issues cannot hang
  // vault restore on “Opening vault”.
  ipcMain.handle(
    "desktop_vault_bootstrap_kv_get",
    async (_e, { key }: { key?: string }) => {
      if (typeof key !== "string" || !key.length) {
        throw makeFsError("EINVAL", "desktop_vault_bootstrap_kv_get.key");
      }
      const data = readVaultBootstrapKv();
      return data[key] as unknown;
    },
  );

  ipcMain.handle(
    "desktop_vault_bootstrap_kv_set",
    async (_e, { key, value }: { key?: string; value?: unknown }) => {
      if (typeof key !== "string" || !key.length) {
        throw makeFsError("EINVAL", "desktop_vault_bootstrap_kv_set.key");
      }
      const data = readVaultBootstrapKv();
      data[key] = value;
      writeVaultBootstrapKv(data);
    },
  );

  ipcMain.handle(
    "desktop_vault_bootstrap_kv_set_many",
    async (_e, { entries }: { entries?: Array<[string, unknown]> }) => {
      if (!Array.isArray(entries)) {
        throw makeFsError("EINVAL", "desktop_vault_bootstrap_kv_set_many");
      }
      const data = readVaultBootstrapKv();
      for (const pair of entries) {
        if (
          !Array.isArray(pair) ||
          pair.length < 2 ||
          typeof pair[0] !== "string" ||
          !pair[0].length
        ) {
          throw makeFsError("EINVAL", "desktop_vault_bootstrap_kv_set_many");
        }
        data[pair[0]] = pair[1];
      }
      writeVaultBootstrapKv(data);
    },
  );

  ipcMain.handle(
    "desktop_vault_bootstrap_kv_get_many",
    async (_e, { keys: keyList }: { keys?: string[] }) => {
      if (!Array.isArray(keyList)) {
        throw makeFsError("EINVAL", "desktop_vault_bootstrap_kv_get_many");
      }
      const data = readVaultBootstrapKv();
      return keyList.map((k) =>
        typeof k === "string" ? data[k] : undefined,
      ) as unknown[];
    },
  );

  ipcMain.handle(
    "desktop_vault_bootstrap_kv_del",
    async (_e, { key }: { key?: string }) => {
      if (typeof key !== "string" || !key.length) {
        throw makeFsError("EINVAL", "desktop_vault_bootstrap_kv_del.key");
      }
      const data = readVaultBootstrapKv();
      delete data[key];
      writeVaultBootstrapKv(data);
    },
  );

  ipcMain.handle("desktop_vault_bootstrap_kv_keys", async () =>
    Object.keys(readVaultBootstrapKv()),
  );

  ipcMain.handle(
    "desktop_vault_bootstrap_kv_is_empty",
    async () => Object.keys(readVaultBootstrapKv()).length === 0,
  );

  ipcMain.handle(
    "desktop_vault_bootstrap_kv_import_if_empty",
    async (
      _e,
      { entries }: { entries?: Array<{ key?: string; value?: unknown }> },
    ) => {
      if (!Array.isArray(entries)) {
        throw makeFsError("EINVAL", "desktop_vault_bootstrap_kv_import");
      }
      let data = readVaultBootstrapKv();
      if (Object.keys(data).length > 0) {
        return { imported: false };
      }
      data = {};
      for (const entry of entries) {
        if (!entry || typeof entry.key !== "string" || !entry.key.length) {
          throw makeFsError("EINVAL", "desktop_vault_bootstrap_kv_import");
        }
        data[entry.key] = entry.value;
      }
      writeVaultBootstrapKv(data);
      return { imported: true };
    },
  );

  // Native notifications: mirror selected durable app notifications.
  ipcMain.handle(
    "desktop_notifications_show",
    async (event, payload: { notification?: DesktopNotificationPayload }) => {
      if (!Notification.isSupported()) {
        return { shown: false, reason: "unsupported" };
      }

      const notification = normalizeDesktopNotificationPayload(
        payload.notification ?? {},
      );
      const sourceWindow = getEventWindow(event);
      const shownNotificationIds = getOrCreateShownNotificationIds(
        sourceWindow?.id ?? 0,
      );
      if (shownNotificationIds.has(notification.id)) {
        return { shown: false, reason: "duplicate" };
      }
      shownNotificationIds.add(notification.id);

      new Notification({
        title: notification.title,
        body: notification.body,
        urgency: notification.severity === "error" ? "critical" : "normal",
      }).show();
      return { shown: true };
    },
  );

  // Folder picker
  ipcMain.handle("desktop_pick_vault_folder", async (event) => {
    if (process.env["LAPIS_DESKTOP_TEST_PICKER_CANCEL"] === "1") {
      return null;
    }
    const testVaultPath = getConfiguredTestVaultPath();
    if (testVaultPath) {
      return {
        path: testVaultPath,
        name: path.basename(testVaultPath),
      };
    }

    const sourceWindow = getEventWindow(event);
    const result = sourceWindow
      ? await dialog.showOpenDialog(sourceWindow, {
          properties: ["openDirectory"],
          title: "Open Vault Folder",
        })
      : await dialog.showOpenDialog({
          properties: ["openDirectory"],
          title: "Open Vault Folder",
        });
    if (result.canceled || !result.filePaths.length) {
      return null;
    }
    const selectedPath = result.filePaths[0];
    return {
      path: selectedPath,
      name: path.basename(selectedPath),
    };
  });

  ipcMain.handle("desktop_create_vault_folder", async (event) => {
    if (process.env["LAPIS_DESKTOP_TEST_PICKER_CANCEL"] === "1") {
      return null;
    }
    const testVaultPath = getConfiguredTestVaultPath();
    if (testVaultPath) {
      return {
        path: testVaultPath,
        name: path.basename(testVaultPath),
      };
    }

    const sourceWindow = getEventWindow(event);
    const result = sourceWindow
      ? await dialog.showOpenDialog(sourceWindow, {
          properties: ["openDirectory", "createDirectory", "promptToCreate"],
          title: "Create Vault Folder",
          buttonLabel: "Create Vault",
        })
      : await dialog.showOpenDialog({
          properties: ["openDirectory", "createDirectory", "promptToCreate"],
          title: "Create Vault Folder",
          buttonLabel: "Create Vault",
        });
    if (result.canceled || !result.filePaths.length) {
      return null;
    }
    const selectedPath = result.filePaths[0];
    fs.mkdirSync(selectedPath, { recursive: true });
    return {
      path: selectedPath,
      name: path.basename(selectedPath),
    };
  });

  ipcMain.handle(
    "desktop_reveal_vault_folder",
    async (_e, payload: { path?: string } | null | undefined) => {
      const targetPath = payload?.path;
      if (!targetPath) {
        throw new Error("Missing vault path");
      }

      const openError = await shell.openPath(targetPath);
      if (openError) {
        throw new Error(openError);
      }

      return { revealed: true };
    },
  );

  ipcMain.handle(
    "desktop_move_vault_folder",
    async (
      event,
      payload:
        | {
            path?: string;
            vaultId?: string;
          }
        | null
        | undefined,
    ) => {
      const sourcePath = payload?.path;
      const oldVaultId = payload?.vaultId;
      if (!sourcePath || !oldVaultId) {
        throw new Error("Missing vault move parameters");
      }

      const sourceWindow = getEventWindow(event);
      const result = sourceWindow
        ? await dialog.showOpenDialog(sourceWindow, {
            properties: ["openDirectory", "createDirectory", "promptToCreate"],
            title: "Move Vault",
            buttonLabel: "Move Vault Here",
          })
        : await dialog.showOpenDialog({
            properties: ["openDirectory", "createDirectory", "promptToCreate"],
            title: "Move Vault",
            buttonLabel: "Move Vault Here",
          });
      if (result.canceled || !result.filePaths.length) {
        return null;
      }

      const destinationParentPath = result.filePaths[0];
      const nextPath = path.join(
        destinationParentPath,
        path.basename(sourcePath),
      );
      if (normalizeSeparators(nextPath) === normalizeSeparators(sourcePath)) {
        return null;
      }
      if (fs.existsSync(nextPath)) {
        throw new Error(
          "A folder with that name already exists in the destination.",
        );
      }

      const nextVaultId = buildDesktopVaultId(nextPath);
      movePathSync(sourcePath, nextPath);
      try {
        migrateVaultStateFiles(oldVaultId, nextVaultId);
      } catch (error) {
        try {
          movePathSync(nextPath, sourcePath);
        } catch (rollbackError) {
          console.error(
            "Failed to roll back moved vault folder",
            rollbackError,
          );
        }
        throw error;
      }

      return {
        path: nextPath,
        name: path.basename(nextPath),
      };
    },
  );

  ipcMain.handle(
    "desktop_fs_resolve_path",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => resolveAbsolutePath(rootPath, normalizeVaultPath(normalizedPath)),
  );

  ipcMain.handle(
    "desktop_fs_to_vault_path",
    async (
      _e,
      { rootPath, absolutePath }: { rootPath: string; absolutePath: string },
    ) => toVaultRelativePathFromAbsolute(rootPath, absolutePath),
  );

  ipcMain.handle(
    "desktop_fs_open_path",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => {
      const targetPath = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      if (!fs.existsSync(targetPath)) {
        throw makeFsError("ENOENT", targetPath);
      }
      const openError = await shell.openPath(targetPath);
      if (openError) {
        throw new Error(openError);
      }
      return { opened: true };
    },
  );

  ipcMain.handle(
    "desktop_fs_reveal_path",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => {
      const targetPath = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      if (!fs.existsSync(targetPath)) {
        throw makeFsError("ENOENT", targetPath);
      }
      shell.showItemInFolder(targetPath);
      return { revealed: true };
    },
  );

  // File system: exists
  ipcMain.handle(
    "desktop_fs_exists",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => {
      const abs = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      return fs.existsSync(abs);
    },
  );

  // File system: stat
  ipcMain.handle(
    "desktop_fs_stat",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => {
      try {
        const abs = resolveAbsolutePath(
          rootPath,
          normalizeVaultPath(normalizedPath),
        );
        const stat = fs.statSync(abs);
        return {
          type: stat.isDirectory() ? "folder" : "file",
          size: stat.size,
          ctime: stat.ctimeMs,
          mtime: stat.mtimeMs,
        };
      } catch {
        return null;
      }
    },
  );

  // File system: read text
  ipcMain.handle(
    "desktop_fs_read_text",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => {
      const abs = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      if (!fs.existsSync(abs)) {
        throw makeFsError("ENOENT", abs);
      }
      return fs.readFileSync(abs, "utf-8");
    },
  );

  // File system: read binary
  ipcMain.handle(
    "desktop_fs_read_binary",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => {
      const abs = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      if (!fs.existsSync(abs)) {
        throw makeFsError("ENOENT", abs);
      }
      const buf = fs.readFileSync(abs);
      return Array.from(buf);
    },
  );

  // File system: scoped resource URL
  ipcMain.handle(
    "desktop_fs_get_resource_url",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => createVaultResourceUrl(rootPath, normalizedPath),
  );

  // File system: write text
  ipcMain.handle(
    "desktop_fs_write_text",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
        data,
      }: { rootPath: string; normalizedPath: string; data: string },
    ) => {
      const abs = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, data, "utf-8");
    },
  );

  // File system: write binary
  ipcMain.handle(
    "desktop_fs_write_binary",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
        data,
      }: { rootPath: string; normalizedPath: string; data: number[] },
    ) => {
      const abs = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, Buffer.from(data));
    },
  );

  // File system: list
  ipcMain.handle(
    "desktop_fs_list",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => {
      const abs = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      if (!fs.existsSync(abs)) {
        throw makeFsError("ENOENT", abs);
      }
      const entries = fs.readdirSync(abs, { withFileTypes: true });
      const files: string[] = [];
      const folders: string[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          folders.push(entry.name);
        } else {
          files.push(entry.name);
        }
      }
      return { files, folders };
    },
  );

  // File system: mkdir
  ipcMain.handle(
    "desktop_fs_mkdir",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
        recursive,
      }: { rootPath: string; normalizedPath: string; recursive?: boolean },
    ) => {
      const abs = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      if (fs.existsSync(abs)) {
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) {
          return;
        }
      }
      fs.mkdirSync(abs, { recursive: recursive ?? false });
    },
  );

  // File system: native watch start
  ipcMain.handle(
    "desktop_fs_watch_start",
    async (
      event,
      {
        watchId,
        rootPath,
        normalizedPath,
        recursive,
      }: {
        watchId: string;
        rootPath: string;
        normalizedPath: string;
        recursive?: boolean;
      },
    ) => {
      const sourceWindow = getEventWindow(event);
      if (!sourceWindow) {
        throw new Error("Unable to resolve source window for watch start");
      }

      await stopWatchForWindow(sourceWindow.id, watchId);

      const watchPath = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );

      const watcher = chokidar.watch(watchPath, {
        ignoreInitial: true,
        persistent: true,
        depth: recursive === false ? 0 : undefined,
        awaitWriteFinish: {
          stabilityThreshold: 150,
          pollInterval: 25,
        },
      });

      const emitPathEvent = (
        type: "create" | "modify" | "delete",
        changedPath: string,
      ) => {
        const relativePath = toVaultRelativePath(rootPath, changedPath);
        if (!relativePath) {
          return;
        }
        sendWatchEvent(sourceWindow, watchId, { type, path: relativePath });
      };

      watcher.on("add", (changedPath) => emitPathEvent("create", changedPath));
      watcher.on("addDir", (changedPath) =>
        emitPathEvent("create", changedPath),
      );
      watcher.on("change", (changedPath) =>
        emitPathEvent("modify", changedPath),
      );
      watcher.on("unlink", (changedPath) =>
        emitPathEvent("delete", changedPath),
      );
      watcher.on("unlinkDir", (changedPath) =>
        emitPathEvent("delete", changedPath),
      );
      watcher.on("error", (error) => {
        sendWatchEvent(sourceWindow, watchId, {
          type: "error",
          path: normalizedPath || "/",
          error: error instanceof Error ? error.message : String(error),
        });
      });

      getOrCreateWindowWatchMap(sourceWindow.id).set(watchId, {
        rootPath,
        close: async () => {
          await watcher.close();
        },
      });
    },
  );

  // File system: native watch stop
  ipcMain.handle(
    "desktop_fs_watch_stop",
    async (event, { watchId }: { watchId: string }) => {
      const sourceWindow = getEventWindow(event);
      if (!sourceWindow) {
        return;
      }

      await stopWatchForWindow(sourceWindow.id, watchId);
    },
  );

  // File system: rmdir
  ipcMain.handle(
    "desktop_fs_rmdir",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
        recursive,
      }: { rootPath: string; normalizedPath: string; recursive?: boolean },
    ) => {
      const abs = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      fs.rmSync(abs, { recursive: recursive ?? false, force: false });
    },
  );

  // File system: remove
  ipcMain.handle(
    "desktop_fs_remove",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
      }: { rootPath: string; normalizedPath: string },
    ) => {
      const abs = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      if (!fs.existsSync(abs)) {
        throw makeFsError("ENOENT", abs);
      }
      fs.unlinkSync(abs);
    },
  );

  // File system: rename
  ipcMain.handle(
    "desktop_fs_rename",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
        normalizedNewPath,
      }: {
        rootPath: string;
        normalizedPath: string;
        normalizedNewPath: string;
      },
    ) => {
      const src = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      const dst = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedNewPath),
      );
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.renameSync(src, dst);
    },
  );

  // File system: copy
  ipcMain.handle(
    "desktop_fs_copy",
    async (
      _e,
      {
        rootPath,
        normalizedPath,
        normalizedNewPath,
      }: {
        rootPath: string;
        normalizedPath: string;
        normalizedNewPath: string;
      },
    ) => {
      const src = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedPath),
      );
      const dst = resolveAbsolutePath(
        rootPath,
        normalizeVaultPath(normalizedNewPath),
      );
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    },
  );

  // App database: load state
  ipcMain.handle(
    "desktop_db_load_state",
    async (_e, { vaultId }: { vaultId: string }) => {
      return loadStateJson(vaultId);
    },
  );

  // App database: save state
  ipcMain.handle(
    "desktop_db_save_state",
    async (
      _e,
      { vaultId, stateJson }: { vaultId: string; stateJson: string },
    ) => {
      saveStateJson(vaultId, stateJson);
    },
  );

  // App database: replace native search documents
  ipcMain.handle(
    "desktop_db_replace_search_documents",
    async (
      _e,
      {
        vaultId,
        documents,
      }: { vaultId: string; documents: SearchDocumentRecord[] },
    ) => {
      replaceSearchDocuments(vaultId, documents);
    },
  );

  // App database: upsert native search document
  ipcMain.handle(
    "desktop_db_upsert_search_document",
    async (
      _e,
      {
        vaultId,
        document,
      }: { vaultId: string; document: SearchDocumentRecord },
    ) => {
      upsertSearchDocument(vaultId, document);
    },
  );

  // App database: delete native search document
  ipcMain.handle(
    "desktop_db_delete_search_document",
    async (_e, { vaultId, path }: { vaultId: string; path: string }) => {
      deleteSearchDocument(vaultId, path);
    },
  );

  // App database: native lexical search candidates
  ipcMain.handle(
    "desktop_db_search_documents",
    async (
      _e,
      {
        vaultId,
        terms,
        limit,
      }: { vaultId: string; terms: string[]; limit: number },
    ) => searchDocuments(vaultId, terms, limit),
  );

  // App database: native vector search candidates
  ipcMain.handle(
    "desktop_db_search_vector_documents",
    async (
      _e,
      {
        vaultId,
        queryVector,
        limit,
      }: { vaultId: string; queryVector: number[]; limit: number },
    ) => searchVectorDocuments(vaultId, queryVector, limit),
  );

  ipcMain.handle("desktop_plugin_assets_register", async (event, payload) =>
    registerPluginAssetContext(event, payload),
  );

  // Community plugins: Electron sidecar host lifecycle and capability broker.
  ipcMain.handle("desktop_plugin_host_prepare", async (_e, payload) => {
    const contextId = readPluginSidecarContextId(payload);
    const preparePayload =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {};
    pluginCapabilityBroker.configureContext(contextId, preparePayload);
    return getPluginSidecar(preparePayload).prepare({
      ...preparePayload,
      contextId,
    });
  });
  ipcMain.handle("desktop_plugin_host_evaluate", async (_e, payload) =>
    getPluginSidecar(payload).evaluate(
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {},
    ),
  );
  ipcMain.handle("desktop_plugin_host_activate", async (_e, payload) =>
    getPluginSidecar(payload).activate(
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {},
    ),
  );
  ipcMain.handle("desktop_plugin_host_deactivate", async (_e, payload) =>
    getPluginSidecar(payload).deactivate(
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {},
    ),
  );
  ipcMain.handle("desktop_plugin_host_shutdown", async (_e, payload) =>
    shutdownPluginSidecar(payload),
  );
}

function buildMenu(): Menu {
  const isMac = process.platform === "darwin";

  function sendMenuEvent(
    channel: string,
    browserWindow?: { id: number } | null,
  ): void {
    const targetWindow = getAppHostWindow(browserWindow);
    if (!targetWindow || targetWindow.isDestroyed()) {
      return;
    }

    targetWindow.webContents.send(channel);
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: APP_DISPLAY_NAME,
            submenu: [
              {
                label: `About ${APP_DISPLAY_NAME}`,
                click: (_menuItem: unknown, browserWindow?: { id: number }) => {
                  sendMenuEvent(
                    "desktop_menu_open_about_dialog",
                    browserWindow,
                  );
                },
              },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Open Vault…",
          accelerator: "CmdOrCtrl+Shift+O",
          click: (_menuItem: unknown, browserWindow?: { id: number }) => {
            sendMenuEvent("desktop_menu_open_vault_picker", browserWindow);
          },
        },
        { type: "separator" },
        isMac ? { role: "close" as const } : { role: "quit" as const },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" as const },
        { role: "redo" as const },
        { type: "separator" as const },
        { role: "cut" as const },
        { role: "copy" as const },
        { role: "paste" as const },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" as const },
              { role: "delete" as const },
              { role: "selectAll" as const },
            ]
          : [
              { role: "delete" as const },
              { type: "separator" as const },
              { role: "selectAll" as const },
            ]),
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" as const },
        { role: "forceReload" as const },
        { role: "toggleDevTools" as const },
        { type: "separator" as const },
        { role: "resetZoom" as const },
        { role: "zoomIn" as const },
        { role: "zoomOut" as const },
        { type: "separator" as const },
        { role: "togglefullscreen" as const },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" as const },
        { role: "zoom" as const },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
              { type: "separator" as const },
              { role: "window" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
    {
      role: "help",
      submenu: [
        ...(!isMac
          ? [
              {
                label: `About ${APP_DISPLAY_NAME}`,
                click: (_menuItem: unknown, browserWindow?: { id: number }) => {
                  sendMenuEvent(
                    "desktop_menu_open_about_dialog",
                    browserWindow,
                  );
                },
              },
              { type: "separator" as const },
            ]
          : []),
        {
          label: "Learn More",
          click: () => {
            void shell.openExternal("https://github.com/lapis-notes/lapis");
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

type DesktopAppInfo = {
  name: string;
  version: string;
  buildTime: string | null;
  copyright: string;
};

function resolveBuildTimestampPath(): string | null {
  if (useDevServerRenderer()) {
    return resolveFirstExistingPath([
      path.join(__dirname, "main.js"),
      path.join(__dirname, "preload.js"),
    ]);
  }

  return resolveFirstExistingPath([
    path.join(__dirname, "../dist/index.html"),
    path.join(__dirname, "main.js"),
    path.join(__dirname, "preload.js"),
  ]);
}

function getBuildTimestamp(): string | null {
  const candidate = resolveBuildTimestampPath();
  if (!candidate) {
    return null;
  }

  try {
    return fs.statSync(candidate).mtime.toISOString();
  } catch {
    return null;
  }
}

function formatBuildTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function getDesktopAppInfo(): DesktopAppInfo {
  return {
    name: APP_DISPLAY_NAME,
    version: app.getVersion(),
    buildTime: getBuildTimestamp(),
    copyright: APP_COPYRIGHT,
  };
}

function applyAboutPanelOptions(): void {
  const appInfo = getDesktopAppInfo();
  const buildTimestamp = formatBuildTimestamp(appInfo.buildTime);

  app.setAboutPanelOptions({
    applicationName: appInfo.name,
    applicationVersion: appInfo.version,
    copyright: appInfo.copyright,
    credits: buildTimestamp ? `Built ${buildTimestamp}` : undefined,
    iconPath: resolveDesktopIconPath() ?? undefined,
  });
}

// ─── Window creation ──────────────────────────────────────────────────────────

const DEV_PORT = 1421;
const DEV_SERVER_URL_ENV = "LAPIS_DESKTOP_DEV_SERVER_URL";
const ELECTRON_MACOS_SHELL_METRICS = {
  // Native traffic lights are 12px circles with 6px gaps. With the standard
  // inset cluster this yields about 62px of occupied leading space before the
  // top tabs should start, which is smaller than the legacy desktop overlay fallback.
  workspaceSafeAreaLeft: 62,
};

function getShellMetrics() {
  if (process.platform !== "darwin") {
    return {};
  }

  return ELECTRON_MACOS_SHELL_METRICS;
}

function getPreloadArguments(): string[] {
  const shellMetrics = getShellMetrics();
  if (!Object.keys(shellMetrics).length) {
    return [];
  }

  return [
    `--lapis-shell-metrics=${encodeURIComponent(JSON.stringify(shellMetrics))}`,
  ];
}

function isDev(): boolean {
  return !app.isPackaged;
}

function getDevServerRendererUrl(): string | null {
  if (!isDev()) {
    return null;
  }

  const configuredUrl = process.env[DEV_SERVER_URL_ENV]?.trim();
  if (!configuredUrl) {
    return null;
  }

  return configuredUrl;
}

function useDevServerRenderer(): boolean {
  return getDevServerRendererUrl() !== null;
}

function shouldOpenDevTools(): boolean {
  return (
    useDevServerRenderer() &&
    process.env["LAPIS_DESKTOP_DISABLE_DEVTOOLS"] !== "1"
  );
}

function getRendererUrl(): string {
  const testVault = process.env["LAPIS_DESKTOP_TEST_VAULT_PATH"];
  const devServerUrl = getDevServerRendererUrl();
  if (devServerUrl) {
    const url = new URL(devServerUrl);
    if (testVault) {
      url.searchParams.set("testVaultPath", testVault);
    }
    return url.toString();
  }
  return path.join(__dirname, "../dist/index.html");
}

function resolveFirstExistingPath(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveDesktopIconPath(options?: {
  prefersDarkAppearance?: boolean;
}): string | null {
  const prefersDarkAppearance = options?.prefersDarkAppearance ?? false;
  const buildDir = path.join(__dirname, "../build");

  if (process.platform === "darwin") {
    return resolveFirstExistingPath([
      path.join(
        buildDir,
        prefersDarkAppearance ? "icon-dark.png" : "icon-light.png",
      ),
      path.join(buildDir, "icon.png"),
    ]);
  }

  return resolveFirstExistingPath([path.join(buildDir, "icon.png")]);
}

function applyDesktopAppIcon(): void {
  const iconPath = resolveDesktopIconPath({
    prefersDarkAppearance: nativeTheme.shouldUseDarkColors,
  });
  if (!iconPath) {
    return;
  }

  if (process.platform === "darwin") {
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      app.dock?.setIcon(icon);
    }
    return;
  }
}

function getAppWindowChromeOptions(): BrowserWindowConstructorOptions {
  const iconPath = resolveDesktopIconPath();

  return {
    icon: iconPath ?? undefined,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      additionalArguments: getPreloadArguments(),
    },
  };
}

function getOrCreateWindowWatchMap(
  windowId: number,
): Map<string, ActiveDesktopWatch> {
  let windowWatches = activeWatchesByWindowId.get(windowId);
  if (!windowWatches) {
    windowWatches = new Map<string, ActiveDesktopWatch>();
    activeWatchesByWindowId.set(windowId, windowWatches);
  }

  return windowWatches;
}

function getOrCreateShownNotificationIds(windowId: number): Set<string> {
  let notificationIds = shownNativeNotificationIdsByWindowId.get(windowId);
  if (!notificationIds) {
    notificationIds = new Set<string>();
    shownNativeNotificationIdsByWindowId.set(windowId, notificationIds);
  }

  return notificationIds;
}

async function stopWatchForWindow(
  windowId: number,
  watchId: string,
): Promise<void> {
  const windowWatches = activeWatchesByWindowId.get(windowId);
  if (!windowWatches?.has(watchId)) {
    return;
  }
  const watch = windowWatches.get(watchId)!;

  windowWatches.delete(watchId);
  if (!windowWatches.size) {
    activeWatchesByWindowId.delete(windowId);
  }
  await watch.close();
}

async function stopAllWatchesForWindow(windowId: number): Promise<void> {
  const windowWatches = activeWatchesByWindowId.get(windowId);
  if (!windowWatches?.size) {
    activeWatchesByWindowId.delete(windowId);
    return;
  }

  const watchIds = [...windowWatches.keys()];
  await Promise.all(
    watchIds.map((watchId) => stopWatchForWindow(windowId, watchId)),
  );
}

function cleanupWindowState(windowId: number): Promise<void> {
  shownNativeNotificationIdsByWindowId.delete(windowId);
  cleanupPluginAssetContextsForWindow(windowId);
  requeuePendingAppUrls(windowId);
  return stopAllWatchesForWindow(windowId);
}

function trackAppWindow(win: BrowserWindow): void {
  if (trackedWindowIds.has(win.id)) {
    return;
  }

  trackedWindowIds.add(win.id);
  configureWindowOpenHandler(win.webContents);
  if (appHostWindowIds.has(win.id)) {
    assignStartupAppUrlsToWindow(win);
  }
  win.on("close", (event) => {
    if (rendererCloseReadyWindowIds.delete(win.id)) {
      return;
    }
    event.preventDefault();
    if (rendererClosePendingWindowIds.has(win.id)) {
      return;
    }
    rendererClosePendingWindowIds.add(win.id);
    traceRendererClose(`request:${win.id}`);
    win.webContents.send("desktop_renderer_before_close");
    const timer = setTimeout(() => {
      traceRendererClose(`timeout:${win.id}`);
      rendererCloseTimersByWindowId.delete(win.id);
      rendererClosePendingWindowIds.delete(win.id);
      if (!win.isDestroyed()) win.destroy();
    }, RENDERER_CLOSE_TIMEOUT_MS);
    rendererCloseTimersByWindowId.set(win.id, timer);
  });
  win.once("closed", () => {
    const timer = rendererCloseTimersByWindowId.get(win.id);
    if (timer) clearTimeout(timer);
    rendererCloseTimersByWindowId.delete(win.id);
    rendererClosePendingWindowIds.delete(win.id);
    rendererCloseReadyWindowIds.delete(win.id);
    appHostWindowIds.delete(win.id);
    trackedWindowIds.delete(win.id);
    void cleanupWindowState(win.id);
    if (appQuitRequested) {
      setTimeout(() => {
        if (BrowserWindow.getAllWindows().length === 0) app.quit();
      }, 0);
    }
  });
}

function getEventWindow(event: IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

function configureWindowOpenHandler(contents: WebContents): void {
  contents.setWindowOpenHandler(({ url }) => {
    if (url === "about:blank") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: getAppWindowChromeOptions(),
      };
    }

    if (/^https?:\/\//iu.test(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    ...getAppWindowChromeOptions(),
  });

  appHostWindowIds.add(win.id);
  trackAppWindow(win);

  registerIpcHandlers();
  Menu.setApplicationMenu(buildMenu());

  const rendererUrl = getRendererUrl();
  if (useDevServerRenderer()) {
    void win.loadURL(rendererUrl);
    if (shouldOpenDevTools()) {
      // win.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    void win.loadFile(rendererUrl);
  }

  return win;
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  applyAboutPanelOptions();
  applyDesktopAppIcon();
  nativeTheme.on("updated", applyDesktopAppIcon);
  registerVaultResourceProtocol();
  registerPluginAssetProtocol();
  app.on("browser-window-created", (_event, win) => {
    trackAppWindow(win);
  });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || useDevServerRenderer()) {
    app.quit();
  }
});

app.on("before-quit", () => {
  appQuitRequested = true;
  void shutdownPluginSidecars();
  void languageServiceSidecarManager.shutdown();
});
