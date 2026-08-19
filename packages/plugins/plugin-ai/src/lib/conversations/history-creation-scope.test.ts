import type { App, TFile } from "@lapis-notes/api";
import { describe, expect, it } from "vitest";
import {
  conversationScopeFromVaultPath,
  readExplorerSelectedPath,
  resolveHistoryCreationScope,
} from "./history-creation-scope";

function createApp(options: {
  selectedPath?: string;
  files?: string[];
} = {}): App {
  const files = new Set(options.files ?? []);
  const hasExplorer = options.selectedPath !== undefined;
  return {
    vault: {
      getFileByPath: (path: string) =>
        files.has(path) ? ({ path } as TFile) : null,
    },
    workspace: {
      getLeavesOfType: () =>
        hasExplorer
          ? [{ view: { selectedPath: options.selectedPath } }]
          : [],
    },
  } as unknown as App;
}

describe("history creation scope", () => {
  it("reads the first Explorer selectedPath", () => {
    const app = createApp({ selectedPath: "Projects" });
    expect(readExplorerSelectedPath(app)).toBe("Projects");
  });

  it("treats a selected file as its note folder", () => {
    const app = createApp({
      selectedPath: "Notes/Welcome.md",
      files: ["Notes/Welcome.md"],
    });
    expect(conversationScopeFromVaultPath(app, "Notes/Welcome.md")).toBe(
      "Notes",
    );
  });

  it("uses a selected folder and skips hidden application segments", () => {
    const app = createApp();
    expect(conversationScopeFromVaultPath(app, "Projects/Atlas")).toBe(
      "Projects/Atlas",
    );
    expect(conversationScopeFromVaultPath(app, "Notes/.agents/skills")).toBe(
      "Notes",
    );
    expect(conversationScopeFromVaultPath(app, "/")).toBe("");
  });

  it("prefers Explorer selection over the active-note fallback", () => {
    const app = createApp({ selectedPath: "Projects" });
    expect(resolveHistoryCreationScope(app, "Notes")).toBe("Projects");
  });

  it("falls back to the active-note scope when Explorer is absent", () => {
    const app = createApp();
    expect(resolveHistoryCreationScope(app, "Notes")).toBe("Notes");
  });

  it("falls back when Explorer has no selected path yet", () => {
    const app = createApp({ selectedPath: "" });
    expect(resolveHistoryCreationScope(app, "Notes")).toBe("Notes");
  });
});
