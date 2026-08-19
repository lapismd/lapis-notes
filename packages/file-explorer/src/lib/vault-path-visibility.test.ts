import { describe, expect, it } from "vitest";
import { isVisibleExplorerPath } from "./vault-path-visibility";

describe("file explorer vault path visibility", () => {
  it.each([
    ".obsidian/app.json",
    ".trash/old.md",
    ".lapis/agents/sessions/id/metadata.yaml",
    "Projects/Atlas/.lapis/agents/sessions/id/transcript.jsonl",
    "Projects/Atlas/.env.example",
    ".gitignore",
  ])("hides dotted path %s unless show-hidden is on", (path) => {
    expect(isVisibleExplorerPath(path)).toBe(false);
    expect(isVisibleExplorerPath(path, { showHidden: true })).toBe(true);
  });

  it("keeps ordinary notes visible", () => {
    expect(isVisibleExplorerPath("Projects/Atlas/note.md")).toBe(true);
    expect(
      isVisibleExplorerPath("Projects/Atlas/note.md", { showHidden: true }),
    ).toBe(true);
  });
});
