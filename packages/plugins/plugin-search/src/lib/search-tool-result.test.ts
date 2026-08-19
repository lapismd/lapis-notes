import { describe, expect, it, vi } from "vitest";
import { TFile } from "@lapis-notes/api";
import {
  editorPositionFromOffset,
  fileNameFromPath,
  notesSearchHitsFromOutput,
  openNotesSearchHit,
} from "./search-tool-result";

describe("notesSearchHitsFromOutput", () => {
  it("reads structuredContent.results from a stringified AppToolResult", () => {
    const hits = notesSearchHitsFromOutput(
      JSON.stringify({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              results: [
                {
                  path: "Projects/auth.md",
                  score: 1,
                  snippets: [{ text: "OAuth tokens", offset: 12 }],
                },
              ],
            }),
          },
        ],
        structuredContent: {
          results: [
            {
              path: "Projects/auth.md",
              score: 1,
              snippets: [{ text: "OAuth tokens", offset: 12 }],
            },
          ],
        },
      }),
    );
    expect(hits).toEqual([
      {
        path: "Projects/auth.md",
        score: 1,
        snippets: [{ text: "OAuth tokens", offset: 12 }],
      },
    ]);
  });
});

describe("openNotesSearchHit", () => {
  it("opens the vault file in a new leaf when chat is active", async () => {
    const file = { path: "Projects/auth.md" } as TFile;
    Object.setPrototypeOf(file, TFile.prototype);
    const chatLeaf = {
      view: {},
    };
    const fileLeaf = {
      view: {},
      openFile: vi.fn(async () => undefined),
    };
    const app = {
      vault: {
        getAbstractFileByPath: vi.fn(() => file),
        cachedRead: vi.fn(async () => "hello OAuth tokens"),
      },
      workspace: {
        getMostRecentLeaf: () => chatLeaf,
        activeLeaf: chatLeaf,
        getLeaf: vi.fn(() => fileLeaf),
        revealLeaf: vi.fn(),
      },
    };
    await openNotesSearchHit(
      app as never,
      {
        path: "Projects/auth.md",
        score: 1,
        snippets: [{ text: "OAuth tokens", offset: 6 }],
      },
      { text: "OAuth tokens", offset: 6 },
    );
    expect(app.workspace.getLeaf).toHaveBeenCalledWith("tab");
    expect(fileLeaf.openFile).toHaveBeenCalledWith(file);
    expect(app.workspace.revealLeaf).toHaveBeenCalledWith(fileLeaf);
    expect(fileNameFromPath("Projects/auth.md")).toBe("auth.md");
    expect(editorPositionFromOffset("hello\nOAuth", 6)).toEqual({
      line: 1,
      ch: 0,
    });
  });
});
