import {
  type App,
  type CachedMetadata,
  type EditorPosition,
  type Pos,
  type ReferenceCache,
  type SearchDocumentRecord,
  type TFile,
} from "@lapis-notes/api";

export type LinkSidebarMode = "backlinks" | "outgoing";
export type LinkSidebarMentionKind = "link" | "embed" | "unlinked";
export type LinkSidebarSortMode =
  | "filename-asc"
  | "filename-desc"
  | "modified-desc"
  | "modified-asc"
  | "created-desc"
  | "created-asc";

export type LinkSidebarFile = Pick<
  TFile,
  "path" | "name" | "basename" | "extension" | "stat"
>;

export interface LinkSidebarDocument {
  path: string;
  content: string;
  frontmatterEndOffset?: number;
}

export interface LinkSidebarMention {
  id: string;
  kind: LinkSidebarMentionKind;
  file: LinkSidebarFile;
  sourcePath: string;
  targetPath: string;
  linkText: string;
  context: string;
  expandedContext: string;
  line: number;
  ch: number;
  offset: number;
  endOffset: number;
}

export interface LinkSidebarGroup {
  file: LinkSidebarFile;
  mentions: LinkSidebarMention[];
}

export interface LinkSidebarData {
  linkedGroups: LinkSidebarGroup[];
  unlinkedGroups: LinkSidebarGroup[];
}

export interface LinkSidebarState {
  activeFile: LinkSidebarFile;
  files: LinkSidebarFile[];
  caches: Map<string, CachedMetadata>;
  documents: Map<string, LinkSidebarDocument>;
  resolveLinkPath: (link: string, sourcePath: string) => string | null;
}

const WORDISH = /[\p{L}\p{N}_-]/u;

export const LINK_SIDEBAR_SORT_OPTIONS: Array<{
  value: LinkSidebarSortMode;
  label: string;
}> = [
  { value: "filename-asc", label: "Filename (A to Z)" },
  { value: "filename-desc", label: "Filename (Z to A)" },
  { value: "modified-desc", label: "Modified time (new to old)" },
  { value: "modified-asc", label: "Modified time (old to new)" },
  { value: "created-desc", label: "Created time (new to old)" },
  { value: "created-asc", label: "Created time (old to new)" },
];

function compareFiles(
  left: LinkSidebarFile,
  right: LinkSidebarFile,
  mode: LinkSidebarSortMode,
): number {
  const text = (a: string, b: string) =>
    a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
  const fallback = () => text(left.path, right.path);
  switch (mode) {
    case "filename-desc":
      return text(right.name, left.name) || fallback();
    case "modified-desc":
      return right.stat.mtime - left.stat.mtime || fallback();
    case "modified-asc":
      return left.stat.mtime - right.stat.mtime || fallback();
    case "created-desc":
      return right.stat.ctime - left.stat.ctime || fallback();
    case "created-asc":
      return left.stat.ctime - right.stat.ctime || fallback();
    default:
      return text(left.name, right.name) || fallback();
  }
}

export function sortLinkSidebarGroups(
  groups: LinkSidebarGroup[],
  mode: LinkSidebarSortMode = "filename-asc",
): LinkSidebarGroup[] {
  return [...groups].sort((left, right) =>
    compareFiles(left.file, right.file, mode),
  );
}

export function formatLinkSidebarSortLabel(
  mode: LinkSidebarSortMode,
): string {
  return (
    LINK_SIDEBAR_SORT_OPTIONS.find((option) => option.value === mode)?.label ??
    LINK_SIDEBAR_SORT_OPTIONS[0]!.label
  );
}

function isMarkdownFile(file: LinkSidebarFile): boolean {
  return file.extension === "md" || file.extension === "markdown";
}

function aliasesFor(
  file: LinkSidebarFile,
  cache: CachedMetadata | null | undefined,
): string[] {
  const frontmatter = cache?.frontmatter;
  const aliasesValue =
    frontmatter && typeof frontmatter === "object"
      ? ((frontmatter as Record<string, unknown>)["aliases"] ??
        (frontmatter as Record<string, unknown>)["alias"])
      : undefined;
  const aliases = Array.isArray(aliasesValue)
    ? aliasesValue.map(String)
    : typeof aliasesValue === "string"
      ? aliasesValue.split(",")
      : [];
  return [
    ...new Set(
      [file.basename, ...aliases]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ].sort((left, right) => right.length - left.length);
}

function references(cache: CachedMetadata | null | undefined): ReferenceCache[] {
  return [...(cache?.links ?? []), ...(cache?.embeds ?? [])];
}

function referenceKind(
  reference: ReferenceCache,
  cache: CachedMetadata,
): LinkSidebarMentionKind {
  return cache.embeds?.includes(reference) ? "embed" : "link";
}

function groupMentions(mentions: LinkSidebarMention[]): LinkSidebarGroup[] {
  const groups = new Map<string, LinkSidebarGroup>();
  for (const mention of mentions) {
    const group = groups.get(mention.file.path) ?? {
      file: mention.file,
      mentions: [],
    };
    group.mentions.push(mention);
    groups.set(mention.file.path, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    mentions: group.mentions.sort((left, right) => left.offset - right.offset),
  }));
}

function positionAt(content: string, offset: number): EditorPosition {
  const before = content.slice(0, Math.max(0, Math.min(offset, content.length)));
  const lines = before.split("\n");
  return { line: lines.length - 1, ch: lines.at(-1)?.length ?? 0 };
}

function contextAt(
  content: string | undefined,
  offset: number,
  fallback: string,
): { context: string; expandedContext: string; pos: EditorPosition } {
  if (!content) {
    return {
      context: fallback,
      expandedContext: fallback,
      pos: { line: 0, ch: 0 },
    };
  }
  const bounded = Math.max(0, Math.min(offset, content.length));
  const start = content.lastIndexOf("\n", Math.max(0, bounded - 1)) + 1;
  const nextBreak = content.indexOf("\n", bounded);
  const end = nextBreak === -1 ? content.length : nextBreak;
  const pos = positionAt(content, bounded);
  const line = content.slice(start, end).trim() || fallback;
  const lines = content.split("\n");
  const expandedContext = lines
    .slice(Math.max(0, pos.line - 1), Math.min(lines.length, pos.line + 2))
    .map((value) => value.trim())
    .filter(Boolean)
    .join("\n");
  return { context: line, expandedContext: expandedContext || line, pos };
}

function mentionFromReference(input: {
  id: string;
  reference: ReferenceCache;
  kind: LinkSidebarMentionKind;
  file: LinkSidebarFile;
  sourcePath: string;
  targetPath: string;
  content?: string;
}): LinkSidebarMention {
  const linkText = input.reference.displayText || input.reference.link;
  const offset = input.reference.position?.start.offset ?? 0;
  const endOffset = input.reference.position?.end.offset ?? offset + linkText.length;
  const { context, expandedContext, pos } = contextAt(
    input.content,
    offset,
    input.reference.original || linkText,
  );
  return {
    id: input.id,
    kind: input.kind,
    file: input.file,
    sourcePath: input.sourcePath,
    targetPath: input.targetPath,
    linkText,
    context,
    expandedContext,
    line: pos.line,
    ch: pos.ch,
    offset,
    endOffset,
  };
}

function blockedRanges(cache: CachedMetadata | null | undefined): Pos[] {
  return references(cache)
    .map((reference) => reference.position)
    .filter((position): position is Pos => Boolean(position));
}

function overlaps(start: number, end: number, ranges: Pos[]): boolean {
  return ranges.some(
    (range) => start < range.end.offset && end > range.start.offset,
  );
}

function hasWordBoundary(content: string, start: number, end: number): boolean {
  const before = start > 0 ? content[start - 1] : "";
  const after = end < content.length ? content[end] : "";
  return (!before || !WORDISH.test(before)) && (!after || !WORDISH.test(after));
}

export function findExactUnlinkedMentions(input: {
  content: string;
  aliases: string[];
  blockedRanges?: Pos[];
  minimumOffset?: number;
}): Array<{ text: string; offset: number; endOffset: number }> {
  const blocked = input.blockedRanges ?? [];
  const minimumOffset = input.minimumOffset ?? 0;
  const seen = new Set<string>();
  const matches: Array<{ text: string; offset: number; endOffset: number }> = [];
  const haystack = input.content.toLocaleLowerCase();

  for (const alias of input.aliases) {
    const needle = alias.trim();
    const loweredNeedle = needle.toLocaleLowerCase();
    if (!needle || seen.has(loweredNeedle)) continue;
    seen.add(loweredNeedle);
    let cursor = minimumOffset;
    while (cursor < input.content.length) {
      const offset = haystack.indexOf(loweredNeedle, cursor);
      if (offset === -1) break;
      const endOffset = offset + needle.length;
      if (
        offset >= minimumOffset &&
        hasWordBoundary(input.content, offset, endOffset) &&
        !overlaps(offset, endOffset, blocked)
      ) {
        matches.push({
          text: input.content.slice(offset, endOffset),
          offset,
          endOffset,
        });
      }
      cursor = endOffset;
    }
  }
  return matches.sort((left, right) => left.offset - right.offset);
}

function mentionFromMatch(input: {
  id: string;
  file: LinkSidebarFile;
  sourcePath: string;
  targetPath: string;
  content: string;
  text: string;
  offset: number;
  endOffset: number;
}): LinkSidebarMention {
  const { context, expandedContext, pos } = contextAt(
    input.content,
    input.offset,
    input.text,
  );
  return {
    id: input.id,
    kind: "unlinked",
    file: input.file,
    sourcePath: input.sourcePath,
    targetPath: input.targetPath,
    linkText: input.text,
    context,
    expandedContext,
    line: pos.line,
    ch: pos.ch,
    offset: input.offset,
    endOffset: input.endOffset,
  };
}

function collectLinkedBacklinks(state: LinkSidebarState): LinkSidebarMention[] {
  const files = new Map(state.files.map((file) => [file.path, file]));
  const mentions: LinkSidebarMention[] = [];
  for (const [sourcePath, cache] of state.caches) {
    const sourceFile = files.get(sourcePath);
    if (!sourceFile) continue;
    references(cache).forEach((reference, index) => {
      const targetPath = state.resolveLinkPath(reference.link, sourcePath);
      if (targetPath !== state.activeFile.path) return;
      mentions.push(
        mentionFromReference({
          id: `${sourcePath}:${reference.position?.start.offset ?? index}:linked`,
          reference,
          kind: referenceKind(reference, cache),
          file: sourceFile,
          sourcePath,
          targetPath,
          content: state.documents.get(sourcePath)?.content,
        }),
      );
    });
  }
  return mentions;
}

function collectOutgoingLinks(state: LinkSidebarState): LinkSidebarMention[] {
  const files = new Map(state.files.map((file) => [file.path, file]));
  const cache = state.caches.get(state.activeFile.path);
  if (!cache) return [];
  const mentions: LinkSidebarMention[] = [];
  references(cache).forEach((reference, index) => {
    const targetPath = state.resolveLinkPath(reference.link, state.activeFile.path);
    const targetFile = targetPath ? files.get(targetPath) : null;
    if (!targetPath || !targetFile) return;
    mentions.push(
      mentionFromReference({
        id: `${targetPath}:${reference.position?.start.offset ?? index}:outgoing`,
        reference,
        kind: referenceKind(reference, cache),
        file: targetFile,
        sourcePath: state.activeFile.path,
        targetPath,
        content: state.documents.get(state.activeFile.path)?.content,
      }),
    );
  });
  return mentions;
}

function collectUnlinkedBacklinks(state: LinkSidebarState): LinkSidebarMention[] {
  const aliases = aliasesFor(
    state.activeFile,
    state.caches.get(state.activeFile.path),
  );
  const files = new Map(state.files.map((file) => [file.path, file]));
  const mentions: LinkSidebarMention[] = [];
  for (const document of state.documents.values()) {
    if (document.path === state.activeFile.path) continue;
    const file = files.get(document.path);
    if (!file || !isMarkdownFile(file)) continue;
    findExactUnlinkedMentions({
      content: document.content,
      aliases,
      blockedRanges: blockedRanges(state.caches.get(document.path)),
      minimumOffset: document.frontmatterEndOffset ?? 0,
    }).forEach((match, index) => {
      mentions.push(
        mentionFromMatch({
          id: `${document.path}:${match.offset}:unlinked-backlink:${index}`,
          file,
          sourcePath: document.path,
          targetPath: state.activeFile.path,
          content: document.content,
          ...match,
        }),
      );
    });
  }
  return mentions;
}

function collectOutgoingUnlinked(state: LinkSidebarState): LinkSidebarMention[] {
  const document = state.documents.get(state.activeFile.path);
  if (!document) return [];
  const linkedTargets = new Set(
    collectOutgoingLinks(state).map((mention) => mention.targetPath),
  );
  const mentions: LinkSidebarMention[] = [];
  for (const targetFile of state.files) {
    if (
      targetFile.path === state.activeFile.path ||
      !isMarkdownFile(targetFile) ||
      linkedTargets.has(targetFile.path)
    ) {
      continue;
    }
    findExactUnlinkedMentions({
      content: document.content,
      aliases: aliasesFor(targetFile, state.caches.get(targetFile.path)),
      blockedRanges: blockedRanges(state.caches.get(state.activeFile.path)),
      minimumOffset: document.frontmatterEndOffset ?? 0,
    }).forEach((match, index) => {
      mentions.push(
        mentionFromMatch({
          id: `${targetFile.path}:${match.offset}:unlinked-outgoing:${index}`,
          file: targetFile,
          sourcePath: state.activeFile.path,
          targetPath: targetFile.path,
          content: document.content,
          ...match,
        }),
      );
    });
  }
  return mentions;
}

export function buildBacklinksData(
  state: LinkSidebarState,
  sortMode: LinkSidebarSortMode = "filename-asc",
): LinkSidebarData {
  return {
    linkedGroups: sortLinkSidebarGroups(
      groupMentions(collectLinkedBacklinks(state)),
      sortMode,
    ),
    unlinkedGroups: sortLinkSidebarGroups(
      groupMentions(collectUnlinkedBacklinks(state)),
      sortMode,
    ),
  };
}

export function buildOutgoingLinksData(
  state: LinkSidebarState,
  sortMode: LinkSidebarSortMode = "filename-asc",
): LinkSidebarData {
  return {
    linkedGroups: sortLinkSidebarGroups(
      groupMentions(collectOutgoingLinks(state)),
      sortMode,
    ),
    unlinkedGroups: sortLinkSidebarGroups(
      groupMentions(collectOutgoingUnlinked(state)),
      sortMode,
    ),
  };
}

function normalizeDocument(document: SearchDocumentRecord): LinkSidebarDocument {
  return {
    path: document.path,
    content: document.content,
    frontmatterEndOffset: document.sourceMetadata?.frontmatterEndOffset,
  };
}

export async function buildLinkSidebarData(
  app: App,
  activeFile: TFile,
  mode: LinkSidebarMode,
  sortMode: LinkSidebarSortMode = "filename-asc",
): Promise<LinkSidebarData> {
  const caches = new Map<string, CachedMetadata>();
  const files = new Map<string, TFile>();
  for (const [file, cache] of app.metadataCache.getAllItems()) {
    files.set(file.path, file);
    caches.set(file.path, cache);
  }
  for (const file of app.vault.getMarkdownFiles()) files.set(file.path, file);

  const documents = new Map<string, LinkSidebarDocument>();
  try {
    for (const document of await app.appDatabase.listSearchDocuments()) {
      documents.set(document.path, normalizeDocument(document));
    }
  } catch (error) {
    app.logger.warn("Unable to load indexed documents for link sidebar", error);
  }

  const liveText = new Map<string, string>();
  app.workspace.iterateAllLeaves((leaf) => {
    const view = leaf.view as unknown as {
      file?: { path?: string } | null;
      getViewData?: () => string;
    };
    if (view.file?.path && typeof view.getViewData === "function") {
      liveText.set(view.file.path, view.getViewData());
    }
  });
  await Promise.all(
    [...files.values()]
      .map(async (file) => {
        try {
          documents.set(file.path, {
            path: file.path,
            content: liveText.get(file.path) ?? (await app.vault.cachedRead(file)),
            frontmatterEndOffset:
              caches.get(file.path)?.frontmatterPosition?.end.offset ?? 0,
          });
        } catch (error) {
          app.logger.warn(`Unable to read ${file.path} for link sidebar`, error);
        }
      }),
  );

  const state: LinkSidebarState = {
    activeFile,
    files: [...files.values()],
    caches,
    documents,
    resolveLinkPath: (link, sourcePath) =>
      app.metadataCache.getFirstLinkpathDest(
        link.split("|")[0]!.split("#")[0]!,
        sourcePath,
      )?.path ?? null,
  };
  return mode === "backlinks"
    ? buildBacklinksData(state, sortMode)
    : buildOutgoingLinksData(state, sortMode);
}
