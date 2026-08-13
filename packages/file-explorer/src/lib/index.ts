import {
  Notice,
  Plugin,
  TFile,
  TFolder,
  View,
  basename,
  dirname,
  joinPath,
  type App,
  type PluginManifest,
  type PluginConstructor,
  type TAbstractFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  ExplorerController,
  type ExplorerNode,
} from "@lapismd/design-core/workspace/explorer";
import type { WorkspaceAction } from "@lapismd/design-core/workspace/core";
import { mount, unmount } from "svelte";
import LapisExplorerView from "./LapisExplorerView.svelte";
import LapisLanding from "./LapisLandingView.svelte";
import { openExplorerFile } from "./open-explorer-file";

const EXPLORER_MANIFEST: PluginManifest = {
  id: "lapis-file-explorer",
  name: "Lapis File Explorer",
  author: "Lapis Notes",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description: "Lapis file explorer backed by the API vault.",
};

const EXPLORER_SCHEMA = {
  id: "workspace",
  title: "Workspace",
  type: "object",
  properties: {
    "workspace.fileExplorer.autoRevealCurrentFile": {
      title: "Auto-reveal current file",
      description: "Reveal the active file in Explorer.",
      type: "boolean",
      default: true,
    },
  },
} as const;

const SUPPORTED_EXTENSIONS = new Set([
  "md",
  "markdown",
  "txt",
  "text",
  "json",
  "data",
]);

function visiblePath(path: string): boolean {
  const first = path.replace(/^\/+/, "").split("/", 1)[0];
  return first !== ".obsidian" && first !== ".trash";
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

function toExplorerNode(file: TAbstractFile): ExplorerNode {
  return {
    path: file.path.replace(/^\/+/, ""),
    name: file.name,
    kind: file instanceof TFolder ? "folder" : "file",
  };
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
  return new ExplorerController({
    loading,
    tree: {
      listEntries: () =>
        app.vault
          .getAllLoadedFiles()
          .filter((file) => file.path !== "/" && visiblePath(file.path))
          .map(toExplorerNode),
      subscribe: (onChange) => {
        const created = app.vault.on("create", onChange);
        const deleted = app.vault.on("delete", onChange);
        const renamed = app.vault.on("rename", onChange);
        return () => {
          app.vault.offref(created);
          app.vault.offref(deleted);
          app.vault.offref(renamed);
        };
      },
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
          .get("workspace.fileExplorer.autoRevealCurrentFile", true),
      setAutoReveal: (value) =>
        app.configuration.updateConfigurationOption(
          "workspace.fileExplorer.autoRevealCurrentFile",
          value,
        ),
    },
    actions: {
      openFile: (path, options) =>
        withNotice(async () => {
          const file = app.vault.getFileByPath(path);
          if (!file) throw new Error(`Unable to find file: ${path}`);
          await openExplorerFile(
            app,
            file,
            options?.disposition ?? "current",
          );
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
    },
  });
}

export class FileExplorerView extends View {
  readonly #controller: ExplorerController;
  #component: ReturnType<typeof mount> | null = null;

  constructor(leaf: WorkspaceLeaf, loading: boolean) {
    super(leaf);
    this.icon = "folder-closed";
    this.#controller = createExplorerController(this.app, loading);
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

  load(): void {
    this.unload();
    this.containerEl.replaceChildren();
    this.#component = mount(LapisExplorerView, {
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
          getWorkspaceHostBinding(
            this.app.workspace,
          ).controller.commands.openPalette();
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

      this.registerSidebarView(
        "file-explorer",
        (leaf) => new FileExplorerView(leaf, options.loading ?? false),
        {
          side: "left",
          title: "Files",
          icon: "folder-closed",
        },
      );
      this.registerView("lapis-landing", (leaf) => new LapisLandingView(leaf));

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

      const { controller } = getWorkspaceHostBinding(this.app.workspace);
      this.register(
        controller.commands.registerPaletteProvider({
          id: "lapis-vault-files",
          search: (query) => {
            const normalized = query.trim().toLocaleLowerCase();
            return this.app.vault
              .getFiles()
              .filter(
                (file) =>
                  visiblePath(file.path) &&
                  SUPPORTED_EXTENSIONS.has(file.extension.toLocaleLowerCase()),
              )
              .filter((file) =>
                file.path.toLocaleLowerCase().includes(normalized),
              )
              .sort((left, right) => left.path.localeCompare(right.path))
              .map((file) => ({
                id: `vault-file:${file.path}`,
                title: file.name,
                subtitle: file.path,
                icon: "file",
                providerId: "lapis-vault-files",
                run: () => this.app.openFile(file),
              }));
          },
        }),
      );

      await this.app.configuration.materializeSchemaDefaults();
    }
  };
}

export const FileExplorerPlugin: PluginConstructor = createFileExplorerPlugin();
export const FileExplorerViewType = "file-explorer";
