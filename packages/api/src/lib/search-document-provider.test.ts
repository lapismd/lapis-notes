import { describe, expect, it, vi } from "vitest";
import { SearchDocumentProviderRegistry } from "./search-document-provider";
import type { TFile } from "./storage";

function file(path: string): TFile {
  const name = path.split("/").at(-1) ?? path;
  return {
    path,
    name,
    baseName: name.replace(/\.[^.]+$/u, ""),
    extension: name.split(".").at(-1) ?? "",
    stat: { ctime: 0, mtime: 0, size: 0 },
  } as TFile;
}

describe("SearchDocumentProviderRegistry", () => {
  it("selects the highest-priority matching provider and emits lifecycle changes", () => {
    const registry = new SearchDocumentProviderRegistry();
    const changes: string[] = [];
    registry.on("changed", ({ providerId, reason }) => {
      changes.push(`${providerId}:${reason}`);
    });
    registry.register({
      id: "search:markdown",
      priority: 0,
      matches: (candidate) => candidate.extension === "md",
      extract: ({ content }) => ({ content }),
    });
    const override = registry.register({
      id: "fixture:markdown",
      priority: 10,
      matches: (candidate) => candidate.extension === "md",
      extract: ({ content }) => ({ content: content.toUpperCase() }),
    });

    expect(registry.resolve(file("Note.md"))?.id).toBe("fixture:markdown");
    override.dispose();
    expect(registry.resolve(file("Note.md"))?.id).toBe("search:markdown");
    expect(changes).toEqual([
      "search:markdown:registered",
      "fixture:markdown:registered",
      "fixture:markdown:unregistered",
    ]);
  });

  it("rejects equal-priority overlaps and duplicate ids", () => {
    const registry = new SearchDocumentProviderRegistry();
    const provider = {
      id: "one",
      matches: () => true,
      extract: vi.fn(({ content }: { content: string }) => ({ content })),
    };
    registry.register(provider);
    expect(() => registry.register(provider)).toThrow(/already registered/u);
    registry.register({ ...provider, id: "two" });
    expect(() => registry.resolve(file("Note.md"))).toThrow(
      /Ambiguous search document providers/u,
    );
  });
});
