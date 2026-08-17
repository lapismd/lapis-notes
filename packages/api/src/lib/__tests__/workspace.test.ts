import { beforeEach, describe, expect, it, vi } from "vitest";
import { isEqual } from "lodash-es";
import { effect_root } from "svelte/internal/client";
import type { App } from "../context.svelte";
import { EventDispatcher } from "../events";
import { Plugin } from "../plugin";
import { TFile } from "../storage/fs";
import { ItemView, TextFileView, View } from "../view.svelte";
import {
  WORKSPACE_POPOUT_UNSUPPORTED_ERROR_MESSAGE,
  OnDemandPluginInstallView,
  Workspace,
  WorkspaceBottomPanel,
  WorkspaceLeaf,
  WorkspaceSidebarGroup,
  WorkspaceTabs,
  WorkspaceWindow,
  WorkspaceView,
  setWorkspacePopoutHost,
} from "../workspace.svelte";
import type { WorkspacePopoutHost } from "../workspace.svelte";
import { getWorkspaceHostBinding } from "../workspace-host";
import { Menu } from "../menu.svelte";
import { ContextKeyService } from "../context-keys.svelte";
import { StatusBarManager } from "../status-bar.svelte";
import type { Command } from "../command.svelte";

vi.mock("../prompt-confirm", () => ({
  promptConfirm: vi.fn(async () => true),
}));

import { promptConfirm } from "../prompt-confirm";

vi.mock("@lapis-notes/ui/sidebar-custom", () => {
  class SidebarState {
    props: any;
    width: string;

    constructor(props: any) {
      this.props = props;
      this.width = props.initialWidth ?? "16rem";
    }

    get open() {
      return this.props.open();
    }

    get size() {
      return this.open ? this.width : (this.props.collapsedSize ?? "0px");
    }

    setOpen(value: boolean) {
      this.props.setOpen(value);
    }
  }

  return { SidebarState };
});

vi.mock("../view.svelte", () => {
  function createContainer(): HTMLElement {
    if (typeof globalThis.createDiv === "function") {
      return globalThis.createDiv();
    }
    return createElement() as unknown as HTMLElement;
  }

  class Component {
    children: Component[] = [];
    loaded = false;
    private unloaders = new Set<() => void>();
    protected _containerEl: HTMLElement = createContainer();

    get containerEl() {
      return this._containerEl;
    }

    set containerEl(el: HTMLElement) {
      this._containerEl = el;
    }

    load(): void {
      if (this.loaded) return;
      this.onload();
      this.loaded = true;
    }

    unload(): void {
      if (!this.loaded) return;
      this.unloaders.forEach((callback) => callback());
      this.unloaders.clear();
      this.children = [];
      this.onunload();
      this.loaded = false;
    }

    onload(): void {}

    onunload(): void {}

    register(callback: () => void): void {
      this.unloaders.add(callback);
    }

    registerEvent(ref: {
      dispatcher: { offref: (value: unknown) => void };
    }): void {
      this.register(() => ref.dispatcher.offref(ref));
    }

    registerDomEvent(): void {}

    registerInterval(id: ReturnType<typeof setInterval>): void {
      this.register(() => clearInterval(id));
    }

    addChild(child: Component): void {
      this.children.push(child);
    }

    removeChild(child: Component): void {
      this.children = this.children.filter((candidate) => candidate !== child);
    }
  }

  class View extends Component {
    icon = "file";
    leaf: any;
    #state: Record<string, unknown> = {};

    constructor(leaf?: any) {
      super();
      this.leaf = leaf;
    }

    get app(): App | undefined {
      return this.leaf?.app;
    }

    getViewType(): string {
      return "view";
    }

    getDisplayText(): string {
      return "View";
    }

    getIcon(): string {
      return this.icon;
    }

    getBreadcrumbFilePath(): string | null {
      return null;
    }

    getBreadcrumbs(): Array<{
      id: string;
      label: string;
      onSelect?: () => void;
    }> {
      return [];
    }

    getState(): Record<string, unknown> {
      return this.#state;
    }

    setState(state: Record<string, unknown>): Promise<void> {
      this.#state = state;
      return Promise.resolve();
    }
  }

  class ItemView extends View {
    actions: Array<{
      icon: string;
      title: string;
      callback: (event: MouseEvent) => unknown;
      disabled?: boolean;
    }> = [];
  }

  class FileView extends ItemView {
    file: any = null;

    getBreadcrumbFilePath(): string | null {
      return this.file?.path ?? null;
    }

    onLoadFile(file: any): Promise<void> {
      this.file = file;
      return Promise.resolve();
    }

    onUnloadFile(): Promise<void> {
      return Promise.resolve();
    }

    onRename(): Promise<void> {
      return Promise.resolve();
    }

    canAcceptExtension(): boolean {
      return true;
    }
  }

  class TextFileView extends FileView {
    editor = {
      app: undefined as App | undefined,
      bindApplication(app: App) {
        this.app = app;
      },
      updateExtensions() {},
      getState() {
        return {};
      },
      destroy: vi.fn(),
    };
  }

  class EmptyView extends View {
    getViewType(): string {
      return "empty";
    }

    getDisplayText(): string {
      return "Empty";
    }
  }

  return {
    Component,
    EmptyView,
    FileView,
    ItemView,
    TextFileView,
    View,
  };
});

vi.mock("svelte-sonner", () => {
  const toast = Object.assign(() => 1, {
    dismiss() {},
  });
  return { toast };
});

function createElement() {
  const element = {
    children: [] as any[],
    className: "",
    textContent: "",
    scrollTop: 0,
    style: {},
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      },
    },
    append(...nodes: any[]) {
      this.children.push(...nodes);
    },
    appendChild(node: any) {
      this.children.push(node);
      return node;
    },
    removeChild(node: any) {
      this.children = this.children.filter((child) => child !== node);
      return node;
    },
    replaceChildren(...nodes: any[]) {
      this.children = [...nodes];
    },
    createDiv() {
      const child = createElement();
      this.children.push(child);
      return child;
    },
    addEventListener() {},
    removeEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    setText(text: string) {
      this.textContent = text;
    },
    empty() {
      this.children = [];
      this.textContent = "";
    },
    detach() {},
  };
  return element;
}

function installGlobals() {
  globalThis.createDiv = (() =>
    createElement()) as unknown as typeof globalThis.createDiv;
  globalThis.document = {
    createElement: () => createElement(),
    createTextNode: (text: string) => ({ textContent: text }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    head: {
      appendChild() {},
    },
    documentElement: {
      classList: {
        contains: () => false,
      },
    },
  } as unknown as Document;
  globalThis.window = {
    document: globalThis.document,
    matchMedia: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
  } as unknown as Window & typeof globalThis;
}

function createWorkspaceHarness(
  editorAssociations: Record<string, string> = {},
) {
  installGlobals();
  const plugins = {
    activateForPath: vi.fn(async () => false),
    activateForLanguage: vi.fn(async () => false),
    activateForViewType: vi.fn(async (_viewType: string) => false),
    findLanguageIdsForPath: vi.fn(() => [] as string[]),
  };
  const registeredCommands: Record<string, Command> = {};
  const commands = Object.assign(
    new EventDispatcher<{
      register: [command: Command];
      unregister: [command: Command];
      "hotkeys-updated": [event: { commandId?: string }];
    }>(),
    {
      commands: registeredCommands,
      executeCommand: vi.fn(async (id: string) => {
        return registeredCommands[id]?.callback?.();
      }),
      registerCommand(command: Command) {
        registeredCommands[command.id] = command;
        this.trigger("register", command);
      },
      unregisterCommand(id: string) {
        const command = registeredCommands[id];
        if (!command) return false;
        delete registeredCommands[id];
        this.trigger("unregister", command);
        return true;
      },
      getCommand(id: string) {
        return registeredCommands[id];
      },
      getEffectiveHotkeys(id: string) {
        return registeredCommands[id]?.hotkeys ?? [];
      },
      isCommandAvailable(id: string) {
        return Boolean(registeredCommands[id]?.callback);
      },
    },
  );
  const app = {
    version: "1.10.0",
    telemetry: {
      measure<T>(
        _name: string,
        callback: (span: { setAttribute(): void }) => T,
      ) {
        return callback({ setAttribute() {} });
      },
      measureAsync<T>(
        _name: string,
        callback: (span: { setAttribute(): void }) => Promise<T>,
      ) {
        return callback({ setAttribute() {} });
      },
    },
    vault: {
      create: async () => null,
      getFileByPath: () => null,
      read: async () => "",
    },
    configuration: {
      getConfiguration: () => ({
        get<T>(key: string, defaultValue?: T): T {
          if (key === "workspace.editorAssociations") {
            return editorAssociations as T;
          }
          return defaultValue as T;
        },
      }),
    },
    plugins,
    contextKeys: new ContextKeyService(),
    statusBar: new StatusBarManager(),
    commands,
    notifications: {
      notify: vi.fn((options: { id: string }) => ({ id: options.id })),
      withProgress: vi.fn(
        async (
          _options: unknown,
          task: (
            progress: { report: ReturnType<typeof vi.fn> },
            token: { signal: AbortSignal },
          ) => Promise<unknown>,
        ) => {
          const progress = { report: vi.fn() };
          return task(progress, {
            signal: new AbortController().signal,
          });
        },
      ),
    },
    workspace: {
      requestSaveLayout() {},
      viewCreator() {
        return undefined;
      },
    },
  } as unknown as App & {
    plugins: typeof plugins;
    workspace: {
      requestSaveLayout: () => void;
      viewCreator: (type: string) => undefined;
    };
  };

  globalThis.app = app;
  let workspace!: Workspace;
  effect_root(() => {
    workspace = new Workspace(app);
  });
  (app as App & { workspace: Workspace }).workspace = workspace;

  return { app, workspace };
}

function createPluginDistributionStub(overrides: Record<string, unknown> = {}) {
  return {
    addProgressListener: vi.fn(() => () => {}),
    ...overrides,
  };
}

class HoverLinkPlugin extends Plugin {
  onload(): void {}
}

class MockTextFileView extends TextFileView {
  getViewType(): string {
    return "mock-text";
  }

  getDisplayText(): string {
    return "Mock Text";
  }

  getViewData(): string {
    return "";
  }

  setViewData(): void {}

  clear(): void {}

  canAcceptExtension(): boolean {
    return true;
  }

  onLoadFile(file: TFile): Promise<void> {
    this.file = file;
    return Promise.resolve();
  }

  onUnloadFile(): Promise<void> {
    return Promise.resolve();
  }

  onRename(): Promise<void> {
    return Promise.resolve();
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }
}

class MockItemView extends ItemView {
  constructor(
    leaf?: WorkspaceLeaf,
    private readonly viewType = "graph",
    private readonly displayText = "Graph",
  ) {
    super(leaf);
  }

  onload(): void {
    this.leaf.contentEl.empty();
    this.leaf.contentEl.createDiv();
  }

  onunload(): void {}

  getViewType(): string {
    return this.viewType;
  }

  getDisplayText(): string {
    return this.displayText;
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }
}

class MockChromeView extends MockItemView {
  readonly actionCallback = vi.fn();
  readonly readingViewCallback = vi.fn();
  readonly providerCallback = vi.fn();
  actions = [
    {
      icon: "book-open",
      title: "Current view: editing\nClick to read",
      disabled: false,
      callback: this.actionCallback,
    },
  ];

  onPaneMenu(menu: Menu, source: string): void {
    menu.addItem((item) =>
      item
        .setSection("view")
        .setTitle("Reading view")
        .setIcon("book-open")
        .setChecked(true)
        .onClick(this.readingViewCallback),
    );
    menu.addMenu((providerMenu) => {
      providerMenu.setSection("provider").setTitle("Plugin views");
      providerMenu.addItem((item) =>
        item
          .setTitle(`Provider action (${source})`)
          .onClick(this.providerCallback),
      );
    });
  }
}

function docsRegistryEntry() {
  return {
    id: "lapis-docs",
    name: "Docs",
    description: "Rich document and spreadsheet editing for Lapis",
    author: "Lapis Notes",
    channel: "official" as const,
    latestVersion: "0.1.0",
    minAppVersion: "0.20.0",
    platforms: ["web", "electron"] as const,
    categories: ["documents", "editor"],
    badges: ["official", "verified"] as const,
    detail: "plugins/lapis-docs.json",
    contributes: {
      editorViews: [
        {
          id: "lapis-doc",
          filenamePatterns: ["*.lapisdoc", "*.lapissheet"],
          extensions: ["lapisdoc", "lapissheet"],
        },
      ],
    },
  };
}

function notebookRegistryEntry() {
  return {
    id: "lapis-notebook",
    name: "Notebook",
    description: "Reactive notebook support for markdown notes",
    author: "Lapis Notes",
    channel: "official" as const,
    latestVersion: "2026.6.1",
    minAppVersion: "1.7.7",
    platforms: ["web", "electron"] as const,
    categories: ["editor", "productivity"],
    badges: ["official", "verified"] as const,
    detail: "plugins/lapis-notebook.json",
    contributes: {
      editorViews: [
        {
          id: "notebook",
          filenamePatterns: ["*.notebook.md"],
          extensions: ["notebook.md"],
        },
      ],
    },
  };
}

beforeEach(() => {
  installGlobals();
  setWorkspacePopoutHost(null);
  vi.mocked(promptConfirm).mockReset();
  vi.mocked(promptConfirm).mockResolvedValue(true);
});

describe("Workspace compatibility", () => {
  it("keeps leaves, views, and editors bound to their owning application", () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf();
    const view = new MockTextFileView(leaf);
    leaf.view = view;
    globalThis.app = { id: "conflicting-app" } as never;

    expect(leaf.app).toBe(app);
    expect(view.app).toBe(app);
    expect(view.editor.app).toBe(app);
  });

  it("retains the most recently active file while a non-file sidebar has focus", () => {
    const { workspace } = createWorkspaceHarness();
    const fileLeaf = workspace.getLeaf();
    const file = new TFile(
      "Notes/Recent.md",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    const fileView = new MockTextFileView(fileLeaf);
    fileView.file = file;
    fileLeaf.view = fileView;
    workspace.activeLeaf = fileLeaf;

    expect(workspace.getActiveFile()).toBe(file);

    workspace.activeLeaf = workspace.getLeftLeaf(false)!;

    expect(workspace.getActiveFile()).toBe(file);
  });

  it("projects API plugin lifecycle state into the managed settings registry", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const pluginEvents = new EventDispatcher<{
      "plugins-loaded": [];
      "plugin-enabled": [plugin: unknown];
      "plugin-disabled": [plugin: unknown];
      "plugin-error": [id: string, message: string, error?: unknown];
    }>();
    const disablePlugin = vi.fn(async () => true);
    const enablePlugin = vi.fn(async () => true);
    const coreEntries = [
      {
        manifest: {
          id: "markdown",
          name: "Markdown",
          description: "Markdown editing",
        },
        enabled: true,
        required: false,
        distribution: "bundled" as const,
        errorMessage: null,
      },
      {
        manifest: {
          id: "roles",
          name: "CV Roles",
          description: "Role tracking and CV workflows",
        },
        enabled: true,
        required: false,
        distribution: "first-party-external" as const,
        errorMessage: null,
      },
    ];
    Object.assign(app.plugins, {
      corePluginEntries: coreEntries,
      disablePlugin,
      enablePlugin,
      on: pluginEvents.on.bind(pluginEvents),
      offref: pluginEvents.offref.bind(pluginEvents),
    });

    workspace.bindPlugins();
    const registry =
      getWorkspaceHostBinding(workspace).controller.managedPlugins;

    expect(registry.states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "lapis:markdown",
          distribution: "bundled",
          status: "enabled",
        }),
        expect.objectContaining({
          key: "lapis:roles",
          distribution: "first-party-external",
          status: "enabled",
        }),
      ]),
    );

    await expect(registry.disable("lapis:roles")).resolves.toBe(true);
    expect(disablePlugin).toHaveBeenCalledWith("roles");
    coreEntries[1].enabled = false;
    pluginEvents.emit("plugin-disabled", {});
    expect(
      registry.states.find((entry) => entry.key === "lapis:roles"),
    ).toMatchObject({
      enabled: false,
      status: "disabled",
    });
  });

  it("splits side leaves by inserting a nested horizontal view", () => {
    const { workspace } = createWorkspaceHarness();
    const originalLeaf = workspace.getRightLeaf(false);
    const splitLeaf = workspace.getRightLeaf(true);

    expect(originalLeaf).toBeInstanceOf(WorkspaceLeaf);
    expect(splitLeaf).toBeInstanceOf(WorkspaceLeaf);

    const nestedSplit = workspace.rightSplit.children[0] as WorkspaceView;
    expect(nestedSplit).toBeInstanceOf(WorkspaceView);
    expect(nestedSplit.type).toBe("horizontal");
    expect(nestedSplit.children).toHaveLength(2);
    expect(nestedSplit.children[0]).toBeInstanceOf(WorkspaceTabs);
    expect(nestedSplit.children[1]).toBeInstanceOf(WorkspaceTabs);
    expect((nestedSplit.children[0] as WorkspaceTabs).children[0]).toBe(
      originalLeaf,
    );
    expect((nestedSplit.children[1] as WorkspaceTabs).children[0]).toBe(
      splitLeaf,
    );
  });

  it("opens host-backed popout windows when the host supports them", () => {
    const { workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf();

    const popoutDocument = globalThis.document as Document;
    const popoutWindow = {
      document: popoutDocument,
      focus: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const host: WorkspacePopoutHost = {
      supportsPopouts: () => true,
      openWindow: () => ({
        win: popoutWindow,
        doc: popoutDocument,
        focus: () => popoutWindow.focus(),
        close: () => popoutWindow.close(),
        onClose: () => () => {},
      }),
    };
    setWorkspacePopoutHost(host);

    const floatingLeaf = workspace.openPopoutLeaf({
      x: 24,
      y: 36,
      size: { width: 420, height: 260 },
    });
    expect(floatingLeaf).toBeInstanceOf(WorkspaceLeaf);
    expect(workspace.floating.children).toHaveLength(1);
    expect(workspace.floating.children[0]).toBeInstanceOf(WorkspaceWindow);
    expect(workspace.floating.children[0].toWindowJson()).toMatchObject({
      type: "floating",
      mode: "popout",
      x: 24,
      y: 36,
      width: 420,
      height: 260,
    });
    expect(workspace.floating.children[0].win).toBe(popoutWindow);

    const movedWindow = workspace.moveLeafToPopout(leaf, {
      x: 60,
      y: 72,
      size: { width: 500, height: 300 },
    });
    expect(movedWindow).toBeInstanceOf(WorkspaceWindow);
    expect(workspace.floating.children).toHaveLength(2);
    expect(movedWindow.children[0]).toBeInstanceOf(WorkspaceTabs);
    expect((movedWindow.children[0] as WorkspaceTabs).children[0]).toBe(leaf);

    const childLeaf = workspace.getLeaf(true);
    const childPopout = workspace.moveWorkspaceChildToPopout(childLeaf, {
      x: 90,
      y: 108,
      size: { width: 520, height: 320 },
    });
    expect(childPopout.mode).toBe("popout");
    expect(workspace.floating.children).toHaveLength(3);
    expect((childPopout.children[0] as WorkspaceTabs).children[0]).toBe(
      childLeaf,
    );

    const firstWindow = workspace.floating.children[0];
    workspace.focusFloatingWindow(firstWindow);
    expect(popoutWindow.focus).toHaveBeenCalled();
    expect(workspace.floating.children.at(-1)).toBe(firstWindow);

    workspace.closeFloatingWindow(firstWindow);
    expect(popoutWindow.close).toHaveBeenCalled();
    expect(workspace.floating.children).toHaveLength(2);

    const windowLeaf = workspace.getLeaf("window");
    expect(windowLeaf.parent).toBeInstanceOf(WorkspaceTabs);
    expect(workspace.floating.children).toHaveLength(3);
  });

  it("opens a new in-app floating leaf", () => {
    const { workspace } = createWorkspaceHarness();
    const leaf = workspace.openFloatingLeaf({
      x: 24,
      y: 36,
      size: { width: 420, height: 260 },
    });

    expect(leaf).toBeInstanceOf(WorkspaceLeaf);
    expect(workspace.floating.children).toHaveLength(1);
    expect(workspace.floating.children[0].toWindowJson()).toMatchObject({
      type: "floating",
      mode: "floating",
      x: 24,
      y: 36,
      width: 420,
      height: 260,
    });
  });

  it("fails popout requests without detaching the source leaf when no host is available", () => {
    const { workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf();
    const parent = leaf.parent;

    expect(() => workspace.openPopoutLeaf()).toThrow(
      WORKSPACE_POPOUT_UNSUPPORTED_ERROR_MESSAGE,
    );
    expect(() => workspace.moveLeafToPopout(leaf)).toThrow(
      WORKSPACE_POPOUT_UNSUPPORTED_ERROR_MESSAGE,
    );
    expect(() => workspace.moveWorkspaceChildToPopout(leaf)).toThrow(
      WORKSPACE_POPOUT_UNSUPPORTED_ERROR_MESSAGE,
    );
    expect(leaf.parent).toBe(parent);
    expect(workspace.floating.children).toHaveLength(0);
  });

  it("stores and cleans up hover link sources registered by plugins", () => {
    const { app, workspace } = createWorkspaceHarness();
    const plugin = new HoverLinkPlugin(app, {
      id: "hover-plugin",
      name: "Hover Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });

    plugin.load();
    plugin.registerHoverLinkSource("hover-plugin:preview", {
      display: "Hover Plugin",
      defaultMod: true,
    });

    expect(
      (
        workspace as unknown as { hoverLinkSources: Map<string, unknown> }
      ).hoverLinkSources.get("hover-plugin:preview"),
    ).toEqual({
      display: "Hover Plugin",
      defaultMod: true,
    });

    plugin.unload();

    expect(
      (
        workspace as unknown as { hoverLinkSources: Map<string, unknown> }
      ).hoverLinkSources.has("hover-plugin:preview"),
    ).toBe(false);
  });

  it("collects visible hint targets from workspace chrome", () => {
    const { workspace } = createWorkspaceHarness();

    const visibleTarget = {
      dataset: {
        hintTarget: "file-item",
        hintTargetId: "files:note-md",
        hintAction: "open-file",
        hintLeafId: "leaf-1",
        hintLabel: "Note.md",
        hintDescription: "Open note",
        hintGroup: "files",
      },
      textContent: "Ignored fallback text",
      getAttribute(name: string) {
        return name === "aria-hidden" ? null : null;
      },
      getBoundingClientRect() {
        return { width: 120, height: 28 };
      },
    } as unknown as HTMLElement;

    const hiddenTarget = {
      dataset: {
        hintTarget: "hidden-item",
        hintLabel: "Hidden",
      },
      textContent: "Hidden",
      getAttribute(name: string) {
        return name === "aria-hidden" ? "true" : null;
      },
      getBoundingClientRect() {
        return { width: 120, height: 28 };
      },
    } as unknown as HTMLElement;

    const disabledTarget = {
      dataset: {
        hintTarget: "toolbar-button",
        hintLabel: "Disabled",
      },
      textContent: "Disabled",
      disabled: true,
      getAttribute() {
        return null;
      },
      getBoundingClientRect() {
        return { width: 100, height: 28 };
      },
    } as unknown as HTMLElement;

    workspace.containerEl = {
      querySelectorAll() {
        return [visibleTarget, hiddenTarget, disabledTarget];
      },
    } as unknown as HTMLElement;

    expect(workspace.getVisibleHintTargets()).toEqual([
      {
        id: "files:note-md",
        type: "file-item",
        label: "Note.md",
        action: "open-file",
        element: visibleTarget,
        leafId: "leaf-1",
        commandId: undefined,
        description: "Open note",
        group: "files",
      },
    ]);
  });

  it("deduplicates repeated explicit hint target ids", () => {
    const { workspace } = createWorkspaceHarness();

    const firstTarget = {
      dataset: {
        hintTarget: "markdown-link",
        hintTargetId: "markdown-link:Home.md",
        hintLabel: "Link 1",
      },
      textContent: "Link 1",
      getAttribute() {
        return null;
      },
      getBoundingClientRect() {
        return { width: 80, height: 20 };
      },
    } as unknown as HTMLElement;

    const secondTarget = {
      dataset: {
        hintTarget: "markdown-link",
        hintTargetId: "markdown-link:Home.md",
        hintLabel: "Link 2",
      },
      textContent: "Link 2",
      getAttribute() {
        return null;
      },
      getBoundingClientRect() {
        return { width: 80, height: 20 };
      },
    } as unknown as HTMLElement;

    workspace.containerEl = {
      querySelectorAll() {
        return [firstTarget, secondTarget];
      },
    } as unknown as HTMLElement;

    expect(workspace.getVisibleHintTargets()).toEqual([
      {
        id: "markdown-link:Home.md",
        type: "markdown-link",
        label: "Link 1",
        action: "click",
        element: firstTarget,
        leafId: undefined,
        commandId: undefined,
        description: undefined,
        group: undefined,
      },
      {
        id: "markdown-link:Home.md:1",
        type: "markdown-link",
        label: "Link 2",
        action: "click",
        element: secondTarget,
        leafId: undefined,
        commandId: undefined,
        description: undefined,
        group: undefined,
      },
    ]);
  });

  it("falls back to a selected in-tree leaf when the active leaf is detached", () => {
    const { workspace } = createWorkspaceHarness();
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const selectedLeaf = tabs.children[0];
    const detachedLeaf = new WorkspaceLeaf();

    tabs.addChild(detachedLeaf);
    tabs.removeChild(detachedLeaf, true);
    workspace._activeLeaf = detachedLeaf;

    expect(workspace.activeLeaf).toBe(selectedLeaf);
  });

  it("uses a main area leaf for default navigation when the active leaf is in the sidebar", () => {
    const { workspace } = createWorkspaceHarness();
    const mainTabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const selectedMainLeaf = mainTabs.children[0];
    const sidebarLeaf = workspace.getLeftLeaf(false)!;

    workspace.activeLeaf = sidebarLeaf;

    expect(workspace.activeLeaf).toBe(sidebarLeaf);
    expect(workspace.activeRootLeaf).toBe(selectedMainLeaf);
    expect(workspace.getLeaf()).toBe(selectedMainLeaf);
  });

  it("creates a main area leaf for default navigation when only a sidebar leaf is active", () => {
    const { workspace } = createWorkspaceHarness();
    const mainTabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const selectedMainLeaf = mainTabs.children[0];
    const sidebarLeaf = workspace.getLeftLeaf(false)!;

    mainTabs.removeChild(selectedMainLeaf, true);
    workspace.activeLeaf = sidebarLeaf;

    const navigationLeaf = workspace.getLeaf();

    expect(navigationLeaf).not.toBe(sidebarLeaf);
    expect(mainTabs.children).toEqual([navigationLeaf]);
    expect(workspace.activeRootLeaf).toBe(navigationLeaf);
  });

  it("opens links from active sidebar leaves in the main area", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const mainTabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const selectedMainLeaf = mainTabs.children[0];
    const sidebarLeaf = workspace.getLeftLeaf(false)!;
    const target = new TFile(
      "Notes/Target.md",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );

    mainTabs.removeChild(selectedMainLeaf, true);
    workspace.activeLeaf = sidebarLeaf;
    workspace.registerView("markdown", (currentLeaf) => {
      const view = new MockTextFileView();
      view.leaf = currentLeaf;
      currentLeaf.view = view;
      return view;
    });
    workspace.registerExtensions(["md"], "markdown");
    vi.spyOn(app.vault, "getFileByPath").mockImplementation((path) =>
      path === "Notes/Target.md" ? target : null,
    );

    await workspace.openLinkText("Notes/Target", "");

    const openedLeaf = mainTabs.children[0];
    expect(openedLeaf).toBeInstanceOf(WorkspaceLeaf);
    if (!(openedLeaf instanceof WorkspaceLeaf)) {
      throw new Error(
        "Expected the sidebar link to open a main workspace leaf",
      );
    }
    expect(openedLeaf).not.toBe(sidebarLeaf);
    expect(openedLeaf.view).toBeInstanceOf(MockTextFileView);
    expect((openedLeaf.view as MockTextFileView).file).toBe(target);
    expect(workspace.activeLeaf).toBe(openedLeaf);
    expect(sidebarLeaf.view).not.toBeInstanceOf(MockTextFileView);
  });

  it("opens links from active floating leaves inside the same floating pane", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const mainTabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const floatingLeaf = mainTabs.children[0];
    const target = new TFile(
      "Notes/FloatingTarget.md",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );

    const floatingWindow = workspace.moveWorkspaceChildToFloating(floatingLeaf);
    expect(floatingLeaf).toBeInstanceOf(WorkspaceLeaf);
    if (!(floatingLeaf instanceof WorkspaceLeaf)) {
      throw new Error("Expected a floating workspace leaf");
    }
    workspace.activeLeaf = floatingLeaf;
    workspace.registerView("markdown", () => new MockTextFileView());
    workspace.registerExtensions(["md"], "markdown");
    vi.spyOn(app.vault, "getFileByPath").mockImplementation((path) =>
      path === "Notes/FloatingTarget.md" ? target : null,
    );

    await workspace.openLinkText("Notes/FloatingTarget", "");

    expect(workspace.getLeaf()).toBe(floatingLeaf);
    expect(floatingLeaf.view).toBeInstanceOf(MockTextFileView);
    expect((floatingLeaf.view as MockTextFileView).file).toBe(target);
    expect(workspace.activeLeaf).toBe(floatingLeaf);
    expect(floatingWindow.iterateAllLeaves((leaf) => leaf)).toBe(floatingLeaf);
    expect(mainTabs.children).toHaveLength(0);
  });

  it("prefers the focused popout host for default navigation", () => {
    const { workspace } = createWorkspaceHarness();
    const rootLeaf = workspace.getLeaf();
    const popoutDocument = globalThis.document as Document;
    const popoutWindow = {
      document: popoutDocument,
      focus: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const host: WorkspacePopoutHost = {
      supportsPopouts: () => true,
      openWindow: () => ({
        win: popoutWindow,
        doc: popoutDocument,
        focus: () => popoutWindow.focus(),
        close: () => popoutWindow.close(),
        onClose: () => () => {},
      }),
    };
    setWorkspacePopoutHost(host);

    const popupLeaf = workspace.openPopoutLeaf();
    const popupWindowModel = workspace.floating.children[0];

    workspace.focusFloatingWindow(popupWindowModel);
    workspace.activeLeaf = rootLeaf;

    expect(workspace.getLeaf()).toBe(popupLeaf);
  });

  it("focuses a popout window when revealing one of its leaves", async () => {
    const { workspace } = createWorkspaceHarness();
    const popoutDocument = globalThis.document as Document;
    const popoutWindow = {
      document: popoutDocument,
      focus: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const host: WorkspacePopoutHost = {
      supportsPopouts: () => true,
      openWindow: () => ({
        win: popoutWindow,
        doc: popoutDocument,
        focus: () => popoutWindow.focus(),
        close: () => popoutWindow.close(),
        onClose: () => () => {},
      }),
    };
    setWorkspacePopoutHost(host);

    const popupLeaf = workspace.openPopoutLeaf();
    await workspace.revealLeaf(popupLeaf);

    expect(popoutWindow.focus).toHaveBeenCalled();
    expect(workspace.activeLeaf).toBe(popupLeaf);
  });

  it("returns the popup document for the focused command host", () => {
    const { workspace } = createWorkspaceHarness();
    const popoutDocument = globalThis.document as Document;
    const popoutWindow = {
      document: popoutDocument,
      focus: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const host: WorkspacePopoutHost = {
      supportsPopouts: () => true,
      openWindow: () => ({
        win: popoutWindow,
        doc: popoutDocument,
        focus: () => popoutWindow.focus(),
        close: () => popoutWindow.close(),
        onClose: () => () => {},
      }),
    };
    setWorkspacePopoutHost(host);

    workspace.openPopoutLeaf();
    workspace.focusFloatingWindow(workspace.floating.children[0]);

    expect(workspace.getCommandHostDocument()).toBe(popoutDocument);
  });

  it("destroys the previous text editor when a leaf swaps views", () => {
    createWorkspaceHarness();
    const leaf = new WorkspaceLeaf();
    const firstView = new MockTextFileView(leaf);
    const secondView = new MockTextFileView();

    leaf.view = firstView;
    leaf.view = secondView;

    expect(firstView.editor.destroy).toHaveBeenCalledTimes(1);
  });

  it("reattaches the shared content element before loading an item view", async () => {
    createWorkspaceHarness();
    const leaf = new WorkspaceLeaf();

    expect(leaf.containerEl.style.height).toBe("100%");
    leaf.containerEl.empty();
    expect(Array.from(leaf.containerEl.children).includes(leaf.contentEl)).toBe(
      false,
    );

    const graphView = new MockItemView(leaf);
    await leaf.open(
      graphView,
      { history: false },
      { type: "graph", state: {} },
    );

    expect(Array.from(leaf.containerEl.children).includes(leaf.contentEl)).toBe(
      true,
    );
    expect(leaf.contentEl.children).toHaveLength(1);
  });

  it("removes stale item-view content before loading a plain view", async () => {
    createWorkspaceHarness();
    const leaf = new WorkspaceLeaf();
    leaf.contentEl.style.height = "100%";
    leaf.contentEl.createDiv();

    class MockPlainView extends View {
      onload(): void {
        this.leaf.containerEl.createDiv();
      }

      getViewType(): string {
        return "plain";
      }

      getDisplayText(): string {
        return "Plain";
      }

      protected onOpen(): Promise<void> {
        return Promise.resolve();
      }

      protected onClose(): Promise<void> {
        return Promise.resolve();
      }
    }

    const plainView = new MockPlainView(leaf);
    await leaf.open(
      plainView,
      { history: false },
      { type: "plain", state: {} },
    );

    expect(leaf.containerEl.children).toHaveLength(1);
    expect(Array.from(leaf.containerEl.children)).not.toContain(leaf.contentEl);
  });

  it("requests a workspace save when opening a non-file view", async () => {
    const { workspace } = createWorkspaceHarness();
    const requestSaveLayout = vi.spyOn(workspace, "requestSaveLayout");
    const leaf = workspace.getLeaf(true);

    workspace.registerView(
      "graph",
      (currentLeaf) => new MockItemView(currentLeaf),
    );

    await leaf.setViewState({ type: "graph", state: {} }, { history: true });

    expect(requestSaveLayout).toHaveBeenCalled();
  });

  it("recovers a persisted missing-view placeholder after its view becomes available", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);

    class CanonicalBacklinksView extends MockItemView {
      getViewType(): string {
        return "backlink";
      }
    }

    app.plugins.activateForViewType.mockImplementation(async (viewType) => {
      if (viewType === "backlink") {
        workspace.registerView(
          "backlink",
          (currentLeaf) => new CanonicalBacklinksView(currentLeaf),
        );
      }
      return true;
    });

    await leaf.setViewState({
      type: "empty",
      state: {
        __missingViewType: "backlink",
        pinnedFile: "Notes/Welcome.md",
      },
    });

    expect(app.plugins.activateForViewType).toHaveBeenCalledWith("backlink");
    expect(leaf.view.getViewType()).toBe("backlink");
    expect(leaf.getViewState()).toEqual({
      type: "backlink",
      state: { pinnedFile: "Notes/Welcome.md" },
    });
  });

  it("retains an unavailable missing-view placeholder", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);

    await leaf.setViewState({
      type: "empty",
      state: { __missingViewType: "bookmarks" },
    });

    expect(app.plugins.activateForViewType).toHaveBeenCalledWith("bookmarks");
    expect(leaf.getViewState()).toEqual({
      type: "empty",
      state: { __missingViewType: "bookmarks" },
    });
  });

  it("honors explicit file-backed view state instead of falling back to the file default", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    const file = new TFile("Deck.md", { ctime: 0, mtime: 0, size: 0 }, null);

    class SlidesTextFileView extends MockTextFileView {
      getViewType(): string {
        return "slides";
      }
    }

    vi.spyOn(app.vault, "getFileByPath").mockImplementation((path) =>
      path === "Deck.md" ? file : null,
    );
    workspace.registerView("markdown", () => new MockTextFileView());
    workspace.registerExtensions(["md"], "markdown");
    workspace.registerView("slides", (currentLeaf) => {
      return new SlidesTextFileView(currentLeaf);
    });

    await leaf.setViewState({
      type: "slides",
      state: { file: "Deck.md" },
    });

    expect(leaf.view.getViewType()).toBe("slides");
    expect((leaf.view as SlidesTextFileView).file).toBe(file);
  });

  it("restores a graph view after history.back following in-tab file navigation", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    let graphLoadCount = 0;

    class TrackingGraphView extends MockItemView {
      onload(): void {
        graphLoadCount += 1;
        super.onload();
      }
    }

    workspace.registerView(
      "graph",
      (currentLeaf) => new TrackingGraphView(currentLeaf),
    );
    workspace.registerView("markdown", () => new MockTextFileView());
    workspace.registerExtensions(["md"], "markdown");

    const file = new TFile(
      "Notes/Target.md",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    vi.spyOn(app.vault, "getFileByPath").mockImplementation((path) =>
      path === "Notes/Target.md" ? file : null,
    );
    app.plugins.activateForViewType.mockImplementation(
      async (viewType: string) => {
        if (viewType === "markdown") {
          workspace.registerView(viewType, () => new MockTextFileView());
        }
        return true;
      },
    );

    await leaf.setViewState({ type: "graph", state: {} }, { history: false });
    expect(leaf.view.getViewType()).toBe("graph");
    expect(graphLoadCount).toBe(1);

    await leaf.openFile(file, { result: { history: true } });
    expect(leaf.view.getViewType()).toBe("mock-text");
    expect((leaf.view as MockTextFileView).file).toBe(file);
    expect(leaf.history.stack.map((state) => state.type)).toEqual([
      "graph",
      "mock-text",
    ]);

    await leaf.openFile(file, { result: { history: true } });
    expect(leaf.history.stack.map((state) => state.type)).toEqual([
      "graph",
      "mock-text",
    ]);

    await leaf.history.back();
    expect(leaf.view.getViewType()).toBe("graph");
    expect(graphLoadCount).toBe(2);
  });

  it("emits layout-change events when requesting layout persistence", () => {
    const { workspace } = createWorkspaceHarness();
    const events: unknown[] = [];

    workspace.on("layout-change", (event) => events.push(event));
    workspace.requestSaveLayout({ source: "drag-drop", operation: "test" });

    expect(events).toEqual([{ source: "drag-drop", operation: "test" }]);
  });

  it("emits layout-ready after layout loading finishes", async () => {
    const { workspace } = createWorkspaceHarness();
    const events: string[] = [];

    workspace.on("layout-ready", () => events.push("ready"));

    await workspace.loadLayout();

    expect(events).toEqual(["ready"]);
  });

  it("uses the captured desktop shell geometry before a layout is persisted", async () => {
    const { workspace } = createWorkspaceHarness();

    await workspace.loadLayout();

    const layout = workspace.toJson();
    const mainTabs = layout.main.children[0] as {
      children: Array<{ state: { type: string; title: string } }>;
    };
    expect(mainTabs.children).toHaveLength(1);
    expect(mainTabs.children[0]?.state).toMatchObject({
      type: "empty",
    });
    expect(workspace.activeLeaf?.getViewState().type ?? "empty").toBe("empty");
    expect(layout.left.width).toBe("22rem");
    expect(layout.right.width).toBe("0");
    expect(layout.bottom.height).toBe("0px");
  });

  it("loads an alternate workspace file and hydrates the host controller", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const layout = workspace.toJson();
    const leaf = (layout.main.children[0] as any).children[0];
    leaf.id = "alternate-leaf";
    layout.active = "alternate-leaf";
    const workspaceFile = new TFile(
      "/.obsidian/mobile.json",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    const getFileByPath = vi
      .spyOn(app.vault, "getFileByPath")
      .mockImplementation((path) =>
        path === "/.obsidian/mobile.json" ? workspaceFile : null,
      );
    vi.spyOn(app.vault, "read").mockResolvedValue(JSON.stringify(layout));

    await workspace.loadLayout("mobile.json");

    expect(getFileByPath).toHaveBeenCalledWith("/.obsidian/mobile.json");
    expect(workspace.activeLeaf?.id).toBe("alternate-leaf");
    expect(
      JSON.stringify(getWorkspaceHostBinding(workspace).controller.getLayout()),
    ).toContain("alternate-leaf");
  });

  it("exposes the api-owned design-core controller through the host binding", () => {
    const { workspace } = createWorkspaceHarness();
    const binding = getWorkspaceHostBinding(workspace);

    expect(binding.controller.getLayout()).toEqual(
      expect.objectContaining({
        main: expect.objectContaining({ type: "split" }),
        left: expect.objectContaining({ type: "split" }),
        right: expect.objectContaining({ type: "split" }),
      }),
    );

    const leaf = workspace.getLeaf();
    workspace.requestSaveLayout({ source: "api", operation: "host-sync" });

    expect(JSON.stringify(binding.controller.getLayout())).toContain(leaf.id);
  });

  it("projects live API commands into the host command palette", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const controller = getWorkspaceHostBinding(workspace).controller;
    const callback = vi.fn();

    app.commands.registerCommand({
      id: "fixture:open",
      name: "Fixture: Open Fixture",
      sourcePlugin: "fixture",
      callback,
    });

    const projected = controller.commands.getCommand("fixture:open");
    expect(projected).toMatchObject({
      id: "fixture:open",
      title: "Fixture: Open Fixture",
      sourcePlugin: "fixture",
    });
    await projected?.callback({} as never);
    expect(callback).toHaveBeenCalledOnce();

    app.commands.unregisterCommand("fixture:open");
    expect(controller.commands.getCommand("fixture:open")).toBeNull();
  });

  it("mirrors editor contributions and extension patterns into design-core", () => {
    const { workspace } = createWorkspaceHarness();
    const controller = getWorkspaceHostBinding(workspace).controller;
    const dispose = workspace.registerEditorView({
      id: "source.markdown",
      viewType: "markdown",
      label: "Markdown source",
      filenamePatterns: ["*.md"],
      source: "manifest",
    });

    workspace.registerExtensions(["md", "markdown"], "markdown");
    expect(controller.editorViews.get("source.markdown")).toEqual(
      expect.objectContaining({
        id: "source.markdown",
        viewType: "markdown",
        label: "Markdown source",
        filenamePatterns: ["*.md", "*.markdown"],
        source: "plugin",
      }),
    );

    workspace.unregisterExtensions(["markdown"], "markdown");
    expect(
      controller.editorViews.get("source.markdown")?.filenamePatterns,
    ).toEqual(["*.md"]);

    dispose();
    expect(controller.editorViews.get("source.markdown")).toBeUndefined();
  });

  it("persists controller settings through API configuration without feedback writes", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const controller = getWorkspaceHostBinding(workspace).controller;
    const events = new EventDispatcher<{
      updated: [{ key: string; value: unknown; prev: unknown }];
    }>();
    const values: Record<string, unknown> = {
      "editor.display.wrapLines": false,
      "unrelated.key": "keep",
    };
    let physicalWrites = 0;
    const updateConfigurationOptions = vi.fn(
      async (changes: Readonly<Record<string, unknown>>) => {
        const changed = Object.entries(changes).filter(
          ([key, value]) => !isEqual(values[key], value),
        );
        if (!changed.length) return;
        physicalWrites += 1;
        for (const [key, value] of changed) {
          const prev = values[key];
          values[key] = value;
          events.trigger("updated", { key, value, prev });
        }
      },
    );
    (app as any).configuration = {
      getConfiguration: () => ({
        entries: () => Object.entries(values),
      }),
      updateConfigurationOptions,
      on: events.on.bind(events),
      offref: events.offref.bind(events),
    };
    workspace.bindConfiguration();
    controller.registerSettingsSection({
      id: "editor",
      title: "Editor",
      fields: [
        {
          id: "editor.display.wrapLines",
          type: "boolean",
          title: "Wrap lines",
          default: true,
        },
      ],
    });

    expect(controller.settings.get("editor.display.wrapLines")).toBe(false);
    expect(controller.settings.update("editor.display.wrapLines", true)).toBe(
      true,
    );
    await controller.settings.flushSave();
    expect(physicalWrites).toBe(1);
    expect(values).toEqual(
      expect.objectContaining({
        "editor.display.wrapLines": true,
        "unrelated.key": "keep",
      }),
    );

    const prev = values["editor.display.wrapLines"];
    values["editor.display.wrapLines"] = false;
    physicalWrites += 1;
    events.trigger("updated", {
      key: "editor.display.wrapLines",
      value: false,
      prev,
    });
    expect(controller.settings.get("editor.display.wrapLines")).toBe(false);

    await controller.settings.flushSave();
    expect(physicalWrites).toBe(2);
    expect(updateConfigurationOptions).toHaveBeenCalledTimes(2);
  });

  it("configures the host controller with Lapis metadata and notification chrome", async () => {
    const { workspace } = createWorkspaceHarness();
    const controller = getWorkspaceHostBinding(workspace).controller;

    expect(controller.applicationInfo).toMatchObject({
      name: "Lapis Notes",
      version: "1.10.0",
      logoUrl: expect.stringContaining("lapis-logo.svg"),
    });
    expect(controller.plugins.get("notifications")).toMatchObject({
      id: "notifications",
      enabled: true,
      status: "disabled",
    });
    expect(controller.plugins.get("fmode")).toMatchObject({
      id: "fmode",
      enabled: false,
      status: "disabled",
    });

    await controller.start();
    expect(controller.plugins.get("fmode")).toMatchObject({
      id: "fmode",
      enabled: false,
      status: "disabled",
    });
    expect(await controller.managedPlugins.enable("app-shell:fmode")).toBe(
      true,
    );
    expect(controller.plugins.get("fmode")).toMatchObject({
      id: "fmode",
      enabled: true,
      status: "enabled",
    });
    await controller.dispose();
  });

  it("projects controller changes while preserving compatibility leaf identity", async () => {
    const { workspace } = createWorkspaceHarness();
    const binding = getWorkspaceHostBinding(workspace);
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const originalLeaf = tabs.children[0] as WorkspaceLeaf;
    const events: unknown[] = [];
    workspace.on("layout-change", (event) => events.push(event));

    const added = binding.controller.workspace.openLeaf(
      "empty",
      {},
      { paneId: tabs.id, title: "Second", active: true },
    );
    expect(added).not.toBeNull();

    await vi.waitFor(() => {
      expect(workspace.getLeafById(added!.id)).toBeInstanceOf(WorkspaceLeaf);
    });

    expect(workspace.getLeafById(originalLeaf.id)).toBe(originalLeaf);
    expect(workspace.activeLeaf?.id).toBe(added!.id);
    expect(events).toContainEqual({ source: "api", operation: "tab-add" });
  });

  it("restores bottom-panel leaves without replacing stable wrappers", async () => {
    const { app, workspace } = createWorkspaceHarness();
    workspace.registerView(
      "terminal",
      (leaf) => new MockItemView(leaf, "terminal", "Terminal"),
    );
    const panel = workspace.bottomPanel;

    await workspace.changeLayout({
      ...workspace.toJson(),
      bottom: {
        id: "bottom-panel",
        type: "tabs",
        stacked: false,
        currentTab: 0,
        height: "320px",
        children: [
          {
            id: "terminal-leaf",
            type: "leaf",
            state: {
              type: "terminal",
              state: { cwd: "/vault" },
              icon: "terminal",
              title: "Terminal",
            },
          },
        ],
      },
      active: "terminal-leaf",
    });

    const leaf = workspace.getLeafById("terminal-leaf");
    expect(workspace.bottomPanel).toBe(panel);
    expect(panel).toBeInstanceOf(WorkspaceBottomPanel);
    expect(panel.collapsed).toBe(false);
    expect(panel.size).toBe(320);
    expect(workspace.activeLeaf).toBe(leaf);
    expect(workspace.getLeavesOfType("terminal")).toEqual([leaf]);
    expect(workspace.getOpenLeafEntries()).toContainEqual(
      expect.objectContaining({ leaf, region: "bottom", active: true }),
    );
    expect(
      workspace.getOpenLeafEntries({ includeBottomPanel: false }),
    ).not.toContainEqual(expect.objectContaining({ leaf }));
    expect(app.plugins.activateForViewType).toHaveBeenCalledWith("terminal");
  });

  it("projects controller bottom-panel mutations and preserves leaf identity", async () => {
    const { workspace } = createWorkspaceHarness();
    const controller = getWorkspaceHostBinding(workspace).controller;
    const originalPanel = workspace.bottomPanel;
    const leaf = controller.workspace.openInBottomPanel(
      "empty",
      {},
      {
        title: "Output",
        active: true,
      },
    );
    expect(leaf).not.toBeNull();

    await vi.waitFor(() => {
      expect(workspace.getLeafById(leaf!.id)).not.toBeNull();
      expect(workspace.bottomPanel.collapsed).toBe(false);
    });
    const projectedLeaf = workspace.getLeafById(leaf!.id);

    controller.workspace.setBottomPanelSize(360);
    await vi.waitFor(() => {
      expect(workspace.bottomPanel.size).toBe(360);
    });

    expect(workspace.bottomPanel).toBe(originalPanel);
    expect(workspace.getLeafById(leaf!.id)).toBe(projectedLeaf);
  });

  it("controls the bottom panel through the compatibility API", () => {
    const { workspace } = createWorkspaceHarness();
    const controller = getWorkspaceHostBinding(workspace).controller;
    const events: unknown[] = [];
    workspace.on("layout-change", (event) => events.push(event));

    const leaf = workspace.getBottomLeaf();
    workspace.setBottomPanelSize(340);
    workspace.setBottomPanelOpen(false);
    workspace.toggleBottomPanel();

    expect(leaf.parent).toBe(workspace.bottomPanel);
    expect(workspace.bottomPanel.collapsed).toBe(false);
    expect(workspace.bottomPanel.size).toBe(340);
    expect(controller.getLayout().bottom).toMatchObject({
      height: "340px",
      children: [expect.objectContaining({ id: leaf.id })],
    });
    expect(events).toContainEqual({
      source: "bottom-panel",
      operation: "open-leaf",
    });
    expect(events).toContainEqual({
      source: "bottom-panel",
      operation: "resize",
    });
  });

  it("keeps alignment story-local and rejects bottom split operations", async () => {
    const { workspace } = createWorkspaceHarness();
    const leaf = workspace.getBottomLeaf();

    expect(workspace.bottomPanelAlignment).toBe("center");
    expect(workspace.setBottomPanelAlignment("justify")).toBe(true);
    expect(workspace.bottomPanelAlignment).toBe("justify");
    expect(workspace.enterFocusMode(leaf)).toBe(false);
    expect(() => workspace.createLeafBySplit(leaf)).toThrow(
      "Bottom panel does not support split panes",
    );
    await expect(workspace.duplicateLeaf(leaf, "split")).rejects.toThrow(
      "Bottom panel does not support split panes",
    );
    await expect(
      workspace.dropWorkspaceItemOnTabs(workspace.bottomPanel, {
        position: "left",
        item: workspace.getLeaf(),
      }),
    ).resolves.toBe(false);
  });

  it("debounces bottom layout writes and leaves settings out of workspace persistence", async () => {
    const { app, workspace } = createWorkspaceHarness();
    await workspace.loadLayout("mobile.json");
    const create = vi.spyOn(app.vault, "create");

    const leaf = workspace.getBottomLeaf();
    workspace.setBottomPanelSize(300);
    expect(workspace.setBottomPanelAlignment("right")).toBe(true);

    await vi.waitFor(
      () => {
        expect(create).toHaveBeenCalledTimes(1);
      },
      { timeout: 2_000 },
    );

    expect(create).toHaveBeenCalledWith(
      "/.obsidian/mobile.json",
      expect.any(String),
    );
    const persisted = JSON.parse(String(create.mock.calls[0]?.[1]));
    expect(persisted.bottom).toMatchObject({
      height: "300px",
      children: [expect.objectContaining({ id: leaf.id })],
    });
    expect(persisted).not.toHaveProperty("bottomPanelAlignment");
  });

  it("does not resurrect stale tabs during back-to-back host mutations", async () => {
    const { workspace } = createWorkspaceHarness();
    const binding = getWorkspaceHostBinding(workspace);
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const originalLeaf = tabs.children[0] as WorkspaceLeaf;

    const added = binding.controller.workspace.openLeaf(
      "empty",
      {},
      { paneId: tabs.id, title: "Transient", active: true },
    );
    expect(added).not.toBeNull();
    expect(binding.controller.workspace.closeLeaf(added!.id)).toBe(true);
    binding.controller.renderer.setSidebarOpen("left", true);

    await vi.waitFor(() => {
      expect(workspace.getLeafById(added!.id)).toBeNull();
      expect(workspace.getLeafById(originalLeaf.id)).toBe(originalLeaf);
      expect(workspace.leftSplit.collapsed).toBe(false);
    });

    expect(
      (binding.controller.getLayout().main.children[0] as any).children.map(
        (child: { id: string }) => child.id,
      ),
    ).toEqual([originalLeaf.id]);
  });

  it("persists the final projection after back-to-back host mutations", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const binding = getWorkspaceHostBinding(workspace);
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const originalLeaf = tabs.children[0] as WorkspaceLeaf;
    const secondLeaf = new WorkspaceLeaf();
    const thirdLeaf = new WorkspaceLeaf();
    tabs.addChild(secondLeaf);
    tabs.addChild(thirdLeaf);
    workspace.requestSaveLayout({ source: "api", operation: "seed-tabs" });
    const create = vi.spyOn(app.vault, "create");
    await workspace.loadLayout();

    const added = binding.controller.workspace.openLeaf(
      "empty",
      {},
      { paneId: tabs.id, title: "Transient", active: true },
    );
    expect(added).not.toBeNull();
    expect(binding.controller.workspace.setActiveLeaf(originalLeaf.id)).toBe(
      true,
    );
    expect(binding.controller.workspace.closeLeaf(added!.id)).toBe(true);

    await vi.waitFor(() => {
      expect(workspace.getLeafById(added!.id)).toBeNull();
      expect(workspace.activeLeaf).toBe(originalLeaf);
    });
    const otherCreate = vi.fn();
    globalThis.app = {
      ...app,
      vault: { ...app.vault, create: otherCreate },
    } as App;
    await vi.waitFor(
      () => {
        expect(create).toHaveBeenCalledTimes(1);
      },
      { timeout: 2_000 },
    );

    const persisted = JSON.parse(String(create.mock.calls[0]?.[1]));
    expect(
      persisted.main.children[0].children.map(
        (child: { id: string }) => child.id,
      ),
    ).toEqual([originalLeaf.id, secondLeaf.id, thirdLeaf.id]);
    expect(persisted.active).toBe(originalLeaf.id);
    expect(otherCreate).not.toHaveBeenCalled();
  });

  it("forwards cancelable controller drop events to compatibility listeners", async () => {
    const { workspace } = createWorkspaceHarness();
    const binding = getWorkspaceHostBinding(workspace);
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const added = binding.controller.workspace.openLeaf(
      "empty",
      {},
      { paneId: tabs.id, title: "Second", active: true },
    );
    expect(added).not.toBeNull();
    await vi.waitFor(() => {
      expect(workspace.getLeafById(added!.id)).not.toBeNull();
    });

    workspace.on("layout-will-drop", (event) => event.preventDefault());
    const moved = binding.controller.workspace.moveLeaf(
      added!.id,
      tabs.id,
      "center",
      0,
    );

    expect(moved).toBe(false);
    expect(
      (binding.controller.getLayout().main.children[0] as any).children.map(
        (child: { id: string }) => child.id,
      ),
    ).toEqual([tabs.children[0]!.id, added!.id]);
  });

  it("registers Lapis views as imperative design-core definitions", () => {
    const { workspace } = createWorkspaceHarness();
    const binding = getWorkspaceHostBinding(workspace);

    workspace.registerView(
      "graph",
      (leaf) => new MockItemView(leaf, "graph", "Graph"),
    );

    expect(binding.controller.renderer.registry.resolve("graph")).toMatchObject(
      {
        kind: "imperative",
        type: "graph",
        showHeader: true,
      },
    );

    workspace.unregisterView("graph");
    expect(
      binding.controller.renderer.registry.resolve("graph"),
    ).toBeUndefined();
  });

  it("projects view actions and pane-menu contributions into design-core chrome", async () => {
    const { workspace } = createWorkspaceHarness();
    const binding = getWorkspaceHostBinding(workspace);
    let chromeView: MockChromeView | null = null;
    workspace.registerView("chrome", (leaf) => {
      chromeView = new MockChromeView(leaf, "chrome", "Chrome");
      return chromeView;
    });

    const leaf = workspace.getLeaf();
    await leaf.setViewState({ type: "chrome", state: {} });
    const definition = binding.controller.renderer.registry.resolve("chrome");
    expect(definition?.kind).toBe("imperative");
    const chrome = definition?.getChrome?.({
      tab: {
        id: leaf.id,
        kind: "tab",
        title: "Chrome",
        view: { type: "chrome", state: {} },
      },
      hostId: "root",
      paneId: leaf.parent.id,
      active: true,
      showInlineTitle: true,
      activate: () => true,
      close: () => true,
      setState: () => true,
    });

    expect(chrome?.actions).toMatchObject([
      {
        id: "view-action:0:book-open",
        label: "Current view: editing\nClick to read",
        icon: "book-open",
        disabled: false,
      },
    ]);
    await chrome?.actions?.[0]?.onSelect();
    expect(chromeView!.actionCallback).toHaveBeenCalledTimes(1);

    const menu = binding.controller.renderer.createPaneMenu(leaf.id);
    expect(
      menu.entries
        .slice(0, 5)
        .map((entry) =>
          entry.kind === "separator" ? entry.kind : entry.title,
        ),
    ).toEqual([
      "Reading view",
      "separator",
      "Plugin views",
      "separator",
      "Split right",
    ]);
    const readingView = menu.entries.find(
      (entry) => entry.kind === "item" && entry.title === "Reading view",
    );
    expect(readingView).toMatchObject({
      kind: "item",
      icon: "book-open",
      checked: true,
      disabled: false,
      section: "view",
    });
    if (readingView?.kind === "item") await readingView.callback?.();
    expect(chromeView!.readingViewCallback).toHaveBeenCalledTimes(1);

    const providerMenu = menu.entries.find(
      (entry) => entry.kind === "submenu" && entry.title === "Plugin views",
    );
    expect(providerMenu?.kind).toBe("submenu");
    if (providerMenu?.kind === "submenu") {
      const providerAction = providerMenu.menu.entries.find(
        (entry) =>
          entry.kind === "item" &&
          entry.title === "Provider action (more-options)",
      );
      expect(providerAction?.kind).toBe("item");
      if (providerAction?.kind === "item") await providerAction.callback?.();
    }
    expect(chromeView!.providerCallback).toHaveBeenCalledTimes(1);
  });

  it("projects contributed breadcrumbs and a breadcrumb file path into chrome", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const binding = getWorkspaceHostBinding(workspace);
    const onSelectHistory = vi.fn();

    class BreadcrumbView extends View {
      getViewType(): string {
        return "history-compare";
      }

      getDisplayText(): string {
        return "History: Notes/Welcome.md";
      }

      getBreadcrumbFilePath(): string | null {
        return "Notes/Welcome.md";
      }

      getBreadcrumbs() {
        return [
          {
            id: "history",
            label: "History",
            onSelect: onSelectHistory,
          },
        ];
      }
    }

    workspace.registerView(
      "history-compare",
      (leaf) => new BreadcrumbView(leaf),
    );
    const leaf = workspace.getLeaf();
    await leaf.setViewState({ type: "history-compare", state: {} });
    const chrome = binding.controller.renderer.registry
      .resolve("history-compare")
      ?.getChrome?.({
        tab: {
          id: leaf.id,
          kind: "tab",
          title: "History compare",
          view: { type: "history-compare", state: {} },
        },
        hostId: "root",
        paneId: leaf.parent.id,
        active: true,
        showInlineTitle: true,
        activate: () => true,
        close: () => true,
        setState: () => true,
      });

    expect(chrome?.title).toBe("Welcome.md");
    expect(chrome?.titleEditable).toBe(false);
    expect(chrome?.breadcrumbs?.map((crumb) => crumb.label)).toEqual([
      "History",
      "Notes",
    ]);
    chrome?.breadcrumbs?.[0]?.onSelect?.();
    expect(onSelectHistory).toHaveBeenCalledTimes(1);
    chrome?.breadcrumbs?.[1]?.onSelect?.();
    expect(app.commands.executeCommand).toHaveBeenCalledWith(
      "lapis-file-explorer:reveal-path",
      "Notes",
    );
  });

  it("keeps file-view chrome breadcrumbs and an editable title", async () => {
    const { workspace } = createWorkspaceHarness();
    const binding = getWorkspaceHostBinding(workspace);
    workspace.registerView("markdown", (leaf) => new MockTextFileView(leaf));
    const leaf = workspace.getLeaf();
    await leaf.setViewState({ type: "markdown", state: {} });
    const file = new TFile(
      "Notes/Welcome.md",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    await (leaf.view as MockTextFileView).onLoadFile(file);
    const chrome = binding.controller.renderer.registry
      .resolve("markdown")
      ?.getChrome?.({
        tab: {
          id: leaf.id,
          kind: "tab",
          title: "Welcome.md",
          view: { type: "markdown", state: {} },
        },
        hostId: "root",
        paneId: leaf.parent.id,
        active: true,
        showInlineTitle: true,
        activate: () => true,
        close: () => true,
        setState: () => true,
      });

    expect(chrome?.title).toBe("Welcome.md");
    expect(chrome?.titleEditable).toBe(true);
    expect(chrome?.breadcrumbs?.map((crumb) => crumb.label)).toEqual(["Notes"]);
  });

  it("moves tab children through cancelable workspace drop events", () => {
    const { workspace } = createWorkspaceHarness();
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const firstLeaf = tabs.children[0] as WorkspaceLeaf;
    const secondLeaf = new WorkspaceLeaf();
    tabs.addChild(secondLeaf);
    const events: string[] = [];

    workspace.on("layout-will-drop", (event) => {
      events.push(`will:${event.operation}:${event.position}`);
    });
    workspace.on("layout-did-drop", (event) => {
      events.push(`did:${event.operation}:${event.position}`);
    });
    workspace.on("layout-change", (event) => {
      events.push(`change:${event.source}:${event.operation}`);
    });

    const moved = workspace.moveWorkspaceChildToTabIndex(firstLeaf, tabs, 2, {
      position: "right",
      source: "html5",
    });

    expect(moved).toBe(true);
    expect(tabs.children).toEqual([secondLeaf, firstLeaf]);
    expect(tabs.selectedChild).toBe(firstLeaf);
    expect(workspace.activeLeaf).toBe(firstLeaf);
    expect(events).toEqual([
      "will:tab-reorder:right",
      "change:drag-drop:tab-reorder",
      "did:tab-reorder:right",
    ]);
  });

  it("does not mutate layout when workspace drop is canceled", () => {
    const { workspace } = createWorkspaceHarness();
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const firstLeaf = tabs.children[0] as WorkspaceLeaf;
    const secondLeaf = new WorkspaceLeaf();
    tabs.addChild(secondLeaf);

    workspace.on("layout-will-drop", (event) => event.preventDefault());

    const moved = workspace.moveWorkspaceChildToTabIndex(firstLeaf, tabs, 2, {
      position: "right",
      source: "html5",
    });

    expect(moved).toBe(false);
    expect(tabs.children).toEqual([firstLeaf, secondLeaf]);
  });

  it("creates a split through cancelable workspace drop events", async () => {
    const { workspace } = createWorkspaceHarness();
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const firstLeaf = tabs.children[0] as WorkspaceLeaf;
    const secondLeaf = new WorkspaceLeaf();
    tabs.addChild(secondLeaf);
    const events: string[] = [];

    workspace.on("layout-will-drop", (event) => {
      events.push(`will:${event.operation}:${event.position}`);
    });
    workspace.on("layout-did-drop", (event) => {
      events.push(`did:${event.operation}:${event.position}`);
    });
    workspace.on("layout-change", (event) => {
      events.push(`change:${event.source}:${event.operation}`);
    });

    const moved = await workspace.dropWorkspaceItemOnTabs(tabs, {
      item: firstLeaf,
      position: "right",
      source: "html5",
    });

    expect(moved).toBe(true);
    expect(workspace.rootSplit.children).toHaveLength(2);
    expect(workspace.rootSplit.children[1]).toBeInstanceOf(WorkspaceTabs);
    const splitTabs = workspace.rootSplit.children[1] as WorkspaceTabs;
    expect(splitTabs.selectedLeaf?.state.type).toBe(firstLeaf.state.type);
    expect(tabs.children).toEqual([secondLeaf]);
    expect(workspace.activeLeaf).toBe(splitTabs.selectedLeaf);
    expect(events).toEqual([
      "will:split-drop:right",
      "change:drag-drop:split-drop",
      "did:split-drop:right",
    ]);
  });

  it("moves sidebar leaves through cancelable workspace drop events", () => {
    const { workspace } = createWorkspaceHarness();
    const firstLeaf = new WorkspaceLeaf();
    const tabs = new WorkspaceTabs({ leaves: [firstLeaf] });
    workspace.leftSplit.addChild(tabs);
    const secondLeaf = new WorkspaceLeaf();
    tabs.addChild(secondLeaf);
    const group = workspace.convertSidebarLeavesToGroup(
      "left",
      [firstLeaf, secondLeaf],
      {
        name: "Pinned",
      },
    );
    const thirdLeaf = new WorkspaceLeaf();
    tabs.addChild(thirdLeaf);
    const events: string[] = [];

    workspace.on("layout-will-drop", (event) => {
      events.push(`will:${event.operation}:${event.position}`);
    });
    workspace.on("layout-did-drop", (event) => {
      events.push(`did:${event.operation}:${event.position}`);
    });
    workspace.on("layout-change", (event) => {
      events.push(`change:${event.source}:${event.operation}`);
    });

    const moved = workspace.moveLeafToSidebarGroupIndex(thirdLeaf, group, 1, {
      position: "top",
      source: "html5",
    });

    expect(moved).toBe(true);
    expect(group.children).toEqual([firstLeaf, thirdLeaf, secondLeaf]);
    expect(group.parent.selectedChild).toBe(group);
    expect(workspace.activeLeaf).toBe(thirdLeaf);
    expect(events).toEqual([
      "will:sidebar-group-reorder:top",
      "change:drag-drop:sidebar-group-reorder",
      "did:sidebar-group-reorder:top",
    ]);
  });

  it("prefers the longest registered extension match for file paths", () => {
    const { workspace } = createWorkspaceHarness();

    workspace.registerView("markdown", () => new MockTextFileView());
    workspace.registerView("notebook", () => new MockTextFileView());
    workspace.registerExtensions(["md"], "markdown");
    workspace.registerExtensions([".notebook.md"], "notebook");

    expect(workspace.determineViewType("md")).toBe("markdown");
    expect(workspace.determineViewTypeForPath("Notes/Daily.md")).toBe(
      "markdown",
    );
    expect(workspace.determineViewTypeForPath("Notes/Daily.notebook.md")).toBe(
      "notebook",
    );
  });

  it("uses longest-suffix routing when creating views for files", () => {
    const { workspace } = createWorkspaceHarness();

    workspace.registerView("markdown", () => new MockItemView());
    workspace.registerView("notebook", () => new MockTextFileView());
    workspace.registerExtensions(["md"], "markdown");
    workspace.registerExtensions(["notebook.md"], "notebook");

    const file = new TFile(
      "Notes/Example.notebook.md",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );

    const creator = workspace.viewCreator(file);
    const view = creator?.(new WorkspaceLeaf());

    expect(view).toBeInstanceOf(MockTextFileView);
  });

  it("prefers configured editor associations over registered extensions", () => {
    const { workspace } = createWorkspaceHarness({
      "*.md": "lapis.text.editor",
    });

    workspace.registerView("markdown", () => new MockItemView());
    workspace.registerView("text", () => new MockTextFileView());
    workspace.registerEditorView({
      id: "lapis.text.editor",
      viewType: "text",
      label: "Text",
      filenamePatterns: ["*.md"],
    });
    workspace.registerExtensions(["md"], "markdown");

    expect(workspace.determineViewTypeForPath("Notes/Daily.md")).toBe("text");
  });

  it("uses the most specific configured editor association", () => {
    const { workspace } = createWorkspaceHarness({
      "*.md": "lapis.markdown.editor",
      "Notes/*.md": "lapis.text.editor",
    });

    workspace.registerView("markdown", () => new MockTextFileView());
    workspace.registerView("text", () => new MockTextFileView());
    workspace.registerEditorView({
      id: "lapis.markdown.editor",
      viewType: "markdown",
      label: "Markdown",
      filenamePatterns: ["*.md"],
    });
    workspace.registerEditorView({
      id: "lapis.text.editor",
      viewType: "text",
      label: "Text",
      filenamePatterns: ["*.md"],
    });

    expect(workspace.determineViewTypeForPath("Notes/Daily.md")).toBe("text");
  });

  it("falls back to registered extension routing when an association target is missing", () => {
    const { workspace } = createWorkspaceHarness({
      "*.md": "missing.editor",
    });

    workspace.registerView("markdown", () => new MockTextFileView());
    workspace.registerExtensions(["md"], "markdown");

    expect(workspace.determineViewTypeForPath("Notes/Daily.md")).toBe(
      "markdown",
    );
  });

  it("uses registered editor view filename patterns before suffix fallback", () => {
    const { workspace } = createWorkspaceHarness();

    workspace.registerView("custom", () => new MockTextFileView());
    workspace.registerEditorView({
      id: "custom.editor",
      viewType: "custom",
      label: "Custom",
      filenamePatterns: ["Fixtures/*.fixture"],
      priority: "default",
    });

    expect(workspace.determineViewTypeForPath("Fixtures/example.fixture")).toBe(
      "custom",
    );
  });

  it("activates an associated view type before creating a file view", async () => {
    const { app, workspace } = createWorkspaceHarness({
      "*.fixture": "custom.editor",
    });
    const leaf = workspace.getLeaf(true);
    const file = new TFile(
      "Fixtures/example.fixture",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );

    workspace.registerEditorView({
      id: "custom.editor",
      viewType: "custom",
      label: "Custom",
      filenamePatterns: ["*.fixture"],
    });
    app.plugins.activateForViewType.mockImplementation(
      async (viewType: string) => {
        workspace.registerView(viewType, () => new MockTextFileView());
        return true;
      },
    );

    await leaf.openFile(file, { result: { history: false } });

    expect(app.plugins.activateForViewType).toHaveBeenCalledWith("custom");
    expect(leaf.view).toBeInstanceOf(MockTextFileView);
  });

  it("offers an on-demand official plugin install when no file handler is registered", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    const file = new TFile(
      "Docs/example.lapisdoc",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    const install = vi.fn(async () => {
      workspace.registerView("docs-document", () => new MockTextFileView());
      workspace.registerExtensions(["lapisdoc"], "docs-document");
    });
    const refreshCatalog = vi.fn(async () => ({ plugins: [] }));
    const search = vi.fn(() => [docsRegistryEntry()]);
    (app as any).pluginDistribution = createPluginDistributionStub({
      refreshCatalog,
      search,
      install,
    });

    await leaf.openFile(file, { result: { history: false } });

    expect(promptConfirm).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        description:
          "No installed editor can open Docs/example.lapisdoc. Check the official plugin registry for a verified plugin?",
      }),
    );
    expect(refreshCatalog).toHaveBeenCalled();
    expect(search).toHaveBeenCalledWith({
      channel: "official",
      compatibleOnly: true,
    });
    expect(leaf.view).toBeInstanceOf(OnDemandPluginInstallView);
    expect(install).not.toHaveBeenCalled();

    await expect(
      (leaf.view as OnDemandPluginInstallView).installAndOpen(),
    ).resolves.toBe(true);

    expect(install).toHaveBeenCalledWith(
      "lapis-docs",
      expect.objectContaining({
        requireOfficial: true,
        enable: true,
        signal: expect.any(AbortSignal),
      }),
    );
    expect(leaf.view).toBeInstanceOf(MockTextFileView);
  });

  it("offers an on-demand official plugin install for notebook files", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    const file = new TFile(
      "Notes/Example.notebook.md",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    const install = vi.fn(async () => {
      workspace.registerView("notebook", () => new MockTextFileView());
      workspace.registerExtensions(["notebook.md"], "notebook");
    });
    (app as any).pluginDistribution = createPluginDistributionStub({
      refreshCatalog: vi.fn(async () => ({ plugins: [] })),
      search: vi.fn(() => [notebookRegistryEntry()]),
      install,
    });

    await leaf.openFile(file, { result: { history: false } });

    expect(promptConfirm).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        description:
          "No installed editor can open Notes/Example.notebook.md. Check the official plugin registry for a verified plugin?",
      }),
    );
    expect(leaf.view).toBeInstanceOf(OnDemandPluginInstallView);

    await expect(
      (leaf.view as OnDemandPluginInstallView).installAndOpen(),
    ).resolves.toBe(true);

    expect(install).toHaveBeenCalledWith(
      "lapis-notebook",
      expect.objectContaining({
        requireOfficial: true,
        enable: true,
        signal: expect.any(AbortSignal),
      }),
    );
    expect(leaf.view).toBeInstanceOf(MockTextFileView);
  });

  it("asks before checking the registry for on-demand file handlers", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    const file = new TFile(
      "Docs/example.lapisdoc",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    const refreshCatalog = vi.fn(async () => ({ plugins: [] }));
    vi.mocked(promptConfirm).mockResolvedValue(false);
    (app as any).pluginDistribution = createPluginDistributionStub({
      refreshCatalog,
      search: vi.fn(() => [docsRegistryEntry()]),
      install: vi.fn(),
    });

    await leaf.openFile(file, { result: { history: false } });

    expect(refreshCatalog).not.toHaveBeenCalled();
    expect(leaf.view).not.toBeInstanceOf(OnDemandPluginInstallView);
  });

  it("keeps the install prompt recoverable when on-demand installation fails", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    const file = new TFile(
      "Docs/example.lapissheet",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    (app as any).pluginDistribution = createPluginDistributionStub({
      refreshCatalog: vi.fn(async () => ({ plugins: [] })),
      search: vi.fn(() => [docsRegistryEntry()]),
      install: vi.fn(async () => {
        throw new Error("signature did not verify");
      }),
    });

    await leaf.openFile(file, { result: { history: false } });
    const prompt = leaf.view as OnDemandPluginInstallView;

    await expect(prompt.installAndOpen()).resolves.toBe(false);

    expect(leaf.view).toBe(prompt);
    expect(prompt.getErrorMessage()).toContain("signature did not verify");
  });

  it("does not offer on-demand installs for non-official registry matches", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    const file = new TFile(
      "Docs/example.lapisdoc",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    (app as any).pluginDistribution = createPluginDistributionStub({
      refreshCatalog: vi.fn(async () => ({ plugins: [] })),
      search: vi.fn(() => [
        {
          ...docsRegistryEntry(),
          channel: "community",
          badges: ["community"],
        },
      ]),
      install: vi.fn(),
    });

    await leaf.openFile(file, { result: { history: false } });

    expect(leaf.view).not.toBeInstanceOf(OnDemandPluginInstallView);
  });

  it("keeps the on-demand install prompt when reopening the same file", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    const file = new TFile(
      "Docs/example.lapisdoc",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    (app as any).pluginDistribution = createPluginDistributionStub({
      refreshCatalog: vi.fn(async () => ({ plugins: [] })),
      search: vi.fn(() => [docsRegistryEntry()]),
      install: vi.fn(),
    });

    await leaf.openFile(file, { result: { history: false } });
    const prompt = leaf.view as OnDemandPluginInstallView;
    expect(prompt).toBeInstanceOf(OnDemandPluginInstallView);
    vi.mocked(promptConfirm).mockClear();

    await leaf.openFile(file, { result: { history: false } });

    expect(leaf.view).toBe(prompt);
    expect(promptConfirm).not.toHaveBeenCalled();
  });

  it("restores the on-demand install prompt from saved layout without reconfirming", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    const file = new TFile(
      "Docs/example.lapisdoc",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    (app as any).pluginDistribution = createPluginDistributionStub({
      refreshCatalog: vi.fn(async () => ({ plugins: [] })),
      search: vi.fn(() => [docsRegistryEntry()]),
      install: vi.fn(),
    });
    (app as any).vault.getFileByPath = (path: string) =>
      path === file.path ? file : null;

    await leaf.openFile(file, { result: { history: false } });
    vi.mocked(promptConfirm).mockClear();

    await leaf.setViewState({
      type: "plugin-install-prompt",
      state: { file: file.path },
    });

    expect(leaf.view).toBeInstanceOf(OnDemandPluginInstallView);
    expect(promptConfirm).not.toHaveBeenCalled();
  });

  it("uses an existing registered handler before checking registry install matches", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf(true);
    const refreshCatalog = vi.fn(async () => ({ plugins: [] }));
    workspace.registerView("docs-document", () => new MockTextFileView());
    workspace.registerExtensions(["lapisdoc"], "docs-document");
    (app as any).pluginDistribution = createPluginDistributionStub({
      refreshCatalog,
      search: vi.fn(() => [docsRegistryEntry()]),
      install: vi.fn(),
    });

    await leaf.openFile(
      new TFile("Docs/example.lapisdoc", { ctime: 0, mtime: 0, size: 0 }, null),
      { result: { history: false } },
    );

    expect(leaf.view).toBeInstanceOf(MockTextFileView);
    expect(refreshCatalog).not.toHaveBeenCalled();
  });

  it("restores old flat sidebar layout JSON without sidebar groups", async () => {
    const { workspace } = createWorkspaceHarness();
    workspace.registerView(
      "graph",
      (currentLeaf) => new MockItemView(currentLeaf),
    );

    await workspace.changeLayout({
      main: workspace.rootSplit.toJson(),
      left: {
        id: "left",
        type: "split",
        direction: "vertical",
        width: "22rem",
        sizes: [50],
        children: [
          {
            id: "left-tabs",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "flat-leaf",
                type: "leaf",
                state: {
                  type: "graph",
                  state: {},
                  icon: "box",
                  title: "Graph",
                },
              },
            ],
          },
        ],
      },
      right: workspace.rightSplit.toJson(),
    });

    const tabs = workspace.leftSplit.children[0] as WorkspaceTabs;
    expect(tabs.children[0]).toBeInstanceOf(WorkspaceLeaf);
    expect((tabs.children[0] as WorkspaceLeaf).id).toBe("flat-leaf");
  });

  it("round-trips grouped sidebar layout JSON with hidden, collapsed, and sized panels", async () => {
    const { workspace } = createWorkspaceHarness();
    workspace.registerView(
      "graph",
      (currentLeaf) => new MockItemView(currentLeaf),
    );
    workspace.registerView(
      "search",
      (currentLeaf) => new MockItemView(currentLeaf, "search", "Search"),
    );

    await workspace.changeLayout({
      main: workspace.rootSplit.toJson(),
      left: workspace.leftSplit.toJson(),
      right: {
        id: "right",
        type: "split",
        direction: "vertical",
        width: "16rem",
        sizes: [50],
        children: [
          {
            id: "right-tabs",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "workspace-tools",
                type: "sidebar-group",
                name: "Workspace Tools",
                icon: "panel-right",
                hiddenLeafIds: ["search-leaf"],
                collapsed: { "graph-leaf": true },
                panelSizes: { "graph-leaf": 35, "search-leaf": 65 },
                children: [
                  {
                    id: "graph-leaf",
                    type: "leaf",
                    state: {
                      type: "graph",
                      state: { depth: 1 },
                      icon: "box",
                      title: "Graph",
                    },
                  },
                  {
                    id: "search-leaf",
                    type: "leaf",
                    state: {
                      type: "search",
                      state: { query: "todo" },
                      icon: "search",
                      title: "Search",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const group = workspace.getSidebarGroup("right", "workspace-tools");
    expect(group).toBeInstanceOf(WorkspaceSidebarGroup);
    expect(group?.children.map((leaf) => leaf.id)).toEqual([
      "graph-leaf",
      "search-leaf",
    ]);

    const layout = workspace.getLayout() as any;
    expect(layout.right.children[0].children[0]).toMatchObject({
      id: "workspace-tools",
      type: "sidebar-group",
      name: "Workspace Tools",
      icon: "panel-right",
      hiddenLeafIds: ["search-leaf"],
      collapsed: { "graph-leaf": true },
      panelSizes: { "graph-leaf": 35, "search-leaf": 65 },
    });
  });

  it("round-trips floating window layout JSON with persisted bounds", async () => {
    const { workspace } = createWorkspaceHarness();
    workspace.registerView(
      "graph",
      (currentLeaf) => new MockItemView(currentLeaf),
    );

    await workspace.changeLayout({
      main: workspace.rootSplit.toJson(),
      left: workspace.leftSplit.toJson(),
      right: workspace.rightSplit.toJson(),
      floating: [
        {
          id: "floating-1",
          type: "floating",
          direction: "vertical",
          sizes: [50],
          x: 40,
          y: 64,
          width: 420,
          height: 280,
          displayState: "collapsed",
          children: [
            {
              id: "floating-tabs",
              type: "tabs",
              stacked: false,
              currentTab: 0,
              children: [
                {
                  id: "floating-leaf",
                  type: "leaf",
                  state: {
                    type: "graph",
                    state: { depth: 2 },
                    icon: "box",
                    title: "Graph",
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(workspace.floating.children).toHaveLength(1);
    expect(workspace.floating.children[0].toWindowJson()).toMatchObject({
      id: "floating-1",
      type: "floating",
      x: 40,
      y: 64,
      width: 420,
      height: 280,
      displayState: "collapsed",
    });

    const layout = workspace.getLayout() as any;
    expect(layout.floating).toHaveLength(1);
    expect(layout.floating[0]).toMatchObject({
      id: "floating-1",
      type: "floating",
      x: 40,
      y: 64,
      width: 420,
      height: 280,
      displayState: "collapsed",
    });
  });

  it("persists collapsed and minimized floating window state but not maximized", async () => {
    const { workspace } = createWorkspaceHarness();
    const events: unknown[] = [];
    workspace.on("layout-change", (event) => events.push(event));

    const leaf = workspace.getLeaf();
    const floatingWindow = workspace.moveWorkspaceChildToFloating(leaf, {
      x: 40,
      y: 52,
      size: { width: 360, height: 240 },
    });

    workspace.collapseFloatingWindow(floatingWindow);
    expect(floatingWindow.displayState).toBe("collapsed");
    expect(floatingWindow.toWindowJson()).toMatchObject({
      displayState: "collapsed",
    });

    workspace.minimizeFloatingWindow(floatingWindow);
    expect(floatingWindow.displayState).toBe("minimized");
    expect(floatingWindow.toWindowJson()).toMatchObject({
      displayState: "minimized",
    });

    workspace.maximizeFloatingWindow(floatingWindow);
    expect(floatingWindow.displayState).toBe("maximized");
    expect(floatingWindow.toWindowJson()).not.toHaveProperty("displayState");

    workspace.restoreFloatingWindow(floatingWindow);
    expect(floatingWindow.displayState).toBe("normal");
    expect(floatingWindow.toWindowJson()).not.toHaveProperty("displayState");
    expect(events).toEqual(
      expect.arrayContaining([
        { source: "api", operation: "collapse-floating-pane" },
        { source: "api", operation: "minimize-floating-pane" },
        { source: "api", operation: "maximize-floating-pane" },
        { source: "api", operation: "restore-floating-pane" },
      ]),
    );

    await workspace.changeLayout({
      main: workspace.rootSplit.toJson(),
      left: workspace.leftSplit.toJson(),
      right: workspace.rightSplit.toJson(),
      floating: [
        {
          ...floatingWindow.toWindowJson(),
          id: "reloaded-floating",
          displayState: "maximized",
        },
      ],
    });

    expect(workspace.floating.children[0].displayState).toBe("normal");
  });

  it("traverses grouped sidebar leaves and finds leaves by view type", async () => {
    const { workspace } = createWorkspaceHarness();
    workspace.registerView(
      "graph",
      (currentLeaf) => new MockItemView(currentLeaf),
    );
    workspace.registerView(
      "search",
      (currentLeaf) => new MockItemView(currentLeaf, "search", "Search"),
    );

    const graphLeaf = workspace.ensureSideLeaf("graph", "right", {
      group: "tools",
    });
    await graphLeaf.setViewState({ type: "graph", state: {} });
    const searchLeaf = workspace.ensureSideLeaf("search", "right", {
      group: "tools",
    });
    await searchLeaf.setViewState({ type: "search", state: {} });

    const visited: string[] = [];
    workspace.iterateAllLeaves((leaf) => {
      visited.push(leaf.view.getViewType());
    });

    expect(visited).toContain("graph");
    expect(visited).toContain("search");
    expect(workspace.getLeavesOfType("search")).toEqual([searchLeaf]);
  });

  it("restores the active leaf when the saved active id is inside a group", async () => {
    const { app, workspace } = createWorkspaceHarness();
    workspace.registerView(
      "search",
      (currentLeaf) => new MockItemView(currentLeaf, "search", "Search"),
    );
    const layout = {
      main: workspace.rootSplit.toJson(),
      left: workspace.leftSplit.toJson(),
      right: {
        id: "right",
        type: "split",
        direction: "vertical",
        width: "16rem",
        sizes: [50],
        children: [
          {
            id: "right-tabs",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "tools",
                type: "sidebar-group",
                name: "Tools",
                children: [
                  {
                    id: "active-search",
                    type: "leaf",
                    state: {
                      type: "search",
                      state: {},
                      icon: "search",
                      title: "Search",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      active: "active-search",
    };
    const workspaceFile = new TFile(
      "/.obsidian/workspace.json",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );
    vi.spyOn(app.vault, "getFileByPath").mockReturnValue(workspaceFile);
    vi.spyOn(app.vault, "read").mockResolvedValue(JSON.stringify(layout));

    await workspace.loadLayout();

    expect(workspace.activeLeaf?.id).toBe("active-search");
  });

  it("changeLayout restores active leaf and activates view plugins", async () => {
    const { app, workspace } = createWorkspaceHarness();
    workspace.registerView(
      "search",
      (currentLeaf) => new MockItemView(currentLeaf, "search", "Search"),
    );
    const requestSaveLayout = vi.spyOn(workspace, "requestSaveLayout");

    await workspace.changeLayout({
      main: {
        id: "main",
        type: "split",
        direction: "vertical",
        sizes: [100],
        children: [
          {
            id: "main-tabs",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "restored-search",
                type: "leaf",
                state: {
                  type: "search",
                  state: {},
                  icon: "search",
                  title: "Search",
                },
              },
            ],
          },
        ],
      },
      left: workspace.leftSplit.toJson(),
      right: workspace.rightSplit.toJson(),
      floating: [],
      active: "restored-search",
    });

    expect(app.plugins.activateForViewType).toHaveBeenCalledWith("search");
    expect(workspace.activeLeaf?.id).toBe("restored-search");
    expect(workspace.layoutReady).toBe(true);
    expect(requestSaveLayout).toHaveBeenCalled();
  });

  it("changeLayout restores floating layout state from an object", async () => {
    const source = createWorkspaceHarness();
    const target = createWorkspaceHarness();
    const sourceTabs = source.workspace.rootSplit.children[0] as WorkspaceTabs;
    const leaf = sourceTabs.children[0] as WorkspaceLeaf;

    source.workspace.moveWorkspaceChildToFloating(leaf, {
      x: 32,
      y: 48,
      size: {
        width: 360,
        height: 240,
      },
    });
    const layout = source.workspace.getLayout();

    await target.workspace.changeLayout(layout);

    expect((target.workspace.getLayout() as any).floating).toHaveLength(1);
    expect((target.workspace.getLayout() as any).floating[0]).toMatchObject({
      x: 32,
      y: 48,
      width: 360,
      height: 240,
    });
  });

  it("creates grouped side leaves and persists hidden panel state", async () => {
    const { workspace } = createWorkspaceHarness();
    workspace.registerView(
      "search",
      (currentLeaf) => new MockItemView(currentLeaf, "search", "Search"),
    );

    const leaf = workspace.ensureSideLeaf("search", "left", {
      group: "tools",
      groupTitle: "Tools",
      groupIcon: "wrench",
      hidden: true,
    });
    await leaf.setViewState({ type: "search", state: {} });

    const group = workspace.getSidebarGroup("left", "tools");
    expect(group?.name).toBe("Tools");
    expect(group?.icon).toBe("wrench");
    expect(group?.children).toEqual([leaf]);
    expect(group?.isLeafHidden(leaf)).toBe(true);
    expect(workspace.ensureSideLeaf("search", "left", { group: "tools" })).toBe(
      leaf,
    );
  });

  it("converts sidebar leaves to a group and back to normal tabs", async () => {
    const { workspace } = createWorkspaceHarness();
    workspace.registerView(
      "graph",
      (currentLeaf) => new MockItemView(currentLeaf),
    );
    workspace.registerView(
      "search",
      (currentLeaf) => new MockItemView(currentLeaf, "search", "Search"),
    );
    const graphLeaf = workspace.getRightLeaf(false)!;
    const searchLeaf = workspace.getRightLeaf(false)!;
    await graphLeaf.setViewState({ type: "graph", state: {} });
    await searchLeaf.setViewState({ type: "search", state: {} });

    const group = workspace.convertSidebarLeavesToGroup(
      "right",
      [graphLeaf, searchLeaf],
      {
        group: "tools",
        name: "Tools",
        icon: "wrench",
      },
    );

    expect(group.children).toEqual([graphLeaf, searchLeaf]);
    expect(workspace.getSidebarGroupLeaves("right", "tools")).toEqual([
      graphLeaf,
      searchLeaf,
    ]);

    const restoredLeaves = workspace.convertSidebarGroupToLeaves(group);

    expect(restoredLeaves).toEqual([graphLeaf, searchLeaf]);
    expect(workspace.getSidebarGroup("right", "tools")).toBeNull();
    expect(graphLeaf.parent).toBeInstanceOf(WorkspaceTabs);
    expect(searchLeaf.parent).toBe(graphLeaf.parent);
  });

  it("registers sidebar view placement defaults through plugins", () => {
    const { app, workspace } = createWorkspaceHarness();
    const plugin = new HoverLinkPlugin(app, {
      id: "sidebar-plugin",
      name: "Sidebar Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });

    plugin.load();
    plugin.registerSidebarView(
      "search",
      (leaf) => new MockItemView(leaf, "search", "Search"),
      { side: "left", group: "tools", groupTitle: "Tools" },
    );

    const leaf = workspace.ensureSideLeaf("search");

    expect(workspace.getSidebarGroupLeaves("left", "tools")).toEqual([leaf]);
    plugin.unload();
    expect(
      (
        workspace as unknown as { sidebarViewPlacements: Map<string, unknown> }
      ).sidebarViewPlacements.has("search"),
    ).toBe(false);
  });

  it("keeps source leaf reachable when moveLeafToPopout is called with a host that opens successfully", () => {
    const { workspace } = createWorkspaceHarness();
    const popoutDocument = globalThis.document as Document;
    const popoutWindow = {
      document: popoutDocument,
      focus: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const host: WorkspacePopoutHost = {
      supportsPopouts: () => true,
      openWindow: () => ({
        win: popoutWindow,
        doc: popoutDocument,
        focus: () => popoutWindow.focus(),
        close: () => popoutWindow.close(),
        onClose: () => () => {},
      }),
    };
    setWorkspacePopoutHost(host);

    const leaf = workspace.getLeaf();

    const window = workspace.moveLeafToPopout(leaf);

    // The leaf must now be in the floating window, not in the root split.
    expect(workspace.floating.children).toHaveLength(1);
    expect(workspace.floating.children[0]).toBe(window);
    expect((window.children[0] as WorkspaceTabs).children[0]).toBe(leaf);
    // The leaf must no longer be reachable from the root split.
    let foundInRoot = false;
    workspace.rootSplit.iterateAllLeaves((l) => {
      if (l === leaf) foundInRoot = true;
    });
    expect(foundInRoot).toBe(false);
  });

  it("keeps source leaf reachable when moveWorkspaceChildToFloating is called", () => {
    const { workspace } = createWorkspaceHarness();
    const sourceTabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const leaf = workspace.getLeaf();

    workspace.moveWorkspaceChildToFloating(leaf, {
      x: 0,
      y: 0,
      size: { width: 300, height: 200 },
    });

    // Leaf must be in the floating window.
    expect(workspace.floating.children).toHaveLength(1);
    const floatingTabs = workspace.floating.children[0]
      .children[0] as WorkspaceTabs;
    expect(floatingTabs.children[0]).toBe(leaf);

    // Leaf must no longer be in its original tabs.
    expect(sourceTabs.children.includes(leaf)).toBe(false);
  });

  it("enters focus mode for a root leaf without changing serialized layout", () => {
    const { workspace } = createWorkspaceHarness();
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    const leaf = workspace.getLeaf();
    const before = workspace.toJson();

    expect(workspace.enterFocusMode(leaf)).toBe(true);

    expect(workspace.focusMode?.leaf).toBe(leaf);
    expect(workspace.focusMode?.tabs).toBe(tabs);
    expect(workspace.isFocusModeForTabs(tabs)).toBe(true);
    expect(workspace.activeLeaf).toBe(leaf);
    expect(workspace.getFocusedCommandHostId()).toBe("root");
    expect(workspace.toJson()).toEqual(before);

    expect(workspace.exitFocusMode()).toBe(true);
    expect(workspace.focusMode).toBeNull();
  });

  it("rejects focus mode for non-root leaves", () => {
    const { workspace } = createWorkspaceHarness();
    const sidebarLeaf = workspace.getLeftLeaf(false)!;
    const rootLeaf = workspace.getLeaf();
    const floatingWindow = workspace.moveWorkspaceChildToFloating(rootLeaf, {
      x: 0,
      y: 0,
      size: { width: 300, height: 200 },
    });
    const floatingLeaf = (floatingWindow.children[0] as WorkspaceTabs)
      .children[0] as WorkspaceLeaf;

    expect(workspace.enterFocusMode(sidebarLeaf)).toBe(false);
    expect(workspace.enterFocusMode(floatingLeaf)).toBe(false);
    expect(workspace.focusMode).toBeNull();
  });

  it("clears focus mode when the focused leaf is removed", () => {
    const { workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf();

    workspace.enterFocusMode(leaf);
    leaf.close();

    expect(workspace.focusMode).toBeNull();
  });

  it("clears focus mode when restoring layout", async () => {
    const { workspace } = createWorkspaceHarness();
    const leaf = workspace.getLeaf();
    const layout = workspace.toJson();

    workspace.enterFocusMode(leaf);
    await workspace.changeLayout(layout);

    expect(workspace.focusMode).toBeNull();
  });

  it("normalizes a malformed layout when loading via changeLayout", async () => {
    const { workspace } = createWorkspaceHarness();
    workspace.registerView(
      "graph",
      (currentLeaf) => new MockItemView(currentLeaf),
    );

    // Malformed layout: currentTab out of range, sizes too short, stale sidedock.
    await workspace.changeLayout({
      main: {
        id: "s",
        type: "split",
        direction: "vertical",
        sizes: [], // wrong — needs 1 entry for 1 child
        children: [
          {
            id: "t",
            type: "tabs",
            stacked: false,
            currentTab: 99, // out of range
            children: [
              {
                id: "leaf-a",
                type: "leaf",
                state: {
                  type: "graph",
                  state: {},
                  icon: "box",
                  title: "Graph",
                },
              },
            ],
          },
        ],
      },
      left: {
        id: "l",
        type: "split",
        direction: "vertical",
        sizes: [],
        children: [],
        width: "16rem",
      },
      right: {
        id: "r",
        type: "split",
        direction: "vertical",
        sizes: [],
        children: [],
        width: "16rem",
      },
    });

    // Main split must have the repaired child and repaired currentTab.
    const tabs = workspace.rootSplit.children[0] as WorkspaceTabs;
    expect(tabs).toBeInstanceOf(WorkspaceTabs);
    expect((tabs.children[0] as WorkspaceLeaf).id).toBe("leaf-a");
    // selectedIndex should have been clamped to 0 (the only valid index).
    expect(tabs.selectedIndex).toBe(0);
  });

  it("drops empty floating windows when loading via changeLayout", async () => {
    const { workspace } = createWorkspaceHarness();

    await workspace.changeLayout({
      main: workspace.rootSplit.toJson(),
      left: workspace.leftSplit.toJson(),
      right: workspace.rightSplit.toJson(),
      floating: [
        {
          id: "empty-win",
          type: "floating",
          direction: "vertical",
          sizes: [],
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          children: [], // no leaves
        },
      ],
    });

    expect(workspace.floating.children).toHaveLength(0);
  });

  it("updates display mode and emits change events without layout saves", () => {
    const { workspace } = createWorkspaceHarness();
    const events: unknown[] = [];
    const layoutEvents: unknown[] = [];

    workspace.on("display-mode-change", (event) => events.push(event));
    workspace.on("layout-change", (event) => layoutEvents.push(event));

    workspace.setDisplayMode("mobile", "test");

    expect(workspace.displayMode).toBe("mobile");
    expect(workspace.isMobileMode).toBe(true);
    expect(events).toEqual([
      {
        mode: "mobile",
        previousMode: "desktop",
        reason: "test",
      },
    ]);
    expect(layoutEvents).toEqual([]);
  });

  it("does not emit duplicate display-mode events when the mode is unchanged", () => {
    const { workspace } = createWorkspaceHarness();
    const events: unknown[] = [];

    workspace.on("display-mode-change", (event) => events.push(event));

    workspace.setDisplayMode("desktop", "test");
    workspace.setDisplayMode("mobile", "test");
    workspace.setDisplayMode("mobile", "test");

    expect(events).toEqual([
      {
        mode: "mobile",
        previousMode: "desktop",
        reason: "test",
      },
    ]);
  });

  it("collects open leaf entries across main, grouped sidebar, floating, and popout regions", async () => {
    const { workspace } = createWorkspaceHarness();
    workspace.registerView("markdown", (leaf) => new MockTextFileView(leaf));
    workspace.registerExtensions(["md"], "markdown");
    workspace.registerView(
      "search",
      (currentLeaf) => new MockItemView(currentLeaf, "search", "Search"),
    );
    workspace.registerView(
      "graph",
      (currentLeaf) => new MockItemView(currentLeaf, "graph", "Graph"),
    );

    const mainLeaf = workspace.getLeaf();
    await mainLeaf.openFile(
      new TFile("Notes/Main.md", { ctime: 0, mtime: 0, size: 0 }, null),
    );

    const searchLeaf = workspace.ensureSideLeaf("search", "right", {
      group: "tools",
    });
    await searchLeaf.setViewState({ type: "search", state: {} });
    const graphLeaf = workspace.ensureSideLeaf("graph", "right", {
      group: "tools",
    });
    await graphLeaf.setViewState({ type: "graph", state: {} });
    const group = graphLeaf.parent as WorkspaceSidebarGroup;
    group.setLeafHidden(graphLeaf, true);

    const floatingLeaf = workspace.getLeaf("tab");
    await floatingLeaf.setViewState({ type: "graph", state: {} });
    workspace.moveWorkspaceChildToFloating(floatingLeaf);

    const popoutDocument = globalThis.document as Document;
    const popoutWindow = {
      document: popoutDocument,
      focus: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const host: WorkspacePopoutHost = {
      supportsPopouts: () => true,
      openWindow: () => ({
        win: popoutWindow,
        doc: popoutDocument,
        focus: () => popoutWindow.focus(),
        close: () => popoutWindow.close(),
        onClose: () => () => {},
      }),
    };
    setWorkspacePopoutHost(host);

    const popoutLeaf = workspace.openPopoutLeaf();
    await popoutLeaf.setViewState({ type: "search", state: {} });
    workspace.activeLeaf = mainLeaf;

    const entries = workspace.getOpenLeafEntries();
    const mainEntry = entries.find((entry) => entry.leaf === mainLeaf);
    const searchEntry = entries.find((entry) => entry.leaf === searchLeaf);
    const hiddenEntry = entries.find((entry) => entry.leaf === graphLeaf);
    const floatingEntry = entries.find((entry) => entry.leaf === floatingLeaf);
    const popoutEntry = entries.find((entry) => entry.leaf === popoutLeaf);

    expect(mainEntry).toMatchObject({
      region: "main",
      active: true,
      selectedInParent: true,
      filePath: "Notes/Main.md",
      viewType: "mock-text",
    });
    expect(searchEntry).toMatchObject({
      region: "right",
      parentGroupId: group.id,
      parentGroupName: group.name,
      selectedInParent: true,
      active: false,
    });
    expect(hiddenEntry).toMatchObject({
      region: "right",
      parentGroupId: group.id,
      selectedInParent: false,
    });
    expect(floatingEntry).toMatchObject({
      region: "floating",
      parentWindowMode: "floating",
    });
    expect(popoutEntry).toMatchObject({
      region: "popout",
      parentWindowMode: "popout",
    });

    expect(
      workspace.getOpenLeafEntries({
        includeFloating: false,
        includePopout: false,
      }),
    ).not.toContainEqual(expect.objectContaining({ leaf: floatingLeaf }));
  });

  it("activates a main leaf by selecting its parent tab and saving layout", () => {
    const { workspace } = createWorkspaceHarness();
    const layoutEvents: unknown[] = [];

    const firstLeaf = workspace.getLeaf();
    const secondLeaf = workspace.getLeaf("tab");
    const tabs = secondLeaf.parent as WorkspaceTabs;
    tabs.selected = firstLeaf;
    workspace.activeLeaf = firstLeaf;
    workspace.on("layout-change", (event) => layoutEvents.push(event));

    const activated = workspace.activateLeaf(secondLeaf, {
      operation: "activate-test-leaf",
    });

    expect(activated).toBe(true);
    expect(tabs.selectedLeaf).toBe(secondLeaf);
    expect(workspace.activeLeaf).toBe(secondLeaf);
    expect(layoutEvents).toContainEqual({
      source: "api",
      operation: "activate-test-leaf",
    });
  });

  it("activates hidden grouped sidebar leaves and avoids focusing popouts in mobile mode", async () => {
    const { workspace } = createWorkspaceHarness();
    workspace.registerView(
      "search",
      (currentLeaf) => new MockItemView(currentLeaf, "search", "Search"),
    );
    workspace.registerView(
      "graph",
      (currentLeaf) => new MockItemView(currentLeaf, "graph", "Graph"),
    );

    const searchLeaf = workspace.ensureSideLeaf("search", "right", {
      group: "tools",
    });
    await searchLeaf.setViewState({ type: "search", state: {} });
    const graphLeaf = workspace.ensureSideLeaf("graph", "right", {
      group: "tools",
    });
    await graphLeaf.setViewState({ type: "graph", state: {} });
    const group = graphLeaf.parent as WorkspaceSidebarGroup;
    group.setLeafHidden(graphLeaf, true);

    const activatedSidebarLeaf = workspace.activateLeaf(graphLeaf, {
      saveLayout: false,
    });

    expect(activatedSidebarLeaf).toBe(true);
    expect(group.parent.selectedChild).toBe(group);
    expect(group.isLeafHidden(graphLeaf)).toBe(false);
    expect(workspace.activeLeaf).toBe(graphLeaf);

    const popoutDocument = globalThis.document as Document;
    const popoutWindow = {
      document: popoutDocument,
      focus: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const host: WorkspacePopoutHost = {
      supportsPopouts: () => true,
      openWindow: () => ({
        win: popoutWindow,
        doc: popoutDocument,
        focus: () => popoutWindow.focus(),
        close: () => popoutWindow.close(),
        onClose: () => () => {},
      }),
    };
    setWorkspacePopoutHost(host);

    const popoutLeaf = workspace.openPopoutLeaf();
    await popoutLeaf.setViewState({ type: "search", state: {} });
    workspace.setDisplayMode("mobile", "test");

    const activatedPopoutLeaf = workspace.activateLeaf(popoutLeaf, {
      saveLayout: false,
    });

    expect(activatedPopoutLeaf).toBe(true);
    expect(popoutWindow.focus).not.toHaveBeenCalled();
    expect(workspace.focusedHostId).toBe("root");
  });

  it("projects compatibility ribbon and reactive status items into the shell controller", async () => {
    const { app, workspace } = createWorkspaceHarness();
    const controller = getWorkspaceHostBinding(workspace).controller;
    const ribbonCallback = vi.fn();
    const removeRibbon = workspace.leftRibbon.addItem({
      id: "roles:Open Applications",
      icon: "briefcase-business",
      title: "Open Applications",
      hidden: false,
      callback: ribbonCallback,
    });

    const ribbon = controller.ribbon.items.find(
      (item) => item.id === "roles:Open Applications",
    );
    expect(ribbon).toMatchObject({
      side: "left",
      label: "Open Applications",
      icon: "briefcase-business",
    });
    await ribbon?.onSelect(new MouseEvent("click"));
    expect(ribbonCallback).toHaveBeenCalledOnce();

    const removeStatus = app.statusBar.registerItem({
      id: "roles:actions-attention",
      text: "1",
      segments: ["1 due", "actions"],
      icon: "bell",
      tooltip: "Open Role Actions (1 due)",
      command: "roles:open-actions",
      alignment: "right",
      priority: 80,
      buildMenu: (menu) => {
        menu.addItem((item) => item.setTitle("1 min read"));
      },
    });
    const projectedStatus = controller.status.items.find(
      (item) => item.id === "roles:actions-attention",
    );
    expect(projectedStatus).toMatchObject({
      align: "right",
      label: "1",
      segments: ["1 due", "actions"],
      icon: "bell",
    });
    expect(projectedStatus?.buildMenu).toEqual(expect.any(Function));
    const projectedMenu = {
      entries: [] as { title?: string }[],
      addItem(
        callback: (item: {
          setTitle(title: string): unknown;
          setDisabled(): unknown;
          setSection(): unknown;
          onClick(): unknown;
          setIcon(): unknown;
          setChecked(): unknown;
        }) => void,
      ) {
        const entry: { title?: string } = {};
        callback({
          setTitle(title) {
            entry.title = title;
            return this;
          },
          setDisabled() {
            return this;
          },
          setSection() {
            return this;
          },
          onClick() {
            return this;
          },
          setIcon() {
            return this;
          },
          setChecked() {
            return this;
          },
        });
        this.entries.push(entry);
      },
      addSeparator() {},
      addMenu() {},
    };
    projectedStatus?.buildMenu?.(projectedMenu as never);
    expect(projectedMenu.entries).toEqual(
      expect.arrayContaining([{ title: "1 min read" }]),
    );

    app.statusBar.upsertItem({
      id: "roles:actions-attention",
      text: "2",
      segments: ["2"],
    });
    const updated = controller.status.items.find(
      (item) => item.id === "roles:actions-attention",
    );
    expect(updated?.segments).toEqual(["2"]);
    await updated?.onSelect?.();
    expect(app.commands.executeCommand).toHaveBeenCalledWith(
      "roles:open-actions",
    );

    removeStatus();
    removeRibbon();
    expect(
      controller.status.items.some(
        (item) => item.id === "roles:actions-attention",
      ),
    ).toBe(false);
    expect(
      controller.ribbon.items.some(
        (item) => item.id === "roles:Open Applications",
      ),
    ).toBe(false);
  });

  it("closes a leaf and selects a sensible fallback", () => {
    const { workspace } = createWorkspaceHarness();

    const firstLeaf = workspace.getLeaf();
    const secondLeaf = workspace.getLeaf("tab");
    workspace.activateLeaf(secondLeaf, { saveLayout: false });

    const nextLeaf = workspace.closeLeafAndSelectFallback(secondLeaf, {
      saveLayout: false,
    });

    expect(nextLeaf).toBe(firstLeaf);
    expect(workspace.activeLeaf).toBe(firstLeaf);

    const finalLeaf = workspace.closeLeafAndSelectFallback(firstLeaf, {
      saveLayout: false,
    });

    expect(finalLeaf).toBeNull();
    expect(workspace.activeLeaf).toBeNull();
  });
});
