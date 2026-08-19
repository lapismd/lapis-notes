import type { App, TFile } from "@lapis-notes/api";
import { describe, expect, it } from "vitest";
import { EXPLORER_SETTING_IDS } from "./explorer-settings";
import {
  listVaultPaletteFiles,
  VAULT_PALETTE_FILES_TAB,
  VAULT_PALETTE_RECENT_GROUP,
} from "./vault-palette-files";

function createFile(path: string): TFile {
  const name = path.split("/").pop() ?? path;
  const extension = name.includes(".") ? name.split(".").pop() ?? "" : "";
  return { path, name, extension } as TFile;
}

function createApp(options: {
  queryFiles?: TFile[];
  recentFiles?: TFile[];
  showHidden?: boolean;
}): App {
  const files = options.queryFiles ?? [];
  return {
    vault: {
      getFiles: () => files,
    },
    workspace: {
      getRecentFiles: () => options.recentFiles ?? [],
    },
    configuration: {
      getConfiguration: () => ({
        get<T>(key: string, defaultValue?: T): T {
          if (key === EXPLORER_SETTING_IDS.showHiddenFiles) {
            return Boolean(options.showHidden) as T;
          }
          return defaultValue as T;
        },
      }),
    },
  } as unknown as App;
}

describe("listVaultPaletteFiles", () => {
  it("declares the Files tab and Recent group labels", () => {
    expect(VAULT_PALETTE_FILES_TAB).toEqual({
      id: "files",
      label: "Files",
      order: 20,
    });
    expect(VAULT_PALETTE_RECENT_GROUP).toBe("Recent");
  });

  it("lists visible recents when the query is empty", () => {
    const recent = [
      createFile("Notes/Welcome.md"),
      createFile(".obsidian/app.json"),
      createFile("Notes/draft.bin"),
    ];
    expect(listVaultPaletteFiles(createApp({ recentFiles: recent }), "")).toEqual(
      [recent[0]],
    );
  });

  it("filters vault files by path and hidden-file setting", () => {
    const files = [
      createFile("Notes/Welcome.md"),
      createFile("Notes/settings.json"),
      createFile(".obsidian/app.json"),
    ];
    const hiddenOff = createApp({ queryFiles: files });
    expect(
      listVaultPaletteFiles(hiddenOff, "settings.json").map((file) => file.path),
    ).toEqual(["Notes/settings.json"]);

    const hiddenOn = createApp({ queryFiles: files, showHidden: true });
    expect(
      listVaultPaletteFiles(hiddenOn, "app.json").map((file) => file.path),
    ).toEqual([".obsidian/app.json"]);
  });
});
