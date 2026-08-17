import {
  createAppToolExecutionScope,
  type AppToolExecutionContext,
} from "@lapis-notes/api/agent-tools";
import { describe, expect, it, vi } from "vitest";
import { createNotesSearchTool } from "./notes-search-tool";

function context(): AppToolExecutionContext {
  return {
    conversationId: "conversation-1",
    agentBindingId: "binding-1",
    runId: "run-1",
    toolCallId: "call-1",
    scope: createAppToolExecutionScope("Projects/Alpha"),
    signal: new AbortController().signal,
  };
}

describe("notes_search", () => {
  it("searches only scoped Markdown documents with portable bounded results", async () => {
    const query = vi.fn(async () => ({
      count: 3,
      hits: [
        {
          id: "Projects/Alpha/readme.md",
          score: 12,
          document: { path: "Projects/Alpha/readme.md" },
          snippets: [{ text: "matching text", offset: 4 }],
        },
        {
          id: "Projects/Alpha/board.canvas",
          score: 10,
          document: { path: "Projects/Alpha/board.canvas" },
          snippets: [{ text: "canvas", offset: 0 }],
        },
        {
          id: "Projects/Alpha/.lapis/private.md",
          score: 9,
          document: { path: "Projects/Alpha/.lapis/private.md" },
          snippets: [{ text: "private", offset: 0 }],
        },
      ],
    }));
    const tool = createNotesSearchTool({ query } as never);

    await expect(
      tool.execute({ query: "matching", limit: 5 }, context()),
    ).resolves.toMatchObject({
      structuredContent: {
        results: [
          {
            path: "Projects/Alpha/readme.md",
            score: 12,
            snippets: [{ text: "matching text", offset: 4 }],
          },
        ],
      },
    });
    expect(query).toHaveBeenCalledWith({
      term: "matching",
      limit: 5,
      pathPrefix: "Projects/Alpha",
      sourceProviderIds: ["search:markdown"],
    });
  });

  it("uses a ten-result default and observes pre-cancelled calls", async () => {
    const query = vi.fn(async () => ({ count: 0, hits: [] }));
    const tool = createNotesSearchTool({ query } as never);
    const cancelled = context();
    const controller = new AbortController();
    controller.abort();
    cancelled.signal = controller.signal;

    await expect(
      tool.execute({ query: "test" }, cancelled),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(query).not.toHaveBeenCalled();
  });
});
