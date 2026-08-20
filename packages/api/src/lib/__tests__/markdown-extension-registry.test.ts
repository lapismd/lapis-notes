import { describe, expect, it, vi } from "vitest";
import { MarkdownExtensionRegistry } from "../markdown-extension-registry";
import { MarkdownFileSurfaceRegistry } from "../markdown-file-surface-registry";

describe("MarkdownExtensionRegistry", () => {
  it("namespaces contributions by plugin and disposes the matching entry", () => {
    const registry = new MarkdownExtensionRegistry();
    const disposeFirst = registry.register("alpha", { id: "items" });
    registry.register("beta", { id: "items" });

    expect(registry.getAll().map(({ pluginId, id }) => `${pluginId}:${id}`)).toEqual([
      "alpha:items",
      "beta:items",
    ]);
    expect(() => registry.register("alpha", { id: "items" })).toThrow(
      "already registered",
    );

    disposeFirst();
    expect(registry.getAll().map(({ pluginId }) => pluginId)).toEqual(["beta"]);
  });
});

describe("MarkdownFileSurfaceRegistry", () => {
  it("uses the latest provider and removes it without disturbing earlier providers", async () => {
    const registry = new MarkdownFileSurfaceRegistry();
    const first = vi.fn(() => ({
      enter() {},
      async flush() { return true; },
      async exit() { return true; },
      dispose() {},
    }));
    const second = vi.fn(first);
    registry.register("markdown-a", first);
    const removeSecond = registry.register("markdown-b", second);
    const options = {
      containerEl: document.createElement("div"),
      file: { path: "lists/docs.md" },
      surface: { id: "tasks-list" },
    } as any;

    await registry.mount(options);
    expect(second).toHaveBeenCalledWith(options);
    removeSecond();
    await registry.mount(options);
    expect(first).toHaveBeenCalledWith(options);
  });
});
