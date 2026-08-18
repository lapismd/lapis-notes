import type {
  AppTool,
  AppToolExecutionContext,
  AppToolJsonValue,
} from "@lapis-notes/api/agent-tools";
import { type Vault } from "@lapis-notes/api/vault";

const MAX_LIST_ENTRIES = 200;
const MAX_LIST_RESULT_BYTES = 48 * 1024;
const HIDDEN_NOTE_SEGMENTS = new Set([".obsidian", ".lapis", ".trash"]);

interface NotesListInput {
  path?: string;
  depth?: number;
}

export function createMarkdownNoteTools(vault: Vault): AppTool[] {
  return [createNotesListTool(vault)];
}

export function createNotesListTool(vault: Vault): AppTool<NotesListInput> {
  return {
    name: "notes_list",
    description: `
List Markdown notes and folders in the current conversation's Lapis vault scope.

Use this to browse the note tree. Prefer this tool over ls, find, or tree on the
host cwd. Use notes_search for content and read for a selected file.
`.trim(),
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

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
