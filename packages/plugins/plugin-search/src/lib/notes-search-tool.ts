import type {
  AppTool,
  AppToolExecutionContext,
  AppToolJsonValue,
} from "@lapis-notes/api";
import type { SearchManager } from "./search-manager";

const MARKDOWN_SOURCE_PROVIDER_ID = "search:markdown";
const HIDDEN_NOTE_SEGMENTS = new Set([".obsidian", ".lapis", ".trash"]);
const MAX_STRUCTURED_RESULT_BYTES = 48 * 1024;

interface NotesSearchInput {
  query: string;
  limit?: number;
}

export function createNotesSearchTool(
  searchManager: Pick<SearchManager, "query">,
): AppTool<NotesSearchInput> {
  return {
    name: "notes_search",
    description: `
Search the user's Lapis Notes using the application's indexed note search.

Use this tool whenever the user asks to:
- find, search, locate, recall, or look up notes
- find information previously written in their notes
- discover notes related to a topic
- search across the current folder/project

Prefer this tool over shell commands such as grep, rg, find, or manually
walking the notes filesystem. This tool uses the application's index and
respects the current conversation's note scope.

Returns lightweight matches. Use read to inspect a selected result.
`.trim(),
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1, maxLength: 1_000 },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        results: { type: "array" },
      },
      required: ["results"],
      additionalProperties: false,
    },
    effect: "read",
    execute: async (input, context) => executeNotesSearch(searchManager, input, context),
  };
}

async function executeNotesSearch(
  searchManager: Pick<SearchManager, "query">,
  input: NotesSearchInput,
  context: AppToolExecutionContext,
) {
  context.signal.throwIfAborted();
  const limit = input.limit ?? 10;
  const result = await searchManager.query({
    term: input.query,
    limit,
    pathPrefix: context.scope.directory,
    sourceProviderIds: [MARKDOWN_SOURCE_PROVIDER_ID],
  });
  context.signal.throwIfAborted();
  const results: Array<{
    path: string;
    score: number;
    snippets: Array<{ text: string; offset: number }>;
  }> = [];
  for (const hit of result.hits) {
    if (!isAllowedMarkdownPath(hit.document.path)) continue;
    const entry = {
      path: hit.document.path,
      score: Number.isFinite(hit.score) ? hit.score : 0,
      snippets: hit.snippets.slice(0, 3).map((snippet) => ({
        text: snippet.text.slice(0, 500),
        offset: Math.max(0, snippet.offset),
      })),
    };
    if (
      new TextEncoder().encode(JSON.stringify({ results: [...results, entry] }))
        .byteLength > MAX_STRUCTURED_RESULT_BYTES
    ) {
      break;
    }
    results.push(entry);
    if (results.length >= limit) break;
  }
  const structuredContent = { results } satisfies AppToolJsonValue;
  return {
    content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }],
    structuredContent,
  };
}

function isAllowedMarkdownPath(path: string): boolean {
  const segments = path.split("/");
  const extension = segments.at(-1)?.split(".").at(-1)?.toLowerCase();
  return (
    (extension === "md" || extension === "markdown") &&
    !segments.some((segment) => HIDDEN_NOTE_SEGMENTS.has(segment))
  );
}
