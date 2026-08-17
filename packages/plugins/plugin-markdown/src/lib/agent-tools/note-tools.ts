import type {
  AppTool,
  AppToolExecutionContext,
  AppToolJsonValue,
  AppToolResult,
} from "@lapis-notes/api/agent-tools";
import { TFile, type Vault } from "@lapis-notes/api/vault";

const MAX_READ_LINES = 500;
const MAX_READ_BYTES = 60 * 1024;
const MAX_LIST_ENTRIES = 200;
const MAX_LIST_RESULT_BYTES = 48 * 1024;
const MAX_PATCH_TEXT_BYTES = 16 * 1024;
const HIDDEN_NOTE_SEGMENTS = new Set([".obsidian", ".lapis", ".trash"]);

interface NotesReadInput {
  path: string;
  startLine?: number;
  endLine?: number;
}

interface NotesListInput {
  path?: string;
  depth?: number;
}

interface NotesPatchInput {
  path: string;
  oldText: string;
  newText: string;
}

class PatchConflict extends Error {
  constructor(
    readonly reason: "match_not_found" | "ambiguous_match",
    readonly matchCount: number,
  ) {
    super(reason);
  }
}

export function createMarkdownNoteTools(vault: Vault): AppTool[] {
  return [
    createNotesReadTool(vault),
    createNotesListTool(vault),
    createNotesPatchTool(vault),
  ];
}

export function createNotesReadTool(vault: Vault): AppTool<NotesReadInput> {
  return {
    name: "notes_read",
    description:
      "Read a bounded line range from a Markdown note in the conversation directory.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", minLength: 1, maxLength: 1_024 },
        startLine: { type: "integer", minimum: 1 },
        endLine: { type: "integer", minimum: 1 },
      },
      required: ["path"],
      additionalProperties: false,
    },
    outputSchema: { type: "object" },
    effect: "read",
    execute: async (input, context) => {
      context.signal.throwIfAborted();
      const path = resolveMarkdownPath(input.path, context);
      const file = requireMarkdownFile(vault, path);
      const content = await vault.read(file);
      context.signal.throwIfAborted();
      const lines = content.split(/\r?\n/u);
      const totalLines = lines.length;
      const startLine = input.startLine ?? 1;
      const requestedEnd = Math.min(input.endLine ?? totalLines, totalLines);
      if (startLine > requestedEnd || startLine > totalLines) {
        throw new Error("Requested note line range is empty or reversed.");
      }
      const boundedEnd = Math.min(
        requestedEnd,
        startLine + MAX_READ_LINES - 1,
      );
      const selected = lines.slice(startLine - 1, boundedEnd).join("\n");
      const text = truncateUtf8(selected, MAX_READ_BYTES);
      const selectedLineCount = Math.min(
        boundedEnd - startLine + 1,
        text.split("\n").length,
      );
      const stat = await vault.stat(path);
      const structuredContent = {
        path,
        text,
        startLine,
        endLine: startLine + selectedLineCount - 1,
        totalLines,
        truncated:
          boundedEnd < requestedEnd || byteLength(selected) > MAX_READ_BYTES,
        revision: revisionFromStat(stat),
      } satisfies AppToolJsonValue;
      return {
        content: [{ type: "text", text }],
        structuredContent,
      };
    },
  };
}

export function createNotesListTool(vault: Vault): AppTool<NotesListInput> {
  return {
    name: "notes_list",
    description:
      "List Markdown notes and folders beneath the fixed conversation directory.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", maxLength: 1_024 },
        depth: { type: "integer", minimum: 1, maximum: 3, default: 1 },
      },
      additionalProperties: false,
    },
    outputSchema: { type: "object" },
    effect: "read",
    execute: async (input, context) => {
      context.signal.throwIfAborted();
      const basePath = resolveDirectoryPath(
        input.path ?? context.scope.directory,
        context,
      );
      requireFolder(vault, basePath);
      const depth = input.depth ?? 1;
      const entries: Array<{ path: string; type: "file" | "folder" }> = [];
      for (const folder of vault.getAllFolders()) {
        context.signal.throwIfAborted();
        if (
          isAllowedPath(folder.path) &&
          isDescendantWithinDepth(folder.path, basePath, depth)
        ) {
          entries.push({ path: folder.path, type: "folder" });
        }
      }
      for (const file of vault.getFiles()) {
        context.signal.throwIfAborted();
        if (
          isMarkdownPath(file.path) &&
          isAllowedPath(file.path) &&
          isDescendantWithinDepth(file.path, basePath, depth)
        ) {
          entries.push({ path: file.path, type: "file" });
        }
      }
      entries.sort(
        (left, right) =>
          left.path.localeCompare(right.path) ||
          left.type.localeCompare(right.type),
      );
      const boundedEntries: typeof entries = [];
      let listBytes = 0;
      for (const entry of entries) {
        const entryBytes = byteLength(entry.path) + 32;
        if (
          boundedEntries.length >= MAX_LIST_ENTRIES ||
          listBytes + entryBytes > MAX_LIST_RESULT_BYTES
        ) {
          break;
        }
        boundedEntries.push(entry);
        listBytes += entryBytes;
      }
      const truncated = boundedEntries.length < entries.length;
      const structuredContent = {
        path: basePath,
        depth,
        entries: boundedEntries,
        truncated,
      } satisfies AppToolJsonValue;
      return {
        content: [
          { type: "text", text: JSON.stringify(structuredContent) },
        ],
        structuredContent,
      };
    },
  };
}

export function createNotesPatchTool(vault: Vault): AppTool<NotesPatchInput> {
  return {
    name: "notes_patch",
    description:
      "Atomically replace exactly one matching text range in a scoped Markdown note.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", minLength: 1, maxLength: 1_024 },
        oldText: { type: "string", minLength: 1, maxLength: 16_384 },
        newText: { type: "string", maxLength: 16_384 },
      },
      required: ["path", "oldText", "newText"],
      additionalProperties: false,
    },
    outputSchema: { type: "object" },
    effect: "write",
    describeApproval: async (input, context) => {
      const path = resolveMarkdownPath(input.path, context);
      validatePatchText(input.oldText, input.newText);
      return {
        title: `Patch ${path}`,
        description: "Replace one exact text match in this note.",
        path,
        diff: { before: input.oldText, after: input.newText },
      };
    },
    execute: async (input, context) => {
      context.signal.throwIfAborted();
      const path = resolveMarkdownPath(input.path, context);
      validatePatchText(input.oldText, input.newText);
      const file = requireMarkdownFile(vault, path);
      try {
        await vault.process(file, (current) => {
          context.signal.throwIfAborted();
          const matches = countMatches(current, input.oldText);
          if (matches !== 1) {
            throw new PatchConflict(
              matches === 0 ? "match_not_found" : "ambiguous_match",
              matches,
            );
          }
          return current.replace(input.oldText, input.newText);
        });
      } catch (error) {
        if (error instanceof PatchConflict) {
          return patchConflictResult(path, error);
        }
        throw error;
      }
      context.signal.throwIfAborted();
      const structuredContent = {
        status: "patched",
        path,
        revision: revisionFromStat(await vault.stat(path)),
      } satisfies AppToolJsonValue;
      return {
        content: [{ type: "text", text: `Patched ${path}` }],
        structuredContent,
      };
    },
  };
}

function resolveMarkdownPath(
  path: string,
  context: AppToolExecutionContext,
): string {
  const resolved = context.scope.resolve(path);
  if (!isAllowedPath(resolved) || !isMarkdownPath(resolved)) {
    throw new Error("Note path must be a non-internal Markdown file.");
  }
  return resolved;
}

function resolveDirectoryPath(
  path: string,
  context: AppToolExecutionContext,
): string {
  const resolved = context.scope.resolve(path);
  if (!isAllowedPath(resolved)) {
    throw new Error("Note directory must not address internal content.");
  }
  return resolved;
}

function isAllowedPath(path: string): boolean {
  return !path
    .split("/")
    .some((segment) => HIDDEN_NOTE_SEGMENTS.has(segment));
}

function isMarkdownPath(path: string): boolean {
  const extension = path.split("/").at(-1)?.split(".").at(-1)?.toLowerCase();
  return extension === "md" || extension === "markdown";
}

function requireMarkdownFile(vault: Vault, path: string): TFile {
  const file = vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) throw new Error(`Markdown note not found: ${path}`);
  return file;
}

function requireFolder(vault: Vault, path: string): void {
  const folder = path ? vault.getFolderByPath(path) : vault.getRoot();
  if (!folder) throw new Error(`Note directory not found: ${path}`);
}

function isDescendantWithinDepth(
  path: string,
  basePath: string,
  depth: number,
): boolean {
  const prefix = basePath ? `${basePath}/` : "";
  if (!path.startsWith(prefix) || path === basePath) return false;
  const relative = path.slice(prefix.length);
  return relative.split("/").length <= depth;
}

function validatePatchText(oldText: string, newText: string): void {
  if (oldText === newText) {
    throw new Error("Patch old and new text must differ.");
  }
  if (!oldText) throw new Error("Patch old text must not be empty.");
  if (
    byteLength(oldText) > MAX_PATCH_TEXT_BYTES ||
    byteLength(newText) > MAX_PATCH_TEXT_BYTES
  ) {
    throw new Error("Patch text exceeds the size limit.");
  }
}

function countMatches(content: string, oldText: string): number {
  let count = 0;
  let offset = 0;
  while ((offset = content.indexOf(oldText, offset)) !== -1) {
    count += 1;
    offset += oldText.length;
  }
  return count;
}

function patchConflictResult(
  path: string,
  conflict: PatchConflict,
): AppToolResult {
  const structuredContent = {
    status: "conflict",
    path,
    reason: conflict.reason,
    matchCount: conflict.matchCount,
  } satisfies AppToolJsonValue;
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Patch conflict for ${path}: ${conflict.reason}`,
      },
    ],
    structuredContent,
  };
}

function revisionFromStat(
  stat: { mtime: number; size: number } | null,
): AppToolJsonValue {
  return stat ? { mtime: stat.mtime, size: stat.size } : null;
}

function truncateUtf8(value: string, limit: number): string {
  if (byteLength(value) <= limit) return value;
  let low = 0;
  let high = value.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (byteLength(value.slice(0, middle)) <= limit) low = middle;
    else high = middle - 1;
  }
  return value.slice(0, low);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
