import { describe, expect, it, vi } from "vitest";
import { Menu, isMenuItem } from "../menu.svelte";
import type {
  DiagnosticCollection,
  DiagnosticResource,
  WorkspaceDiagnostic,
} from "../diagnostics";
import { LanguageServiceManager } from "./manager";
import type { LanguageServiceProvider, VirtualDocument } from "./types";

const WORKSPACE_FAILURES = "";

function createCollection(): DiagnosticCollection & {
  values: Map<string, readonly WorkspaceDiagnostic[]>;
} {
  const values = new Map<string, readonly WorkspaceDiagnostic[]>();
  const keyFor = (resource: DiagnosticResource | null) =>
    resource ? resource.uri : WORKSPACE_FAILURES;
  return {
    id: "language-service",
    label: "Language service",
    disposed: false,
    values,
    set(
      resourceOrEntries:
        | DiagnosticResource
        | null
        | Iterable<readonly [DiagnosticResource | null, readonly WorkspaceDiagnostic[] | undefined]>,
      diagnostics?: readonly WorkspaceDiagnostic[],
    ) {
      if (
        resourceOrEntries &&
        typeof resourceOrEntries === "object" &&
        Symbol.iterator in resourceOrEntries
      ) {
        for (const [resource, next] of resourceOrEntries) {
          const key = keyFor(resource);
          if (next?.length) values.set(key, next);
          else values.delete(key);
        }
        return;
      }
      if (resourceOrEntries === undefined) return;
      const key = keyFor(resourceOrEntries);
      if (diagnostics?.length) values.set(key, diagnostics);
      else values.delete(key);
    },
    get(resource) {
      return values.get(keyFor(resource));
    },
    has(resource) {
      return values.has(keyFor(resource));
    },
    delete(resource) {
      return values.delete(keyFor(resource));
    },
    clear() {
      values.clear();
    },
    forEach(callback) {
      for (const [uri, diagnostics] of values) {
        callback(uri ? { uri } : null, diagnostics, this);
      }
    },
    *[Symbol.iterator]() {
      for (const [uri, diagnostics] of values) {
        yield [uri ? { uri } : null, diagnostics] as const;
      }
    },
    dispose() {
      values.clear();
    },
  };
}

const document: VirtualDocument = {
  uri: "vault:///Welcome.md",
  languageId: "markdown",
  version: 1,
  text: "heading",
};

describe("LanguageServiceManager diagnostics bridge", () => {
  it("publishes only retained documents and clears the final closed editor", async () => {
    const manager = new LanguageServiceManager();
    const collection = createCollection();
    manager.bindDiagnostics({ collection, applyCodeAction: vi.fn() });
    manager.registerProvider(provider());

    await manager.diagnostics(document);
    expect(collection.values.size).toBe(0);

    const releaseFirst = manager.retainDocument(document.uri);
    const releaseSecond = manager.retainDocument(document.uri);
    await manager.diagnostics(document);
    expect(collection.values.get(document.uri)?.[0]?.message).toBe(
      "Heading level skipped",
    );
    expect(collection.values.get(document.uri)?.[0]?.code).toEqual({
      value: "MD001",
      target:
        "https://github.com/DavidAnson/markdownlint/blob/main/doc/md001.md",
    });

    releaseFirst();
    expect(collection.values.has(document.uri)).toBe(true);
    releaseSecond();
    expect(collection.values.has(document.uri)).toBe(false);
  });

  it("exposes cached provider actions and clears stale results on unload", async () => {
    const manager = new LanguageServiceManager();
    const collection = createCollection();
    const applyCodeAction = vi.fn();
    manager.bindDiagnostics({ collection, applyCodeAction });
    const unregister = manager.registerProvider(provider());
    manager.retainDocument(document.uri);
    await manager.diagnostics(document);
    await vi.waitFor(() => {
      const menu = new Menu();
      manager.buildDiagnosticItemMenu(menu, {
        key: "problem",
        collectionId: collection.id,
        collectionLabel: collection.label,
        resource: { uri: document.uri },
        diagnostic: collection.values.get(document.uri)![0],
      });
      expect(Object.values(menu.renderedItems).flat()).toHaveLength(1);
    });

    const menu = new Menu();
    manager.buildDiagnosticItemMenu(menu, {
      key: "problem",
      collectionId: collection.id,
      collectionLabel: collection.label,
      resource: { uri: document.uri },
      diagnostic: collection.values.get(document.uri)![0],
    });
    const item = Object.values(menu.renderedItems).flat()[0];
    expect(isMenuItem(item) && item.title).toBe("Fix heading level");
    if (isMenuItem(item)) item.click(new KeyboardEvent("keydown"));
    expect(applyCodeAction).toHaveBeenCalledOnce();

    unregister();
    expect(collection.values.size).toBe(0);
  });

  it("does not publish an in-flight result after the diagnostics bridge is unbound", async () => {
    const manager = new LanguageServiceManager();
    const collection = createCollection();
    manager.bindDiagnostics({ collection, applyCodeAction: vi.fn() });
    manager.retainDocument(document.uri);

    let resolveDiagnostics!: (
      diagnostics: Awaited<
        ReturnType<NonNullable<LanguageServiceProvider["provideDiagnostics"]>>
      >,
    ) => void;
    const pendingDiagnostics = new Promise<
      Awaited<
        ReturnType<NonNullable<LanguageServiceProvider["provideDiagnostics"]>>
      >
    >((resolve) => {
      resolveDiagnostics = resolve;
    });
    manager.registerProvider({
      ...provider(),
      provideDiagnostics: () => pendingDiagnostics,
    });

    const request = manager.diagnostics(document);
    manager.unbindDiagnostics();
    resolveDiagnostics([]);

    await expect(request).resolves.toEqual([]);
    expect(collection.values.size).toBe(0);
  });

  it("scopes cached actions to the originating diagnostic and unique titles", async () => {
    const manager = new LanguageServiceManager();
    const collection = createCollection();
    manager.bindDiagnostics({ collection, applyCodeAction: vi.fn() });
    const diagnostic = {
      message: "Lists should be surrounded by blank lines",
      severity: "warning" as const,
      source: "markdownlint",
      code: "MD032",
      range: {
        start: { line: 1, character: 0 },
        end: { line: 1, character: 1 },
      },
    };
    const other = {
      ...diagnostic,
      range: {
        start: { line: 4, character: 0 },
        end: { line: 4, character: 1 },
      },
    };
    manager.registerProvider({
      ...provider(),
      async provideDiagnostics() {
        return [diagnostic];
      },
      async provideCodeActions() {
        return [
          {
            title: "Fix this violation of `MD032`",
            diagnostics: [diagnostic],
            edit: { changes: [{ from: 0, to: 0, insert: "\n" }] },
          },
          {
            title: "Disable MD032 for this file",
            diagnostics: [other],
            edit: { changes: [{ from: 0, to: 0, insert: "<!-- ignore -->" }] },
          },
          {
            title: "Fix this violation of `MD032`",
            diagnostics: [diagnostic],
            edit: { changes: [{ from: 6, to: 6, insert: "\n" }] },
          },
          {
            title: "Disable MD032 for this line",
            diagnostics: [diagnostic],
            edit: { changes: [{ from: 0, to: 0, insert: "<!-- next -->" }] },
          },
        ];
      },
    });
    manager.retainDocument(document.uri);
    await manager.diagnostics(document);

    expect(
      manager
        .cachedCodeActionsFor(document.uri, diagnostic)
        .map((action) => action.title),
    ).toEqual([
      "Fix this violation of `MD032`",
      "Disable MD032 for this line",
    ]);
  });

  it("merges diagnostics and code actions from every matching priority", async () => {
    const manager = new LanguageServiceManager();
    const collection = createCollection();
    manager.bindDiagnostics({ collection, applyCodeAction: vi.fn() });
    manager.registerProvider({
      ...provider(),
      metadata: {
        ...provider().metadata,
        id: "markdown-lint",
        priority: 100,
      },
    });
    manager.registerProvider({
      ...provider(),
      metadata: {
        id: "spellcheck",
        languages: ["markdown"],
        runtime: "in-process",
        priority: 90,
        capabilities: { diagnostics: true, codeActions: true },
      },
      async provideDiagnostics() {
        return [
          {
            message: "Did you mean “going”?",
            severity: "error",
            source: "harper",
            code: "SpellCheck",
            range: {
              start: { line: 0, character: 8 },
              end: { line: 0, character: 12 },
            },
          },
        ];
      },
      async provideCodeActions() {
        return [{ title: "going" }];
      },
    });
    manager.retainDocument(document.uri);

    const diagnostics = await manager.diagnostics(document);
    expect(diagnostics.map((entry) => entry.source)).toEqual([
      "markdownlint",
      "harper",
    ]);
    expect(
      collection.values.get(document.uri)?.map((entry) => entry.source),
    ).toEqual(["markdownlint", "harper"]);

    await expect(
      manager.codeActions(document, {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 12 },
      }),
    ).resolves.toEqual([
      expect.objectContaining({ title: "Fix heading level" }),
      expect.objectContaining({ title: "going" }),
    ]);
  });

  it("does not drop a completed provider when another diagnostics request hangs", async () => {
    vi.useFakeTimers();
    const manager = new LanguageServiceManager();
    const collection = createCollection();
    manager.bindDiagnostics({ collection, applyCodeAction: vi.fn() });
    manager.registerProvider({
      ...provider(),
      metadata: { ...provider().metadata, id: "markdown-lint", priority: 100 },
    });
    manager.registerProvider({
      ...provider(),
      metadata: {
        id: "spellcheck",
        languages: ["markdown"],
        runtime: "in-process",
        priority: 90,
        capabilities: { diagnostics: true, codeActions: true },
      },
      provideDiagnostics: () => new Promise(() => {}),
    });
    manager.retainDocument(document.uri);

    const request = manager.diagnostics(document);
    try {
      await vi.advanceTimersByTimeAsync(8_000);
      await expect(request).resolves.toEqual([
        expect.objectContaining({ source: "markdownlint" }),
      ]);
      expect(collection.values.get(document.uri)?.[0]?.source).toBe(
        "markdownlint",
      );
      expect(collection.get(null)).toEqual([
        expect.objectContaining({
          source: "Language service",
          code: "spellcheck",
          message: expect.stringContaining("did not complete"),
        }),
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("publishes a workspace-wide row when a provider throws and keeps other diagnostics", async () => {
    const manager = new LanguageServiceManager();
    const collection = createCollection();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    manager.bindDiagnostics({ collection, applyCodeAction: vi.fn() });
    manager.registerProvider({
      ...provider(),
      metadata: { ...provider().metadata, id: "markdown-lint", priority: 100 },
    });
    manager.registerProvider({
      ...provider(),
      metadata: {
        id: "spellcheck",
        languages: ["markdown"],
        runtime: "in-process",
        priority: 90,
        capabilities: { diagnostics: true, codeActions: true },
      },
      provideDiagnostics: async () => {
        throw new Error("wasm instantiate failed");
      },
    });
    manager.retainDocument(document.uri);

    await expect(manager.diagnostics(document)).resolves.toEqual([
      expect.objectContaining({ source: "markdownlint" }),
    ]);
    expect(collection.get(null)).toEqual([
      expect.objectContaining({
        source: "Language service",
        code: "spellcheck",
        message:
          "Language diagnostics provider “spellcheck” failed: wasm instantiate failed",
      }),
    ]);
    warn.mockRestore();
  });

  it("clears a provider failure after a later successful provide", async () => {
    const manager = new LanguageServiceManager();
    const collection = createCollection();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    manager.bindDiagnostics({ collection, applyCodeAction: vi.fn() });
    let shouldFail = true;
    manager.registerProvider({
      ...provider(),
      provideDiagnostics: async () => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error("wasm instantiate failed");
        }
        return [];
      },
    });
    manager.retainDocument(document.uri);

    await manager.diagnostics(document);
    expect(collection.get(null)?.[0]?.code).toBe("markdownlint");
    await manager.diagnostics(document);
    expect(collection.get(null)).toBeUndefined();
    warn.mockRestore();
  });

  it("publishes an eager provider failure before the first lint", () => {
    const manager = new LanguageServiceManager();
    const collection = createCollection();
    manager.bindDiagnostics({ collection, applyCodeAction: vi.fn() });
    manager.reportProviderFailure("spellcheck", new Error("harper setup failed"));
    expect(collection.get(null)).toEqual([
      expect.objectContaining({
        source: "Language service",
        code: "spellcheck",
        message:
          "Language diagnostics provider “spellcheck” failed: harper setup failed",
      }),
    ]);
  });

  it("runs provider applyCommand for serializable action commands", async () => {
    const manager = new LanguageServiceManager();
    const applyCommand = vi.fn();
    manager.registerProvider({
      ...provider(),
      applyCommand,
    });

    await manager.applyCommand(document, {
      id: "spellcheck:add-to-dictionary",
      arguments: ["sentense"],
    });

    expect(applyCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        document,
      }),
      {
        id: "spellcheck:add-to-dictionary",
        arguments: ["sentense"],
      },
    );
  });

  it("handles rejected fire-and-forget document updates", async () => {
    const manager = new LanguageServiceManager();
    const error = new Error("provider stopped");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    manager.registerProvider({
      ...provider(),
      updateDocument: () => Promise.reject(error),
    });

    manager.updateDocument(document);

    await vi.waitFor(() => {
      expect(warn).toHaveBeenCalledWith("Language document update failed", {
        provider: "markdownlint",
        error,
      });
    });
    warn.mockRestore();
  });
});

function provider(): LanguageServiceProvider {
  return {
    metadata: {
      id: "markdownlint",
      languages: ["markdown"],
      runtime: "worker",
      capabilities: { diagnostics: true, codeActions: true },
    },
    async provideDiagnostics() {
      return [
        {
          message: "Heading level skipped",
          severity: "warning",
          source: "markdownlint",
          code: "MD001",
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 7 },
          },
        },
      ];
    },
    async provideCodeActions() {
      return [
        {
          title: "Fix heading level",
          edit: { changes: [{ from: 0, to: 1, insert: "#" }] },
        },
      ];
    },
  };
}
