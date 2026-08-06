import { describe, expect, it, vi } from "vitest";
import { HistoryManager } from "../history.svelte";

describe("HistoryManager navigation snapshots", () => {
  it("replaces the current entry before pushing a new navigation state", async () => {
    const updater = vi.fn();
    const history = new HistoryManager<{ file: string; mode: string }>(updater);

    history.pushState({ file: "A.md", mode: "live-preview" });
    history.replaceState({ file: "A.md", mode: "preview" });
    history.pushState({ file: "B.md", mode: "preview" });

    await history.back();

    expect(updater).toHaveBeenCalledWith({
      file: "A.md",
      mode: "preview",
    });
    expect(history.stack).toEqual([
      { file: "A.md", mode: "preview" },
      { file: "B.md", mode: "preview" },
    ]);
  });
});
