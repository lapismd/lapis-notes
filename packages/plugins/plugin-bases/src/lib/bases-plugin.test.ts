import { describe, expect, it, vi } from "vitest";

vi.mock("@lapis-notes/api", async () => {
  class MockEmbedRegistry {
    readonly embedByExtension: Record<string, unknown> = {};

    register(extension: string, view: unknown): () => void {
      this.embedByExtension[extension.toLowerCase()] = view;
      return () => {
        delete this.embedByExtension[extension.toLowerCase()];
      };
    }

    get(extension: string): unknown {
      return this.embedByExtension[extension.toLowerCase()] ?? null;
    }
  }

  class MockMarkdownRenderChild {
    readonly unloaders = new Set<() => void>();

    constructor(readonly containerEl: HTMLElement) {}

    register(callback: () => void): void {
      this.unloaders.add(callback);
    }
  }

  class MockPlugin {
    readonly unloaders = new Set<() => void>();

    constructor(
      readonly app: any,
      readonly manifest: any,
    ) {}

    register(callback: () => void): void {
      this.unloaders.add(callback);
    }

    unload(): void {
      this.unloaders.forEach((callback) => callback());
      this.unloaders.clear();
    }

    registerView(type: string, creator: unknown): void {
      this.app.registerView(type, creator);
      this.register(() => this.app.unregisterView?.(type, creator));
    }

    registerEditorView(config: unknown): void {
      this.app.registerEditorView?.(config);
    }

    registerExtensions(extensions: string[], viewType: string): void {
      this.app.registerExtensions(extensions, viewType);
      this.register(() =>
        this.app.unregisterExtensions?.(extensions, viewType),
      );
    }

    registerEditorExtension(extension: unknown, viewType: string): void {
      this.app.registerEditorExtension?.(extension, viewType);
      this.register(() =>
        this.app.unregisterEditorExtension?.(extension, viewType),
      );
    }

    registerMarkdownCodeBlockProcessor(
      language: string,
      handler: unknown,
    ): void {
      this.app.registerMarkdownCodeBlockProcessor(language, handler);
      this.register(() =>
        this.app.unregisterMarkdownCodeBlockProcessor?.(language, handler),
      );
    }
  }

  return {
    EmbedRegistry: MockEmbedRegistry,
    MarkdownRenderChild: MockMarkdownRenderChild,
    Plugin: MockPlugin,
  };
});

vi.mock("@lapis-notes/api/editor/core", () => ({
  markupEditor: vi.fn(() => Symbol("yaml-editor")),
}));

vi.mock("@codemirror/lang-yaml", () => ({
  yaml: vi.fn(() => Symbol("yaml-language")),
}));

vi.mock("./bases-view", () => ({
  BasesView: class {},
  BasesViewType: "bases",
  createBasesViewRegistrations: vi.fn(() => new Map()),
  parseBasesDocument: vi.fn(() => ({
    filters: { and: [] },
    properties: {},
    formulas: {},
    summaries: {},
    activeView: "Test",
    views: [],
  })),
}));

vi.mock("./bases-view/view.svelte", () => ({
  default: Symbol("BasesComponent"),
}));

vi.mock("svelte", () => ({
  mount: vi.fn(() => ({ destroy: vi.fn() })),
  unmount: vi.fn(),
}));

import { EmbedRegistry } from "@lapis-notes/api";
import { mount } from "svelte";
import { parseBasesDocument } from "./bases-view";
import { BasesPlugin } from "./bases-plugin";

function createMockApp() {
  const markdownProcessors: Record<string, unknown[]> = {};

  return {
    embedRegistry: new EmbedRegistry(),
    markdownProcessors,
    registerView: vi.fn(),
    unregisterView: vi.fn(),
    registerEditorView: vi.fn(),
    registerExtensions: vi.fn(),
    unregisterExtensions: vi.fn(),
    registerEditorExtension: vi.fn(),
    unregisterEditorExtension: vi.fn(),
    registerMarkdownCodeBlockProcessor: vi.fn(
      (language: string, handler: unknown) => {
        markdownProcessors[language] ||= [];
        markdownProcessors[language].push(handler);
      },
    ),
    unregisterMarkdownCodeBlockProcessor: vi.fn(
      (language: string, handler: unknown) => {
        markdownProcessors[language] = (
          markdownProcessors[language] || []
        ).filter((candidate) => candidate !== handler);
      },
    ),
    vault: {
      read: vi.fn(),
    },
  } as any;
}

describe("BasesPlugin", () => {
  it("registers the complete legacy surface plus YAML source editing", async () => {
    const app = createMockApp();
    const plugin = new BasesPlugin(app);

    await plugin.onload();

    expect(plugin.manifest).toMatchObject({
      id: "bases",
      name: "Bases",
      minAppVersion: "1.7.7",
      description: "Bases",
      author: "Lapis Notes Bases",
      authorUrl: "https://app.lapis.md",
      isDesktopOnly: false,
    });
    expect(app.registerView).toHaveBeenCalledWith(
      "bases",
      expect.any(Function),
    );
    expect(app.registerEditorView).toHaveBeenCalledWith({
      id: "bases",
      label: "Bases",
      filenamePatterns: ["*.bases", "*.base"],
      priority: "default",
    });
    expect(app.registerExtensions).toHaveBeenCalledWith(
      ["bases", "base"],
      "bases",
    );
    expect(app.registerEditorExtension).toHaveBeenCalledWith(
      expect.any(Function),
      "bases",
    );
    expect(app.embedRegistry.get("base")).toBeTypeOf("function");
    expect(app.embedRegistry.get("bases")).toBeTypeOf("function");
    expect(app.markdownProcessors.base).toHaveLength(1);
    expect(app.markdownProcessors.bases).toHaveLength(1);
  });

  it("removes bases embeds and fenced code block processors on unload", async () => {
    const app = createMockApp();
    const plugin = new BasesPlugin(app);

    await plugin.onload();
    plugin.unload();

    expect(app.embedRegistry.get("base")).toBeNull();
    expect(app.embedRegistry.get("bases")).toBeNull();
    expect(app.markdownProcessors.base ?? []).toHaveLength(0);
    expect(app.markdownProcessors.bases ?? []).toHaveLength(0);
    expect(app.unregisterEditorExtension).toHaveBeenCalledWith(
      expect.any(Function),
      "bases",
    );
  });

  it("renders invalid fenced Bases YAML as a read-only error", async () => {
    const app = createMockApp();
    const plugin = new BasesPlugin(app);
    vi.mocked(parseBasesDocument).mockImplementationOnce(() => {
      throw new Error("invalid YAML");
    });
    await plugin.onload();
    const containerEl = document.createElement("div");
    const addChild = vi.fn();
    const handler = app.markdownProcessors.base[0] as (
      source: string,
      container: HTMLElement,
      context: { addChild: (child: unknown) => void },
    ) => void;

    handler("views: [", containerEl, { addChild });

    expect(
      containerEl.querySelector(".bases-view-error__message")?.textContent,
    ).toContain("Unable to render this base: invalid YAML");
    expect(mount).not.toHaveBeenCalled();
    expect(addChild).toHaveBeenCalledOnce();
  });
});
