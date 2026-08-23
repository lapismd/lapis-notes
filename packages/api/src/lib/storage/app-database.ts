import {
  canCollectSearchQueryPropertyNames,
  canCollectSearchQueryTerms,
  collectSearchQueryPropertyNames,
  collectSearchQueryTerms,
  parseSearchQueryAst,
} from "../search-query";
import {
  cosineSimilarity,
  createSearchEmbeddingProvider,
  type SearchEmbeddingRuntimeStatus,
  type SearchEmbeddingProvider,
  type SearchEmbeddingProviderConfig,
} from "./search-embedding-provider";
import {
  evaluateSearchQueryForDocument,
  findSearchQueryRangesInText,
  isStructuredSearchQuery,
  type SearchQueryEvaluationOptions,
  type SearchQueryTextRangeOptions,
} from "./search-query-evaluator";
import {
  assertProjectionReadAccess,
  assertProjectionWriteAccess,
  evaluateProjectionQuery,
  indexedValuesForRow,
  MAX_PROJECTION_ROWS_PER_SOURCE,
  projectionIndexStatus,
  PUBLIC_TASKS_PROJECTION_ID,
  sourceIsCurrent,
  type IndexProjectionDefinitionRecord,
  type IndexProjectionEdgeRecord,
  type IndexQuery,
  type IndexQueryResult,
  type IndexRelatedQuery,
  type IndexProjectionRowRecord,
  type IndexProjectionSourceRecord,
  type IndexProjectionValueRecord,
  type MarkProjectionSourceErrorInput,
  type ReplaceProjectionSourceInput,
} from "./index-projection";
import {
  taskQueryToIndexQuery,
  TASK_PROJECTION_FIELDS,
  TASK_PROJECTION_VERSION,
  type AppDatabaseLinkKind,
  type AppDatabaseTaskChildQuery,
  type AppDatabaseTaskQuery,
  type AppDatabaseTaskRecord,
} from "./task-projection";

export type {
  SearchEmbeddingProviderConfig,
  SearchEmbeddingRuntimeStatus,
} from "./search-embedding-provider";

export type RuntimeTarget = "web-pwa" | "deno-desktop" | "test";

export interface LocalSearchQueryEnhancementProviderConfig {
  kind: "local-model";
  queryExpansionModelId: string;
  rerankerModelId: string;
  allowRemoteModels?: boolean;
  localModelPath?: string;
  maxExpandedQueries: number;
  maxRerankCandidates: number;
}

export type SearchQueryEnhancementProviderConfig =
  LocalSearchQueryEnhancementProviderConfig;

export type SearchQueryEnhancementRuntimePhase =
  | "ready"
  | "loading"
  | "running"
  | "error";

export interface SearchQueryEnhancementRuntimeStatus {
  providerKind: SearchQueryEnhancementProviderConfig["kind"];
  phase: SearchQueryEnhancementRuntimePhase;
  queryExpansionModelId?: string;
  rerankerModelId?: string;
  message?: string;
  updatedAt: number;
}

export interface SearchQueryEnhancementSignal {
  requestedMode: "auto" | "lexical" | "vector" | "hybrid";
  topLexicalScore: number;
  topVectorScore: number;
  topFusedScore: number;
  resultCount: number;
}

export interface SearchQueryExpansionResult {
  expandedQueries: string[];
}

export interface SearchQueryRerankResult {
  rankedPaths: string[];
}

export interface SearchQueryEnhancementProvider {
  readonly config: SearchQueryEnhancementProviderConfig;
  ready(): Promise<boolean>;
  expandQuery(input: {
    query: string;
    signal: SearchQueryEnhancementSignal;
    abortSignal?: AbortSignal;
  }): Promise<SearchQueryExpansionResult>;
  rerank(input: {
    query: string;
    candidates: AppDatabaseSearchResult[];
    signal: SearchQueryEnhancementSignal;
    abortSignal?: AbortSignal;
  }): Promise<SearchQueryRerankResult>;
  getRuntimeStatus(): SearchQueryEnhancementRuntimeStatus;
}

export interface AppDatabaseSearchQueryEnhancementRequest {
  runtimeTarget: RuntimeTarget;
  provider: SearchQueryEnhancementProviderConfig;
  expandQuery: boolean;
  rerankResults: boolean;
}

export type AppDatabaseSearchQueryEnhancementSkipReason =
  | "unsupported-runtime"
  | "strong-signal"
  | "provider-unavailable";

export interface AppDatabaseSearchQueryEnhancementDiagnostics {
  runtimeTarget: RuntimeTarget;
  providerKind: SearchQueryEnhancementProviderConfig["kind"];
  expandQuery: boolean;
  rerankResults: boolean;
  applied: boolean;
  skipReason?: AppDatabaseSearchQueryEnhancementSkipReason;
  signal: SearchQueryEnhancementSignal;
}

export interface AppDatabaseSearchIndexStats {
  documentCount: number;
  chunkCount: number;
  readyChunkCount: number;
  pendingChunkCount: number;
  errorChunkCount: number;
  lastError: string | null;
}

export function supportsSearchQueryEnhancementRuntime(
  runtimeTarget?: RuntimeTarget | null,
): boolean {
  return runtimeTarget === "deno-desktop";
}

export type AppDatabaseKind = "turso-wasm" | "turso-native" | "memory";

export type AppDatabaseStorageMode = "local" | "synced" | "remote";
export type AppDatabaseTransport =
  | "native"
  | "wasm-worker"
  | "broadcast-proxy"
  | "memory";
export type AppDatabaseRole = "direct" | "owner" | "proxy" | "blocked" | "test";

export interface AppDatabaseCapabilities {
  nativeFullTextSearch: boolean;
  vectorSearch: boolean;
  approximateNearestNeighbors: boolean;
  localEmbeddings: boolean;
  crossTabCoordination: boolean;
  sync: boolean;
}

export interface AppDatabaseDescriptor {
  providerId: string;
  engine: "turso" | "memory";
  transport: AppDatabaseTransport;
  role: AppDatabaseRole;
  storageMode: AppDatabaseStorageMode;
  capabilities: AppDatabaseCapabilities;
}

export const EMPTY_APP_DATABASE_CAPABILITIES: AppDatabaseCapabilities = {
  nativeFullTextSearch: false,
  vectorSearch: false,
  approximateNearestNeighbors: false,
  localEmbeddings: false,
  crossTabCoordination: false,
  sync: false,
};

export interface MetadataCacheSnapshot {
  fileCache: Record<string, { mtime: number; size: number; hash: string }>;
  metadataCache: Record<string, unknown>;
  resolvedLinks: Record<string, Record<string, number>>;
  unresolvedLinks: Record<string, Record<string, number>>;
}

export interface AppDatabaseFileRecord {
  path: string;
  normalizedPath: string;
  extension: string;
  mtime: number;
  size: number;
  hash: string;
  /** Parser signature from the indexed metadata row when requested as a manifest. */
  parserVersion?: string;
  indexed: boolean;
  deleted?: boolean;
}

export interface AppDatabaseMetadataRecord {
  path: string;
  hash: string;
  parserVersion: string;
  metadata: unknown;
}

export interface AppDatabaseLinkRecord {
  sourcePath: string;
  targetText: string;
  original?: string;
  resolvedTargetPath: string | null;
  type: "link" | "embed";
  position?: unknown;
  count: number;
  heading?: string | null;
  kind?: AppDatabaseLinkKind;
  ordinal?: number;
}

export interface AppDatabaseTagRecord {
  path: string;
  tag: string;
  parts: string[];
  hierarchy: string[];
  position?: unknown;
}

export interface AppDatabasePropertyRecord {
  path: string;
  name: string;
  inferredType: string;
  declaredType?: string;
  value: unknown;
}

export interface AppDatabaseIndexedFile {
  file: AppDatabaseFileRecord;
  metadata: AppDatabaseMetadataRecord;
  links: AppDatabaseLinkRecord[];
  tags: AppDatabaseTagRecord[];
  properties: AppDatabasePropertyRecord[];
  task?: AppDatabaseTaskRecord | null;
}
export type AppDatabaseIndexedMetadataScalar = string | number | boolean | null;

export type AppDatabaseIndexedMetadataPropertyFilterOp =
  | "exists"
  | "not-exists"
  | "="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<=";

export interface AppDatabaseIndexedMetadataPropertyFilter {
  name: string;
  op: AppDatabaseIndexedMetadataPropertyFilterOp;
  value?: AppDatabaseIndexedMetadataScalar;
}

export type AppDatabaseIndexedMetadataSortField =
  | {
      kind: "file";
      field: "path" | "extension" | "mtime" | "size";
    }
  | {
      kind: "property";
      name: string;
    };

export interface AppDatabaseIndexedMetadataSort {
  field: AppDatabaseIndexedMetadataSortField;
  direction: "ASC" | "DESC";
}

export interface AppDatabaseIndexedMetadataQuery {
  extensions?: string[];
  pathPrefixes?: string[];
  /** Exclude dot-prefixed path segments such as app and plugin state folders. */
  excludeHiddenPaths?: boolean;
  propertyFilters?: AppDatabaseIndexedMetadataPropertyFilter[];
  requiredTags?: string[];
  resolvedTargetPaths?: string[];
  sort?: AppDatabaseIndexedMetadataSort[];
  limit?: number;
}

export interface AppDatabaseIndexedMetadataRow {
  file: AppDatabaseFileRecord;
  metadata: AppDatabaseMetadataRecord | null;
  properties: AppDatabasePropertyRecord[];
  tags: AppDatabaseTagRecord[];
  links: AppDatabaseLinkRecord[];
}

export interface AppDatabaseIndexedFileManifestQuery {
  after?: string;
  limit?: number;
  /**
   * Restrict the manifest lookup to a bounded set of exact paths. Callers use
   * this to reconcile one vault iterator batch without materializing the
   * complete vault or metadata payloads.
   */
  paths?: string[];
}

export interface AppDatabaseIndexedFileManifestPage {
  rows: AppDatabaseFileRecord[];
  nextCursor?: string;
}

export interface AppDatabaseIndexedMetadataPageQuery {
  query?: AppDatabaseIndexedMetadataQuery;
  after?: string;
  limit?: number;
}

export interface AppDatabaseIndexedMetadataPage {
  rows: AppDatabaseIndexedMetadataRow[];
  nextCursor?: string;
}

export type AppDatabaseMetadataFacetKind =
  | "tag"
  | "property-name"
  | "property-path"
  | "property-value";

export interface AppDatabaseMetadataFacetQuery {
  kind: AppDatabaseMetadataFacetKind;
  propertyName?: string;
  pathPrefixes?: string[];
  limit?: number;
}

export interface AppDatabaseMetadataFacetRow {
  value: AppDatabaseIndexedMetadataScalar;
  valueType: "null" | "string" | "number" | "boolean" | "date";
  count: number;
  /** Metadata types observed for a property name or nested property path. */
  metadataTypes?: string[];
  /** Whether a property-name/path row represents a top-level frontmatter key. */
  topLevel?: boolean;
}

export type AppDatabaseMetadataLinkDirection = "incoming" | "outgoing";
export type AppDatabaseMetadataLinkResolution =
  | "resolved"
  | "unresolved"
  | "all";

export interface AppDatabaseMetadataLinkQuery {
  direction: AppDatabaseMetadataLinkDirection;
  path?: string;
  /** Batch source/target paths for indexed consumers such as Bases. */
  paths?: string[];
  resolution?: AppDatabaseMetadataLinkResolution;
  limit?: number;
}

export type AppDatabaseChangeDomain =
  | "metadata"
  | "search"
  | "history"
  | "notification"
  | "notebook"
  | "task"
  | "projection"
  | "meta";

export interface AppDatabaseChangeSet {
  revision: number;
  domains: AppDatabaseChangeDomain[];
  paths: string[];
  renamed?: { oldPath: string; newPath: string }[];
  reset?: boolean;
  committedAt: number;
}

export type AppDatabaseChangeListener = (change: AppDatabaseChangeSet) => void;

export interface SearchDocumentRecord {
  path: string;
  /** Domain projection owner used to isolate disposable search corpora. */
  sourceProviderId?: string;
  name: string;
  extension: string;
  checksum: string;
  content: string;
  tags: string[];
  tagParts: string[];
  tagHierarchy: string[];
  metadataText?: string;
  chunks?: SearchDocumentChunk[];
  sourceMetadata?: SearchDocumentSourceMetadata;
}

export interface SearchDocumentChunkingSettings {
  targetChars: number;
  breakpointWindowChars: number;
  breakpointDecay: number;
}

export interface SearchDocumentSourcePosition {
  offset: number;
}

export interface SearchDocumentSourceRange {
  start: SearchDocumentSourcePosition;
  end: SearchDocumentSourcePosition;
}

export interface SearchDocumentSourceHeading {
  heading: string;
  level: number;
  position: SearchDocumentSourceRange;
}

export interface SearchDocumentSourceSection {
  type: string;
  position: SearchDocumentSourceRange;
}

export interface SearchDocumentSourceMetadata {
  /** Core metadata/content hash used for body-free warm reconciliation. */
  metadataHash?: string;
  /** Domain provider version that produced this projection. */
  providerVersion?: string;
  /** Chunking and projection configuration signature. */
  projectionSignature?: string;
  sourceMtime?: number;
  sourceSize?: number;
  rawTags: string[];
  frontmatter?: unknown;
  frontmatterEndOffset?: number;
  headings: SearchDocumentSourceHeading[];
  sections: SearchDocumentSourceSection[];
  chunking: SearchDocumentChunkingSettings;
}

export interface SearchDocumentManifestRecord {
  path: string;
  checksum: string;
  sourceProviderId?: string;
  metadataHash?: string;
  providerVersion?: string;
  projectionSignature?: string;
  sourceMtime?: number;
  sourceSize?: number;
}

export interface SearchDocumentManifestQuery {
  after?: string;
  limit?: number;
}

export interface SearchDocumentManifestPage {
  rows: SearchDocumentManifestRecord[];
  nextCursor?: string;
}

export interface SearchDocumentChunkEmbeddingState {
  status: "pending" | "ready" | "error";
  modelId: string;
  modelVersion?: string;
  dimensions?: number;
  vector?: number[];
  fingerprint?: string;
  dirty?: boolean;
  updatedAt?: number;
  error?: string;
}

export interface SearchDocumentChunk {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  heading?: string;
  kind?:
    | "frontmatter"
    | "heading"
    | "paragraph"
    | "list"
    | "blockquote"
    | "code"
    | "fallback";
  embedding?: SearchDocumentChunkEmbeddingState;
}

type SearchBreakPoint = {
  pos: number;
  score: number;
  kind: string;
};

type CodeFenceRegion = {
  start: number;
  end: number;
};

const SEARCH_FALLBACK_BREAK_PATTERNS: Array<[RegExp, number, string]> = [
  [/\n#{1}(?!#)/g, 100, "h1"],
  [/\n#{2}(?!#)/g, 90, "h2"],
  [/\n#{3}(?!#)/g, 80, "h3"],
  [/\n#{4}(?!#)/g, 70, "h4"],
  [/\n#{5}(?!#)/g, 60, "h5"],
  [/\n#{6}(?!#)/g, 50, "h6"],
  [/\n```/g, 80, "code"],
  [/\n(?:---|\*\*\*|___)\s*\n/g, 60, "hr"],
  [/\n\s*\n+/g, 20, "blank"],
  [/\n[-*]\s/g, 5, "list"],
  [/\n\d+\.\s/g, 5, "numlist"],
  [/\n/g, 1, "newline"],
];

function processSearchTags(tags: string[]) {
  const normalizedTags = [...new Set(tags)]
    .filter((tag) => tag.trim().length)
    .map((tag) => tag.replace(/^#/, ""));
  const tagParts: string[] = [];
  const tagHierarchy: string[] = [];

  for (const tag of normalizedTags) {
    const parts = tag.split("/").filter((part) => part.trim().length);
    tagParts.push(...parts);
    for (let index = 1; index <= parts.length; index += 1) {
      const hierarchyLevel = parts.slice(0, index).join("/");
      if (!tagHierarchy.includes(hierarchyLevel)) {
        tagHierarchy.push(hierarchyLevel);
      }
    }
  }

  return {
    tags: normalizedTags,
    tagParts: [...new Set(tagParts)],
    tagHierarchy,
  };
}

function normalizeChunkKind(kind?: string): SearchDocumentChunk["kind"] {
  switch (kind) {
    case "yaml":
      return "frontmatter";
    case "heading":
    case "paragraph":
    case "list":
    case "blockquote":
    case "code":
      return kind;
    case "callout":
      return "blockquote";
    default:
      return "fallback";
  }
}

function headingScore(level: number): number {
  return Math.max(50, 110 - level * 10);
}

function sectionBreakpoint(
  section: SearchDocumentSourceSection,
  heading?: SearchDocumentSourceHeading,
): SearchBreakPoint {
  switch (section.type) {
    case "heading": {
      const level = heading?.level ?? 1;
      return {
        pos: section.position.start.offset,
        score: headingScore(level),
        kind: `h${level}`,
      };
    }
    case "code":
      return { pos: section.position.start.offset, score: 80, kind: "code" };
    case "thematicBreak":
      return { pos: section.position.start.offset, score: 60, kind: "hr" };
    case "list":
      return { pos: section.position.start.offset, score: 5, kind: "list" };
    case "blockquote":
    case "callout":
      return {
        pos: section.position.start.offset,
        score: 10,
        kind: "blockquote",
      };
    case "paragraph":
    case "text":
      return { pos: section.position.start.offset, score: 20, kind: "blank" };
    default:
      return {
        pos: section.position.start.offset,
        score: 1,
        kind: section.type,
      };
  }
}

function sectionKindAtOffset(
  metadata: SearchDocumentSourceMetadata,
  offset: number,
): SearchDocumentChunk["kind"] {
  const section = metadata.sections.find(
    (entry) =>
      entry.position.start.offset <= offset &&
      entry.position.end.offset >= offset,
  );
  return normalizeChunkKind(section?.type);
}

function trimChunkBounds(content: string, start: number, end: number) {
  let nextStart = Math.max(0, start);
  let nextEnd = Math.min(content.length, end);
  while (nextStart < nextEnd && /\s/.test(content[nextStart] ?? "")) {
    nextStart += 1;
  }
  while (nextEnd > nextStart && /\s/.test(content[nextEnd - 1] ?? "")) {
    nextEnd -= 1;
  }
  return { start: nextStart, end: nextEnd };
}

function nearestHeading(
  metadata: SearchDocumentSourceMetadata,
  offset: number,
): string | undefined {
  let currentHeading: string | undefined;
  for (const heading of [...metadata.headings].sort(
    (left, right) => left.position.start.offset - right.position.start.offset,
  )) {
    if (heading.position.start.offset > offset) {
      break;
    }
    currentHeading = heading.heading;
  }
  return currentHeading;
}

function mergeBreakPoints(points: SearchBreakPoint[]): SearchBreakPoint[] {
  const merged = new Map<number, SearchBreakPoint>();
  for (const point of points) {
    const existing = merged.get(point.pos);
    if (!existing || point.score > existing.score) {
      merged.set(point.pos, point);
    }
  }
  return [...merged.values()].sort((left, right) => left.pos - right.pos);
}

function buildFallbackBreakPoints(
  content: string,
  startOffset: number,
): SearchBreakPoint[] {
  const text = content.slice(startOffset);
  const points: SearchBreakPoint[] = [];

  for (const [pattern, score, kind] of SEARCH_FALLBACK_BREAK_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      points.push({
        pos: startOffset + (match.index ?? 0),
        score,
        kind,
      });
    }
  }

  return mergeBreakPoints(points);
}

function findCodeFenceRegions(
  content: string,
  metadata: SearchDocumentSourceMetadata,
  startOffset: number,
): CodeFenceRegion[] {
  const sectionFences = metadata.sections
    .filter((section) => section.type === "code")
    .map((section) => ({
      start: Math.max(startOffset, section.position.start.offset),
      end: section.position.end.offset,
    }));
  if (sectionFences.length) {
    return sectionFences;
  }

  const matches = [...content.matchAll(/(^|\n)```/gm)];
  const fences: CodeFenceRegion[] = [];
  for (let index = 0; index < matches.length; index += 2) {
    const start = matches[index]?.index;
    if (start === undefined || start < startOffset) {
      continue;
    }
    const end = matches[index + 1]?.index ?? content.length;
    fences.push({ start, end });
  }
  return fences;
}

function isInsideCodeFence(pos: number, fences: CodeFenceRegion[]): boolean {
  return fences.some((fence) => pos > fence.start && pos < fence.end);
}

function findBestCutoff(
  breakPoints: SearchBreakPoint[],
  chunkStart: number,
  targetCharPos: number,
  windowChars: number,
  decayFactor: number,
  codeFences: CodeFenceRegion[],
): number {
  const windowStart = Math.max(chunkStart + 1, targetCharPos - windowChars);
  let bestPos = targetCharPos;
  let bestScore = -1;

  for (const point of breakPoints) {
    if (point.pos < windowStart) {
      continue;
    }
    if (point.pos > targetCharPos) {
      break;
    }
    if (point.pos <= chunkStart) {
      continue;
    }
    if (isInsideCodeFence(point.pos, codeFences)) {
      continue;
    }

    const distance = targetCharPos - point.pos;
    const normalizedDistance = distance / windowChars;
    const multiplier =
      1 - normalizedDistance * normalizedDistance * decayFactor;
    const finalScore = point.score * multiplier;

    if (
      finalScore > bestScore ||
      (finalScore === bestScore && point.pos > bestPos)
    ) {
      bestScore = finalScore;
      bestPos = point.pos;
    }
  }

  return bestPos;
}

function buildSectionBreakPoints(
  metadata: SearchDocumentSourceMetadata,
  frontmatterEndOffset: number,
): SearchBreakPoint[] {
  const headingsByOffset = new Map(
    metadata.headings.map((heading) => [
      heading.position.start.offset,
      heading,
    ]),
  );

  return mergeBreakPoints(
    metadata.sections
      .filter((section) => section.position.start.offset > frontmatterEndOffset)
      .map((section) =>
        sectionBreakpoint(
          section,
          headingsByOffset.get(section.position.start.offset),
        ),
      ),
  );
}

function createChunk(
  path: string,
  content: string,
  metadata: SearchDocumentSourceMetadata,
  startOffset: number,
  endOffset: number,
  kind?: string,
): SearchDocumentChunk | null {
  const trimmed = trimChunkBounds(content, startOffset, endOffset);
  if (trimmed.end <= trimmed.start) {
    return null;
  }

  return {
    id: `${path}#chunk-${trimmed.start}-${trimmed.end}`,
    text: content.slice(trimmed.start, trimmed.end),
    startOffset: trimmed.start,
    endOffset: trimmed.end,
    heading: nearestHeading(metadata, trimmed.start),
    kind: normalizeChunkKind(
      kind ?? sectionKindAtOffset(metadata, trimmed.start),
    ),
  };
}

function buildSearchChunks(
  path: string,
  content: string,
  metadata: SearchDocumentSourceMetadata,
): SearchDocumentChunk[] {
  const frontmatterEndOffset = metadata.frontmatterEndOffset ?? 0;
  const breakPoints = mergeBreakPoints([
    ...buildSectionBreakPoints(metadata, frontmatterEndOffset),
    ...buildFallbackBreakPoints(content, frontmatterEndOffset),
  ]);
  const codeFences = findCodeFenceRegions(
    content,
    metadata,
    frontmatterEndOffset,
  );
  const chunks: SearchDocumentChunk[] = [];
  let chunkStart = frontmatterEndOffset;

  while (chunkStart < content.length) {
    const remaining = content.length - chunkStart;
    const targetEnd = Math.min(
      chunkStart + metadata.chunking.targetChars,
      content.length,
    );
    const chunkEnd =
      remaining > metadata.chunking.targetChars
        ? findBestCutoff(
            breakPoints,
            chunkStart,
            targetEnd,
            metadata.chunking.breakpointWindowChars,
            metadata.chunking.breakpointDecay,
            codeFences,
          )
        : content.length;
    const safeEnd = chunkEnd > chunkStart ? chunkEnd : targetEnd;
    const chunk = createChunk(path, content, metadata, chunkStart, safeEnd);
    if (!chunk) {
      if (safeEnd <= chunkStart) {
        break;
      }
      chunkStart = safeEnd;
      continue;
    }
    chunks.push(chunk);
    chunkStart = Math.max(safeEnd, chunk.endOffset);
  }

  return chunks;
}

export function normalizeSearchDocument(
  document: SearchDocumentRecord,
): SearchDocumentRecord {
  const { sourceMetadata, ...baseDocument } = document;
  if (!sourceMetadata) {
    return clone(baseDocument);
  }

  const tags = processSearchTags(sourceMetadata.rawTags ?? document.tags);
  return {
    ...clone(baseDocument),
    sourceMetadata: clone(sourceMetadata),
    tags: tags.tags,
    tagParts: tags.tagParts,
    tagHierarchy: tags.tagHierarchy,
    metadataText:
      sourceMetadata.frontmatter === undefined
        ? (document.metadataText ?? "")
        : JSON.stringify(sourceMetadata.frontmatter ?? {}),
    chunks: buildSearchChunks(document.path, document.content, sourceMetadata),
  };
}

export type AppDatabaseSearchMode = "lexical" | "vector" | "hybrid";

export type AppDatabaseSearchField =
  | "content"
  | "path"
  | "name"
  | "tags"
  | "metadata";

export interface AppDatabaseSearchRange {
  start: number;
  end: number;
}

export interface AppDatabaseSearchSnippet {
  field: AppDatabaseSearchField;
  text: string;
  ranges: AppDatabaseSearchRange[];
  offset: number;
  chunkId?: string;
  chunkLabel?: string;
}

export interface AppDatabaseSearchOptions {
  limit?: number;
  /** Vault-relative directory filter applied before ranking and limiting. */
  pathPrefix?: string;
  snippetLength?: number;
  mode?: AppDatabaseSearchMode | "auto";
  includeDiagnostics?: boolean;
  caseSensitive?: boolean;
  sourceProviderIds?: string[];
  queryEnhancement?: AppDatabaseSearchQueryEnhancementRequest;
}

export type AppDatabaseSearchScoreFusionAlgorithm =
  | "lexical-score"
  | "vector-score"
  | "reciprocal-rank-fusion";

export interface AppDatabaseSearchScoreFusion {
  algorithm: AppDatabaseSearchScoreFusionAlgorithm;
  k?: number;
  lexicalRank?: number;
  vectorRank?: number;
  lexicalContribution?: number;
  vectorContribution?: number;
}

export interface AppDatabaseSearchScoreBreakdown {
  lexical?: number;
  vector?: number;
  fused: number;
  fusion?: AppDatabaseSearchScoreFusion;
}

export interface AppDatabaseSearchDiagnostics {
  requestedMode?: AppDatabaseSearchMode | "auto";
  appliedMode: AppDatabaseSearchMode;
  backendKind: AppDatabaseKind;
  lexicalCandidateCount?: number;
  vectorCandidateCount?: number;
  totalCandidateCount?: number;
  providerKind?: SearchEmbeddingProviderConfig["kind"];
  modelId?: string;
  modelReady?: boolean;
  queryEnhancement?: AppDatabaseSearchQueryEnhancementDiagnostics;
}

export interface AppDatabaseSearchResult {
  document: SearchDocumentRecord;
  score: number;
  snippets: AppDatabaseSearchSnippet[];
  retrievalMode: AppDatabaseSearchMode;
  scoreBreakdown: AppDatabaseSearchScoreBreakdown;
  matchedChunkIds: string[];
  diagnostics?: AppDatabaseSearchDiagnostics;
}

export interface AppDatabaseNotebookCellState {
  state: string;
  sourceHash?: string;
  outputs: unknown[];
  inputValues?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
  setupPhases?: AppDatabaseNotebookExecutionPhaseState[];
}

export interface AppDatabaseNotebookExecutionPhaseState {
  key: string;
  label: string;
  status: string;
  durationMs?: number;
  detail?: string;
}

export interface AppDatabaseNotebookState {
  sourcePath: string;
  mtime: number;
  updatedAt: number;
  cells: Record<string, AppDatabaseNotebookCellState>;
}

export type AppDatabaseFileHistoryEventType =
  | "baseline"
  | "create"
  | "modify"
  | "rename"
  | "delete"
  | "restore";

export interface AppDatabaseFileHistoryFile {
  fileId: string;
  currentPath: string;
  deleted: boolean;
}

export interface AppDatabaseFileHistoryRevision {
  revisionId: string;
  fileId: string;
  currentPath: string;
  capturedPath: string;
  eventType: AppDatabaseFileHistoryEventType;
  createdAt: number;
  sourceMtime?: number;
  sourceSize?: number;
  contentHash: string;
  content: string;
}

export interface AppDatabaseFileHistory {
  file: AppDatabaseFileHistoryFile;
  revisions: AppDatabaseFileHistoryRevision[];
}

export interface AppDatabaseStoreFileHistoryRevisionInput {
  path: string;
  previousPath?: string;
  eventType: AppDatabaseFileHistoryEventType;
  createdAt: number;
  sourceMtime?: number;
  sourceSize?: number;
  contentHash?: string;
  content?: string;
  maxRevisions?: number;
  replaceLatest?: boolean;
}

export interface AppDatabaseStoreFileHistoryRevisionResult {
  fileId: string;
  stored: boolean;
  deduplicated: boolean;
  revision?: AppDatabaseFileHistoryRevision;
}

export type AppDatabaseNotificationSeverity = "info" | "warning" | "error";

export interface AppDatabaseNotificationRecord {
  id: string;
  title?: string;
  message: string;
  severity: AppDatabaseNotificationSeverity;
  source?: string;
  createdAt: number;
  updatedAt: number;
  read: boolean;
  cleared: boolean;
}

export interface AppDatabase {
  readonly kind: AppDatabaseKind;
  readonly vaultId: string;
  readonly descriptor: AppDatabaseDescriptor;
  open(): Promise<void>;
  migrate(): Promise<void>;
  close(): Promise<void>;
  beginSearchIndexingBatch(): Promise<void>;
  endSearchIndexingBatch(): Promise<void>;
  configureSearchEmbeddingProvider(
    provider: SearchEmbeddingProviderConfig | null,
  ): Promise<void>;
  getSearchEmbeddingProvider(): Promise<SearchEmbeddingProviderConfig | null>;
  getSearchEmbeddingRuntimeStatus(): Promise<SearchEmbeddingRuntimeStatus | null>;
  getSearchIndexStats(): Promise<AppDatabaseSearchIndexStats>;
  getMeta<T = unknown>(key: string): Promise<T | undefined>;
  setMeta(key: string, value: unknown): Promise<void>;
  getNotebookState(
    sourcePath: string,
  ): Promise<AppDatabaseNotebookState | undefined>;
  setNotebookState(
    sourcePath: string,
    state: AppDatabaseNotebookState,
  ): Promise<void>;
  deleteNotebookState(sourcePath: string): Promise<void>;
  loadMetadataSnapshot(): Promise<MetadataCacheSnapshot | null>;
  saveMetadataSnapshot(snapshot: MetadataCacheSnapshot): Promise<void>;
  getFileHistory(path: string): Promise<AppDatabaseFileHistory | null>;
  storeFileHistoryRevision(
    input: AppDatabaseStoreFileHistoryRevisionInput,
  ): Promise<AppDatabaseStoreFileHistoryRevisionResult>;
  listNotifications(): Promise<AppDatabaseNotificationRecord[]>;
  upsertNotification(record: AppDatabaseNotificationRecord): Promise<void>;
  markNotificationRead(id: string): Promise<void>;
  clearNotification(id: string): Promise<void>;
  clearAllNotifications(): Promise<void>;
  getChangeRevision(): Promise<number>;
  subscribeToChanges(listener: AppDatabaseChangeListener): () => void;
  upsertIndexedFile(record: AppDatabaseIndexedFile): Promise<void>;
  getIndexedFile(
    path: string,
  ): Promise<AppDatabaseIndexedMetadataRow | undefined>;
  listIndexedFileManifest(
    query?: AppDatabaseIndexedFileManifestQuery,
  ): Promise<AppDatabaseIndexedFileManifestPage>;
  queryIndexedMetadata(
    query?: AppDatabaseIndexedMetadataQuery,
  ): Promise<AppDatabaseIndexedMetadataRow[]>;
  queryIndexedMetadataPage(
    query?: AppDatabaseIndexedMetadataPageQuery,
  ): Promise<AppDatabaseIndexedMetadataPage>;
  queryMetadataFacets(
    query: AppDatabaseMetadataFacetQuery,
  ): Promise<AppDatabaseMetadataFacetRow[]>;
  queryMetadataLinks(
    query: AppDatabaseMetadataLinkQuery,
  ): Promise<AppDatabaseLinkRecord[]>;
  deleteIndexedFile(path: string): Promise<void>;
  renameIndexedFile(oldPath: string, newPath: string): Promise<void>;
  upsertSearchDocument(document: SearchDocumentRecord): Promise<void>;
  deleteSearchDocument(path: string): Promise<void>;
  getSearchDocument(path: string): Promise<SearchDocumentRecord | undefined>;
  listSearchDocumentManifest(
    query?: SearchDocumentManifestQuery,
  ): Promise<SearchDocumentManifestPage>;
  listSearchDocuments(): Promise<SearchDocumentRecord[]>;
  rebuildSearchIndex(): Promise<void>;
  searchDocuments(
    query: string,
    options?: AppDatabaseSearchOptions,
  ): Promise<AppDatabaseSearchResult[]>;
  upsertTaskProjection(record: AppDatabaseTaskRecord): Promise<void>;
  deleteTaskProjection(path: string): Promise<void>;
  queryTasks(query?: AppDatabaseTaskQuery): Promise<AppDatabaseTaskRecord[]>;
  getTaskRow(lookup: {
    path?: string;
    id?: string;
  }): Promise<AppDatabaseTaskRecord | undefined>;
  listChildLinks(
    query: AppDatabaseTaskChildQuery,
  ): Promise<AppDatabaseLinkRecord[]>;
  listTaskDescendants(path: string): Promise<AppDatabaseTaskRecord[]>;
  registerProjectionDefinition(
    definition: IndexProjectionDefinitionRecord,
  ): Promise<void>;
  unregisterProjectionDefinition(projectionId: string): Promise<void>;
  replaceProjectionSource(input: ReplaceProjectionSourceInput): Promise<void>;
  markProjectionSourceError(
    input: MarkProjectionSourceErrorInput,
  ): Promise<void>;
  deleteProjectionSource(
    projectionId: string,
    sourcePath: string,
    writerPluginId?: string,
  ): Promise<void>;
  queryProjection<T = Record<string, unknown>>(
    projectionId: string,
    query?: IndexQuery,
    readerPluginId?: string,
  ): Promise<IndexQueryResult<T>>;
  getProjectionRow<T = Record<string, unknown>>(
    projectionId: string,
    rowId: string,
    readerPluginId?: string,
  ): Promise<T | null>;
  queryRelated<T = Record<string, unknown>>(
    query: IndexRelatedQuery,
    readerPluginId?: string,
  ): Promise<IndexQueryResult<T>>;
}

export interface AppDatabaseOpenContext {
  vaultId: string;
  runtime: RuntimeTarget;
  role?: AppDatabaseRole;
}

export interface AppDatabaseProvider {
  readonly id: string;
  canOpen(context: AppDatabaseOpenContext): boolean | Promise<boolean>;
  open(context: AppDatabaseOpenContext): Promise<AppDatabase>;
}

const NOTIFICATIONS_META_KEY = "notifications.records";

export type AppDatabaseState = {
  meta: Record<string, unknown>;
  metadataSnapshot: MetadataCacheSnapshot | null;
  searchEmbeddingProvider: SearchEmbeddingProviderConfig | null;
  historyFiles: AppDatabaseFileHistoryFile[];
  historyRevisions: [string, AppDatabaseFileHistoryRevision[]][];
  files: AppDatabaseFileRecord[];
  metadata: AppDatabaseMetadataRecord[];
  links: [string, AppDatabaseLinkRecord[]][];
  tags: [string, AppDatabaseTagRecord[]][];
  properties: [string, AppDatabasePropertyRecord[]][];
  searchDocuments: SearchDocumentRecord[];
  tasks: AppDatabaseTaskRecord[];
  projections?: IndexProjectionDefinitionRecord[];
  projectionSources?: IndexProjectionSourceRecord[];
  projectionRows?: IndexProjectionRowRecord[];
  projectionValues?: IndexProjectionValueRecord[];
  projectionEdges?: IndexProjectionEdgeRecord[];
  projectionRevision?: number;
};

export const APP_DATABASE_SCHEMA_VERSION = 5;

function clone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeIndexedMetadataExtension(extension: string): string {
  return extension.replace(/^\.+/, "").trim().toLowerCase();
}

function normalizeIndexedMetadataPathPrefix(prefix: string): string {
  return prefix.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

function matchesIndexedMetadataPathPrefix(
  path: string,
  prefix: string,
): boolean {
  return (
    prefix.length === 0 || path === prefix || path.startsWith(`${prefix}/`)
  );
}

function indexedMetadataTagCandidates(tag: string): string[] {
  const normalized = tag.trim();
  if (!normalized.length) {
    return [];
  }

  return normalized.startsWith("#")
    ? [normalized, normalized.slice(1)]
    : [normalized, `#${normalized}`];
}

function toIndexedMetadataScalar(
  value: unknown,
): AppDatabaseIndexedMetadataScalar | undefined {
  if (value === null) {
    return null;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return undefined;
}

function flattenIndexedMetadataPropertyValues(
  value: unknown,
  path: string,
  output: Array<{ path: string; value: AppDatabaseIndexedMetadataScalar }> = [],
): Array<{ path: string; value: AppDatabaseIndexedMetadataScalar }> {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      flattenIndexedMetadataPropertyValues(entry, `${path}[${index}]`, output),
    );
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      flattenIndexedMetadataPropertyValues(entry, `${path}.${key}`, output);
    }
    return output;
  }
  const scalar = toIndexedMetadataScalar(value);
  if (scalar !== undefined) output.push({ path, value: scalar });
  return output;
}

function normalizeIndexedMetadataPropertyPath(path: string): string {
  return path.toLowerCase().replace(/\[\d+\]/gu, "[]");
}

function indexedMetadataPropertyValues(
  properties: AppDatabasePropertyRecord[],
  name: string,
): AppDatabaseIndexedMetadataScalar[] {
  const normalizedName = normalizeIndexedMetadataPropertyPath(name);
  const values: AppDatabaseIndexedMetadataScalar[] = [];
  for (const property of properties) {
    if (
      normalizeIndexedMetadataPropertyPath(property.name) === normalizedName
    ) {
      const scalar = toIndexedMetadataScalar(property.value);
      if (scalar !== undefined) values.push(scalar);
      values.push(
        ...flattenIndexedMetadataPropertyValues(
          property.value,
          property.name,
        ).map((entry) => entry.value),
      );
      continue;
    }
    values.push(
      ...flattenIndexedMetadataPropertyValues(property.value, property.name)
        .filter(
          (entry) =>
            normalizeIndexedMetadataPropertyPath(entry.path) === normalizedName,
        )
        .map((entry) => entry.value),
    );
  }
  return values;
}

function compareIndexedMetadataScalars(
  left: AppDatabaseIndexedMetadataScalar | undefined,
  right: AppDatabaseIndexedMetadataScalar | undefined,
): number {
  if (left === right) {
    return 0;
  }
  if (left === undefined || left === null) {
    return 1;
  }
  if (right === undefined || right === null) {
    return -1;
  }
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }
  return String(left).localeCompare(String(right));
}

function matchesIndexedMetadataPropertyFilter(
  properties: AppDatabasePropertyRecord[],
  filter: AppDatabaseIndexedMetadataPropertyFilter,
): boolean {
  const property = properties.find(
    (entry) => entry.name.toLowerCase() === filter.name.toLowerCase(),
  );
  const values = indexedMetadataPropertyValues(properties, filter.name);

  if (filter.op === "exists") {
    return !!property || values.length > 0;
  }
  if (filter.op === "not-exists") {
    return !property && values.length === 0;
  }
  if (!property && values.length === 0) {
    return false;
  }

  const right = filter.value;
  return values.some((left) => {
    const comparison = compareIndexedMetadataScalars(left, right);
    switch (filter.op) {
      case "=":
        return left === right;
      case "!=":
        return left !== right;
      case ">":
        return comparison > 0;
      case ">=":
        return comparison >= 0;
      case "<":
        return comparison < 0;
      case "<=":
        return comparison <= 0;
      default:
        return false;
    }
  });
}

function indexedMetadataSortValue(
  row: AppDatabaseIndexedMetadataRow,
  sort: AppDatabaseIndexedMetadataSort,
): AppDatabaseIndexedMetadataScalar | undefined {
  if (sort.field.kind === "file") {
    switch (sort.field.field) {
      case "path":
        return row.file.path;
      case "extension":
        return row.file.extension;
      case "mtime":
        return row.file.mtime;
      case "size":
        return row.file.size;
    }
  }

  if (sort.field.kind !== "property") {
    return undefined;
  }

  const propertyName = sort.field.name;

  return toIndexedMetadataScalar(
    row.properties.find((entry) => entry.name === propertyName)?.value,
  );
}

function createAppDatabaseStableId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function hashAppDatabaseText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `text-${(hash >>> 0).toString(16)}`;
}

function shouldDeduplicateFileHistoryEvent(
  eventType: AppDatabaseFileHistoryEventType,
): boolean {
  return (
    eventType === "baseline" || eventType === "create" || eventType === "modify"
  );
}

function notebookStateMetaKey(sourcePath: string): string {
  return `notebook.state:${sourcePath}`;
}

export function searchTerms(query: string): string[] {
  const ast = parseSearchQueryAst(query);
  if (canCollectSearchQueryTerms(ast)) {
    return collectSearchQueryTerms(ast);
  }

  return query
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function searchPropertyNames(query: string): string[] {
  const ast = parseSearchQueryAst(query);
  if (!canCollectSearchQueryPropertyNames(ast)) {
    return [];
  }

  return collectSearchQueryPropertyNames(ast);
}

function rootSearchPropertyName(name: string): string {
  return (
    name.replace(/\[\]/gu, "").split(".")[0]?.toLowerCase() ??
    name.toLowerCase()
  );
}

export function hasSearchPropertyNames(
  properties: AppDatabasePropertyRecord[],
  requiredNames: string[],
): boolean {
  if (!requiredNames.length) {
    return true;
  }

  const availableNames = new Set(
    properties.map((property) => property.name.toLowerCase()),
  );
  return requiredNames.every((name) => {
    const normalizedName = name.toLowerCase();
    return (
      availableNames.has(normalizedName) ||
      availableNames.has(rootSearchPropertyName(normalizedName))
    );
  });
}

export function searchDocumentProperties(
  document: SearchDocumentRecord,
  indexedProperties: AppDatabasePropertyRecord[],
): AppDatabasePropertyRecord[] {
  if (!document.metadataText) return indexedProperties;
  try {
    const metadata = JSON.parse(document.metadataText) as unknown;
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return indexedProperties;
    }
    const properties = new Map(
      indexedProperties.map((property) => [
        property.name.toLowerCase(),
        property,
      ]),
    );
    for (const [name, value] of Object.entries(
      metadata as Record<string, unknown>,
    )) {
      properties.set(name.toLowerCase(), {
        path: document.path,
        name,
        inferredType: Array.isArray(value) ? "array" : typeof value,
        value,
      });
    }
    return [...properties.values()];
  } catch {
    return indexedProperties;
  }
}

function searchTextTerms(query: string): string[] {
  const propertyNames = new Set(searchPropertyNames(query));
  return searchTerms(query).filter((term) => !propertyNames.has(term));
}

export function mergeSearchRanges(
  ranges: AppDatabaseSearchRange[],
): AppDatabaseSearchRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: AppDatabaseSearchRange[] = [];
  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

export function findSearchRanges(
  text: string,
  query: string,
  options: SearchQueryTextRangeOptions = {},
): AppDatabaseSearchRange[] {
  return findSearchQueryRangesInText(text, query, options);
}

function clampRange(
  range: AppDatabaseSearchRange,
  start: number,
  end: number,
): AppDatabaseSearchRange | null {
  const next = {
    start: Math.max(0, range.start - start),
    end: Math.min(end - start, range.end - start),
  };
  if (next.end <= next.start) return null;
  return next;
}

function renameChunkId(
  chunkId: string,
  oldPath: string,
  newPath: string,
): string {
  if (!chunkId.startsWith(`${oldPath}#`)) {
    return chunkId;
  }
  return `${newPath}${chunkId.slice(oldPath.length)}`;
}

function buildFieldSnippet(
  field: Exclude<AppDatabaseSearchField, "content">,
  text: string,
  ranges: AppDatabaseSearchRange[],
  snippetLength: number,
): AppDatabaseSearchSnippet[] {
  if (!ranges.length || !text.length) return [];

  if (text.length <= snippetLength || field === "name" || field === "path") {
    return [
      {
        field,
        text,
        ranges,
        offset: 0,
      },
    ];
  }

  const focus = ranges[0];
  const padding = Math.max(16, Math.floor(snippetLength / 3));
  const start = Math.max(0, focus.start - padding);
  const end = Math.min(
    text.length,
    Math.max(start + snippetLength, focus.end + padding),
  );

  return [
    {
      field,
      text: text.slice(start, end),
      ranges: ranges
        .map((range) => clampRange(range, start, end))
        .filter((range): range is AppDatabaseSearchRange => Boolean(range)),
      offset: start,
    },
  ];
}

function buildContentSnippets(
  text: string,
  ranges: AppDatabaseSearchRange[],
  snippetLength: number,
): AppDatabaseSearchSnippet[] {
  if (!ranges.length || !text.length) return [];

  const grouped = new Map<string, AppDatabaseSearchSnippet>();
  for (const range of ranges) {
    const lineStart = text.lastIndexOf("\n", Math.max(0, range.start - 1)) + 1;
    const lineEndIndex = text.indexOf("\n", range.end);
    const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
    const key = `${lineStart}:${lineEnd}`;
    const snippet = grouped.get(key) ?? {
      field: "content" as const,
      text: text.slice(lineStart, lineEnd),
      ranges: [],
      offset: lineStart,
    };
    const nextRange = clampRange(range, lineStart, lineEnd);
    if (nextRange) {
      snippet.ranges.push(nextRange);
    }
    grouped.set(key, snippet);
  }

  return [...grouped.values()]
    .sort((a, b) => a.offset - b.offset)
    .slice(0, 8)
    .map((snippet) => {
      const ranges = mergeSearchRanges(snippet.ranges);
      if (snippet.text.length <= snippetLength) {
        return { ...snippet, ranges };
      }
      const focus = ranges[0];
      const start = Math.max(0, focus.start - Math.floor(snippetLength / 3));
      const end = Math.min(
        snippet.text.length,
        Math.max(
          start + snippetLength,
          focus.end + Math.floor(snippetLength / 3),
        ),
      );
      return {
        field: "content" as const,
        text: snippet.text.slice(start, end),
        ranges: ranges
          .map((range) => clampRange(range, start, end))
          .filter((range): range is AppDatabaseSearchRange => Boolean(range)),
        offset: snippet.offset + start,
      };
    });
}

function buildChunkContentSnippets(
  chunks: SearchDocumentChunk[],
  query: string,
  snippetLength: number,
  options: AppDatabaseSearchOptions = {},
): AppDatabaseSearchSnippet[] {
  return chunks
    .flatMap((chunk) =>
      buildContentSnippets(
        chunk.text,
        findSearchRanges(chunk.text, query, {
          caseSensitive: options.caseSensitive,
          field: "content",
        }),
        snippetLength,
      ).map((snippet) => ({
        ...snippet,
        offset: chunk.startOffset + snippet.offset,
        chunkId: chunk.id,
        chunkLabel: chunk.heading,
      })),
    )
    .sort((a, b) => a.offset - b.offset)
    .slice(0, 8);
}

function buildChunkPreviewSnippets(
  document: SearchDocumentRecord,
  chunkIds: string[],
  snippetLength: number,
): AppDatabaseSearchSnippet[] {
  const byId = new Map(
    (document.chunks ?? []).map((chunk) => [chunk.id, chunk]),
  );
  return chunkIds
    .map((chunkId) => byId.get(chunkId))
    .filter((chunk): chunk is SearchDocumentChunk => Boolean(chunk))
    .slice(0, 3)
    .map((chunk) => ({
      field: "content" as const,
      text: chunk.text.slice(0, snippetLength),
      ranges: [],
      offset: chunk.startOffset,
      chunkId: chunk.id,
      chunkLabel: chunk.heading,
    }));
}

export function buildSearchSnippets(
  document: SearchDocumentRecord,
  query: string,
  options: AppDatabaseSearchOptions = {},
): AppDatabaseSearchSnippet[] {
  const snippetLength = options.snippetLength ?? 160;
  return [
    ...buildFieldSnippet(
      "name",
      document.name,
      findSearchRanges(document.name, query, {
        caseSensitive: options.caseSensitive,
        field: "name",
      }),
      snippetLength,
    ),
    ...buildFieldSnippet(
      "path",
      document.path,
      findSearchRanges(document.path, query, {
        caseSensitive: options.caseSensitive,
        field: "path",
      }),
      snippetLength,
    ),
    ...buildFieldSnippet(
      "tags",
      document.tags.map((tag) => `#${tag}`).join(" "),
      findSearchRanges(document.tags.map((tag) => `#${tag}`).join(" "), query, {
        caseSensitive: options.caseSensitive,
        field: "tags",
      }),
      snippetLength,
    ),
    ...(document.chunks?.length
      ? buildChunkContentSnippets(
          document.chunks,
          query,
          snippetLength,
          options,
        )
      : buildContentSnippets(
          document.content,
          findSearchRanges(document.content, query, {
            caseSensitive: options.caseSensitive,
            field: "content",
          }),
          snippetLength,
        )),
    ...buildFieldSnippet(
      "metadata",
      document.metadataText ?? "",
      findSearchRanges(document.metadataText ?? "", query, {
        caseSensitive: options.caseSensitive,
        field: "metadata",
      }),
      snippetLength,
    ),
  ];
}

export function scoreSearchDocument(
  document: SearchDocumentRecord,
  query: string,
  properties: AppDatabasePropertyRecord[] = [],
  options: SearchQueryEvaluationOptions = {},
): number {
  const evaluation = evaluateSearchQueryForDocument(
    document,
    query,
    properties,
    options,
  );
  if (isStructuredSearchQuery(query) || options.caseSensitive) {
    return evaluation.matched ? evaluation.score : 0;
  }

  const propertyNames = searchPropertyNames(query);
  if (!hasSearchPropertyNames(properties, propertyNames)) {
    return 0;
  }

  const parts = searchTextTerms(query);
  let score = propertyNames.length ? propertyNames.length * 25 : 0;
  if (!parts.length) return score;
  const haystacks = [
    document.path,
    document.name,
    document.chunks?.map((chunk) => chunk.text).join("\n") || document.content,
    document.tags.join(" "),
    document.tagParts.join(" "),
    document.tagHierarchy.join(" "),
    document.metadataText ?? "",
  ].map((value) => value.toLowerCase());
  for (const part of parts) {
    const matched = haystacks.some((value, index) => {
      const hit = value.includes(part);
      if (hit) score += index <= 1 ? 25 : 10;
      return hit;
    });
    if (!matched) return 0;
  }
  return score;
}

export const MIN_VECTOR_SEARCH_SCORE = 0.2;
export const SEARCH_RRF_K = 60;

export function scoreVectorDocument(
  document: SearchDocumentRecord,
  queryVector: number[],
): { score: number; matchedChunkIds: string[] } {
  const rankedChunks = (document.chunks ?? [])
    .map((chunk) => {
      const vector = chunk.embedding?.vector ?? [];
      return {
        chunkId: chunk.id,
        score:
          chunk.embedding?.status === "ready"
            ? cosineSimilarity(vector, queryVector)
            : 0,
      };
    })
    .filter((entry) => entry.score >= MIN_VECTOR_SEARCH_SCORE)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  return {
    score: rankedChunks[0]?.score ?? 0,
    matchedChunkIds: rankedChunks.map((entry) => entry.chunkId),
  };
}

function reciprocalRankContribution(rank?: number): number {
  if (!rank || rank <= 0 || !Number.isFinite(rank)) {
    return 0;
  }
  return 1 / (SEARCH_RRF_K + rank);
}

function buildSearchScoreFusion(
  lexicalScore: number,
  vectorScore: number,
  appliedMode: AppDatabaseSearchMode,
  ranks: { lexicalRank?: number; vectorRank?: number } = {},
): { score: number; fusion: AppDatabaseSearchScoreFusion } {
  if (appliedMode === "vector") {
    const score = vectorScore * 100;
    return {
      score,
      fusion: {
        algorithm: "vector-score",
        vectorRank: ranks.vectorRank,
        vectorContribution: score,
      },
    };
  }
  if (appliedMode === "hybrid") {
    const lexicalRank = lexicalScore > 0 ? (ranks.lexicalRank ?? 1) : undefined;
    const vectorRank =
      vectorScore >= MIN_VECTOR_SEARCH_SCORE
        ? (ranks.vectorRank ?? 1)
        : undefined;
    const lexicalContribution = reciprocalRankContribution(lexicalRank);
    const vectorContribution = reciprocalRankContribution(vectorRank);
    return {
      score: lexicalContribution + vectorContribution,
      fusion: {
        algorithm: "reciprocal-rank-fusion",
        k: SEARCH_RRF_K,
        lexicalRank,
        vectorRank,
        lexicalContribution,
        vectorContribution,
      },
    };
  }
  return {
    score: lexicalScore,
    fusion: {
      algorithm: "lexical-score",
      lexicalRank: ranks.lexicalRank,
      lexicalContribution: lexicalScore,
    },
  };
}

export function rankSearchScores(
  entries: Array<{ path: string; score: number }>,
  isCandidate: (score: number) => boolean = (score) => score > 0,
): Map<string, number> {
  return new Map(
    entries
      .filter(
        (entry) => Number.isFinite(entry.score) && isCandidate(entry.score),
      )
      .sort(
        (left, right) =>
          right.score - left.score || left.path.localeCompare(right.path),
      )
      .map((entry, index) => [entry.path, index + 1]),
  );
}

export function compareSearchResults(
  left: AppDatabaseSearchResult,
  right: AppDatabaseSearchResult,
): number {
  return (
    right.score - left.score ||
    (right.scoreBreakdown.lexical ?? 0) - (left.scoreBreakdown.lexical ?? 0) ||
    (right.scoreBreakdown.vector ?? 0) - (left.scoreBreakdown.vector ?? 0) ||
    left.document.path.localeCompare(right.document.path)
  );
}

export function pathWithinPrefix(path: string, prefix?: string): boolean {
  return !prefix || path === prefix || path.startsWith(`${prefix}/`);
}

const STRONG_QUERY_ENHANCEMENT_LEXICAL_SCORE = 25;
const STRONG_QUERY_ENHANCEMENT_RRF_SCORE =
  1 / (SEARCH_RRF_K + 1) + 1 / (SEARCH_RRF_K + 2);

function buildSearchQueryEnhancementSignal(
  results: AppDatabaseSearchResult[],
  requestedMode: AppDatabaseSearchMode | "auto",
): SearchQueryEnhancementSignal {
  return {
    requestedMode,
    topLexicalScore: Math.max(
      0,
      ...results.map((result) => result.scoreBreakdown.lexical ?? 0),
    ),
    topVectorScore: Math.max(
      0,
      ...results.map((result) => result.scoreBreakdown.vector ?? 0),
    ),
    topFusedScore: results[0]?.scoreBreakdown.fused ?? 0,
    resultCount: results.length,
  };
}

function shouldSkipSearchQueryEnhancement(
  results: AppDatabaseSearchResult[],
): boolean {
  const topResult = results[0];
  if (!topResult) {
    return false;
  }

  if (
    topResult.retrievalMode === "lexical" &&
    (topResult.scoreBreakdown.lexical ?? 0) >=
      STRONG_QUERY_ENHANCEMENT_LEXICAL_SCORE
  ) {
    return true;
  }

  return (
    topResult.retrievalMode === "hybrid" &&
    (topResult.scoreBreakdown.fused ?? 0) >= STRONG_QUERY_ENHANCEMENT_RRF_SCORE
  );
}

export function resolveSearchQueryEnhancementDiagnostics(
  results: AppDatabaseSearchResult[],
  options: AppDatabaseSearchOptions,
): AppDatabaseSearchQueryEnhancementDiagnostics | undefined {
  const request = options.queryEnhancement;
  if (!request || (!request.expandQuery && !request.rerankResults)) {
    return undefined;
  }

  const signal = buildSearchQueryEnhancementSignal(
    results,
    options.mode ?? "auto",
  );

  if (!supportsSearchQueryEnhancementRuntime(request.runtimeTarget)) {
    return {
      runtimeTarget: request.runtimeTarget,
      providerKind: request.provider.kind,
      expandQuery: request.expandQuery,
      rerankResults: request.rerankResults,
      applied: false,
      skipReason: "unsupported-runtime",
      signal,
    };
  }

  if (shouldSkipSearchQueryEnhancement(results)) {
    return {
      runtimeTarget: request.runtimeTarget,
      providerKind: request.provider.kind,
      expandQuery: request.expandQuery,
      rerankResults: request.rerankResults,
      applied: false,
      skipReason: "strong-signal",
      signal,
    };
  }

  return {
    runtimeTarget: request.runtimeTarget,
    providerKind: request.provider.kind,
    expandQuery: request.expandQuery,
    rerankResults: request.rerankResults,
    applied: false,
    skipReason: "provider-unavailable",
    signal,
  };
}

function matchedChunkIds(snippets: AppDatabaseSearchSnippet[]): string[] {
  return [...new Set(snippets.flatMap((snippet) => snippet.chunkId ?? []))];
}

function firstEmbeddingModel(
  document: SearchDocumentRecord,
): SearchDocumentChunkEmbeddingState | undefined {
  return document.chunks
    ?.map((chunk) => chunk.embedding)
    .find((embedding): embedding is SearchDocumentChunkEmbeddingState =>
      Boolean(embedding?.modelId),
    );
}

export function embeddingErrorState(
  document: SearchDocumentRecord,
  provider: SearchEmbeddingProvider,
  error: unknown,
): SearchDocumentRecord {
  const message = error instanceof Error ? error.message : String(error);
  const timestamp = Date.now();

  return {
    ...clone(document),
    chunks: (document.chunks ?? []).map((chunk) => ({
      ...clone(chunk),
      embedding: {
        ...clone(chunk.embedding),
        status: "error",
        modelId: provider.config.modelId ?? "lapis/token-hash-v0",
        modelVersion: provider.config.modelVersion,
        dimensions: provider.config.dimensions,
        dirty: true,
        updatedAt: timestamp,
        error: message,
      },
    })),
  };
}

export function buildSearchResult(
  document: SearchDocumentRecord,
  query: string,
  options: AppDatabaseSearchOptions,
  context: {
    backendKind: AppDatabaseKind;
    appliedMode?: AppDatabaseSearchMode;
    lexicalScore?: number;
    vectorScore?: number;
    lexicalCandidateCount?: number;
    vectorCandidateCount?: number;
    providerConfig?: SearchEmbeddingProviderConfig | null;
    preferredChunkIds?: string[];
    lexicalRank?: number;
    vectorRank?: number;
  },
): AppDatabaseSearchResult {
  const snippetLength = options.snippetLength ?? 160;
  const lexicalScore =
    context.lexicalScore ?? scoreSearchDocument(document, query, [], options);
  const vectorScore = context.vectorScore ?? 0;
  const appliedMode = context.appliedMode ?? "lexical";
  const snippets = buildSearchSnippets(document, query, options);
  if (!snippets.length && lexicalScore > 0) {
    snippets.push({
      field: "name",
      text: document.name,
      ranges: [],
      offset: 0,
    });
  }
  if (!snippets.length && context.preferredChunkIds?.length) {
    snippets.push(
      ...buildChunkPreviewSnippets(
        document,
        context.preferredChunkIds,
        snippetLength,
      ),
    );
  }
  const { score, fusion } = buildSearchScoreFusion(
    lexicalScore,
    vectorScore,
    appliedMode,
    {
      lexicalRank: context.lexicalRank,
      vectorRank: context.vectorRank,
    },
  );
  const matchedChunks = [
    ...new Set([
      ...matchedChunkIds(snippets),
      ...(context.preferredChunkIds ?? []),
    ]),
  ];
  const embedding = firstEmbeddingModel(document);

  return {
    document,
    score,
    snippets,
    retrievalMode: appliedMode,
    scoreBreakdown: {
      lexical: lexicalScore,
      vector: vectorScore || undefined,
      fused: score,
      fusion,
    },
    matchedChunkIds: matchedChunks,
    diagnostics: options.includeDiagnostics
      ? {
          requestedMode: options.mode ?? "auto",
          appliedMode,
          backendKind: context.backendKind,
          lexicalCandidateCount: context.lexicalCandidateCount,
          vectorCandidateCount: context.vectorCandidateCount,
          totalCandidateCount:
            (context.lexicalCandidateCount ?? 0) +
            (context.vectorCandidateCount ?? 0),
          providerKind: context.providerConfig?.kind,
          modelId: embedding?.modelId ?? context.providerConfig?.modelId,
          modelReady:
            embedding?.status === "ready" || Boolean(context.providerConfig),
        }
      : undefined,
  };
}

export class MemoryAppDatabase implements AppDatabase {
  readonly kind: AppDatabaseKind = "memory";
  get descriptor(): AppDatabaseDescriptor {
    return {
      providerId: "memory-test",
      engine: "memory",
      transport: "memory",
      role: "test",
      storageMode: "local",
      capabilities: {
        ...EMPTY_APP_DATABASE_CAPABILITIES,
        localEmbeddings: true,
      },
    };
  }
  protected meta: Record<string, unknown> = {};
  protected metadataSnapshot: MetadataCacheSnapshot | null = null;
  protected searchEmbeddingProviderConfig: SearchEmbeddingProviderConfig | null =
    null;
  protected searchEmbeddingProvider: SearchEmbeddingProvider | null = null;
  protected searchIndexStatsByPath = new Map<
    string,
    AppDatabaseSearchIndexStats
  >();
  protected searchIndexStats: AppDatabaseSearchIndexStats = {
    documentCount: 0,
    chunkCount: 0,
    readyChunkCount: 0,
    pendingChunkCount: 0,
    errorChunkCount: 0,
    lastError: null,
  };
  protected searchIndexLastErrorPath: string | null = null;
  protected historyFiles = new Map<string, AppDatabaseFileHistoryFile>();
  protected historyFileIdsByPath = new Map<string, string>();
  protected historyRevisions = new Map<
    string,
    AppDatabaseFileHistoryRevision[]
  >();
  protected files = new Map<string, AppDatabaseFileRecord>();
  protected metadata = new Map<string, AppDatabaseMetadataRecord>();
  protected links = new Map<string, AppDatabaseLinkRecord[]>();
  protected tags = new Map<string, AppDatabaseTagRecord[]>();
  protected properties = new Map<string, AppDatabasePropertyRecord[]>();
  protected searchDocs = new Map<string, SearchDocumentRecord>();
  protected tasks = new Map<string, AppDatabaseTaskRecord>();
  protected projections = new Map<string, IndexProjectionDefinitionRecord>();
  protected projectionSources = new Map<string, IndexProjectionSourceRecord>();
  protected projectionRows = new Map<string, IndexProjectionRowRecord>();
  protected projectionValues: IndexProjectionValueRecord[] = [];
  protected projectionEdges: IndexProjectionEdgeRecord[] = [];
  protected projectionRevision = 0;
  protected changeRevision = 0;
  private readonly changeListeners = new Set<AppDatabaseChangeListener>();

  constructor(readonly vaultId: string) {}

  async open(): Promise<void> {
    await this.migrate();
  }

  async migrate(): Promise<void> {
    this.meta["schema.version"] = APP_DATABASE_SCHEMA_VERSION;
  }

  async close(): Promise<void> {
    await this.searchEmbeddingProvider?.dispose?.();
    this.searchEmbeddingProvider = null;
  }

  async beginSearchIndexingBatch(): Promise<void> {}

  async endSearchIndexingBatch(): Promise<void> {}

  async configureSearchEmbeddingProvider(
    provider: SearchEmbeddingProviderConfig | null,
  ): Promise<void> {
    const previousProvider = clone(this.searchEmbeddingProviderConfig);
    const nextProvider = clone(provider);

    const providerChanged =
      JSON.stringify(previousProvider) !== JSON.stringify(nextProvider);

    if (!providerChanged) {
      return;
    }

    const previousRuntime = this.searchEmbeddingProvider;
    this.searchEmbeddingProviderConfig = nextProvider;
    this.searchEmbeddingProvider = createSearchEmbeddingProvider(nextProvider);
    await previousRuntime?.dispose?.();

    if (this.searchDocs.size === 0) {
      this.emitChange(["search"]);
      return;
    }

    this.searchDocs = new Map(
      [...this.searchDocs.values()].map((document) => {
        const rebound = this.rebindSearchDocumentForProvider(document);
        return [rebound.path, rebound];
      }),
    );
    this.rebuildSearchIndexStats();
    this.emitChange(["search"]);
  }

  async getSearchEmbeddingProvider(): Promise<SearchEmbeddingProviderConfig | null> {
    return clone(this.searchEmbeddingProviderConfig);
  }

  async getSearchEmbeddingRuntimeStatus(): Promise<SearchEmbeddingRuntimeStatus | null> {
    return this.searchEmbeddingProvider
      ? clone(this.searchEmbeddingProvider.getRuntimeStatus())
      : null;
  }

  async getSearchIndexStats(): Promise<AppDatabaseSearchIndexStats> {
    return clone(this.searchIndexStats);
  }

  async getMeta<T = unknown>(key: string): Promise<T | undefined> {
    return clone(this.meta[key]) as T | undefined;
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    this.meta[key] = clone(value);
    this.emitChange(["meta"]);
  }

  async getNotebookState(
    sourcePath: string,
  ): Promise<AppDatabaseNotebookState | undefined> {
    return this.getMeta<AppDatabaseNotebookState>(
      notebookStateMetaKey(sourcePath),
    );
  }

  async setNotebookState(
    sourcePath: string,
    state: AppDatabaseNotebookState,
  ): Promise<void> {
    this.meta[notebookStateMetaKey(sourcePath)] = clone(state);
    this.emitChange(["notebook"], [sourcePath]);
  }

  async deleteNotebookState(sourcePath: string): Promise<void> {
    delete this.meta[notebookStateMetaKey(sourcePath)];
    this.emitChange(["notebook"], [sourcePath]);
  }

  async loadMetadataSnapshot(): Promise<MetadataCacheSnapshot | null> {
    return clone(this.metadataSnapshot);
  }

  async saveMetadataSnapshot(snapshot: MetadataCacheSnapshot): Promise<void> {
    this.metadataSnapshot = clone(snapshot);
    this.emitChange(["metadata"]);
  }

  async getFileHistory(path: string): Promise<AppDatabaseFileHistory | null> {
    const fileId = this.historyFileIdsByPath.get(path);
    if (!fileId) {
      return null;
    }

    const file = this.historyFiles.get(fileId);
    if (!file) {
      return null;
    }

    return clone({
      file,
      revisions: this.historyRevisions.get(fileId) ?? [],
    });
  }

  async storeFileHistoryRevision(
    input: AppDatabaseStoreFileHistoryRevisionInput,
  ): Promise<AppDatabaseStoreFileHistoryRevisionResult> {
    const existingFile = this.resolveFileHistoryFile(
      input.path,
      input.previousPath,
    );
    const file = existingFile ?? {
      fileId: createAppDatabaseStableId("history-file"),
      currentPath: input.path,
      deleted: false,
    };
    const latestRevision = this.historyRevisions.get(file.fileId)?.at(-1);
    const content = input.content ?? latestRevision?.content ?? "";
    const contentHash =
      input.contentHash ??
      latestRevision?.contentHash ??
      hashAppDatabaseText(content);
    const deduplicated =
      shouldDeduplicateFileHistoryEvent(input.eventType) &&
      !file.deleted &&
      latestRevision?.contentHash === contentHash;

    if (deduplicated) {
      return {
        fileId: file.fileId,
        stored: false,
        deduplicated: true,
      };
    }

    if (input.previousPath && input.previousPath !== input.path) {
      this.historyFileIdsByPath.delete(input.previousPath);
    }

    const nextFile: AppDatabaseFileHistoryFile = {
      fileId: file.fileId,
      currentPath: input.path,
      deleted: input.eventType === "delete",
    };
    this.historyFiles.set(nextFile.fileId, nextFile);
    this.historyFileIdsByPath.set(nextFile.currentPath, nextFile.fileId);

    const previousRevisions = this.historyRevisions.get(nextFile.fileId) ?? [];
    const revision: AppDatabaseFileHistoryRevision =
      input.replaceLatest && latestRevision
        ? {
            ...latestRevision,
            currentPath: nextFile.currentPath,
            capturedPath:
              input.eventType === "rename" && input.previousPath
                ? input.previousPath
                : input.path,
            eventType: input.eventType,
            createdAt: input.createdAt,
            sourceMtime: input.sourceMtime,
            sourceSize: input.sourceSize,
            contentHash,
            content,
          }
        : {
            revisionId: createAppDatabaseStableId("history-revision"),
            fileId: nextFile.fileId,
            currentPath: nextFile.currentPath,
            capturedPath:
              input.eventType === "rename" && input.previousPath
                ? input.previousPath
                : input.path,
            eventType: input.eventType,
            createdAt: input.createdAt,
            sourceMtime: input.sourceMtime,
            sourceSize: input.sourceSize,
            contentHash,
            content,
          };
    const maxRevisions = input.maxRevisions ?? Number.POSITIVE_INFINITY;
    const nextRevisions = (
      input.replaceLatest && latestRevision
        ? [...previousRevisions.slice(0, -1), revision]
        : [...previousRevisions, revision]
    ).slice(-Math.max(1, maxRevisions));
    this.historyRevisions.set(nextFile.fileId, nextRevisions);
    this.emitChange(["history"], [input.path]);

    return {
      fileId: nextFile.fileId,
      stored: true,
      deduplicated: false,
      revision: clone(revision),
    };
  }

  async listNotifications(): Promise<AppDatabaseNotificationRecord[]> {
    const records =
      (await this.getMeta<AppDatabaseNotificationRecord[]>(
        NOTIFICATIONS_META_KEY,
      )) ?? [];
    return records
      .filter((record) => !record.cleared)
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((record) => clone(record));
  }

  async upsertNotification(
    record: AppDatabaseNotificationRecord,
  ): Promise<void> {
    const records =
      (await this.getMeta<AppDatabaseNotificationRecord[]>(
        NOTIFICATIONS_META_KEY,
      )) ?? [];
    const next = new Map(records.map((entry) => [entry.id, entry]));
    next.set(record.id, clone(record));
    this.meta[NOTIFICATIONS_META_KEY] = clone([...next.values()]);
    this.emitChange(["notification"]);
  }

  async markNotificationRead(id: string): Promise<void> {
    const records =
      (await this.getMeta<AppDatabaseNotificationRecord[]>(
        NOTIFICATIONS_META_KEY,
      )) ?? [];
    const now = Date.now();
    this.meta[NOTIFICATIONS_META_KEY] = clone(
      records.map((record) =>
        record.id === id ? { ...record, read: true, updatedAt: now } : record,
      ),
    );
    this.emitChange(["notification"]);
  }

  async clearNotification(id: string): Promise<void> {
    const records =
      (await this.getMeta<AppDatabaseNotificationRecord[]>(
        NOTIFICATIONS_META_KEY,
      )) ?? [];
    const now = Date.now();
    this.meta[NOTIFICATIONS_META_KEY] = clone(
      records.map((record) =>
        record.id === id
          ? { ...record, cleared: true, updatedAt: now }
          : record,
      ),
    );
    this.emitChange(["notification"]);
  }

  async clearAllNotifications(): Promise<void> {
    const records =
      (await this.getMeta<AppDatabaseNotificationRecord[]>(
        NOTIFICATIONS_META_KEY,
      )) ?? [];
    const now = Date.now();
    this.meta[NOTIFICATIONS_META_KEY] = clone(
      records.map((record) => ({ ...record, cleared: true, updatedAt: now })),
    );
    this.emitChange(["notification"]);
  }

  async getChangeRevision(): Promise<number> {
    return this.changeRevision;
  }

  subscribeToChanges(listener: AppDatabaseChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  async upsertIndexedFile(record: AppDatabaseIndexedFile): Promise<void> {
    this.files.set(record.file.path, clone({ ...record.file, deleted: false }));
    this.metadata.set(record.metadata.path, clone(record.metadata));
    this.links.set(record.file.path, clone(record.links));
    this.tags.set(record.file.path, clone(record.tags));
    this.properties.set(record.file.path, clone(record.properties));
    if (record.task) {
      await this.upsertTaskProjection(record.task);
    } else if (record.task === null) {
      await this.deleteTaskProjection(record.file.path);
    }
    this.emitChange(["metadata"], [record.file.path]);
  }

  async deleteIndexedFile(path: string): Promise<void> {
    const existing = this.files.get(path);
    if (existing) {
      this.files.set(path, { ...existing, deleted: true, indexed: false });
    }
    delete this.meta[notebookStateMetaKey(path)];
    this.metadata.delete(path);
    this.links.delete(path);
    this.tags.delete(path);
    this.properties.delete(path);
    this.searchDocs.delete(path);
    this.tasks.delete(path);
    for (const definition of this.projections.values()) {
      this.removeProjectionSource(definition.projectionId, path);
    }
    this.emitChange(["metadata", "search", "task", "projection"], [path]);
  }

  async renameIndexedFile(oldPath: string, newPath: string): Promise<void> {
    const file = this.files.get(oldPath);
    if (file) {
      this.files.delete(oldPath);
      this.files.set(newPath, {
        ...file,
        path: newPath,
        normalizedPath: newPath,
      });
    }
    const notebookState = this.meta[notebookStateMetaKey(oldPath)];
    if (notebookState !== undefined) {
      delete this.meta[notebookStateMetaKey(oldPath)];
      this.meta[notebookStateMetaKey(newPath)] = clone({
        ...(notebookState as AppDatabaseNotebookState),
        sourcePath: newPath,
      });
    }
    const metadata = this.metadata.get(oldPath);
    if (metadata) {
      this.metadata.delete(oldPath);
      this.metadata.set(newPath, { ...metadata, path: newPath });
    }
    const links = this.links.get(oldPath);
    if (links) {
      this.links.delete(oldPath);
      this.links.set(
        newPath,
        links.map((link) => ({ ...link, sourcePath: newPath })),
      );
    }
    const tags = this.tags.get(oldPath);
    if (tags) {
      this.tags.delete(oldPath);
      this.tags.set(
        newPath,
        tags.map((tag) => ({ ...tag, path: newPath })),
      );
    }
    const properties = this.properties.get(oldPath);
    if (properties) {
      this.properties.delete(oldPath);
      this.properties.set(
        newPath,
        properties.map((property) => ({ ...property, path: newPath })),
      );
    }
    const task = this.tasks.get(oldPath);
    if (task) {
      this.tasks.delete(oldPath);
      this.tasks.set(newPath, { ...task, documentPath: newPath });
    }
    this.renameProjectionSources(oldPath, newPath);
    const searchDoc = this.searchDocs.get(oldPath);
    if (searchDoc) {
      this.searchDocs.delete(oldPath);
      this.searchDocs.set(newPath, {
        ...searchDoc,
        path: newPath,
        chunks: searchDoc.chunks?.map((chunk) => ({
          ...chunk,
          id: renameChunkId(chunk.id, oldPath, newPath),
        })),
      });
      const stats = this.searchIndexStatsByPath.get(oldPath);
      if (stats) {
        this.searchIndexStatsByPath.delete(oldPath);
        this.searchIndexStatsByPath.set(newPath, stats);
        if (this.searchIndexLastErrorPath === oldPath) {
          this.searchIndexLastErrorPath = newPath;
        }
      }
    }
    this.emitChange(
      ["metadata", "search", "task", "projection", "notebook"],
      [oldPath, newPath],
      [{ oldPath, newPath }],
    );
  }

  async getIndexedFile(
    path: string,
  ): Promise<AppDatabaseIndexedMetadataRow | undefined> {
    return clone(this.materializeIndexedMetadataRows([path])[0]);
  }

  async listIndexedFileManifest(
    query: AppDatabaseIndexedFileManifestQuery = {},
  ): Promise<AppDatabaseIndexedFileManifestPage> {
    const limit = Math.max(1, query.limit ?? 500);
    const requestedPaths = query.paths?.length ? new Set(query.paths) : null;
    const rows = [...this.files.values()]
      .filter(
        (file) =>
          file.indexed &&
          !file.deleted &&
          (!query.after || file.path > query.after) &&
          (!requestedPaths || requestedPaths.has(file.path)),
      )
      .sort((left, right) =>
        left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
      );
    const page = rows.slice(0, limit).map((file) => ({
      ...file,
      parserVersion: this.metadata.get(file.path)?.parserVersion,
    }));
    return clone({
      rows: page,
      nextCursor: rows.length > page.length ? page.at(-1)?.path : undefined,
    });
  }

  async queryIndexedMetadata(
    query: AppDatabaseIndexedMetadataQuery = {},
  ): Promise<AppDatabaseIndexedMetadataRow[]> {
    const rows = this.materializeIndexedMetadataRows();
    return clone(this.applyIndexedMetadataQuery(rows, query));
  }

  async queryIndexedMetadataPage(
    input: AppDatabaseIndexedMetadataPageQuery = {},
  ): Promise<AppDatabaseIndexedMetadataPage> {
    const limit = Math.max(1, input.limit ?? input.query?.limit ?? 100);
    const query = { ...(input.query ?? {}), limit: undefined };
    const rows = this.applyIndexedMetadataQuery(
      this.materializeIndexedMetadataRows(),
      query,
    ).filter((row) => !input.after || row.file.path > input.after);
    const page = rows.slice(0, limit);
    return clone({
      rows: page,
      nextCursor:
        rows.length > page.length ? page.at(-1)?.file.path : undefined,
    });
  }

  async queryMetadataFacets(
    query: AppDatabaseMetadataFacetQuery,
  ): Promise<AppDatabaseMetadataFacetRow[]> {
    const matchesPath = (path: string) =>
      !query.pathPrefixes?.length ||
      query.pathPrefixes.some((prefix) =>
        matchesIndexedMetadataPathPrefix(path, prefix),
      );
    const counts = new Map<string, AppDatabaseMetadataFacetRow>();
    const types = new Map<string, Set<string>>();
    const add = (
      value: AppDatabaseIndexedMetadataScalar,
      valueType: AppDatabaseMetadataFacetRow["valueType"],
      metadataType?: string,
      topLevel?: boolean,
    ) => {
      const key = `${valueType}\0${String(value)}`;
      const current = counts.get(key);
      counts.set(key, {
        value,
        valueType,
        count: (current?.count ?? 0) + 1,
        topLevel: topLevel ?? current?.topLevel,
      });
      if (metadataType) {
        const observed = types.get(key) ?? new Set<string>();
        observed.add(metadataType);
        types.set(key, observed);
      }
    };
    if (query.kind === "tag") {
      for (const [path, tags] of this.tags) {
        if (!matchesPath(path)) continue;
        for (const tag of new Set(tags.flatMap((entry) => entry.hierarchy)))
          add(tag, "string");
      }
    } else if (query.kind === "property-name") {
      for (const [path, properties] of this.properties) {
        if (!matchesPath(path)) continue;
        const unique = new Map(properties.map((entry) => [entry.name, entry]));
        for (const property of unique.values()) {
          add(
            property.name,
            "string",
            property.declaredType ?? property.inferredType,
            true,
          );
        }
      }
    } else if (query.kind === "property-path") {
      for (const [path, properties] of this.properties) {
        if (!matchesPath(path)) continue;
        const unique = new Map<string, { type: string; topLevel: boolean }>();
        for (const property of properties) {
          unique.set(property.name, {
            type: property.declaredType ?? property.inferredType,
            topLevel: true,
          });
          for (const entry of flattenIndexedMetadataPropertyValues(
            property.value,
            property.name,
          )) {
            const type =
              entry.value === null
                ? "unknown"
                : typeof entry.value === "number"
                  ? "number"
                  : typeof entry.value === "boolean"
                    ? "checkbox"
                    : "text";
            unique.set(entry.path.replace(/\[\d+\]/gu, "[]"), {
              type,
              topLevel: entry.path === property.name,
            });
          }
        }
        for (const [propertyPath, descriptor] of unique) {
          add(propertyPath, "string", descriptor.type, descriptor.topLevel);
        }
      }
    } else if (query.propertyName) {
      for (const [path, properties] of this.properties) {
        if (!matchesPath(path)) continue;
        const seen = new Set<string>();
        for (const scalar of indexedMetadataPropertyValues(
          properties,
          query.propertyName,
        )) {
          const scalarKey = `${typeof scalar}\0${String(scalar)}`;
          if (seen.has(scalarKey)) continue;
          seen.add(scalarKey);
          const type =
            scalar === null
              ? "null"
              : typeof scalar === "number"
                ? "number"
                : typeof scalar === "boolean"
                  ? "boolean"
                  : "string";
          add(scalar, type);
        }
      }
    }
    return [...counts.entries()]
      .map(([key, row]) => ({
        ...row,
        metadataTypes: types.get(key)?.size ? [...types.get(key)!] : undefined,
      }))
      .sort(
        (left, right) =>
          right.count - left.count ||
          String(left.value).localeCompare(String(right.value)),
      )
      .slice(0, query.limit ?? 100);
  }

  async queryMetadataLinks(
    query: AppDatabaseMetadataLinkQuery,
  ): Promise<AppDatabaseLinkRecord[]> {
    const paths = new Set([
      ...(query.paths ?? []),
      ...(query.path ? [query.path] : []),
    ]);
    if (!paths.size) return [];
    const links =
      query.direction === "outgoing"
        ? [...paths].flatMap((path) => this.links.get(path) ?? [])
        : [...this.links.values()]
            .flat()
            .filter((link) =>
              link.resolvedTargetPath
                ? paths.has(link.resolvedTargetPath)
                : false,
            );
    return clone(
      links
        .filter((link) => {
          if (query.resolution === "resolved")
            return link.resolvedTargetPath != null;
          if (query.resolution === "unresolved")
            return link.resolvedTargetPath == null;
          return true;
        })
        .sort(
          (left, right) =>
            left.sourcePath.localeCompare(right.sourcePath) ||
            (left.ordinal ?? 0) - (right.ordinal ?? 0),
        )
        .slice(0, query.limit ?? 1000),
    );
  }

  async upsertSearchDocument(document: SearchDocumentRecord): Promise<void> {
    const prepared = await this.prepareSearchDocument(document);
    this.searchDocs.set(prepared.path, clone(prepared));
    this.updateSearchIndexStatsForDocument(prepared.path, prepared);
    this.emitChange(["search"], [prepared.path]);
  }

  async deleteSearchDocument(path: string): Promise<void> {
    this.searchDocs.delete(path);
    this.deleteSearchIndexStatsForPath(path);
    this.emitChange(["search"], [path]);
  }

  async getSearchDocument(
    path: string,
  ): Promise<SearchDocumentRecord | undefined> {
    return clone(this.searchDocs.get(path));
  }

  async listSearchDocumentManifest(
    query: SearchDocumentManifestQuery = {},
  ): Promise<SearchDocumentManifestPage> {
    const limit = Math.max(1, query.limit ?? 500);
    const rows = [...this.searchDocs.values()]
      .filter((document) => !query.after || document.path > query.after)
      .sort((left, right) =>
        left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
      );
    const page = rows.slice(0, limit).map((document) => ({
      path: document.path,
      checksum: document.checksum,
      sourceProviderId: document.sourceProviderId,
      metadataHash: document.sourceMetadata?.metadataHash,
      providerVersion: document.sourceMetadata?.providerVersion,
      projectionSignature: document.sourceMetadata?.projectionSignature,
      sourceMtime: document.sourceMetadata?.sourceMtime,
      sourceSize: document.sourceMetadata?.sourceSize,
    }));
    return clone({
      rows: page,
      nextCursor: rows.length > page.length ? page.at(-1)?.path : undefined,
    });
  }

  async listSearchDocuments(): Promise<SearchDocumentRecord[]> {
    return [...this.searchDocs.values()].map((document) => clone(document));
  }

  async rebuildSearchIndex(): Promise<void> {
    this.rebuildSearchIndexStats();
    this.emitChange(["search"]);
  }

  protected async prepareSearchDocument(
    document: SearchDocumentRecord,
  ): Promise<SearchDocumentRecord> {
    const normalizedDocument = normalizeSearchDocument(document);
    const provider = this.searchEmbeddingProvider;
    if (!provider || !normalizedDocument.chunks?.length) {
      return clone(normalizedDocument);
    }

    try {
      const ready = await provider.ready();
      if (!ready) {
        return {
          ...clone(normalizedDocument),
          chunks: normalizedDocument.chunks.map((chunk) => ({
            ...clone(chunk),
            embedding: {
              ...clone(chunk.embedding),
              status: "pending",
              modelId: provider.config.modelId ?? "lapis/token-hash-v0",
              modelVersion: provider.config.modelVersion,
              dimensions: provider.config.dimensions,
            },
          })),
        };
      }

      const embeddings = new Map(
        (await provider.embedDocument(normalizedDocument)).map((entry) => [
          entry.chunkId,
          entry,
        ]),
      );
      const timestamp = Date.now();

      return {
        ...clone(normalizedDocument),
        chunks: normalizedDocument.chunks.map((chunk) => {
          const embedding = embeddings.get(chunk.id);
          if (!embedding) {
            return clone(chunk);
          }

          return {
            ...clone(chunk),
            embedding: {
              status: "ready",
              modelId: provider.config.modelId ?? "lapis/token-hash-v0",
              modelVersion: provider.config.modelVersion,
              dimensions: embedding.vector.length,
              vector: [...embedding.vector],
              fingerprint: embedding.fingerprint,
              dirty: false,
              updatedAt: timestamp,
            },
          };
        }),
      };
    } catch (error) {
      return embeddingErrorState(normalizedDocument, provider, error);
    }
  }

  async searchDocuments(
    query: string,
    options: AppDatabaseSearchOptions = {},
  ): Promise<AppDatabaseSearchResult[]> {
    return this.searchDocumentsForPaths(query, options);
  }

  async upsertTaskProjection(record: AppDatabaseTaskRecord): Promise<void> {
    this.tasks.set(record.documentPath, clone(record));
    await this.ensureTasksProjectionDefinition();
    await this.replaceProjectionSource({
      projectionId: PUBLIC_TASKS_PROJECTION_ID,
      sourcePath: record.documentPath,
      sourceHash:
        this.files.get(record.documentPath)?.hash ?? record.documentId,
      rows: [{ id: record.documentId, kind: record.kind, data: { ...record } }],
    });
    this.emitChange(["task"], [record.documentPath]);
  }

  async deleteTaskProjection(path: string): Promise<void> {
    this.tasks.delete(path);
    this.removeProjectionSource(PUBLIC_TASKS_PROJECTION_ID, path);
    this.emitChange(["task", "projection"], [path]);
  }

  async queryTasks(
    query: AppDatabaseTaskQuery = {},
  ): Promise<AppDatabaseTaskRecord[]> {
    const result = await this.queryProjection<AppDatabaseTaskRecord>(
      PUBLIC_TASKS_PROJECTION_ID,
      taskQueryToIndexQuery(query),
    );
    return clone(result.rows);
  }

  async getTaskRow(lookup: {
    path?: string;
    id?: string;
  }): Promise<AppDatabaseTaskRecord | undefined> {
    if (lookup.id) {
      const row = await this.getProjectionRow<AppDatabaseTaskRecord>(
        PUBLIC_TASKS_PROJECTION_ID,
        lookup.id,
      );
      return row ?? undefined;
    }
    if (lookup.path) {
      const result = await this.queryProjection<AppDatabaseTaskRecord>(
        PUBLIC_TASKS_PROJECTION_ID,
        {
          where: {
            op: "compare",
            field: "documentPath",
            comparison: "eq",
            value: lookup.path,
          },
        },
      );
      return result.rows[0];
    }
    return undefined;
  }

  async registerProjectionDefinition(
    definition: IndexProjectionDefinitionRecord,
  ): Promise<void> {
    this.projections.set(
      definition.projectionId,
      clone({ ...definition, active: true }),
    );
    this.projectionRevision += 1;
    this.emitChange(["projection"]);
  }

  async unregisterProjectionDefinition(projectionId: string): Promise<void> {
    const existing = this.projections.get(projectionId);
    if (!existing) return;
    this.projections.set(projectionId, { ...existing, active: false });
    this.projectionRevision += 1;
    this.emitChange(["projection"]);
  }

  async replaceProjectionSource(
    input: ReplaceProjectionSourceInput,
  ): Promise<void> {
    assertProjectionWriteAccess(input.projectionId, input.writerPluginId);
    const definition = this.projections.get(input.projectionId);
    if (!definition?.active) {
      throw new Error(`Projection ${input.projectionId} is not registered.`);
    }
    if (input.rows.length > MAX_PROJECTION_ROWS_PER_SOURCE) {
      throw new Error("Projection exceeded the maximum rows per source file.");
    }
    this.removeProjectionSource(input.projectionId, input.sourcePath);
    this.projectionSources.set(
      this.projectionSourceKey(input.projectionId, input.sourcePath),
      {
        projectionId: input.projectionId,
        sourcePath: input.sourcePath,
        sourceHash: input.sourceHash,
        schemaVersion: definition.schemaVersion,
        configHash: definition.configHash,
        status: "ready",
        error: null,
        indexedAt: Date.now(),
      },
    );
    for (const row of input.rows) {
      const record: IndexProjectionRowRecord = {
        projectionId: input.projectionId,
        rowId: row.id,
        sourcePath: input.sourcePath,
        kind: row.kind,
        ordinal: row.ordinal ?? 0,
        data: clone(row.data),
      };
      this.projectionRows.set(
        this.projectionRowKey(input.projectionId, row.id),
        record,
      );
      this.projectionValues.push(
        ...indexedValuesForRow(input.projectionId, row, definition.fields),
      );
    }
    for (const edge of input.edges ?? []) {
      this.projectionEdges.push({
        projectionId: input.projectionId,
        ...edge,
        targetProjectionId: edge.targetProjectionId ?? input.projectionId,
        data: edge.data ?? null,
      });
    }
    this.projectionRevision += 1;
    this.emitChange(["projection"], [input.sourcePath]);
  }

  async markProjectionSourceError(
    input: MarkProjectionSourceErrorInput,
  ): Promise<void> {
    assertProjectionWriteAccess(input.projectionId, input.writerPluginId);
    const definition = this.projections.get(input.projectionId);
    this.removeProjectionSource(input.projectionId, input.sourcePath);
    this.projectionSources.set(
      this.projectionSourceKey(input.projectionId, input.sourcePath),
      {
        projectionId: input.projectionId,
        sourcePath: input.sourcePath,
        sourceHash: input.sourceHash,
        schemaVersion: definition?.schemaVersion ?? 0,
        configHash: definition?.configHash ?? "",
        status: "error",
        error: input.error,
        indexedAt: Date.now(),
      },
    );
    this.projectionRevision += 1;
    this.emitChange(["projection"], [input.sourcePath]);
  }

  async deleteProjectionSource(
    projectionId: string,
    sourcePath: string,
    writerPluginId?: string,
  ): Promise<void> {
    assertProjectionWriteAccess(projectionId, writerPluginId);
    this.removeProjectionSource(projectionId, sourcePath);
    this.projectionRevision += 1;
    this.emitChange(["projection"], [sourcePath]);
  }

  async queryProjection<T = Record<string, unknown>>(
    projectionId: string,
    query: IndexQuery = {},
    readerPluginId?: string,
  ): Promise<IndexQueryResult<T>> {
    const definition = this.projections.get(projectionId);
    assertProjectionReadAccess(definition, readerPluginId);
    const sources = [...this.projectionSources.values()].filter(
      (source) => source.projectionId === projectionId,
    );
    const rows = [...this.projectionRows.values()].filter((row) => {
      if (row.projectionId !== projectionId) return false;
      const source = this.projectionSources.get(
        this.projectionSourceKey(projectionId, row.sourcePath),
      );
      const file = this.files.get(row.sourcePath);
      return Boolean(
        source &&
          definition &&
          sourceIsCurrent(source, file?.hash, definition, query.includeStale),
      );
    });
    return evaluateProjectionQuery<T>(
      rows,
      query,
      this.projectionRevision,
      projectionIndexStatus(sources),
    );
  }

  async getProjectionRow<T = Record<string, unknown>>(
    projectionId: string,
    rowId: string,
    readerPluginId?: string,
  ): Promise<T | null> {
    const definition = this.projections.get(projectionId);
    assertProjectionReadAccess(definition, readerPluginId);
    const row = this.projectionRows.get(
      this.projectionRowKey(projectionId, rowId),
    );
    if (!row) {
      const byDocumentId = [...this.projectionRows.values()].find(
        (candidate) =>
          candidate.projectionId === projectionId &&
          (candidate.data.documentId === rowId || candidate.data.id === rowId),
      );
      if (!byDocumentId) return null;
      return this.currentProjectionData(byDocumentId, definition);
    }
    return this.currentProjectionData(row, definition);
  }

  private currentProjectionData<T>(
    row: IndexProjectionRowRecord,
    definition: IndexProjectionDefinitionRecord | undefined,
  ): T | null {
    const source = this.projectionSources.get(
      this.projectionSourceKey(row.projectionId, row.sourcePath),
    );
    const file = this.files.get(row.sourcePath);
    if (
      !source ||
      !definition ||
      !sourceIsCurrent(source, file?.hash, definition)
    ) {
      return null;
    }
    return clone(row.data) as T;
  }

  async queryRelated<T = Record<string, unknown>>(
    query: IndexRelatedQuery,
    readerPluginId?: string,
  ): Promise<IndexQueryResult<T>> {
    const definition = this.projections.get(query.projectionId);
    assertProjectionReadAccess(definition, readerPluginId);
    const matching = this.projectionEdges
      .filter(
        (edge) =>
          edge.projectionId === query.projectionId &&
          edge.relation === query.relation,
      )
      .filter((edge) => {
        if (query.direction !== "in") return edge.sourceRowId === query.rowId;
        if (edge.targetRowId === query.rowId) return true;
        const target = [...this.projectionRows.values()].find(
          (row) =>
            row.projectionId === query.projectionId &&
            row.rowId === query.rowId,
        );
        return Boolean(target && edge.targetPath === target.sourcePath);
      })
      .sort((left, right) => left.ordinal - right.ordinal);
    const rows: IndexProjectionRowRecord[] = [];
    for (const edge of matching) {
      const targetProjection =
        query.direction === "in"
          ? edge.projectionId
          : (edge.targetProjectionId ?? query.projectionId);
      const row =
        query.direction === "in"
          ? this.projectionRows.get(
              this.projectionRowKey(targetProjection, edge.sourceRowId),
            )
          : edge.targetRowId
            ? this.projectionRows.get(
                this.projectionRowKey(targetProjection, edge.targetRowId),
              )
            : [...this.projectionRows.values()].find(
                (candidate) =>
                  candidate.projectionId === targetProjection &&
                  candidate.sourcePath === edge.targetPath,
              );
      if (!row) continue;
      if (
        query.targetWhere &&
        !evaluateProjectionQuery(
          [row],
          { where: query.targetWhere },
          0,
          "ready",
        ).rows.length
      ) {
        continue;
      }
      rows.push(row);
    }
    return evaluateProjectionQuery<T>(
      rows,
      { limit: query.limit },
      this.projectionRevision,
      "ready",
    );
  }

  private async ensureTasksProjectionDefinition(): Promise<void> {
    if (this.projections.get(PUBLIC_TASKS_PROJECTION_ID)?.active) return;
    await this.registerProjectionDefinition({
      projectionId: PUBLIC_TASKS_PROJECTION_ID,
      ownerPluginId: "tasks",
      schemaVersion: TASK_PROJECTION_VERSION,
      configHash: "",
      visibility: "public",
      fields: TASK_PROJECTION_FIELDS,
      active: true,
      updatedAt: Date.now(),
    });
  }

  private projectionSourceKey(
    projectionId: string,
    sourcePath: string,
  ): string {
    return `${projectionId}\0${sourcePath}`;
  }

  private projectionRowKey(projectionId: string, rowId: string): string {
    return `${projectionId}\0${rowId}`;
  }

  private removeProjectionSource(
    projectionId: string,
    sourcePath: string,
  ): void {
    this.projectionSources.delete(
      this.projectionSourceKey(projectionId, sourcePath),
    );
    for (const [key, row] of this.projectionRows) {
      if (row.projectionId === projectionId && row.sourcePath === sourcePath) {
        this.projectionRows.delete(key);
      }
    }
    this.projectionValues = this.projectionValues.filter(
      (value) =>
        !(
          value.projectionId === projectionId &&
          [...this.projectionRows.values()].every(
            (row) =>
              !(
                row.projectionId === projectionId &&
                row.sourcePath === sourcePath &&
                row.rowId === value.rowId
              ),
          )
        ),
    );
    this.projectionEdges = this.projectionEdges.filter((edge) => {
      if (edge.projectionId !== projectionId) return true;
      const sourceRow = this.projectionRows.get(
        this.projectionRowKey(projectionId, edge.sourceRowId),
      );
      return Boolean(sourceRow);
    });
  }

  private renameProjectionSources(oldPath: string, newPath: string): void {
    for (const [key, source] of this.projectionSources) {
      if (source.sourcePath !== oldPath) continue;
      this.projectionSources.delete(key);
      this.projectionSources.set(
        this.projectionSourceKey(source.projectionId, newPath),
        {
          ...source,
          sourcePath: newPath,
        },
      );
    }
    for (const [key, row] of this.projectionRows) {
      if (row.sourcePath !== oldPath) continue;
      this.projectionRows.delete(key);
      this.projectionRows.set(key, { ...row, sourcePath: newPath });
    }
    this.projectionEdges = this.projectionEdges.map((edge) =>
      edge.targetPath === oldPath ? { ...edge, targetPath: newPath } : edge,
    );
  }

  async listChildLinks(
    query: AppDatabaseTaskChildQuery,
  ): Promise<AppDatabaseLinkRecord[]> {
    const links = this.links.get(query.sourcePath) ?? [];
    return clone(
      links
        .filter((link) => !query.kind || link.kind === query.kind)
        .sort((left, right) => (left.ordinal ?? 0) - (right.ordinal ?? 0)),
    );
  }

  async listTaskDescendants(path: string): Promise<AppDatabaseTaskRecord[]> {
    const projectionId = PUBLIC_TASKS_PROJECTION_ID;
    const source = [...this.projectionRows.values()].find(
      (row) => row.projectionId === projectionId && row.sourcePath === path,
    );
    if (!source) return [];
    const seen = new Set<string>([source.rowId]);
    const results: AppDatabaseTaskRecord[] = [];
    const visit = (sourceRowId: string) => {
      for (const edge of this.projectionEdges) {
        if (
          edge.projectionId !== projectionId ||
          edge.sourceRowId !== sourceRowId ||
          (edge.relation !== "task-entry" && edge.relation !== "list-entry")
        ) {
          continue;
        }
        const targetProjection = edge.targetProjectionId ?? projectionId;
        const target = edge.targetRowId
          ? this.projectionRows.get(
              this.projectionRowKey(targetProjection, edge.targetRowId),
            )
          : [...this.projectionRows.values()].find(
              (row) =>
                row.projectionId === targetProjection &&
                row.sourcePath === edge.targetPath,
            );
        if (!target || seen.has(target.rowId)) continue;
        const current = this.currentProjectionData<AppDatabaseTaskRecord>(
          target,
          this.projections.get(target.projectionId),
        );
        if (!current) continue;
        seen.add(target.rowId);
        results.push(current);
        visit(target.rowId);
      }
    };
    visit(source.rowId);
    return results;
  }

  protected async searchDocumentsForPaths(
    query: string,
    options: AppDatabaseSearchOptions = {},
    candidatePaths?: Iterable<string>,
  ): Promise<AppDatabaseSearchResult[]> {
    const propertyNames = searchPropertyNames(query);
    const allowedPaths = candidatePaths ? new Set(candidatePaths) : null;
    const allowedSourceProviders = options.sourceProviderIds?.length
      ? new Set(options.sourceProviderIds)
      : null;
    const sourceDocuments = [...this.searchDocs.values()]
      .filter(
        (document) =>
          (!allowedPaths || allowedPaths.has(document.path)) &&
          pathWithinPrefix(document.path, options.pathPrefix) &&
          (!allowedSourceProviders ||
            (document.sourceProviderId != null &&
              allowedSourceProviders.has(document.sourceProviderId))),
      )
      .map((document) => ({
        document,
        properties: searchDocumentProperties(
          document,
          this.properties.get(document.path) ?? [],
        ),
      }))
      .filter(({ properties }) =>
        hasSearchPropertyNames(properties, propertyNames),
      );
    const limit = options.limit ?? 100;
    const requestedMode = options.mode ?? "auto";
    const queryVector =
      requestedMode === "lexical" || !this.searchEmbeddingProvider
        ? null
        : await this.safeEmbedQuery(query);
    const vectorScores = new Map(
      sourceDocuments.map(({ document }) => [
        document.path,
        queryVector
          ? scoreVectorDocument(document, queryVector)
          : { score: 0, matchedChunkIds: [] },
      ]),
    );
    const lexicalScores = new Map(
      sourceDocuments.map(({ document, properties }) => [
        document.path,
        scoreSearchDocument(document, query, properties, options),
      ]),
    );
    const vectorCandidateCount = [...vectorScores.values()].filter(
      (entry) => entry.score >= MIN_VECTOR_SEARCH_SCORE,
    ).length;
    const appliedMode: AppDatabaseSearchMode = queryVector
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
    const candidateCount = sourceDocuments.length;
    const results = sourceDocuments
      .map(({ document }) =>
        buildSearchResult(document, query, options, {
          backendKind: this.kind,
          appliedMode,
          lexicalScore: lexicalScores.get(document.path) ?? 0,
          vectorScore: vectorScores.get(document.path)?.score ?? 0,
          lexicalCandidateCount: candidateCount,
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
      });

    return this.finalizeSearchResults(results, options, limit);
  }

  protected finalizeSearchResults(
    results: AppDatabaseSearchResult[],
    options: AppDatabaseSearchOptions,
    limit = options.limit ?? 100,
  ): AppDatabaseSearchResult[] {
    const sortedResults = [...results].sort(compareSearchResults);
    const queryEnhancementDiagnostics =
      resolveSearchQueryEnhancementDiagnostics(sortedResults, options);

    return sortedResults.slice(0, limit).map((result) => {
      const cloned = clone(result);
      if (cloned.diagnostics && queryEnhancementDiagnostics) {
        cloned.diagnostics.queryEnhancement = clone(
          queryEnhancementDiagnostics,
        );
      }
      return cloned;
    });
  }

  protected async safeEmbedQuery(query: string): Promise<number[] | null> {
    if (!this.searchEmbeddingProvider) {
      return null;
    }

    try {
      return await this.searchEmbeddingProvider.embedQuery(query);
    } catch {
      return null;
    }
  }

  protected rebindSearchDocumentForProvider(
    document: SearchDocumentRecord,
  ): SearchDocumentRecord {
    const provider = this.searchEmbeddingProvider;
    if (!provider || !document.chunks?.length) {
      return clone(document);
    }

    return {
      ...clone(document),
      chunks: document.chunks.map((chunk) => {
        if (!chunk.text.trim().length) {
          return clone(chunk);
        }

        return {
          ...clone(chunk),
          embedding: {
            status: "pending",
            modelId: provider.config.modelId ?? "lapis/token-hash-v0",
            modelVersion: provider.config.modelVersion,
            dimensions: provider.config.dimensions,
            dirty: true,
          },
        };
      }),
    };
  }

  protected toState(): AppDatabaseState {
    return {
      meta: clone(this.meta),
      metadataSnapshot: clone(this.metadataSnapshot),
      searchEmbeddingProvider: clone(this.searchEmbeddingProviderConfig),
      historyFiles: [...this.historyFiles.values()].map((value) =>
        clone(value),
      ),
      historyRevisions: [...this.historyRevisions.entries()].map(
        ([key, value]) => [key, clone(value)],
      ),
      files: [...this.files.values()].map((value) => clone(value)),
      metadata: [...this.metadata.values()].map((value) => clone(value)),
      links: [...this.links.entries()].map(([key, value]) => [
        key,
        clone(value),
      ]),
      tags: [...this.tags.entries()].map(([key, value]) => [key, clone(value)]),
      properties: [...this.properties.entries()].map(([key, value]) => [
        key,
        clone(value),
      ]),
      searchDocuments: [...this.searchDocs.values()].map((value) =>
        clone(value),
      ),
      tasks: [...this.tasks.values()].map((value) => clone(value)),
      projections: [...this.projections.values()].map((value) => clone(value)),
      projectionSources: [...this.projectionSources.values()].map((value) =>
        clone(value),
      ),
      projectionRows: [...this.projectionRows.values()].map((value) =>
        clone(value),
      ),
      projectionValues: this.projectionValues.map((value) => clone(value)),
      projectionEdges: this.projectionEdges.map((value) => clone(value)),
      projectionRevision: this.projectionRevision,
    };
  }

  protected fromState(state: AppDatabaseState): void {
    this.meta = clone(state.meta ?? {});
    this.metadataSnapshot = clone(state.metadataSnapshot ?? null);
    this.searchEmbeddingProviderConfig = clone(
      state.searchEmbeddingProvider ?? null,
    );
    this.searchEmbeddingProvider = createSearchEmbeddingProvider(
      this.searchEmbeddingProviderConfig,
    );
    this.historyFiles = new Map(
      (state.historyFiles ?? []).map((item) => [item.fileId, item]),
    );
    this.historyFileIdsByPath = new Map(
      [...this.historyFiles.values()].map((item) => [
        item.currentPath,
        item.fileId,
      ]),
    );
    this.historyRevisions = new Map(state.historyRevisions ?? []);
    this.files = new Map((state.files ?? []).map((item) => [item.path, item]));
    this.metadata = new Map(
      (state.metadata ?? []).map((item) => [item.path, item]),
    );
    this.links = new Map(state.links ?? []);
    this.tags = new Map(state.tags ?? []);
    this.properties = new Map(state.properties ?? []);
    this.searchDocs = new Map(
      (state.searchDocuments ?? []).map((item) => [item.path, item]),
    );
    this.tasks = new Map(
      (state.tasks ?? []).map((item) => [item.documentPath, item]),
    );
    this.projections = new Map(
      (state.projections ?? []).map((item) => [item.projectionId, item]),
    );
    this.projectionSources = new Map(
      (state.projectionSources ?? []).map((item) => [
        this.projectionSourceKey(item.projectionId, item.sourcePath),
        item,
      ]),
    );
    this.projectionRows = new Map(
      (state.projectionRows ?? []).map((item) => [
        this.projectionRowKey(item.projectionId, item.rowId),
        item,
      ]),
    );
    this.projectionValues = clone(state.projectionValues ?? []);
    this.projectionEdges = clone(state.projectionEdges ?? []);
    this.projectionRevision = state.projectionRevision ?? 0;
    this.rebuildSearchIndexStats();
  }

  protected rebuildSearchIndexStats(): void {
    this.searchIndexStatsByPath = new Map(
      [...this.searchDocs.values()].map((document) => [
        document.path,
        this.computeSearchIndexStatsForDocument(document),
      ]),
    );
    this.searchIndexStats = {
      documentCount: 0,
      chunkCount: 0,
      readyChunkCount: 0,
      pendingChunkCount: 0,
      errorChunkCount: 0,
      lastError: null,
    };
    this.searchIndexLastErrorPath = null;

    for (const [path, stats] of this.searchIndexStatsByPath) {
      this.addSearchIndexStats(path, stats);
    }
  }

  protected computeSearchIndexStatsForDocument(
    document: SearchDocumentRecord,
  ): AppDatabaseSearchIndexStats {
    const activeModelId = this.searchEmbeddingProviderConfig?.modelId ?? null;
    let chunkCount = 0;
    let readyChunkCount = 0;
    let pendingChunkCount = 0;
    let errorChunkCount = 0;
    let lastError: string | null = null;

    for (const chunk of document.chunks ?? []) {
      chunkCount += 1;
      const embedding = chunk.embedding;
      const staleForActiveProvider = Boolean(
        this.searchEmbeddingProviderConfig &&
          ((activeModelId && embedding?.modelId !== activeModelId) ||
            !embedding),
      );

      if (staleForActiveProvider) {
        pendingChunkCount += 1;
        continue;
      }

      switch (embedding?.status) {
        case "ready":
          readyChunkCount += 1;
          break;
        case "pending":
          pendingChunkCount += 1;
          break;
        case "error":
          errorChunkCount += 1;
          lastError ??= embedding.error ?? null;
          break;
      }
    }

    return {
      documentCount: 1,
      chunkCount,
      readyChunkCount,
      pendingChunkCount,
      errorChunkCount,
      lastError,
    };
  }

  protected updateSearchIndexStatsForDocument(
    path: string,
    document: SearchDocumentRecord,
  ): void {
    const previousStats = this.searchIndexStatsByPath.get(path);
    if (previousStats) {
      this.removeSearchIndexStats(path, previousStats);
    }

    const nextStats = this.computeSearchIndexStatsForDocument(document);
    this.searchIndexStatsByPath.set(path, nextStats);
    this.addSearchIndexStats(path, nextStats);
  }

  protected deleteSearchIndexStatsForPath(path: string): void {
    const previousStats = this.searchIndexStatsByPath.get(path);
    if (!previousStats) {
      return;
    }

    this.removeSearchIndexStats(path, previousStats);
    this.searchIndexStatsByPath.delete(path);
  }

  private addSearchIndexStats(
    path: string,
    stats: AppDatabaseSearchIndexStats,
  ): void {
    this.searchIndexStats.documentCount += stats.documentCount;
    this.searchIndexStats.chunkCount += stats.chunkCount;
    this.searchIndexStats.readyChunkCount += stats.readyChunkCount;
    this.searchIndexStats.pendingChunkCount += stats.pendingChunkCount;
    this.searchIndexStats.errorChunkCount += stats.errorChunkCount;
    if (stats.lastError) {
      this.searchIndexStats.lastError = stats.lastError;
      this.searchIndexLastErrorPath = path;
    }
  }

  private removeSearchIndexStats(
    path: string,
    stats: AppDatabaseSearchIndexStats,
  ): void {
    this.searchIndexStats.documentCount -= stats.documentCount;
    this.searchIndexStats.chunkCount -= stats.chunkCount;
    this.searchIndexStats.readyChunkCount -= stats.readyChunkCount;
    this.searchIndexStats.pendingChunkCount -= stats.pendingChunkCount;
    this.searchIndexStats.errorChunkCount -= stats.errorChunkCount;

    if (this.searchIndexLastErrorPath === path) {
      this.searchIndexStats.lastError = null;
      this.searchIndexLastErrorPath = null;
      for (const [nextPath, nextStats] of this.searchIndexStatsByPath) {
        if (nextPath === path || !nextStats.lastError) {
          continue;
        }
        this.searchIndexStats.lastError = nextStats.lastError;
        this.searchIndexLastErrorPath = nextPath;
      }
    }
  }

  private resolveFileHistoryFile(
    path: string,
    previousPath?: string,
  ): AppDatabaseFileHistoryFile | null {
    const fileId =
      this.historyFileIdsByPath.get(path) ??
      (previousPath ? this.historyFileIdsByPath.get(previousPath) : undefined);
    if (!fileId) {
      return null;
    }

    return this.historyFiles.get(fileId) ?? null;
  }

  protected materializeIndexedMetadataRows(
    candidatePaths?: Iterable<string>,
  ): AppDatabaseIndexedMetadataRow[] {
    const paths = candidatePaths
      ? [...candidatePaths]
      : [...this.files.values()].map((entry) => entry.path);

    return paths
      .map((path) => {
        const file = this.files.get(path);
        if (!file || !file.indexed || file.deleted) {
          return null;
        }

        return {
          file,
          metadata: this.metadata.get(path) ?? null,
          properties: this.properties.get(path) ?? [],
          tags: this.tags.get(path) ?? [],
          links: this.links.get(path) ?? [],
        } satisfies AppDatabaseIndexedMetadataRow;
      })
      .filter((row): row is AppDatabaseIndexedMetadataRow => row !== null);
  }

  protected applyIndexedMetadataQuery(
    rows: AppDatabaseIndexedMetadataRow[],
    query: AppDatabaseIndexedMetadataQuery,
  ): AppDatabaseIndexedMetadataRow[] {
    const normalizedExtensions = (query.extensions ?? [])
      .map(normalizeIndexedMetadataExtension)
      .filter(Boolean);
    const normalizedPrefixes = (query.pathPrefixes ?? [])
      .map(normalizeIndexedMetadataPathPrefix)
      .filter((prefix) => prefix.length > 0);
    const propertyFilters = query.propertyFilters ?? [];
    const requiredTags = (query.requiredTags ?? [])
      .map((tag) => indexedMetadataTagCandidates(tag))
      .filter((candidates) => candidates.length > 0);
    const resolvedTargetPaths = (query.resolvedTargetPaths ?? []).filter(
      Boolean,
    );

    let filtered = rows.filter((row) => {
      if (
        query.excludeHiddenPaths &&
        row.file.path.split("/").some((part) => part.startsWith("."))
      ) {
        return false;
      }

      if (
        normalizedExtensions.length > 0 &&
        !normalizedExtensions.includes(
          normalizeIndexedMetadataExtension(row.file.extension),
        )
      ) {
        return false;
      }

      if (
        normalizedPrefixes.length > 0 &&
        !normalizedPrefixes.some((prefix) =>
          matchesIndexedMetadataPathPrefix(row.file.path, prefix),
        )
      ) {
        return false;
      }

      if (
        propertyFilters.length > 0 &&
        !propertyFilters.every((filter) =>
          matchesIndexedMetadataPropertyFilter(row.properties, filter),
        )
      ) {
        return false;
      }

      if (
        requiredTags.length > 0 &&
        !requiredTags.every((candidates) =>
          row.tags.some((tag) => candidates.includes(tag.tag)),
        )
      ) {
        return false;
      }

      if (
        resolvedTargetPaths.length > 0 &&
        !resolvedTargetPaths.every((targetPath) =>
          row.links.some((link) => link.resolvedTargetPath === targetPath),
        )
      ) {
        return false;
      }

      return true;
    });

    if ((query.sort?.length ?? 0) > 0) {
      filtered = filtered.slice().sort((left, right) => {
        for (const sort of query.sort ?? []) {
          const comparison = compareIndexedMetadataScalars(
            indexedMetadataSortValue(left, sort),
            indexedMetadataSortValue(right, sort),
          );
          if (comparison === 0) {
            continue;
          }
          return sort.direction === "DESC" ? -comparison : comparison;
        }

        return left.file.path < right.file.path
          ? -1
          : left.file.path > right.file.path
            ? 1
            : 0;
      });
    }

    if (query.limit && query.limit > 0) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  protected emitChange(
    domains: AppDatabaseChangeDomain[],
    paths: string[] = [],
    renamed?: { oldPath: string; newPath: string }[],
  ): AppDatabaseChangeSet {
    const change: AppDatabaseChangeSet = {
      revision: ++this.changeRevision,
      domains: [...new Set(domains)],
      paths: [...new Set(paths)],
      renamed: renamed?.map((entry) => ({ ...entry })),
      committedAt: Date.now(),
    };
    for (const listener of this.changeListeners) listener(clone(change));
    return change;
  }
}
