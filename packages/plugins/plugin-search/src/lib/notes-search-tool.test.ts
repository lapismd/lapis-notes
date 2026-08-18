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
  it("steers the agent to indexed vault search instead of host-cwd shell lookup", () => {
    const description = createNotesSearchTool({ query: vi.fn() }).description;
    expect(description).toContain("Prefer this tool over");
    expect(description).toContain("grep");
    expect(description).toContain("rg");
    expect(description).toContain("find");
    expect(description).toContain("lightweight");
    expect(description).toMatch(/\bread\b/u);
    expect(description).not.toContain("notes_read");
  });

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

  it("bounds aggregate structured and text results", async () => {
    const query = vi.fn(async () => ({
      count: 50,
      hits: Array.from({ length: 50 }, (_, index) => ({
        id: `Projects/Alpha/note-${index}.md`,
        score: 50 - index,
        document: { path: `Projects/Alpha/note-${index}.md` },
        snippets: Array.from({ length: 3 }, () => ({
          text: "x".repeat(500),
          offset: 0,
        })),
      })),
    }));
    const result = await createNotesSearchTool({ query } as never).execute(
      { query: "x", limit: 50 },
      context(),
    );
    const encoded = new TextEncoder().encode(
      JSON.stringify(result.structuredContent),
    );

    expect(encoded.byteLength).toBeLessThanOrEqual(48 * 1024);
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.any(String),
    });
  });
});
