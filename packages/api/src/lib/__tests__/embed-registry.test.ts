import { describe, expect, it, vi } from "vitest";
import { EmbedRegistry, type MarkdownEmbedder } from "../embed-registry";

function file(path: string) {
  return { path } as Parameters<MarkdownEmbedder>[0]["file"];
}

describe("EmbedRegistry markdown embedders", () => {
  it("lets an embedder decline, lets a later embedder claim, and unregisters only that embedder", () => {
    const registry = new EmbedRegistry();
    const props = {
      app: {} as Parameters<MarkdownEmbedder>[0]["app"],
      containerEl: document.createElement("div"),
      file: file("Notes/Contract transcript.md"),
    };
    const decline = vi.fn(() => false as const);
    const claim = vi.fn(() => ({ destroy() {} }));
    const removeDecline = registry.registerMarkdownEmbedder(decline);
    const removeClaim = registry.registerMarkdownEmbedder(claim);

    expect(registry.renderMarkdownEmbed(props)).toEqual(
      expect.objectContaining({ destroy: expect.any(Function) }),
    );
    expect(decline).toHaveBeenCalledOnce();
    expect(claim).toHaveBeenCalledOnce();

    removeDecline();
    decline.mockClear();
    claim.mockClear();
    expect(registry.renderMarkdownEmbed(props)).toEqual(
      expect.objectContaining({ destroy: expect.any(Function) }),
    );
    expect(decline).not.toHaveBeenCalled();
    expect(claim).toHaveBeenCalledOnce();

    removeClaim();
    expect(registry.renderMarkdownEmbed(props)).toBe(false);
  });
});
