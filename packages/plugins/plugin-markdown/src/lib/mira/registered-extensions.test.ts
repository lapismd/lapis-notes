import { describe, expect, it, vi } from "vitest";
import { resolveRegisteredMarkdownMiraExtensions } from "./registered-extensions";

describe("registered Markdown contributions", () => {
  it("adapts CodeMirror and rendered processors with complete surface context", async () => {
    const child = {
      loaded: false,
      unloaded: false,
      load() { this.loaded = true; },
      unload() { this.unloaded = true; },
    };
    const processor = vi.fn((_el, context) => context.addChild(child));
    const codeMirror = vi.fn(() => []);
    const app = {
      markdownExtensions: {
        getAll: () => [{
          pluginId: "tasks",
          id: "items",
          codeMirror,
          postProcessor: processor,
        }],
      },
      metadataCache: {
        getFileCacheAsync: async () => ({
          frontmatter: { type: "task-list" },
        }),
      },
      vault: { getFileByPath: vi.fn(), read: vi.fn() },
    } as any;
    const markdown = "---\ntype: task-list\n---\n\n## Items\n\n- [[tasks/one]]\n\n## Notes\n";
    const [extension] = resolveRegisteredMarkdownMiraExtensions(app, {
      sourcePath: "lists/docs.md",
      mode: "reading",
      surface: { id: "tasks-list", context: { selected: true } },
      markdown,
    });

    extension?.codeMirror?.({ mode: "live-preview", readonly: false, sourcePath: "lists/docs.md" });
    expect(codeMirror).toHaveBeenCalledWith(expect.objectContaining({
      mode: "live-preview",
      sourcePath: "lists/docs.md",
      surface: { id: "tasks-list", context: { selected: true } },
    }));

    const heading = {} as HTMLElement;
    const headingStart = markdown.indexOf("## Items");
    const cleanup = extension?.postProcessors?.[0]?.(
      heading,
      {
        type: "heading",
        depth: 2,
        position: {
          start: { offset: headingStart },
          end: { offset: headingStart + "## Items".length },
        },
      },
      null,
    );
    await vi.waitFor(() => expect(processor).toHaveBeenCalledOnce());
    const context = processor.mock.calls[0]?.[1];
    expect(context).toEqual(expect.objectContaining({
      docId: "lists/docs.md",
      sourcePath: "lists/docs.md",
      frontmatter: { type: "task-list" },
      mode: "reading",
      surface: { id: "tasks-list", context: { selected: true } },
    }));
    expect(context.getSectionInfo(heading)?.text).toContain("## Items");
    expect(context.getSectionInfo(heading)?.text).not.toContain("## Notes");

    if (typeof cleanup === "function") cleanup();
    expect(child.unloaded).toBe(true);
  });
});
