import type { App, TFile } from "@lapis-notes/api";
import { describe, expect, it } from "vitest";
import { EXPLORER_SETTING_IDS } from "./explorer-settings";
import {
  listVaultPaletteFiles,
  VAULT_PALETTE_EMPTY_QUERY_LIMIT,
  VAULT_PALETTE_FILES_TAB,
  VAULT_PALETTE_RECENT_GROUP,
} from "./vault-palette-files";

function createFile(path: string): TFile {
  const name = path.split("/").pop() ?? path;
  const extension = name.includes(".") ? (name.split(".").pop() ?? "") : "";
  return { path, name, extension } as TFile;
}

function createApp(options: {
  queryFiles?: TFile[];
  recentFiles?: TFile[];
  showHidden?: boolean;
  paletteFileExtensions?: string[];
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
          if (
            key === EXPLORER_SETTING_IDS.paletteFileExtensions &&
            options.paletteFileExtensions
          ) {
            return options.paletteFileExtensions as T;
          }
          return defaultValue as T;
        },
      }),
    },
  } as unknown as App;
}

describe("listVaultPaletteFiles", () => {
  it("declares the Files tab and starter group labels", () => {
    expect(VAULT_PALETTE_FILES_TAB).toEqual({
      id: "files",
      label: "Files",
      order: 20,
    });
    expect(VAULT_PALETTE_RECENT_GROUP).toBe("Recent");
  });

  it("lists at most 25 visible recents when the query is empty", () => {
    const recent = [
      createFile("Notes/Welcome.md"),
      createFile(".obsidian/app.json"),
      createFile("Notes/draft.bin"),
      ...Array.from({ length: 30 }, (_, index) =>
        createFile(`Recent/${String(index).padStart(2, "0")}.md`),
      ),
    ];
    const results = listVaultPaletteFiles(
      createApp({ recentFiles: recent }),
      "",
    );
    expect(results).toHaveLength(VAULT_PALETTE_EMPTY_QUERY_LIMIT);
    expect(results[0]?.path).toBe("Notes/Welcome.md");
    expect(results.some((file) => file.path.startsWith("."))).toBe(false);
    expect(results.some((file) => file.extension === "bin")).toBe(false);
  });

  it("falls back to the first 25 visible files sorted by path", () => {
    const files = [
      createFile("Projects/Beta.md"),
      createFile("Projects/Alpha.md"),
      createFile(".obsidian/app.json"),
      ...Array.from({ length: 30 }, (_, index) =>
        createFile(`Notes/${String(index).padStart(2, "0")}.md`),
      ),
    ];
    expect(
      listVaultPaletteFiles(createApp({ queryFiles: files }), "").map(
        (file) => file.path,
      ),
    ).toEqual(
      files
        .filter((file) => !file.path.startsWith("."))
        .map((file) => file.path)
        .sort((left, right) => left.localeCompare(right))
        .slice(0, VAULT_PALETTE_EMPTY_QUERY_LIMIT),
    );
  });

  it("sorts typed query matches without imposing the empty-query cap", () => {
    const files = Array.from({ length: 40 }, (_, index) =>
      createFile(`Notes/${String(index).padStart(2, "0")}.md`),
    );
    expect(
      listVaultPaletteFiles(createApp({ queryFiles: files }), "Notes/").map(
        (file) => file.path,
      ),
    ).toEqual(
      files
        .map((file) => file.path)
        .sort((left, right) => left.localeCompare(right)),
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
      listVaultPaletteFiles(hiddenOff, "settings.json").map(
        (file) => file.path,
      ),
    ).toEqual(["Notes/settings.json"]);

    const hiddenOn = createApp({ queryFiles: files, showHidden: true });
    expect(
      listVaultPaletteFiles(hiddenOn, "app.json").map((file) => file.path),
    ).toEqual([".obsidian/app.json"]);
  });

  it("includes YAML defaults and still applies hidden-file visibility", () => {
    const files = [
      createFile("Projects/config.yaml"),
      createFile("Projects/legacy.yml"),
      createFile(".lapis/agents/session/metadata.yaml"),
      createFile("Projects/archive.bin"),
    ];

    const hiddenOff = createApp({ queryFiles: files });
    expect(
      listVaultPaletteFiles(hiddenOff, "config.yaml").map((file) => file.path),
    ).toEqual(["Projects/config.yaml"]);
    expect(
      listVaultPaletteFiles(hiddenOff, "legacy.yml").map((file) => file.path),
    ).toEqual(["Projects/legacy.yml"]);
    expect(listVaultPaletteFiles(hiddenOff, "metadata.yaml")).toEqual([]);

    const hiddenOn = createApp({ queryFiles: files, showHidden: true });
    expect(
      listVaultPaletteFiles(hiddenOn, "metadata.yaml").map(
        (file) => file.path,
      ),
    ).toEqual([".lapis/agents/session/metadata.yaml"]);
    expect(listVaultPaletteFiles(hiddenOn, "archive.bin")).toEqual([]);
  });

  it("reads and normalizes the configurable extension allowlist", () => {
    const files = [
      createFile("Notes/Welcome.md"),
      createFile("Projects/config.yaml"),
      createFile("Projects/app.toml"),
    ];
    const app = createApp({
      queryFiles: files,
      paletteFileExtensions: [" .TOML ", "yaml"],
    });

    expect(listVaultPaletteFiles(app, "Welcome.md")).toEqual([]);
    expect(
      listVaultPaletteFiles(app, "app.toml").map((file) => file.path),
    ).toEqual(["Projects/app.toml"]);
    expect(
      listVaultPaletteFiles(app, "config.yaml").map((file) => file.path),
    ).toEqual(["Projects/config.yaml"]);
  });
});
