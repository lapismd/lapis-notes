import { describe, expect, it, vi } from "vitest";
import { Menu, isMenuItem } from "../menu.svelte";
import type {
  DiagnosticCollection,
  DiagnosticResource,
  WorkspaceDiagnostic,
} from "../diagnostics";
import { LanguageServiceManager } from "./manager";
import type { LanguageServiceProvider, VirtualDocument } from "./types";

function createCollection(): DiagnosticCollection & {
  values: Map<string, readonly WorkspaceDiagnostic[]>;
} {
  const values = new Map<string, readonly WorkspaceDiagnostic[]>();
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
          if (resource && next?.length) values.set(resource.uri, next);
        }
        return;
      }
      if (!resourceOrEntries) return;
      if (diagnostics?.length) values.set(resourceOrEntries.uri, diagnostics);
      else values.delete(resourceOrEntries.uri);
    },
    get(resource) {
      return resource ? values.get(resource.uri) : undefined;
    },
    has(resource) {
      return resource ? values.has(resource.uri) : false;
    },
    delete(resource) {
      return resource ? values.delete(resource.uri) : false;
    },
    clear() {
      values.clear();
    },
    forEach(callback) {
      for (const [uri, diagnostics] of values) {
        callback({ uri }, diagnostics, this);
      }
    },
    *[Symbol.iterator]() {
      for (const [uri, diagnostics] of values) {
        yield [{ uri }, diagnostics] as const;
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
