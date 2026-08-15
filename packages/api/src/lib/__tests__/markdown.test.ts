import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MarkdownPreviewRenderer,
  MarkdownRenderer,
  type MarkdownPostProcessor,
  type MarkdownPostProcessorContext,
} from "../markdown";
import type { App } from "../context.svelte";

class TestMarkdownRenderer extends MarkdownRenderer {
  get file() {
    return null;
  }
}

describe("MarkdownPreviewRenderer compatibility", () => {
  const previousApp = (globalThis as any).app;

  afterEach(() => {
    (globalThis as any).app = previousApp;
  });

  it("registers and unregisters post processors on the active app", () => {
    const registerMarkdownPostProcessor = vi.fn();
    const unregisterMarkdownPostProcessor = vi.fn();
    (globalThis as any).app = {
      registerMarkdownPostProcessor,
      unregisterMarkdownPostProcessor,
    };
    const processor = vi.fn(
      (..._args: Parameters<MarkdownPostProcessor>) => undefined,
    ) as unknown as MarkdownPostProcessor;

    MarkdownPreviewRenderer.registerPostProcessor(processor, 42);
    MarkdownPreviewRenderer.unregisterPostProcessor(processor);

    expect(processor.sortOrder).toBe(42);
    expect(registerMarkdownPostProcessor).toHaveBeenCalledWith(processor);
    expect(unregisterMarkdownPostProcessor).toHaveBeenCalledWith(processor);
  });

  it("prefers an explicit owner over the compatibility application", () => {
    const owner = { id: "markdown-owner" } as unknown as App;
    (globalThis as any).app = { id: "compatibility-only" };

    expect(
      new TestMarkdownRenderer(document.createElement("div"), owner).app,
    ).toBe(owner);
  });

  it("creates code block processors that strip fences", () => {
    const handler = vi.fn();
    const processor = MarkdownPreviewRenderer.createCodeBlockPostProcessor(
      "ts",
      handler,
    );
    const el = {} as HTMLElement;
    const ctx: MarkdownPostProcessorContext = {
      docId: "doc",
      sourcePath: "note.md",
      frontmatter: null,
      addChild: vi.fn(),
      getSectionInfo: () => ({
        text: "```ts\nconst value = 1;\n```\n",
        lineStart: 0,
        lineEnd: 2,
      }),
    };

    processor(el, ctx);

    expect(handler).toHaveBeenCalledWith("const value = 1;", el, ctx);
  });
});
