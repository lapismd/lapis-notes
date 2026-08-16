import { describe, expect, it } from "vitest";
import { isVisibleExplorerPath } from "./vault-path-visibility";

describe("file explorer vault path visibility", () => {
  it.each([
    ".obsidian/app.json",
    ".trash/old.md",
    ".lapis/agents/sessions/id/metadata.yaml",
    "Projects/Atlas/.lapis/agents/sessions/id/transcript.jsonl",
  ])("hides internal path %s", (path) => {
    expect(isVisibleExplorerPath(path)).toBe(false);
  });

  it("keeps ordinary dotfiles and notes visible", () => {
    expect(isVisibleExplorerPath("Projects/Atlas/.env.example")).toBe(true);
    expect(isVisibleExplorerPath("Projects/Atlas/note.md")).toBe(true);
  });
});
