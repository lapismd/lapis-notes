import type {
  AppTool,
  AppToolExecutionContext,
  AppToolJsonValue,
  AppToolResult,
} from "@lapis-notes/api/agent-tools";
import type { MemoryContext, MemorySearchQuery, MemoryService } from "./types";

type MemorySearchInput = {
  query: string;
  scope?: "current" | "workspace";
  corpus?: "curated" | "episodic" | "all";
  limit?: number;
  since?: string;
  before?: string;
  includeSuperseded?: boolean;
};

type MemoryGetInput = {
  ref: string;
  includeEvidence?: boolean;
  includeHistory?: boolean;
};

const MEMORY_SEARCH_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["query"],
  properties: {
    query: { type: "string", minLength: 1, maxLength: 2_000 },
    scope: { type: "string", enum: ["current", "workspace"] },
    corpus: { type: "string", enum: ["curated", "episodic", "all"] },
    limit: { type: "integer", minimum: 1, maximum: 20 },
    since: { type: "string", minLength: 10, maxLength: 64 },
    before: { type: "string", minLength: 10, maxLength: 64 },
    includeSuperseded: { type: "boolean" },
  },
} as const;

const MEMORY_GET_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ref"],
  properties: {
    ref: { type: "string", minLength: 1, maxLength: 512 },
    includeEvidence: { type: "boolean" },
    includeHistory: { type: "boolean" },
  },
} as const;

export function createMemoryAppTools(service: MemoryService): AppTool[] {
  return [createMemorySearchTool(service), createMemoryGetTool(service)];
}

function createMemorySearchTool(service: MemoryService): AppTool<MemorySearchInput> {
  return {
    name: "memory_search",
    description:
      "Search app-owned durable and episodic memory in the current vault. Returns compact results with provenance references; use memory_get for exact evidence.",
    inputSchema: structuredClone(MEMORY_SEARCH_INPUT_SCHEMA),
    outputSchema: { type: "object" },
    effect: "read",
    execute: async (input, context) => {
      context.signal.throwIfAborted();
      const query: MemorySearchQuery = {
        query: input.query,
        ...(input.scope ? { scope: input.scope } : {}),
        ...(input.corpus ? { corpus: input.corpus } : {}),
        ...(input.limit ? { limit: input.limit } : {}),
        ...(input.since ? { since: input.since } : {}),
        ...(input.before ? { before: input.before } : {}),
        ...(input.includeSuperseded !== undefined
          ? { includeSuperseded: input.includeSuperseded }
          : {}),
      };
      const results = await service.search(
        query,
        memoryContext(context),
        context.signal,
      );
      context.signal.throwIfAborted();
      const structuredContent = { results } satisfies AppToolJsonValue;
      return {
        content: [
          {
            type: "text",
            text:
              results.length === 0
                ? "No matching memory found."
                : JSON.stringify(results, null, 2),
          },
        ],
        structuredContent,
      };
    },
  };
}

function createMemoryGetTool(service: MemoryService): AppTool<MemoryGetInput> {
  return {
    name: "memory_get",
    description:
      "Resolve one opaque memory reference and verify its original transcript evidence without returning a complete transcript.",
    inputSchema: structuredClone(MEMORY_GET_INPUT_SCHEMA),
    outputSchema: { type: "object" },
    effect: "read",
    execute: async (input, context): Promise<AppToolResult> => {
      context.signal.throwIfAborted();
      const detail = await service.get(
        input.ref,
        memoryContext(context),
        context.signal,
      );
      const projected = {
        ...detail,
        evidenceMessages:
          input.includeEvidence === false ? [] : detail.evidenceMessages.slice(0, 6),
        history: input.includeHistory ? detail.history : undefined,
      };
      const structuredContent = JSON.parse(
        JSON.stringify(projected),
      ) as AppToolJsonValue;
      return {
        content: [{ type: "text", text: JSON.stringify(projected, null, 2) }],
        structuredContent,
      };
    },
  };
}

function memoryContext(context: AppToolExecutionContext): MemoryContext {
  return {
    scopeDir: context.scope.directory,
    conversationId: context.conversationId,
    agentBindingId: context.agentBindingId,
    runId: context.runId,
  };
}

export const MEMORY_APP_TOOL_SCHEMAS = {
  memorySearch: MEMORY_SEARCH_INPUT_SCHEMA,
  memoryGet: MEMORY_GET_INPUT_SCHEMA,
};
