import type {
  App,
  AppDatabaseIndexedMetadataRow,
  AppDatabaseLinkRecord,
  TFile,
} from "@lapis-notes/api";
import type {
  GraphData,
  GraphLink,
  GraphNode,
  GraphSettings,
} from "./graph-types";

type GraphApp = Pick<App, "vault" | "metadataCache" | "workspace">;
type MutableNode = GraphNode;

export interface GraphBuildProgress {
  processed: number;
  total: number;
  pages: number;
}

export interface GraphBuildOptions {
  signal?: AbortSignal;
  onProgress?: (progress: GraphBuildProgress) => void;
}

const GLOBAL_GRAPH_PAGE_SIZE = 256;
const LOCAL_GRAPH_QUERY_LIMIT = 10_000;
const LOCAL_GRAPH_PATH_BATCH_SIZE = 200;

function graphPathBatches(paths: string[]): string[][] {
  const unique = [...new Set(paths)];
  const batches: string[][] = [];
  for (
    let index = 0;
    index < unique.length;
    index += LOCAL_GRAPH_PATH_BATCH_SIZE
  ) {
    batches.push(unique.slice(index, index + LOCAL_GRAPH_PATH_BATCH_SIZE));
  }
  return batches;
}

function basename(path: string): string {
  return path.split("/").at(-1) ?? path;
}

function labelForPath(path: string): string {
  return basename(path).replace(/\.[^.]+$/, "");
}

function fileNodeId(path: string): string {
  return `note:${path}`;
}

function attachmentNodeId(path: string): string {
  return `attachment:${path}`;
}

function unresolvedNodeId(target: string): string {
  return `unresolved:${target}`;
}

function tagNodeId(tag: string): string {
  return `tag:${tag}`;
}

function parseLinkText(linkText: string): string {
  const [value] = linkText.split("|", 1);
  const [path] = value.split("#", 1);
  return path.trim();
}

export function normalizeGraphTag(tag: string): string {
  const value = tag.trim().replace(/^#+/, "");
  return value.length ? `#${value}` : "";
}

function isMarkdownPath(path: string): boolean {
  return /\.(?:md|markdown)$/i.test(path);
}

function cloneNode(node: GraphNode): MutableNode {
  return {
    ...node,
    tags: [...node.tags],
    groupIds: [...node.groupIds],
  };
}

function ensureNoteNodeFromRow(
  nodes: Map<string, MutableNode>,
  row: AppDatabaseIndexedMetadataRow,
): MutableNode {
  const { file } = row;
  const id = fileNodeId(file.path);
  let node = nodes.get(id);
  if (!node) {
    node = {
      id,
      label: labelForPath(file.path),
      path: file.path,
      type: "note",
      exists: true,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
      mtime: file.mtime,
      extension: file.extension.toLowerCase(),
    };
    nodes.set(id, node);
  }
  node.tags = [
    ...new Set(
      row.tags.map((record) => normalizeGraphTag(record.tag)).filter(Boolean),
    ),
  ];
  node.mtime = file.mtime;
  node.extension = file.extension.toLowerCase();
  return node;
}

function ensureNoteNodeFromFile(
  nodes: Map<string, MutableNode>,
  file: Pick<TFile, "path" | "extension" | "stat">,
): MutableNode {
  const id = fileNodeId(file.path);
  let node = nodes.get(id);
  if (!node) {
    node = {
      id,
      label: labelForPath(file.path),
      path: file.path,
      type: "note",
      exists: true,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
      ctime: file.stat?.ctime,
      mtime: file.stat?.mtime,
      extension: file.extension?.toLowerCase(),
    };
    nodes.set(id, node);
  }
  return node;
}

function ensureAttachmentNode(
  nodes: Map<string, MutableNode>,
  path: string,
  file?: Pick<TFile, "extension" | "stat"> | null,
): MutableNode {
  const id = attachmentNodeId(path);
  let node = nodes.get(id);
  if (!node) {
    node = {
      id,
      label: basename(path),
      path,
      type: "attachment",
      exists: true,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
      ctime: file?.stat?.ctime,
      mtime: file?.stat?.mtime,
      extension:
        file?.extension?.toLowerCase() ?? basename(path).split(".").at(-1),
    };
    nodes.set(id, node);
  }
  return node;
}

function ensureUnresolvedNode(
  nodes: Map<string, MutableNode>,
  target: string,
): MutableNode {
  const id = unresolvedNodeId(target);
  let node = nodes.get(id);
  if (!node) {
    node = {
      id,
      label: target,
      path: target,
      type: "unresolved",
      exists: false,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
    };
    nodes.set(id, node);
  }
  return node;
}

function ensureTagNode(
  nodes: Map<string, MutableNode>,
  tag: string,
): MutableNode {
  const normalized = normalizeGraphTag(tag);
  const id = tagNodeId(normalized);
  let node = nodes.get(id);
  if (!node) {
    node = {
      id,
      label: normalized,
      path: normalized,
      type: "tag",
      exists: true,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
    };
    nodes.set(id, node);
  }
  return node;
}

function addLink(
  links: Map<string, GraphLink>,
  source: string,
  target: string,
  type: GraphLink["type"],
  count: number,
  directed: boolean,
): void {
  const id = `${type}:${source}:${target}`;
  const existing = links.get(id);
  if (existing) {
    existing.count += count;
    return;
  }
  links.set(id, { id, source, target, count, type, directed });
}

function applyNodeCounts(
  nodes: Map<string, MutableNode>,
  links: GraphLink[],
): void {
  for (const node of nodes.values()) {
    node.refCount = 0;
    node.outgoingCount = 0;
  }
  for (const link of links) {
    const source = nodes.get(link.source);
    const target = nodes.get(link.target);
    if (source) source.outgoingCount += link.count;
    if (target) target.refCount += link.count;
  }
}

function assignGroups(
  nodes: GraphNode[],
  settings: GraphSettings,
  groupPathMatches?: ReadonlyMap<string, ReadonlySet<string>>,
): GraphNode[] {
  if (!settings.groups.length) return nodes.map(cloneNode);
  return nodes.map((node) => {
    const nextNode = cloneNode(node);
    nextNode.groupIds = [];
    nextNode.primaryColor = undefined;
    for (const group of settings.groups) {
      const query = group.query.trim().toLowerCase();
      if (!query) continue;
      const resolvedPaths = groupPathMatches?.get(group.id);
      const matches = groupPathMatches
        ? Boolean(
            resolvedPaths && nextNode.path && resolvedPaths.has(nextNode.path),
          )
        : [nextNode.label, nextNode.path ?? "", ...nextNode.tags]
            .join(" ")
            .toLowerCase()
            .includes(query);
      if (!matches) continue;
      nextNode.groupIds.push(group.id);
      nextNode.primaryColor ??= group.color;
    }
    return nextNode;
  });
}

function matchesSearch(node: GraphNode, query: string): boolean {
  const value = query.trim().toLowerCase();
  if (!value) return true;
  return [node.label, node.path ?? "", ...node.tags]
    .join(" ")
    .toLowerCase()
    .includes(value);
}

export function filterGraphBySettings(
  graph: GraphData,
  settings: GraphSettings,
  matches: {
    filterPaths?: ReadonlySet<string>;
    groupPaths?: ReadonlyMap<string, ReadonlySet<string>>;
  } = {},
): GraphData {
  const visibleNodes = new Map<string, GraphNode>();
  for (const node of graph.nodes) {
    if (node.type === "tag" && !settings.filters.showTags) continue;
    if (node.type === "attachment" && !settings.filters.showAttachments)
      continue;
    if (settings.filters.existingFilesOnly && !node.exists) continue;
    if (matches.filterPaths) {
      if (!node.path || !matches.filterPaths.has(node.path)) continue;
    } else if (!matchesSearch(node, settings.filters.searchQuery)) {
      continue;
    }
    visibleNodes.set(node.id, cloneNode(node));
  }

  let visibleLinks = graph.links.filter(
    (link) => visibleNodes.has(link.source) && visibleNodes.has(link.target),
  );

  if (!settings.filters.showOrphans) {
    const connected = new Set<string>();
    for (const link of visibleLinks) {
      connected.add(link.source);
      connected.add(link.target);
    }
    for (const nodeId of [...visibleNodes.keys()]) {
      if (connected.has(nodeId) || nodeId === graph.centerNodeId) continue;
      visibleNodes.delete(nodeId);
    }
    visibleLinks = visibleLinks.filter(
      (link) => visibleNodes.has(link.source) && visibleNodes.has(link.target),
    );
  }

  return {
    nodes: assignGroups(
      [...visibleNodes.values()],
      settings,
      matches.groupPaths,
    ),
    links: visibleLinks.map((link) => ({ ...link })),
    centerNodeId: graph.centerNodeId ?? null,
  };
}

function buildSingleFileGraph(settings: GraphSettings, file: TFile): GraphData {
  const nodes = new Map<string, MutableNode>();
  const node = ensureNoteNodeFromFile(nodes, file);
  return {
    nodes: assignGroups([node], settings),
    links: [],
    centerNodeId: node.id,
  };
}

function resolvedFile(
  app: GraphApp,
  path: string,
): Pick<TFile, "path" | "extension" | "stat"> | null {
  const file = app.vault.getFileByPath(path);
  if (!file || !("extension" in file)) return null;
  return file as TFile;
}

function canIncludeExpandedEdge(
  sourcePath: string,
  depthByPath?: ReadonlyMap<string, number>,
  maxDepth?: number,
): boolean {
  if (!depthByPath || maxDepth == null) return true;
  return (depthByPath.get(sourcePath) ?? maxDepth) < maxDepth;
}

function buildCanonicalGraphFromRows(
  app: GraphApp,
  rows: AppDatabaseIndexedMetadataRow[],
  options: {
    depthByPath?: ReadonlyMap<string, number>;
    maxDepth?: number;
  } = {},
): GraphData {
  const nodes = new Map<string, MutableNode>();
  const links = new Map<string, GraphLink>();
  const rowsByPath = new Map(rows.map((row) => [row.file.path, row]));
  const allowedMarkdownPaths = new Set(rows.map((row) => row.file.path));

  for (const row of rows) {
    const node = ensureNoteNodeFromRow(nodes, row);
    const file = resolvedFile(app, row.file.path);
    node.ctime = file?.stat?.ctime;
    node.mtime = file?.stat?.mtime ?? row.file.mtime;
  }

  for (const row of rows) {
    const sourceNode = ensureNoteNodeFromRow(nodes, row);
    const includeExpanded = canIncludeExpandedEdge(
      row.file.path,
      options.depthByPath,
      options.maxDepth,
    );

    if (includeExpanded) {
      for (const tag of sourceNode.tags) {
        const tagNode = ensureTagNode(nodes, tag);
        addLink(links, sourceNode.id, tagNode.id, "tag", 1, false);
      }
    }

    for (const record of row.links) {
      const targetText = parseLinkText(record.targetText);
      if (record.resolvedTargetPath) {
        const targetPath = record.resolvedTargetPath;
        if (isMarkdownPath(targetPath)) {
          if (!allowedMarkdownPaths.has(targetPath)) continue;
          const targetRow = rowsByPath.get(targetPath);
          const targetNode = targetRow
            ? ensureNoteNodeFromRow(nodes, targetRow)
            : ensureNoteNodeFromFile(
                nodes,
                resolvedFile(app, targetPath) ?? {
                  path: targetPath,
                  extension: "md",
                  stat: { ctime: 0, mtime: 0, size: 0 },
                },
              );
          addLink(
            links,
            sourceNode.id,
            targetNode.id,
            record.type === "embed" ? "embed" : "internal-link",
            record.count,
            true,
          );
          continue;
        }
        if (!includeExpanded) continue;
        const targetNode = ensureAttachmentNode(
          nodes,
          targetPath,
          resolvedFile(app, targetPath),
        );
        addLink(
          links,
          sourceNode.id,
          targetNode.id,
          record.type === "embed" ? "embed" : "internal-link",
          record.count,
          true,
        );
        continue;
      }
      if (!includeExpanded || !targetText) continue;
      const targetNode = ensureUnresolvedNode(nodes, targetText);
      addLink(
        links,
        sourceNode.id,
        targetNode.id,
        record.type === "embed" ? "embed" : "internal-link",
        record.count,
        true,
      );
    }
  }

  const nextLinks = [...links.values()].map((link) => ({ ...link }));
  applyNodeCounts(nodes, nextLinks);
  return {
    nodes: [...nodes.values()].map(cloneNode),
    links: nextLinks,
    centerNodeId: null,
  };
}

async function queryGlobalRows(
  app: GraphApp,
  options: GraphBuildOptions = {},
): Promise<AppDatabaseIndexedMetadataRow[]> {
  const rows: AppDatabaseIndexedMetadataRow[] = [];
  let total = 0;
  if (typeof app.vault.iterateFiles === "function") {
    for (const file of app.vault.iterateFiles()) {
      if (!isMarkdownPath(file.path)) continue;
      if (file.path.split("/").some((segment) => segment.startsWith("."))) {
        continue;
      }
      total += 1;
    }
  }
  let after: string | undefined;
  let pages = 0;
  do {
    throwIfGraphBuildCancelled(options.signal);
    const page = await app.metadataCache.queryMetadataPage({
      after,
      limit: GLOBAL_GRAPH_PAGE_SIZE,
      include: ["tags", "links"],
      query: {
        extensions: ["md", "markdown"],
        excludeHiddenPaths: true,
      },
    });
    rows.push(...page.rows);
    pages += 1;
    options.onProgress?.({
      processed: rows.length,
      total: Math.max(total, rows.length),
      pages,
    });
    after = page.nextCursor;
    if (after) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  } while (after);
  return rows;
}

function throwIfGraphBuildCancelled(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const error = new Error("Graph build cancelled");
  error.name = "AbortError";
  throw error;
}

async function queryRowsForPaths(
  app: GraphApp,
  paths: string[],
): Promise<AppDatabaseIndexedMetadataRow[]> {
  if (!paths.length) return [];
  const requestedPaths = [...new Set(paths)];
  const pathSet = new Set(requestedPaths);
  const rowsByPath = new Map<string, AppDatabaseIndexedMetadataRow>();
  for (const batch of graphPathBatches(requestedPaths)) {
    const rows = await app.metadataCache.queryMetadata({
      extensions: ["md", "markdown"],
      pathPrefixes: batch,
      excludeHiddenPaths: true,
      limit: Math.max(LOCAL_GRAPH_QUERY_LIMIT, batch.length),
    });
    for (const row of rows) {
      if (pathSet.has(row.file.path)) rowsByPath.set(row.file.path, row);
    }
  }
  return requestedPaths.flatMap((path) => {
    const row = rowsByPath.get(path);
    return row ? [row] : [];
  });
}

async function queryLocalLinks(
  app: GraphApp,
  query: {
    direction: "incoming" | "outgoing";
    paths: string[];
    resolution: "all" | "resolved";
  },
): Promise<AppDatabaseLinkRecord[]> {
  const records: AppDatabaseLinkRecord[] = [];
  for (const paths of graphPathBatches(query.paths)) {
    const remaining = LOCAL_GRAPH_QUERY_LIMIT - records.length;
    if (remaining <= 0) break;
    records.push(
      ...(await app.metadataCache.queryLinks({
        ...query,
        paths,
        limit: remaining,
      })),
    );
  }
  return records.slice(0, LOCAL_GRAPH_QUERY_LIMIT);
}

function markdownNeighbors(records: AppDatabaseLinkRecord[]): string[] {
  const paths = new Set<string>();
  for (const record of records) {
    if (isMarkdownPath(record.sourcePath)) paths.add(record.sourcePath);
    if (
      record.resolvedTargetPath &&
      isMarkdownPath(record.resolvedTargetPath)
    ) {
      paths.add(record.resolvedTargetPath);
    }
  }
  return [...paths];
}

async function collectLocalRows(
  app: GraphApp,
  settings: GraphSettings,
  activeFile: TFile,
): Promise<{
  rows: AppDatabaseIndexedMetadataRow[];
  depthByPath: Map<string, number>;
}> {
  const depthByPath = new Map<string, number>([[activeFile.path, 0]]);
  const rowsByPath = new Map<string, AppDatabaseIndexedMetadataRow>();
  let frontier = [activeFile.path];

  for (
    let depth = 0;
    depth <= settings.localGraph.depth && frontier.length;
    depth++
  ) {
    const rows = await queryRowsForPaths(app, frontier);
    for (const row of rows) rowsByPath.set(row.file.path, row);
    if (depth >= settings.localGraph.depth) break;

    const [incoming, outgoing] = await Promise.all([
      queryLocalLinks(app, {
        direction: "incoming",
        paths: frontier,
        resolution: "resolved",
      }),
      queryLocalLinks(app, {
        direction: "outgoing",
        paths: frontier,
        resolution: "all",
      }),
    ]);

    const candidates = new Set(markdownNeighbors([...incoming, ...outgoing]));
    frontier = [...candidates].filter((path) => {
      if (depthByPath.has(path)) return false;
      depthByPath.set(path, depth + 1);
      return true;
    });
  }

  return { rows: [...rowsByPath.values()], depthByPath };
}

export async function buildCanonicalGraph(
  app: GraphApp,
  options: GraphBuildOptions = {},
): Promise<GraphData> {
  const rows = await queryGlobalRows(app, options);
  throwIfGraphBuildCancelled(options.signal);
  return buildCanonicalGraphFromRows(app, rows);
}

export async function buildGlobalGraph(
  app: GraphApp,
  settings: GraphSettings,
): Promise<GraphData> {
  return filterGraphBySettings(await buildCanonicalGraph(app), settings);
}

export async function buildLocalGraph(
  app: GraphApp,
  settings: GraphSettings,
  activeFile: TFile | null,
): Promise<GraphData> {
  return filterGraphBySettings(
    await buildCanonicalLocalGraph(app, settings, activeFile),
    settings,
  );
}

export async function buildCanonicalLocalGraph(
  app: GraphApp,
  settings: GraphSettings,
  activeFile: TFile | null,
): Promise<GraphData> {
  if (!activeFile) return { nodes: [], links: [], centerNodeId: null };

  const { rows, depthByPath } = await collectLocalRows(
    app,
    settings,
    activeFile,
  );
  if (!rows.some((row) => row.file.path === activeFile.path)) {
    return buildSingleFileGraph(settings, activeFile);
  }

  const canonical = buildCanonicalGraphFromRows(app, rows, {
    depthByPath,
    maxDepth: settings.localGraph.depth,
  });
  const scoped = {
    ...canonical,
    centerNodeId: fileNodeId(activeFile.path),
  };
  return scoped.nodes.length
    ? scoped
    : buildSingleFileGraph(settings, activeFile);
}

export function graphNodeIdForFile(path: string): string {
  return fileNodeId(path);
}
