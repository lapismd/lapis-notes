import type {
  AppTool,
  AppToolExecutionContext,
  AppToolJsonValue,
} from "@lapis-notes/api";
import type { SearchManager } from "./search-manager";

const MARKDOWN_SOURCE_PROVIDER_ID = "search:markdown";
const HIDDEN_NOTE_SEGMENTS = new Set([".obsidian", ".lapis", ".trash"]);

interface NotesSearchInput {
  query: string;
  limit?: number;
}

export function createNotesSearchTool(
  searchManager: Pick<SearchManager, "query">,
): AppTool<NotesSearchInput> {
  return {
    name: "notes_search",
    description:
      "Search Markdown notes within the fixed conversation directory.",
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
  const results = result.hits
    .filter((hit) => isAllowedMarkdownPath(hit.document.path))
    .slice(0, limit)
    .map((hit) => ({
      path: hit.document.path,
      score: Number.isFinite(hit.score) ? hit.score : 0,
      snippets: hit.snippets.slice(0, 3).map((snippet) => ({
        text: snippet.text.slice(0, 500),
        offset: Math.max(0, snippet.offset),
      })),
    }));
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
