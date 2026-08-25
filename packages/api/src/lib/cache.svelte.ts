import { md5, parseLinktext, stripHeadingForLink } from "./utils";
import type { App } from "./context.svelte";
import { EventDispatcher } from "./events";
import { logging } from "./logging";
import {
  defaultLinkSettings,
  getLinkPath,
  normalizeVaultPath,
  type VaultIndex,
} from "./links";
import {
  basename,
  TFile,
  type TAbstractFile,
  type AppDatabaseChangeSet,
  type AppDatabaseIndexedFile,
  type AppDatabaseIndexedMetadataPage,
  type AppDatabaseIndexedMetadataPageQuery,
  type AppDatabaseIndexedMetadataQuery,
  type AppDatabaseIndexedMetadataRow,
  type AppDatabaseLinkRecord,
  type AppDatabaseMetadataFacetQuery,
  type AppDatabaseMetadataFacetRow,
  type AppDatabaseMetadataLinkQuery,
  type AppDatabasePropertyRecord,
  type AppDatabaseTagRecord,
  type MetadataCacheSnapshot,
} from "$lib/storage";
import { debounce } from "lodash-es";
import { dirname, resolvePath } from "./storage/path";
import type { NotificationProgressHandle } from "./notifications";

export const METADATA_CACHE_BACKUP_PATH = ".lapis/cache/metadata-cache.json";
export const METADATA_CACHE_HOT_LIMIT = 512;

const METADATA_RECONCILE_CHECKPOINT_KEY =
  "metadata-cache.reconcile-checkpoint.v1";
const METADATA_RECONCILE_CHECKPOINT_VERSION = 1;
const FINGERPRINT_MASK = (1n << 128n) - 1n;

type ReconcileCheckpoint = {
  version: number;
  fingerprint: string;
  completedAt: number;
};

type MetadataReconcileSummary = {
  total: number;
  processed: number;
  changed: number;
  deleted: number;
  batches: number;
};

class StreamingManifestFingerprint {
  private count = 0;
  private sum = 0n;
  private xor = 0n;

  add(value: string): void {
    const digest = BigInt(`0x${md5(value)}`);
    this.count += 1;
    this.sum = (this.sum + digest) & FINGERPRINT_MASK;
    this.xor ^= digest;
  }

  finish(scope: string): string {
    return `${scope}:${this.count}:${this.sum.toString(16).padStart(32, "0")}:${this.xor.toString(16).padStart(32, "0")}`;
  }
}

function isReconcileCheckpoint(value: unknown): value is ReconcileCheckpoint {
  return (
    isRecord(value) &&
    value.version === METADATA_RECONCILE_CHECKPOINT_VERSION &&
    typeof value.fingerprint === "string" &&
    typeof value.completedAt === "number" &&
    Number.isFinite(value.completedAt)
  );
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function isCancellationError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === "AbortError") ||
    (error instanceof Error && /cancel/iu.test(error.message))
  );
}

function notify(message: string): void {
  const Notice = (globalThis as any).Notice;
  if (typeof Notice === "function") {
    new Notice(message);
  } else {
    console.warn(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cloneAppDatabaseChange(
  change: AppDatabaseChangeSet,
): AppDatabaseChangeSet {
  return {
    revision: change.revision,
    domains: [...change.domains],
    paths: [...change.paths],
    renamed: change.renamed?.map((entry) => ({ ...entry })),
    reset: change.reset,
    committedAt: change.committedAt,
  };
}

/**
 * Location within a Markdown document
 *
 * @public
 */
export interface Loc {
  /**
   * Line number. 0-based.
   *
   * @public
   */
  line: number;
  /**
   * Column number.
   *
   * @public
   */
  col: number;
  /**
   * Number of characters from the beginning of the file.
   *
   * @public
   */
  offset: number;
}

/**
 * Describes a text range in a Markdown document.
 *
 * @public
 */
export interface Pos {
  /**
   * Starting location.
   *
   * @public
   */
  start: Loc;
  /**
   * End location.
   *
   * @public
   */
  end: Loc;
}

export interface CacheItem {
  /**
   * Position of this item in the note.
   *
   * @public
   */
  position: Pos;
}

export interface HeadingCache extends CacheItem {
  /** @public */
  heading: string;
  /**
   * Number between 1 and 6.
   *
   * @public
   */
  level: number;
}

export interface TagCache extends CacheItem {
  /** @public */
  tag: string;
}

export interface FootnoteCache extends CacheItem {
  /** @public */
  id: string;
}

export interface BlockCache extends CacheItem {
  /** @public */
  id: string;
}

/**
 * Base interface for items that point to a different location.
 *
 * @public
 */
export interface Reference {
  /**
   * Link destination.
   *
   * @public
   */
  link: string;
  /**
   * Contains the text as it's written in the document. Not available on
   * Publish.
   *
   * @public
   */
  original: string;
  /**
   * Available if title is different from link text, in the case of `[[page
   * name|display name]]` this will return `display name`
   *
   * @public
   */
  displayText?: string;
}

export interface ReferenceCache extends Reference, CacheItem {}

export interface LinkCache extends ReferenceCache {
  heading?: string;
}

export interface EmbedCache extends ReferenceCache {}

export interface SectionCache extends CacheItem {
  /**
   * The block ID of this section, if defined.
   *
   * @public
   */
  id?: string | undefined;
  /**
   * The type string generated by the parser. Typing is non-exhaustive, more
   * types can be available than are documented here.
   *
   * @public
   */
  type:
    | "blockquote"
    | "callout"
    | "code"
    | "element"
    | "footnoteDefinition"
    | "heading"
    | "html"
    | "list"
    | "paragraph"
    | "table"
    | "text"
    | "thematicBreak"
    | "yaml"
    | string;
}

export interface ListItemCache extends CacheItem {
  /**
   * The block ID of this list item, if defined.
   *
   * @public
   */
  id?: string | undefined;
  /**
   * A single character indicating the checked status of a task. The space
   * character `' '` is interpreted as an incomplete task. An other character is
   * interpreted as completed task. `undefined` if this item isn't a task.
   *
   * @public
   */
  task?: string | undefined;
  /**
   * Line number of the parent list item (position.start.line). If this item has
   * no parent (e.g. it's a root level list), then this value is the negative of
   * the line number of the first list item (start of the list).
   *
   * Can be used to deduce which list items belongs to the same group
   * (item1.parent === item2.parent). Can be used to reconstruct hierarchy
   * information (parentItem.position.start.line === childItem.parent).
   *
   * @public
   */
  parent: number;
}

export interface FootnoteRefCache extends CacheItem {
  /** @public */
  id: string;
}

export interface ReferenceLinkCache extends CacheItem {
  /** @public */
  id: string;
  /** @public */
  link: string;
}
export interface FrontMatterCache {
  /** @public */
  [key: string]: any;
}

export interface FrontMatterInfo {
  /** @public Whether this file has a frontmatter block */
  exists: boolean;
  /** @public String representation of the frontmatter */
  frontmatter: string;
  /** @public Start of the frontmatter contents (excluding the ---) */
  from: number;
  /** @public End of the frontmatter contents (excluding the ---) */
  to: number;
  /** @public Offset where the frontmatter block ends (including the ---) */
  contentStart: number;
}

export function getFrontMatterInfo(content: string): FrontMatterInfo {
  const regexp = /^-{3}\s*[\n\r](.*?)[\n\r]-{3}\s*[\n\r]+/s;
  let match: RegExpExecArray | null;
  if ((match = regexp.exec(content))) {
    return {
      exists: true,
      frontmatter: match[1],
      from: match.index,
      to: regexp.lastIndex,
      contentStart: match[0].length,
    };
  }
  return { exists: false, frontmatter: "", from: 0, to: 0, contentStart: 0 };
}

export function parseFrontMatterTags(frontmatter: any | null): string[] | null {
  if (!frontmatter) return null;
  const tags: string[] = [];
  const pushTag = (value: unknown) => {
    const tag = value?.toString().trim();
    if (!tag) {
      return;
    }
    const normalized = tag.startsWith("#") ? tag : `#${tag}`;
    if (/^#[/a-zA-Z0-9_-]+$/.test(normalized)) {
      tags.push(normalized);
    }
  };
  if (typeof frontmatter === "object") {
    for (const [key, value] of Object.entries(frontmatter)) {
      const id = key.toLowerCase().trim();
      if (id === "tags" || id === "tag") {
        if (Array.isArray(value)) {
          value.forEach(pushTag);
        } else if (typeof value === "string") {
          value.split(/[,;\s]+/).forEach(pushTag);
        }
      }
    }
  }
  return tags;
}

export function parseFrontMatterStringArray(
  frontmatter: any | null,
  key: string,
): string[] | null {
  if (!frontmatter || !(key in frontmatter)) return null;
  const value = frontmatter[key];
  if (Array.isArray(value)) {
    return value.map((item) => item.toString());
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return null;
}

export function parseFrontMatterAliases(
  frontmatter: any | null,
): string[] | null {
  return (
    parseFrontMatterStringArray(frontmatter, "aliases") ??
    parseFrontMatterStringArray(frontmatter, "alias")
  );
}

export function parseFrontMatterEntry(
  frontmatter: any | null,
  key: string,
): any | null {
  return frontmatter?.[key] ?? null;
}

export interface FrontmatterLinkCache extends Reference {
  /** @public */
  key: string;
}

export interface CachedMetadata {
  /**
   * Position of the frontmatter in the file.
   *
   * @public
   */
  frontmatterPosition?: Pos;
  links?: LinkCache[];
  embeds?: EmbedCache[];
  tags?: TagCache[];
  /**
   * Sections are root level markdown blocks, which can be used to divide the
   * document up.
   *
   * @public
   */
  sections?: SectionCache[];
  listItems?: ListItemCache[];
  frontmatter?: FrontMatterCache;
  headings?: HeadingCache[];
  footnotes?: FootnoteCache[];
  footnoteRefs?: FootnoteRefCache[];
  referenceLinks?: ReferenceLinkCache[];
  blocks?: Record<string, BlockCache>;
}

export interface SubpathResult {
  start: Loc;
  end: Loc | null;
}

export interface HeadingSubpathResult extends SubpathResult {
  type: "heading";
  current: HeadingCache;
  next: HeadingCache | null;
}

export interface BlockSubpathResult extends SubpathResult {
  type: "block";
  block: BlockCache;
  list?: ListItemCache;
}

export interface FootnoteSubpathResult extends SubpathResult {
  type: "footnote";
  footnote: FootnoteCache;
}

export function iterateRefs(
  refs: Reference[],
  cb: (ref: Reference) => boolean | void,
): boolean {
  for (const ref of refs) {
    if (cb(ref)) return true;
  }
  return false;
}

function uniquePaths(paths: Iterable<string>): string[] {
  return [...new Set([...paths].filter(Boolean))];
}

export function iterateCacheRefs(
  cache: CachedMetadata,
  cb: (ref: ReferenceCache) => boolean | void,
): boolean {
  return iterateRefs(
    [...(cache.links ?? []), ...(cache.embeds ?? [])],
    cb as (ref: Reference) => boolean | void,
  );
}

export function resolveSubpath(
  cache: CachedMetadata,
  subpath: string,
): HeadingSubpathResult | BlockSubpathResult | FootnoteSubpathResult | null {
  const target = subpath.replace(/^#/, "").trim();
  if (!target) return null;

  if (target.startsWith("^")) {
    const id = target.slice(1);
    const block = cache.blocks?.[id];
    if (!block) return null;
    return {
      type: "block",
      block,
      list: cache.listItems?.find((item) => item.id === id),
      start: block.position.start,
      end: block.position.end,
    };
  }

  const footnoteId = /^\[(.+)]$/.exec(target)?.[1];
  if (footnoteId) {
    const footnote = cache.footnotes?.find((item) => item.id === footnoteId);
    if (!footnote) return null;
    return {
      type: "footnote",
      footnote,
      start: footnote.position.start,
      end: footnote.position.end,
    };
  }

  const normalized = stripHeadingForLink(target).toLowerCase();
  const headings = cache.headings ?? [];
  const index = headings.findIndex((heading) => {
    return stripHeadingForLink(heading.heading).toLowerCase() === normalized;
  });
  if (index === -1) return null;

  const current = headings[index];
  const next = headings[index + 1] ?? null;
  return {
    type: "heading",
    current,
    next,
    start: current.position.start,
    end: next?.position.start ?? null,
  };
}

export type MetadataProcessor = {
  read: (
    data: string,
    context: { cache: CachedMetadata; file: TFile },
  ) => Promise<CachedMetadata>;
  write: (cache: CachedMetadata) => string;
};

export type IndexedProjectionContribution = {
  task?: import("./storage/task-projection").AppDatabaseTaskRecord | null;
};

export type IndexedProjectionContributor = {
  project(input: {
    file: TFile;
    content: string;
    cache: CachedMetadata;
  }):
    | IndexedProjectionContribution
    | null
    | Promise<IndexedProjectionContribution | null>;
};

export interface MetadataCacheSnapshotLease {
  readonly snapshot: MetadataCacheSnapshot;
  release(): void;
}

export interface MetadataCacheQueryWatch<T> {
  dispose(): void;
  refresh(): Promise<void>;
  readonly current: T | undefined;
}

function clearObject(data: Record<string, unknown>) {
  for (const key of Object.keys(data)) {
    delete data[key];
  }
}

function frontmatterValueType(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function tagParts(tag: string): { parts: string[]; hierarchy: string[] } {
  const parts = tag
    .replace(/^#/, "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  const hierarchy: string[] = [];
  for (let index = 1; index <= parts.length; index++) {
    hierarchy.push(parts.slice(0, index).join("/"));
  }
  return { parts, hierarchy };
}

/**
 * Indexes parsed markdown metadata, tags, headings, and resolved links for the
 * active vault.
 *
 * @public
 */
export class MetadataCache extends EventDispatcher<{
  /**
   * Called when a file has been indexed, and its (updated) cache is now
   * available.
   *
   * Note: This is not called when a file is renamed for performance reasons.
   * You must hook the vault rename event for those.
   *
   * @public
   */
  changed: [file: TFile, data: string, cache: CachedMetadata];
  /**
   * Called when a file has been deleted. A best-effort previous version of the
   * cached metadata is presented, but it could be null in case the file was not
   * successfully cached previously.
   *
   * @public
   */
  deleted: [file: TFile, prevCache: CachedMetadata | null];
  /** Called when the metadata has been loaded */
  loaded: [];
  /** Called after an indexed database mutation commits. */
  "index-changed": [change: AppDatabaseChangeSet];
}> {
  processors: Map<string, Set<MetadataProcessor>> = new Map();
  projectionContributors: Set<IndexedProjectionContributor> = new Set();
  #fileCache: Record<string, { mtime: number; size: number; hash: string }> =
    $state({});

  #metadataCache: Record<string, CachedMetadata> = $state({});
  #resolvedLinks: Record<string, Record<string, number>> = $state({});
  #unresolvedLinks: Record<string, Record<string, number>> = $state({});
  readonly logger = logging.getLogger("cache");
  private disposed = false;
  private didLoad = false;
  private loadPromise: Promise<void> | null = null;
  private disposePromise: Promise<void> | null = null;
  private readonly pendingOperations = new Set<Promise<unknown>>();
  private readonly hotPathOrder = new Map<string, true>();
  private readonly localMutationPaths = new Set<string>();
  private reconcileIndexChangeDepth = 0;
  private deferredReconcileIndexChange: AppDatabaseChangeSet | null = null;
  private reconcileCheckpointReady = false;
  private reconcileCheckpointDirty = false;
  private reconcileCheckpointGeneration = 0;
  private activeReconcileMutations = 0;
  private reconcileCheckpointWrite: Promise<void> | null = null;
  private snapshotLeaseCount = 0;
  private snapshotLeasePromise: Promise<MetadataCacheSnapshot> | null = null;
  private snapshotLeaseValue: MetadataCacheSnapshot | null = null;
  private databaseChangeUnsubscribe: (() => void) | null = null;
  private readonly handleVaultChange = (
    event: string,
    file: TAbstractFile,
  ): void => this.handleChange(event, file);
  private readonly handleVaultRename = (
    file: TAbstractFile,
    oldPath: string,
  ): void => this.handleRename(file, oldPath);
  private readonly saveSnapshotDebounced = debounce(
    () => void this.saveSnapshotNow(),
    500,
  );

  constructor(readonly app: App) {
    super();
    app.vault.on("all", this.handleVaultChange);
    app.vault.on("rename", this.handleVaultRename);
    this.databaseChangeUnsubscribe =
      app.appDatabase.subscribeToChanges?.((change) =>
        this.handleDatabaseChange(change),
      ) ?? null;
  }

  get metadataCache() {
    return this.#metadataCache;
  }

  get resolvedLinks() {
    return this.#resolvedLinks;
  }

  get unresolvedLinks() {
    return this.#unresolvedLinks;
  }

  get fileCache() {
    return this.#fileCache;
  }

  get initialized(): boolean {
    return this.didLoad;
  }

  getAllItems(): Map<TFile, CachedMetadata> {
    const map: Map<TFile, CachedMetadata> = new Map();
    for (const [path, cache] of Object.entries(this.#fileCache)) {
      const item = this.#metadataCache[cache.hash];
      const file = this.app.vault.getFileByPath(path);
      if (item && file) {
        map.set(file, item);
      }
    }
    return map;
  }

  scheduleSnapshotSave(): void {
    if (this.disposed || this.snapshotLeaseCount === 0) return;
    this.saveSnapshotDebounced();
  }

  async flushSnapshotSave(): Promise<void> {
    this.saveSnapshotDebounced.cancel();
    await this.saveSnapshotNow({ forceBackup: true });
  }

  async dispose(options: { persist?: boolean } = {}): Promise<void> {
    if (this.disposePromise) return this.disposePromise;
    this.disposed = true;
    this.app.vault.off("all", this.handleVaultChange);
    this.app.vault.off("rename", this.handleVaultRename);
    this.databaseChangeUnsubscribe?.();
    this.databaseChangeUnsubscribe = null;
    this.snapshotLeaseCount = 0;
    this.snapshotLeasePromise = null;
    this.snapshotLeaseValue = null;
    this.saveSnapshotDebounced.cancel();
    this.disposePromise = (async () => {
      await Promise.allSettled([...this.pendingOperations]);
      await this.persistReconcileCheckpoint({ allowDisposed: true });
      void options;
    })();
    return this.disposePromise;
  }

  async saveSnapshotNow(
    _options: { forceBackup?: boolean } = {},
  ): Promise<void> {
    const snapshot = await this.buildCompatibilitySnapshot();
    try {
      await this.app.appDatabase.saveMetadataSnapshot(snapshot);
    } catch (err) {
      console.error("Failure saving metadata cache", err);
      notify(`Failure saving metadata cache: ${err}`);
    }
  }

  toJSON() {
    return {
      fileCache: $state.snapshot(this.#fileCache),
      metadataCache: $state.snapshot(this.metadataCache),
      resolvedLinks: $state.snapshot(this.resolvedLinks),
      unresolvedLinks: $state.snapshot(this.unresolvedLinks),
    };
  }

  private applySnapshot(snapshot: MetadataCacheSnapshot): void {
    if (this.disposed) return;
    this.didLoad = true;
    this.#fileCache = snapshot.fileCache;
    this.#metadataCache = snapshot.metadataCache as Record<
      string,
      CachedMetadata
    >;
    this.#resolvedLinks = snapshot.resolvedLinks;
    this.#unresolvedLinks = snapshot.unresolvedLinks;
  }

  async load() {
    if (this.disposed) return;
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.performLoad();
    this.trackOperation(this.loadPromise);
    return this.loadPromise;
  }

  private async performLoad(): Promise<void> {
    try {
      await this.app.telemetry.measureAsync(
        "metadata.cache.load",
        async (loadSpan) =>
          this.app.notifications.withProgress(
            {
              title: "Loading metadata cache",
              source: "Metadata",
              location: "status",
              persistOnError: true,
            },
            async (progress) => {
              if (this.disposed) return;
              progress.report({ message: "Opening metadata store" });
              await this.app.appDatabase.open();
              if (this.disposed) return;
              this.didLoad = true;
              this.trigger("loaded");
              const total = this.countProcessableVaultFiles();
              loadSpan.setAttribute("metadata.files.total", total);
              const fingerprint = this.getReconciliationFingerprint();
              const checkpoint = await this.app.appDatabase.getMeta(
                METADATA_RECONCILE_CHECKPOINT_KEY,
              );
              if (
                isReconcileCheckpoint(checkpoint) &&
                checkpoint.fingerprint === fingerprint
              ) {
                this.reconcileCheckpointReady = true;
                this.reconcileCheckpointDirty = false;
                loadSpan.setAttribute("metadata.checkpoint", "hit");
                progress.report({ message: "Metadata index ready" });
                this.app.telemetry.recordEvent("metadata.reconcile.complete", {
                  checkpoint: "hit",
                  "files.total": total,
                  "files.processed": 0,
                  "files.changed": 0,
                  "files.deleted": 0,
                });
                return;
              }
              loadSpan.setAttribute("metadata.checkpoint", "miss");
              progress.report({ message: "Reconciling metadata index" });
              const summary = await this.reconcileDatabaseWithVault(progress);
              if (this.disposed) return;
              this.reconcileCheckpointReady = true;
              this.markReconcileCheckpointDirty();
              await this.persistReconcileCheckpoint();
              this.app.telemetry.recordEvent("metadata.reconcile.complete", {
                checkpoint: "miss",
                "files.total": summary.total,
                "files.processed": summary.processed,
                "files.changed": summary.changed,
                "files.deleted": summary.deleted,
              });
            },
          ),
      );
    } catch (error) {
      this.app.telemetry.recordEvent(
        isCancellationError(error)
          ? "metadata.reconcile.cancelled"
          : "metadata.reconcile.failed",
        { status: isCancellationError(error) ? "cancelled" : "failed" },
      );
      throw error;
    }
  }

  private async reconcileDatabaseWithVault(
    progress?: NotificationProgressHandle,
  ): Promise<MetadataReconcileSummary> {
    const summary: MetadataReconcileSummary = {
      total: this.countProcessableVaultFiles(),
      processed: 0,
      changed: 0,
      deleted: 0,
      batches: 0,
    };
    if (this.disposed) return summary;
    const reconcileSpan = this.app.telemetry.startSpan("metadata.reconcile", {
      attributes: { "metadata.files.total": summary.total },
    });
    this.reconcileIndexChangeDepth += 1;
    let processed = 0;
    let total = summary.total;
    let cursor: string | undefined;

    try {
      progress?.report({
        current: 0,
        total,
        message:
          total > 0
            ? `Reconciling metadata index (0 of ${total})`
            : "Reconciling metadata index",
      });

      const report = async (path: string) => {
        progress?.throwIfCancellationRequested();
        processed += 1;
        total = Math.max(total, processed);
        progress?.report({
          current: processed,
          total,
          message: `${path} (${processed} of ${total})`,
        });
        await yieldToUi();
      };
      const reportProcessing = async (path: string, stage = "Indexing") => {
        progress?.throwIfCancellationRequested();
        progress?.report({
          current: processed,
          total,
          message: `${stage}: ${path} (${processed + 1} of ${total})`,
        });
        await yieldToUi();
      };

      do {
        progress?.report({
          current: processed,
          total,
          message: `Querying existing metadata index (${processed} of ${total})`,
        });
        const batchSpan = this.app.telemetry.startSpan(
          "metadata.reconcile.batch",
          {
            parent: reconcileSpan,
            attributes: {
              "metadata.batch.kind": "indexed",
              "metadata.batch.limit": 500,
            },
          },
        );
        summary.batches += 1;
        let page;
        try {
          page = await this.app.appDatabase.listIndexedFileManifest({
            after: cursor,
            limit: 500,
          });
          batchSpan.end({ "metadata.batch.rows": page.rows.length });
        } catch (error) {
          batchSpan.recordException(error);
          batchSpan.end();
          throw error;
        }
        for (const indexed of page.rows) {
          if (this.disposed) return summary;
          const current = this.app.vault.getFileByPath(indexed.path);
          if (
            !current ||
            !this.processors.has(current.extension.toLowerCase())
          ) {
            await this.mutateDatabasePaths([indexed.path], () =>
              this.app.appDatabase.deleteIndexedFile(indexed.path),
            );
            this.evictHotPath(indexed.path);
            summary.deleted += 1;
            await report(indexed.path);
            continue;
          }

          if (
            current.stat.mtime !== indexed.mtime ||
            current.stat.size !== indexed.size ||
            indexed.parserVersion !== this.parserSignature(current)
          ) {
            await reportProcessing(current.path);
            await this.processFile(current, (stage) =>
              reportProcessing(current.path, stage),
            );
            summary.changed += 1;
          }
          await report(current.path);
        }
        cursor = page.nextCursor;
      } while (cursor && !this.disposed);

      const batch: TFile[] = [];
      const reconcileCreatedBatch = async () => {
        if (!batch.length || this.disposed) return;
        const batchSize = batch.length;
        progress?.report({
          current: processed,
          total,
          message: `Querying ${batch.length} vault files against metadata index (${processed} of ${total})`,
        });
        const batchSpan = this.app.telemetry.startSpan(
          "metadata.reconcile.batch",
          {
            parent: reconcileSpan,
            attributes: {
              "metadata.batch.kind": "vault",
              "metadata.batch.limit": batchSize,
            },
          },
        );
        summary.batches += 1;
        let manifest;
        try {
          manifest = await this.app.appDatabase.listIndexedFileManifest({
            paths: batch.map((file) => file.path),
            limit: batch.length,
          });
          batchSpan.end({ "metadata.batch.rows": manifest.rows.length });
        } catch (error) {
          batchSpan.recordException(error);
          batchSpan.end();
          throw error;
        }
        const indexedPaths = new Set(manifest.rows.map((file) => file.path));
        for (const file of batch) {
          if (this.disposed) return;
          if (!indexedPaths.has(file.path)) {
            await reportProcessing(file.path);
            await this.processFile(file, (stage) =>
              reportProcessing(file.path, stage),
            );
            summary.changed += 1;
            await report(file.path);
          }
        }
        batch.length = 0;
      };

      for (const file of this.app.vault.iterateFiles()) {
        if (this.disposed) return summary;
        if (!this.processors.has(file.extension.toLowerCase())) continue;
        batch.push(file);
        if (batch.length >= 500) await reconcileCreatedBatch();
      }
      await reconcileCreatedBatch();
    } catch (error) {
      reconcileSpan.recordException(error);
      throw error;
    } finally {
      summary.total = total;
      summary.processed = processed;
      reconcileSpan.end({
        "metadata.files.total": summary.total,
        "metadata.files.processed": summary.processed,
        "metadata.files.changed": summary.changed,
        "metadata.files.deleted": summary.deleted,
        "metadata.batch.count": summary.batches,
      });
      this.reconcileIndexChangeDepth = Math.max(
        0,
        this.reconcileIndexChangeDepth - 1,
      );
      if (this.reconcileIndexChangeDepth === 0) {
        this.flushDeferredReconcileIndexChange();
      }
    }
    return summary;
  }

  private countProcessableVaultFiles(): number {
    let total = 0;
    for (const file of this.app.vault.iterateFiles()) {
      if (this.processors.has(file.extension.toLowerCase())) {
        total += 1;
      }
    }
    return total;
  }

  /**
   * Return the current vault/parser manifest fingerprint used to validate the
   * durable metadata index and disposable indexed-consumer snapshots.
   */
  getReconciliationFingerprint(): string {
    const fingerprint = new StreamingManifestFingerprint();
    for (const file of this.app.vault.iterateFiles()) {
      if (!this.processors.has(file.extension.toLowerCase())) continue;
      fingerprint.add(
        [
          file.path,
          file.stat.mtime,
          file.stat.size,
          this.parserSignature(file),
        ].join("\u0000"),
      );
    }
    return fingerprint.finish("metadata-cache-v1");
  }

  private markReconcileCheckpointDirty(): void {
    this.reconcileCheckpointDirty = true;
    this.reconcileCheckpointGeneration += 1;
  }

  private async persistReconcileCheckpoint(
    options: { allowDisposed?: boolean } = {},
  ): Promise<void> {
    if (this.reconcileCheckpointWrite) {
      await this.reconcileCheckpointWrite;
      return;
    }
    if (
      (!options.allowDisposed && this.disposed) ||
      !this.reconcileCheckpointReady ||
      !this.reconcileCheckpointDirty ||
      this.activeReconcileMutations > 0
    ) {
      return;
    }

    this.reconcileCheckpointWrite = (async () => {
      while (
        (options.allowDisposed || !this.disposed) &&
        this.reconcileCheckpointReady &&
        this.reconcileCheckpointDirty &&
        this.activeReconcileMutations === 0
      ) {
        const generation = this.reconcileCheckpointGeneration;
        const fingerprint = this.getReconciliationFingerprint();
        try {
          await this.app.appDatabase.setMeta(
            METADATA_RECONCILE_CHECKPOINT_KEY,
            {
              version: METADATA_RECONCILE_CHECKPOINT_VERSION,
              fingerprint,
              completedAt: Date.now(),
            } satisfies ReconcileCheckpoint,
          );
        } catch (error) {
          this.reconcileCheckpointReady = false;
          this.logger.warn(
            "Failed to persist metadata reconciliation checkpoint",
            error,
          );
          return;
        }
        if (generation === this.reconcileCheckpointGeneration) {
          this.reconcileCheckpointDirty = false;
        }
      }
    })();
    try {
      await this.reconcileCheckpointWrite;
    } finally {
      this.reconcileCheckpointWrite = null;
    }
  }

  private async invalidateReconcileCheckpoint(): Promise<void> {
    this.reconcileCheckpointReady = false;
    this.markReconcileCheckpointDirty();
    await this.app.appDatabase.setMeta(METADATA_RECONCILE_CHECKPOINT_KEY, {
      version: METADATA_RECONCILE_CHECKPOINT_VERSION,
      fingerprint: "",
      completedAt: 0,
    } satisfies ReconcileCheckpoint);
  }

  private trackReconcileMutation<T>(
    operation: Promise<T>,
    completed: (value: T) => boolean = () => true,
  ): void {
    this.markReconcileCheckpointDirty();
    this.activeReconcileMutations += 1;
    const tracked = operation
      .then((value) => {
        if (!completed(value)) this.reconcileCheckpointReady = false;
        return value;
      })
      .catch((error) => {
        this.reconcileCheckpointReady = false;
        throw error;
      })
      .finally(() => {
        this.activeReconcileMutations = Math.max(
          0,
          this.activeReconcileMutations - 1,
        );
        void this.persistReconcileCheckpoint();
      });
    this.trackOperation(tracked);
  }

  getFileCache(file: TFile): CachedMetadata | null {
    return this.getCache(file.path);
  }

  getCache(path: string): CachedMetadata | null {
    const entry = this.fileCache[path];
    const cache = this.metadataCache[entry?.hash];
    if (cache) this.touchHotPath(path);
    return cache ?? null;
  }

  async getFileCacheAsync(
    file: TFile | string,
  ): Promise<CachedMetadata | null> {
    const path = typeof file === "string" ? file : file.path;
    const hot = this.getCache(path);
    if (hot) return hot;
    const row = await this.app.appDatabase.getIndexedFile(path);
    if (!row?.metadata) return null;
    return this.cacheDatabaseRow(row);
  }

  queryMetadataPage(
    query: AppDatabaseIndexedMetadataPageQuery = {},
  ): Promise<AppDatabaseIndexedMetadataPage> {
    return this.app.appDatabase.queryIndexedMetadataPage(query);
  }

  queryMetadata(
    query: AppDatabaseIndexedMetadataQuery = {},
  ): Promise<AppDatabaseIndexedMetadataRow[]> {
    return this.app.appDatabase.queryIndexedMetadata(query);
  }

  queryFacets(
    query: AppDatabaseMetadataFacetQuery,
  ): Promise<AppDatabaseMetadataFacetRow[]> {
    return this.app.appDatabase.queryMetadataFacets(query);
  }

  queryLinks(
    query: AppDatabaseMetadataLinkQuery,
  ): Promise<AppDatabaseLinkRecord[]> {
    return this.app.appDatabase.queryMetadataLinks(query);
  }

  watchQuery(
    query: AppDatabaseIndexedMetadataPageQuery,
    listener: (page: AppDatabaseIndexedMetadataPage) => void,
    onError?: (error: unknown) => void,
  ): MetadataCacheQueryWatch<AppDatabaseIndexedMetadataPage> {
    let current: AppDatabaseIndexedMetadataPage | undefined;
    let generation = 0;
    let disposed = false;
    const refresh = async () => {
      const requestGeneration = ++generation;
      try {
        const page = await this.queryMetadataPage(query);
        if (disposed || requestGeneration !== generation) return;
        current = page;
        listener(page);
      } catch (error) {
        if (disposed || requestGeneration !== generation) return;
        onError?.(error);
        if (!onError) throw error;
      }
    };
    const scheduleRefresh = () => {
      void refresh().catch((error) => {
        this.logger.warn("Metadata query watch failed", error);
      });
    };
    const event = this.on("index-changed", (change) => {
      if (change.reset || change.domains.includes("metadata"))
        scheduleRefresh();
    });
    scheduleRefresh();
    return {
      get current() {
        return current;
      },
      refresh,
      dispose: () => {
        disposed = true;
        generation += 1;
        this.offref(event);
      },
    };
  }

  async acquireMetadataSnapshotLease(): Promise<MetadataCacheSnapshotLease> {
    this.snapshotLeaseCount += 1;
    try {
      if (!this.snapshotLeaseValue) {
        this.snapshotLeasePromise ??= this.buildCompatibilitySnapshot().finally(
          () => {
            this.snapshotLeasePromise = null;
          },
        );
        this.snapshotLeaseValue = await this.snapshotLeasePromise;
        this.applySnapshot(this.snapshotLeaseValue);
      }
    } catch (error) {
      this.snapshotLeaseCount = Math.max(0, this.snapshotLeaseCount - 1);
      if (this.snapshotLeaseCount === 0) this.snapshotLeaseValue = null;
      throw error;
    }
    const snapshot = this.snapshotLeaseValue;
    let released = false;
    return {
      snapshot,
      release: () => {
        if (released) return;
        released = true;
        this.snapshotLeaseCount = Math.max(0, this.snapshotLeaseCount - 1);
        if (this.snapshotLeaseCount === 0) {
          this.snapshotLeaseValue = null;
          this.trimToHotPaths();
        }
      },
    };
  }

  getDirectReferencePaths(sourcePath: string): string[] {
    const cache = this.getCache(sourcePath);
    if (!cache) {
      return [];
    }

    const targets = new Set<string>();
    iterateCacheRefs(cache, (ref) => {
      const target = this.getFirstLinkpathDest(ref.link, sourcePath);
      if (target?.path) {
        targets.add(target.path);
      }
    });

    return uniquePaths(targets);
  }

  pathDirectlyReferences(sourcePath: string, targetPath: string): boolean {
    if (!sourcePath || !targetPath) {
      return false;
    }

    return this.getDirectReferencePaths(sourcePath).includes(targetPath);
  }

  getDirectReferencingPaths(targetPath: string): string[] {
    if (!targetPath) {
      return [];
    }

    const matches: string[] = [];
    for (const sourcePath of Object.keys(this.fileCache)) {
      if (this.pathDirectlyReferences(sourcePath, targetPath)) {
        matches.push(sourcePath);
      }
    }

    return uniquePaths(matches);
  }

  isDirectlyAffectedByPathChange(
    watchedPath: string | null | undefined,
    changedPath: string | null | undefined,
  ): boolean {
    if (!watchedPath || !changedPath) {
      return false;
    }

    return (
      watchedPath === changedPath ||
      this.pathDirectlyReferences(watchedPath, changedPath) ||
      this.pathDirectlyReferences(changedPath, watchedPath)
    );
  }

  getFirstLinkpathDest(linkpath: string, sourcePath: string): TFile | null {
    const parsed = parseLinktext(linkpath);
    const normalizedPath = normalizeVaultPath(parsed.path);
    if (!normalizedPath.length) {
      return null;
    }

    const sourceDir = normalizeVaultPath(
      sourcePath ? dirname(normalizeVaultPath(sourcePath)) : "",
    );
    const relativePath = sourceDir.length
      ? normalizeVaultPath(resolvePath(sourceDir, normalizedPath))
      : normalizedPath;
    const linkName = basename(normalizedPath);
    const basenamePath = linkName.replace(/\.(md|markdown)$/i, "");
    const candidates = [
      relativePath,
      `${relativePath}.md`,
      `${relativePath}.markdown`,
      normalizedPath,
      `${normalizedPath}.md`,
      `${normalizedPath}.markdown`,
      ...this.app.vault
        .getMarkdownFiles()
        .filter(
          (file) =>
            file.basename === basenamePath ||
            file.baseName === basenamePath ||
            file.path === normalizedPath,
        )
        .map((file) => file.path),
      ...this.app.vault
        .getFiles()
        .filter((file) => {
          const filePath = normalizeVaultPath(file.path);
          return (
            filePath.endsWith(`/${normalizedPath}`) ||
            filePath.endsWith(`/${normalizedPath}.md`) ||
            filePath.endsWith(`/${normalizedPath}.markdown`)
          );
        })
        .map((file) => file.path),
      ...this.app.vault
        .getFiles()
        .filter((file) => file.baseName === linkName)
        .map((file) => file.path),
    ];

    const dedupedCandidates = [...new Set(candidates.filter(Boolean))];
    for (const candidate of dedupedCandidates) {
      const file = this.app.vault.getFileByPath(candidate);
      if (file) return file;
    }
    return null;
  }

  fileToLinktext(
    file: TFile,
    sourcePath: string,
    omitMdExtension?: boolean,
  ): string {
    const vaultIndex: VaultIndex = {
      getFiles: () =>
        this.app.vault.getFiles().map((vaultFile) => ({
          path: vaultFile.path,
          basename: vaultFile.basename,
          extension: vaultFile.extension,
        })),
    };

    return getLinkPath(
      file.path,
      sourcePath,
      {
        ...defaultLinkSettings,
        omitMarkdownExtension:
          omitMdExtension ?? defaultLinkSettings.omitMarkdownExtension,
      },
      vaultIndex,
    );
  }

  rebuild(progress?: NotificationProgressHandle) {
    if (progress) {
      return this.performRebuild(progress);
    }
    return this.app.notifications.withProgress(
      {
        title: "Rebuilding metadata cache",
        source: "Metadata",
        location: "status",
        cancellable: true,
        persistOnError: true,
      },
      (handle) => this.performRebuild(handle),
    );
  }

  private async performRebuild(
    progress: NotificationProgressHandle,
  ): Promise<void> {
    await this.invalidateReconcileCheckpoint();
    clearObject(this.fileCache);
    clearObject(this.metadataCache);
    clearObject(this.resolvedLinks);
    clearObject(this.unresolvedLinks);
    this.hotPathOrder.clear();

    let manifestCursor: string | undefined;
    do {
      const page = await this.app.appDatabase.listIndexedFileManifest({
        after: manifestCursor,
        limit: 500,
      });
      for (const indexed of page.rows) {
        if (this.disposed) return;
        progress.throwIfCancellationRequested();
        await this.mutateDatabasePaths([indexed.path], () =>
          this.app.appDatabase.deleteIndexedFile(indexed.path),
        );
      }
      manifestCursor = page.nextCursor;
    } while (manifestCursor && !this.disposed);

    const files = this.app.vault.getFiles();
    let processed = 0;
    for (const file of files) {
      if (this.disposed) return;
      progress.throwIfCancellationRequested();
      progress.report({
        current: processed,
        total: files.length,
        message: file.path,
      });
      await this.processFile(file);
      processed += 1;
      await yieldToUi();
    }
    if (this.disposed) return;
    progress.report({
      current: processed,
      total: files.length,
      message: "Metadata index rebuilt",
    });
    this.reconcileCheckpointReady = true;
    this.markReconcileCheckpointDirty();
    await this.persistReconcileCheckpoint();
  }

  addProcessor(ext: string, processor: MetadataProcessor) {
    if (!ext?.trim()) return;
    ext = ext.trim().toLowerCase();
    if (!this.processors.has(ext)) {
      this.processors.set(ext, new Set());
    }
    this.processors.get(ext)!.add(processor);
  }

  removeProcessor(ext: string, processor: MetadataProcessor): boolean {
    if (!ext?.trim()) return false;
    ext = ext.trim().toLowerCase();
    if (!this.processors.has(ext)) return false;
    return this.processors.get(ext)!.delete(processor);
  }

  private async projectRegisteredIndexes(
    file: TFile,
    content: string,
    cache: CachedMetadata,
    hash: string,
  ): Promise<void> {
    const fileRef = {
      path: file.path,
      extension: file.extension,
      name: file.name,
    };
    for (const entry of this.app.indexProjections.matching(fileRef, cache)) {
      try {
        const result = await entry.registration.project({
          file: fileRef,
          content,
          cache,
        });
        await this.app.appDatabase.replaceProjectionSource({
          projectionId: entry.projectionId,
          sourcePath: file.path,
          sourceHash: hash,
          rows: result.rows,
          edges: result.edges,
        });
      } catch (error) {
        await this.app.appDatabase.markProjectionSourceError({
          projectionId: entry.projectionId,
          sourcePath: file.path,
          sourceHash: hash,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  addIndexedProjectionContributor(contributor: IndexedProjectionContributor) {
    this.projectionContributors.add(contributor);
  }

  removeIndexedProjectionContributor(
    contributor: IndexedProjectionContributor,
  ): boolean {
    return this.projectionContributors.delete(contributor);
  }

  private parserSignature(file: TFile): string {
    const processorCount =
      this.processors.get(file.extension.toLowerCase())?.size ?? 0;
    return `metadata-cache-v2:${file.extension.toLowerCase()}:${processorCount}`;
  }

  private cacheDatabaseRow(
    row: AppDatabaseIndexedMetadataRow,
  ): CachedMetadata | null {
    if (!row.metadata || !isRecord(row.metadata.metadata)) return null;
    const cache = row.metadata.metadata as CachedMetadata;
    this.#fileCache[row.file.path] = {
      mtime: row.file.mtime,
      size: row.file.size,
      hash: row.metadata.hash,
    };
    this.#metadataCache[row.metadata.hash] = cache;
    this.#resolvedLinks[row.file.path] = {};
    this.#unresolvedLinks[row.file.path] = {};
    for (const link of row.links) {
      const target = link.resolvedTargetPath;
      const collection = target
        ? this.#resolvedLinks[row.file.path]
        : this.#unresolvedLinks[row.file.path];
      const key = target ?? link.targetText;
      collection[key] = (collection[key] ?? 0) + Math.max(1, link.count);
    }
    this.touchHotPath(row.file.path);
    return cache;
  }

  private touchHotPath(path: string): void {
    this.hotPathOrder.delete(path);
    this.hotPathOrder.set(path, true);
    if (this.snapshotLeaseCount > 0) return;
    while (this.hotPathOrder.size > METADATA_CACHE_HOT_LIMIT) {
      const oldest = this.hotPathOrder.keys().next().value as
        | string
        | undefined;
      if (!oldest) break;
      this.evictHotPath(oldest);
    }
  }

  private evictHotPath(path: string): void {
    const hash = this.#fileCache[path]?.hash;
    delete this.#fileCache[path];
    delete this.#resolvedLinks[path];
    delete this.#unresolvedLinks[path];
    this.hotPathOrder.delete(path);
    if (
      hash &&
      !Object.values(this.#fileCache).some((entry) => entry.hash === hash)
    ) {
      delete this.#metadataCache[hash];
    }
  }

  private trimToHotPaths(): void {
    for (const path of Object.keys(this.#fileCache)) {
      if (!this.hotPathOrder.has(path)) this.evictHotPath(path);
    }
    while (this.hotPathOrder.size > METADATA_CACHE_HOT_LIMIT) {
      const oldest = this.hotPathOrder.keys().next().value as
        | string
        | undefined;
      if (!oldest) break;
      this.evictHotPath(oldest);
    }
  }

  private handleDatabaseChange(change: AppDatabaseChangeSet): void {
    if (this.disposed) return;
    if (this.snapshotLeaseCount > 0) {
      this.trackOperation(this.refreshCompatibilitySnapshot(change));
    } else if (change.reset) {
      for (const path of [...this.hotPathOrder.keys()]) {
        if (!this.localMutationPaths.has(path)) this.evictHotPath(path);
      }
    } else if (change.domains.includes("metadata")) {
      for (const path of change.paths) {
        if (!this.localMutationPaths.has(path)) this.evictHotPath(path);
      }
    }
    if (
      this.reconcileIndexChangeDepth > 0 &&
      change.domains.includes("metadata")
    ) {
      this.deferReconcileIndexChange(change);
      return;
    }
    this.trigger("index-changed", change);
  }

  private deferReconcileIndexChange(change: AppDatabaseChangeSet): void {
    if (!this.deferredReconcileIndexChange) {
      this.deferredReconcileIndexChange = cloneAppDatabaseChange(change);
      return;
    }
    const current = this.deferredReconcileIndexChange;
    this.deferredReconcileIndexChange = {
      revision: Math.max(current.revision, change.revision),
      domains: [...new Set([...current.domains, ...change.domains])],
      paths: [...new Set([...current.paths, ...change.paths])],
      renamed: [
        ...(current.renamed ?? []),
        ...(change.renamed?.map((entry) => ({ ...entry })) ?? []),
      ],
      reset: current.reset || change.reset,
      committedAt: Math.max(current.committedAt, change.committedAt),
    };
  }

  private flushDeferredReconcileIndexChange(): void {
    const change = this.deferredReconcileIndexChange;
    this.deferredReconcileIndexChange = null;
    if (!change || this.disposed) return;
    this.trigger("index-changed", change);
  }

  private async refreshCompatibilitySnapshot(
    change: AppDatabaseChangeSet,
  ): Promise<void> {
    if (this.disposed || this.snapshotLeaseCount === 0) return;
    if (change.reset) {
      const snapshot = await this.buildCompatibilitySnapshot();
      if (this.disposed || this.snapshotLeaseCount === 0) return;
      this.snapshotLeaseValue = snapshot;
      this.applySnapshot(snapshot);
      return;
    }
    if (!change.domains.includes("metadata")) return;
    for (const path of change.paths) {
      if (this.disposed || this.snapshotLeaseCount === 0) return;
      if (this.localMutationPaths.has(path)) continue;
      const row = await this.app.appDatabase.getIndexedFile(path);
      if (row?.metadata) this.cacheDatabaseRow(row);
      else this.evictHotPath(path);
    }
  }

  private async mutateDatabasePaths<T>(
    paths: string[],
    operation: () => Promise<T>,
  ): Promise<T> {
    paths.forEach((path) => this.localMutationPaths.add(path));
    try {
      return await operation();
    } finally {
      paths.forEach((path) => this.localMutationPaths.delete(path));
    }
  }

  private async buildCompatibilitySnapshot(): Promise<MetadataCacheSnapshot> {
    const snapshot: MetadataCacheSnapshot = {
      fileCache: {},
      metadataCache: {},
      resolvedLinks: {},
      unresolvedLinks: {},
    };
    let cursor: string | undefined;
    do {
      const page = await this.app.appDatabase.queryIndexedMetadataPage({
        after: cursor,
        limit: 500,
      });
      for (const row of page.rows) {
        if (!row.metadata || !isRecord(row.metadata.metadata)) continue;
        snapshot.fileCache[row.file.path] = {
          mtime: row.file.mtime,
          size: row.file.size,
          hash: row.metadata.hash,
        };
        snapshot.metadataCache[row.metadata.hash] = row.metadata.metadata;
        snapshot.resolvedLinks[row.file.path] = {};
        snapshot.unresolvedLinks[row.file.path] = {};
        for (const link of row.links) {
          const target = link.resolvedTargetPath;
          const collection = target
            ? snapshot.resolvedLinks[row.file.path]
            : snapshot.unresolvedLinks[row.file.path];
          const key = target ?? link.targetText;
          collection[key] = (collection[key] ?? 0) + Math.max(1, link.count);
        }
      }
      cursor = page.nextCursor;
    } while (cursor);
    return snapshot;
  }

  private handleChange(event: string, file: TAbstractFile) {
    if (this.disposed) return;
    if (!(file instanceof TFile)) return;
    switch (event) {
      case "create":
      case "modify":
        if (!this.processors.has(file.extension.toLowerCase())) break;
        this.trackReconcileMutation(
          this.processFile(file),
          (processed) => processed,
        );
        break;
      case "delete":
        const existing = this.fileCache[file.path];
        this.trigger(
          "deleted",
          file,
          existing ? (this.metadataCache[existing.hash] ?? null) : null,
        );
        this.evictHotPath(file.path);
        this.trackReconcileMutation(
          this.mutateDatabasePaths([file.path], () =>
            this.app.appDatabase.deleteIndexedFile(file.path),
          ),
        );
        break;
    }
  }

  private handleRename(file: TAbstractFile, oldPath: string) {
    if (this.disposed) return;
    if (!(file instanceof TFile)) return;
    const existing = this.fileCache[oldPath];
    if (existing) {
      this.fileCache[file.path] = {
        ...existing,
        mtime: file.stat.mtime,
        size: file.stat.size,
      };
      delete this.fileCache[oldPath];
      if (this.resolvedLinks[oldPath]) {
        this.resolvedLinks[file.path] = this.resolvedLinks[oldPath];
        delete this.resolvedLinks[oldPath];
      }
      if (this.unresolvedLinks[oldPath]) {
        this.unresolvedLinks[file.path] = this.unresolvedLinks[oldPath];
        delete this.unresolvedLinks[oldPath];
      }
      this.hotPathOrder.delete(oldPath);
      this.touchHotPath(file.path);
    }
    this.trackReconcileMutation(
      this.mutateDatabasePaths([oldPath, file.path], () =>
        this.app.appDatabase.renameIndexedFile(oldPath, file.path),
      ),
    );
  }

  private trackOperation(operation: Promise<unknown>): void {
    this.pendingOperations.add(operation);
    void operation
      .catch((error) => {
        this.logger.warn("Metadata cache background operation failed", error);
      })
      .finally(() => {
        this.pendingOperations.delete(operation);
      });
  }

  private async processFile(
    file: TFile | null,
    onStage?: (stage: string) => Promise<void> | void,
  ): Promise<boolean> {
    if (this.disposed || !file) return false;
    file = this.app.vault.getFileByPath(file.path);
    if (this.disposed || !file) return false;

    const processors = this.processors.get(file.extension.toLowerCase());
    if (!processors || !processors.size) return false;

    await onStage?.("Reading");
    const content = await this.app.vault.read(file);
    if (this.disposed) return false;
    await onStage?.("Hashing");
    const hash = md5(content);
    const existing = this.fileCache[file.path];
    if (existing && existing.hash === hash) return false;
    await onStage?.("Parsing metadata");
    let cachedMetadata = await this.read(content, file);
    if (this.disposed) return false;
    if (cachedMetadata) {
      this.#metadataCache[hash] = cachedMetadata;
      this.#fileCache[file.path] = {
        mtime: file.stat.mtime,
        size: file.stat.size,
        hash,
      };
      this.touchHotPath(file.path);
      this.processLink(file);
      const record = this.toDatabaseRecord(file, hash, cachedMetadata);
      await onStage?.("Writing metadata index");
      await this.mutateDatabasePaths([file.path], () =>
        this.app.appDatabase.upsertIndexedFile(record),
      );
      await onStage?.("Writing projection index");
      await this.projectRegisteredIndexes(file, content, cachedMetadata, hash);
      await onStage?.("Notifying metadata listeners");
      this.trigger("changed", file, content, cachedMetadata);
    }
    if (existing && existing.hash !== hash) {
      if (
        !Object.values(this.fileCache).some(
          (entry) => entry.hash === existing.hash,
        )
      ) {
        delete this.metadataCache[existing.hash];
      }
    }
    this.logger.debug("Processing file", file.path);
    return Boolean(cachedMetadata);
  }

  private extractLink(path: string) {
    const [segment, description] = path.split("|", 2);
    const [url, sectionId] = segment.split("#", 2);
    return {
      url,
      sectionId,
      displayText:
        description || basename(path) + (sectionId ? ` > ${sectionId}` : ""),
    };
  }

  private processLink(file: TFile) {
    const cachedMetadata = this.metadataCache[this.fileCache[file.path]?.hash];
    if (!cachedMetadata) return;
    this.resolvedLinks[file.path] = {};
    this.unresolvedLinks[file.path] = {};
    const links = cachedMetadata.links;
    if (!links?.length) return;
    links.forEach((link) => {
      const spec = this.extractLink(link.link);
      const path =
        ([...this.processors.keys()]
          .map((ext) => `${spec.url}.${ext}`)
          .find((path) => this.app.vault.getFileByPath(path)) ??
        this.app.vault.getFileByPath(spec.url))
          ? spec.url
          : null;

      if (path) {
        this.resolvedLinks[file.path][path] ||= 0;
        this.resolvedLinks[file.path][path] += 1;
      } else {
        this.unresolvedLinks[file.path][link.link] ||= 0;
        this.unresolvedLinks[file.path][link.link] += 1;
      }
    });
  }

  private toDatabaseRecord(
    file: TFile,
    hash: string,
    cache: CachedMetadata,
  ): AppDatabaseIndexedFile {
    const refs: AppDatabaseLinkRecord[] = [];
    (cache.links ?? []).forEach((ref, ordinal) => {
      const spec = this.extractLink(ref.link);
      refs.push({
        sourcePath: file.path,
        targetText: ref.link,
        original: ref.original,
        resolvedTargetPath:
          this.getFirstLinkpathDest(spec.url, file.path)?.path ?? null,
        type: "link",
        position: ref.position,
        count: 1,
        heading: ref.heading ?? null,
        kind: "reference",
        ordinal,
      });
    });
    for (const ref of cache.embeds ?? []) {
      const spec = this.extractLink(ref.link);
      refs.push({
        sourcePath: file.path,
        targetText: ref.link,
        original: ref.original,
        resolvedTargetPath:
          this.getFirstLinkpathDest(spec.url, file.path)?.path ?? null,
        type: "embed",
        position: ref.position,
        count: 1,
      });
    }

    const inlineTags = new Map(
      (cache.tags ?? []).map((tag) => [tag.tag, tag.position]),
    );
    const tagNames = new Set([
      ...inlineTags.keys(),
      ...(parseFrontMatterTags(cache.frontmatter) ?? []),
    ]);
    const tags: AppDatabaseTagRecord[] = [...tagNames].map((tag) => {
      const parts = tagParts(tag);
      return {
        path: file.path,
        tag,
        parts: parts.parts,
        hierarchy: parts.hierarchy,
        position: inlineTags.get(tag),
      };
    });

    const properties: AppDatabasePropertyRecord[] = Object.entries(
      cache.frontmatter ?? {},
    ).map(([name, value]) => ({
      path: file.path,
      name,
      inferredType:
        this.app.metadataTypeManager?.determinePropertyType(name, value) ??
        frontmatterValueType(value),
      declaredType: this.app.metadataTypeManager?.types?.[name]?.type,
      value,
    }));

    return {
      file: {
        path: file.path,
        normalizedPath: file.path,
        extension: file.extension.toLowerCase(),
        mtime: file.stat.mtime,
        size: file.stat.size,
        hash,
        indexed: true,
      },
      metadata: {
        path: file.path,
        hash,
        parserVersion: this.parserSignature(file),
        metadata: cache,
      },
      links: refs,
      tags,
      properties,
    };
  }

  async processFileCache(
    file: TFile | string | null,
  ): Promise<CachedMetadata | null> {
    if (!file) return null;
    if (typeof file === "string") {
      return this.processFileCache(this.app.vault.getFileByPath(file));
    }
    return this.read(await this.app.vault.read(file), file);
  }

  async read(content: string, file: TFile) {
    const processors = this.processors.get(file.extension.toLowerCase());
    if (!processors || !processors.size) return null;

    let cachedMetadata: CachedMetadata = {};
    for (const processor of processors) {
      const cache = await processor.read(content, {
        file,
        cache: cachedMetadata,
      });
      if (cache) {
        cachedMetadata = cache;
      }
    }
    return cachedMetadata;
  }

  writeFrontmatter(file: TFile, data: FrontMatterCache) {
    const processors = this.processors.get(file.extension.toLowerCase());
    if (!processors || !processors.size) return "";

    for (const processor of processors) {
      const value = processor.write(data);
      if (value) {
        return value;
      }
    }
    return "";
  }
}

export function getAllTags(cache: CachedMetadata): string[] | null {
  return (cache.tags || []).map((it) => it.tag);
}
