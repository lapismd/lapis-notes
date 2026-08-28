import {
  Notice,
  Plugin,
  TFile,
  View,
  basename,
  dirname,
  joinPath,
  type App,
  type PluginManifest,
  type PluginConstructor,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { ExplorerController } from "@lapismd/design-core/workspace/explorer";
import type { WorkspaceAction } from "@lapismd/design-core/workspace/core";
import { mount, unmount } from "svelte";
import ExplorerPanel from "./LapisExplorerView.svelte";
import LapisLanding from "./LapisLandingView.svelte";
import {
  appendNativeExplorerMenu,
  copyExplorerText,
} from "./native-explorer-actions";
import { openExplorerFile } from "./open-explorer-file";
import {
  DEFAULT_VAULT_PALETTE_FILE_EXTENSIONS,
  EXPLORER_SETTING_IDS,
} from "./explorer-settings";
import { listExplorerVaultEntries } from "./explorer-vault-entries";
import { registerExplorerSettings } from "./register-explorer-settings";
import { subscribeExplorerVaultTreeChanges } from "./explorer-tree-subscription";
import {
  listVaultPaletteFiles,
  VAULT_PALETTE_FILES_TAB,
  VAULT_PALETTE_RECENT_GROUP,
} from "./vault-palette-files";
import { bindExplorerSelectionNotifications } from "./explorer-selection";

const EXPLORER_MANIFEST: PluginManifest = {
  id: "lapis-file-explorer",
  name: "Explorer",
  author: "Lapis Notes",
  version: "0.1.0",
  minAppVersion: "0.0.1",
  description: "Lapis file explorer backed by the API vault.",
};

const EXPLORER_SCHEMA = {
  id: "workspace",
  title: "Workspace",
  type: "object",
  properties: {
    [EXPLORER_SETTING_IDS.autoRevealCurrentFile]: {
      title: "Auto-reveal current file",
      description: "Reveal the active file in Explorer.",
      type: "boolean",
      default: true,
    },
    [EXPLORER_SETTING_IDS.showHiddenFiles]: {
      title: "Show hidden files",
      description:
        "Show dotted names, including .obsidian, .trash, and .lapis.",
      type: "boolean",
      default: false,
    },
    [EXPLORER_SETTING_IDS.paletteFileExtensions]: {
      title: "File palette extensions",
      description:
        "Extensions shown by Go to file, without leading dots. An empty list hides every file from the Files palette.",
      type: "array",
      items: { type: "string" },
      default: [...DEFAULT_VAULT_PALETTE_FILE_EXTENSIONS],
    },
  },
} as const;

function readShowHiddenFiles(app: App): boolean {
  return app.configuration
    .getConfiguration()
    .get(EXPLORER_SETTING_IDS.showHiddenFiles, false);
}

function displayError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parentPath(path: string): string {
  const parent = dirname(path);
  return parent === "/" ? "" : parent;
}

async function uniquePath(
  app: App,
  parent: string,
  requestedName: string,
): Promise<string> {
  const dot = requestedName.lastIndexOf(".");
  const base = dot > 0 ? requestedName.slice(0, dot) : requestedName;
  const extension = dot > 0 ? requestedName.slice(dot) : "";
  for (let suffix = 0; ; suffix += 1) {
    const name = `${base}${suffix === 0 ? "" : ` ${suffix + 1}`}${extension}`;
    const path = parent ? joinPath(parent, name) : name;
    if (!(await app.vault.exists(path))) return path;
  }
}

async function withNotice<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    new Notice(displayError(error));
    throw error;
  }
}

function createExplorerController(app: App, loading: boolean) {
  const controller = new ExplorerController({
    loading,
    tree: {
      listEntries: () =>
        listExplorerVaultEntries(app.vault.getAllLoadedFiles()),
      subscribe: (onChange) => subscribeExplorerVaultTreeChanges(app, onChange),
    },
    selection: {
      subscribe: (onActivePath) => {
        // Dedupe so breadcrumb/folder revealPath is not immediately overwritten
        // when focus moves within the same active file leaf.
        let lastPath: string | null | undefined;
        const update = () => {
          const path = app.workspace.activeEditor?.file?.path ?? null;
          if (path === lastPath) return;
          lastPath = path;
          onActivePath(path);
        };
        const ref = app.workspace.on("active-leaf-change", update);
        update();
        return () => app.workspace.offref(ref);
      },
    },
    preferences: {
      getAutoReveal: () =>
        app.configuration
          .getConfiguration()
          .get(EXPLORER_SETTING_IDS.autoRevealCurrentFile, true),
      setAutoReveal: (value) =>
        app.configuration.updateConfigurationOption(
          EXPLORER_SETTING_IDS.autoRevealCurrentFile,
          value,
        ),
      getShowHiddenFiles: () => readShowHiddenFiles(app),
      setShowHiddenFiles: (value) =>
        app.configuration.updateConfigurationOption(
          EXPLORER_SETTING_IDS.showHiddenFiles,
          value,
        ),
    },
    actions: {
      openFile: (path, options) =>
        withNotice(async () => {
          const file = app.vault.getFileByPath(path);
          if (!file) throw new Error(`Unable to find file: ${path}`);
          await openExplorerFile(app, file, options?.disposition ?? "current");
        }),
      createFile: (parent) =>
        withNotice(async () => {
          const path = await uniquePath(app, parent, "Untitled.md");
          const file = await app.vault.create(path, "");
          await app.openFile(file);
          return path;
        }),
      createFolder: (parent) =>
        withNotice(async () => {
          const path = await uniquePath(app, parent, "New folder");
          await app.vault.createFolder(path);
          return path;
        }),
      rename: (path, nextName) =>
        withNotice(async () => {
          const file = app.vault.getAbstractFileByPath(path);
          if (!file) throw new Error(`Unable to find path: ${path}`);
          const nextPath = joinPath(parentPath(path), nextName);
          if (await app.vault.exists(nextPath)) {
            throw new Error(`A file already exists at ${nextPath}`);
          }
          await app.fileManager.renameFile(file, nextPath);
          return nextPath;
        }),
      move: (path, destinationFolderPath) =>
        withNotice(async () => {
          const file = app.vault.getAbstractFileByPath(path);
          if (!file) throw new Error(`Unable to find path: ${path}`);
          const nextPath = joinPath(destinationFolderPath, basename(path));
          if (await app.vault.exists(nextPath)) {
            throw new Error(`A file already exists at ${nextPath}`);
          }
          await app.fileManager.renameFile(file, nextPath);
          return nextPath;
        }),
      delete: (path) =>
        withNotice(async () => {
          const file = app.vault.getAbstractFileByPath(path);
          if (!file) throw new Error(`Unable to find path: ${path}`);
          await app.vault.trash(file, false);
        }),
      copyText: copyExplorerText,
    },
    buildItemMenu: (menu, node) => {
      appendNativeExplorerMenu(menu, node, app);
    },
  });
  bindExplorerSelectionNotifications(app, controller);
  return controller;
}

export class FileExplorerView extends View {
  readonly #controller: ExplorerController;
  #component: ReturnType<typeof mount> | null = null;

  constructor(leaf: WorkspaceLeaf, loading: boolean) {
    super(leaf);
    this.icon = "folder-closed";
    this.#controller = createExplorerController(this.app, loading);
  }

  get selectedPath(): string {
    return this.#controller.selectedPath;
  }

  getViewType(): string {
    return "file-explorer";
  }

  getDisplayText(): string {
    return "Files";
  }

  revealPath(path: string): void {
    this.#controller.revealPath(path.replace(/^\/+/, ""));
  }

  applyShowHiddenFiles(value: boolean): void {
    this.#controller.applyShowHiddenFiles(value);
  }

  load(): void {
    this.unload();
    this.containerEl.replaceChildren();
    this.#component = mount(ExplorerPanel, {
      target: this.containerEl,
      props: { controller: this.#controller },
    });
  }

  unload(): void {
    if (this.#component) void unmount(this.#component);
    this.#component = null;
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }
}

function isFileExplorerView(view: unknown): view is FileExplorerView {
  return view instanceof FileExplorerView;
}

export class LapisLandingView extends View {
  #component: ReturnType<typeof mount> | null = null;

  getViewType(): string {
    return "lapis-landing";
  }

  getDisplayText(): string {
    return "New tab";
  }

  load(): void {
    this.unload();
    this.containerEl.replaceChildren();
    const actions: WorkspaceAction[] = [
      {
        id: "create-note",
        label: "Create new note",
        icon: "square-pen",
        onSelect: async () => {
          const path = await uniquePath(this.app, "", "Untitled.md");
          const file = await this.app.vault.create(path, "");
          await this.app.openFile(file);
        },
      },
      {
        id: "go-to-file",
        label: "Go to file",
        icon: "search",
        onSelect: () => {
          void this.app.commands.executeCommand("app:go-to-file");
        },
      },
      {
        id: "close",
        label: "Close",
        icon: "x",
        onSelect: () => {
          this.leaf.detach();
        },
      },
    ];
    this.#component = mount(LapisLanding, {
      target: this.containerEl,
      props: { actions },
    });
  }

  unload(): void {
    if (this.#component) void unmount(this.#component);
    this.#component = null;
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }
}

export function createFileExplorerPlugin(
  options: { loading?: boolean } = {},
): PluginConstructor {
  return class FileExplorerPlugin extends Plugin {
    constructor(app: App) {
      super(app, EXPLORER_MANIFEST);
    }

    async onload(): Promise<void> {
      this.app.configuration.schema.register(EXPLORER_SCHEMA);
      this.register(() => {
        this.app.configuration.schema.unregister(EXPLORER_SCHEMA);
      });
      registerExplorerSettings(this);
      const configurationRef = this.app.configuration.on(
        "updated",
        ({ key, value }) => {
          if (key !== EXPLORER_SETTING_IDS.showHiddenFiles) return;
          this.syncShowHiddenFiles(Boolean(value));
        },
      );
      this.register(() => {
        this.app.configuration.offref(configurationRef);
      });

      this.registerSidebarView(
        FileExplorerViewType,
        (leaf) => new FileExplorerView(leaf, options.loading ?? false),
        {
          side: "left",
          title: "Files",
          icon: "folder-closed",
        },
        {
          kind: "command",
          command: {
            id: "open-explorer",
            name: "Open Explorer",
            callback: () => void this.openExplorer(),
          },
        },
      );
      this.registerView("lapis-landing", (leaf) => new LapisLandingView(leaf), {
        kind: "internal",
      });

      this.addCommand({
        id: "reveal-path",
        name: "Reveal path in file explorer",
        callback: (path?: string) => {
          if (typeof path !== "string" || path.length === 0) return;
          this.app.workspace.iterateAllLeaves((leaf) => {
            if (!isFileExplorerView(leaf.view)) return;
            leaf.view.revealPath(path);
          });
        },
      });
      this.addCommand({
        id: "toggle-hidden-files",
        name: "Toggle show hidden files",
        callback: () => {
          void this.app.configuration.updateConfigurationOption(
            EXPLORER_SETTING_IDS.showHiddenFiles,
            !readShowHiddenFiles(this.app),
          );
        },
      });

      const { controller } = getWorkspaceHostBinding(this.app.workspace);
      this.register(
        controller.commands.registerPaletteProvider({
          id: "lapis-vault-files",
          tab: VAULT_PALETTE_FILES_TAB,
          emptyQueryLimit: 5,
          search: (query) => {
            const starterFiles = query.trim().length === 0;
            const recentPaths = starterFiles
              ? new Set(
                  this.app.workspace
                    .getRecentFiles()
                    .map((recent) => recent.path),
                )
              : null;
            return listVaultPaletteFiles(this.app, query).map((file) => ({
              id: `vault-file:${file.path}`,
              title: file.name,
              subtitle: file.path,
              icon: "file",
              providerId: "lapis-vault-files",
              tab: VAULT_PALETTE_FILES_TAB.id,
              group: recentPaths?.has(file.path)
                ? VAULT_PALETTE_RECENT_GROUP
                : undefined,
              run: () => this.app.openFile(file),
            }));
          },
        }),
      );

      await this.app.configuration.materializeSchemaDefaults();
    }

    private syncShowHiddenFiles(value: boolean): void {
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (!isFileExplorerView(leaf.view)) return;
        leaf.view.applyShowHiddenFiles(value);
      });
    }

    private async openExplorer(): Promise<void> {
      const existing =
        this.app.workspace.getLeavesOfType(FileExplorerViewType)[0];
      const target =
        existing ??
        this.app.workspace.ensureSideLeaf(FileExplorerViewType, "left");
      if (!existing) {
        await target.setViewState({ type: FileExplorerViewType, state: {} });
      }
      this.app.workspace.activateLeaf(target, {
        focusRootHost: false,
        source: "api",
        operation: "open-explorer",
      });
      await this.app.workspace.revealLeaf(target);
    }
  };
}

export const FileExplorerPlugin: PluginConstructor = createFileExplorerPlugin();
export const FileExplorerViewType = "file-explorer";
export { FILE_EXPLORER_SELECTION_CHANGE_EVENT } from "./explorer-selection";
export { default as ExplorerPanel } from "./LapisExplorerView.svelte";
