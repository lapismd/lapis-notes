import { beforeEach, describe, expect, it } from "vitest";
import type { App } from "../context.svelte";
import { ContextKeyService } from "../context-keys.svelte";
import { EventDispatcher } from "../events";
import type { LapisExtensionManifest } from "../lapis-extension";
import { Plugin } from "../plugin";
import type {
  PluginAssetServer,
  PluginAssetUrlRequest,
} from "../plugin-asset-server";
import type { HostedPluginCapability } from "../plugin-capability-facade";
import {
  NativeDesktopCommunityPluginExecutionHost,
  PluginManager,
  type CommunityPluginEvaluationRequest,
  type CommunityPluginExecutionHost,
  type PluginManagerOptions,
} from "../plugin-manager";
import { StatusBarManager } from "../status-bar.svelte";
import { Vault } from "../storage";
import {
  setNativeDesktopBridge,
  type NativeDesktopBridge,
} from "../storage/desktop-native";
import { InMemoryDataAdapter } from "./data-adapter-conformance";


async function waitForAsyncPluginDataSync(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function createTestApp(
  options: PluginManagerOptions = {},
  state: { workspaceTrusted?: boolean } = {},
) {
  const adapter = new InMemoryDataAdapter();
  const vault = new Vault(adapter);
  const workspaceTrustEvents = new EventDispatcher<{
    changed: [
      state: { trusted: boolean; identity: string; updatedAt: number | null },
    ];
    requested: [
      request: {
        reason?: string;
        pluginId?: string | null;
        capability?: string | null;
      },
    ];
  }>();
  let workspaceTrusted = state.workspaceTrusted ?? true;
  const workspaceTrust = {
    get trusted() {
      return workspaceTrusted;
    },
    getState() {
      return {
        trusted: workspaceTrusted,
        identity: "adapter:memory",
        updatedAt: null,
      };
    },
    async ready() {
      return this.getState();
    },
    async grant() {
      workspaceTrusted = true;
      const next = this.getState();
      workspaceTrustEvents.emit("changed", next);
      return next;
    },
    async revoke() {
      workspaceTrusted = false;
      const next = this.getState();
      workspaceTrustEvents.emit("changed", next);
      return next;
    },
    async request(
      request: {
        reason?: string;
        pluginId?: string | null;
        capability?: string | null;
      } = {},
    ) {
      if (workspaceTrusted) {
        return true;
      }
      workspaceTrustEvents.emit("requested", {
        reason: request.reason,
        pluginId: request.pluginId ?? null,
        capability: request.capability ?? null,
      });
      return false;
    },
    on: workspaceTrustEvents.on.bind(workspaceTrustEvents),
    offref: workspaceTrustEvents.offref.bind(workspaceTrustEvents),
  };
  const commands = {
    commands: {} as Record<
      string,
      {
        id: string;
        name?: string;
        callback?: (...rest: unknown[]) => unknown;
        checkCallback?: (checking: boolean) => unknown;
      }
    >,
    registerCommand(command: {
      id: string;
      name?: string;
      callback?: (...rest: unknown[]) => unknown;
      checkCallback?: (checking: boolean) => unknown;
    }) {
      this.commands[command.id] = command;
    },
    getCommand(id: string) {
      return this.commands[id] ?? null;
    },
    unregisterCommand(id: string) {
      delete this.commands[id];
      return true;
    },
    async executeCommand(id: string, ...args: unknown[]) {
      const command = this.commands[id];
      if (!command) {
        throw new Error(`Invalid command: ${id}`);
      }
      if (command.checkCallback) {
        if (!command.checkCallback(true)) {
          throw new Error(`Command not available: ${id}`);
        }
        return command.checkCallback(false);
      }
      if (command.callback) {
        return command.callback(...args);
      }
      throw new Error(`Invalid command: ${id}`);
    },
    registerGlobalDeclaration() {
      return () => {};
    },
  };
  const registeredSchemas: unknown[] = [];
  const configurationEvents = new EventDispatcher<{
    "plugin-data-updated": [
      {
        pluginId: string;
        value: unknown;
        prev: unknown;
        origin: string;
      },
    ];
  }>();
  const pluginData = new Map<string, unknown>();
  const configuration = {
    schema: {
      registeredSchemas,
      register(...schemas: unknown[]) {
        registeredSchemas.push(...schemas);
      },
      unregister(...schemas: unknown[]) {
        for (const schema of schemas) {
          const index = registeredSchemas.indexOf(schema);
          if (index !== -1) {
            registeredSchemas.splice(index, 1);
          }
        }
      },
      registerWebView() {},
      removeWebView() {},
      getConfiguration() {
        return {
          get(_key: string, defaultValue?: unknown) {
            return defaultValue;
          },
        };
      },
    },
    async materializeSchemaDefaults() {},
    getConfiguration() {
      return {
        get(_key: string, defaultValue?: unknown) {
          return defaultValue;
        },
        update() {},
      };
    },
    on: configurationEvents.on.bind(configurationEvents),
    offref: configurationEvents.offref.bind(configurationEvents),
    hasPluginData(pluginId: string) {
      return pluginData.has(pluginId);
    },
    getPluginData(pluginId: string) {
      return pluginData.has(pluginId) ? pluginData.get(pluginId) : null;
    },
    async updatePluginData(
      pluginId: string,
      value: unknown,
      options: { origin?: string } = {},
    ) {
      const prev = pluginData.has(pluginId)
        ? pluginData.get(pluginId)
        : undefined;
      pluginData.set(pluginId, value);
      configurationEvents.emit("plugin-data-updated", {
        pluginId,
        value,
        prev,
        origin: options.origin ?? "configuration-update",
      });
    },
    async removePluginData(
      pluginId: string,
      options: { origin?: string } = {},
    ) {
      const prev = pluginData.has(pluginId)
        ? pluginData.get(pluginId)
        : undefined;
      pluginData.delete(pluginId);
      configurationEvents.emit("plugin-data-updated", {
        pluginId,
        value: undefined,
        prev,
        origin: options.origin ?? "configuration-update",
      });
    },
  };
  const languageServices = {
    providers: {} as Record<string, any>,
    registerProvider(provider: {
      metadata: { id: string };
      dispose?: () => void;
    }) {
      if (this.providers[provider.metadata.id]) {
        throw new Error(
          `Language service provider ${provider.metadata.id} is already registered`,
        );
      }
      this.providers[provider.metadata.id] = provider;
      return () => {
        delete this.providers[provider.metadata.id];
        provider.dispose?.();
      };
    },
    registerGlobalDeclaration() {
      return () => {};
    },
  };
  const workspaceEvents = new EventDispatcher();
  const metadataCacheEvents = new EventDispatcher();
  const notificationEvents = new EventDispatcher();

  const app = {
    version: "1.10.0",
    vault,
    commands,
    telemetry: {
      measureAsync: async <T>(
        _name: string,
        callback: (span: {
          setAttribute: (...args: unknown[]) => void;
        }) => Promise<T>,
      ) => callback({ setAttribute() {} }),
      measure: <T>(
        _name: string,
        callback: (span: { setAttribute: (...args: unknown[]) => void }) => T,
      ) => callback({ setAttribute() {} }),
      startSpan() {
        return {
          setAttribute() {},
          end() {},
          recordException() {},
          setStatus() {},
        };
      },
      recordEvent() {},
      getConfiguration() {
        return {
          enabled: false,
          debugLogging: false,
          webVitals: false,
          persistDiagnostics: false,
          sampleRate: 1,
          slowSpanThresholdMs: 50,
          otlpEndpoint: "",
        };
      },
      async configure() {},
      async clearDiagnostics() {},
    },
    workspace: {
      leaves: [] as Array<{
        view: { getViewType(): string };
      }>,
      viewCreators: new Map<string, unknown>(),
      on: workspaceEvents.on.bind(workspaceEvents),
      offref: workspaceEvents.offref.bind(workspaceEvents),
      editorViews: new Map<string, unknown>(),
      registerView(type: string, creator: unknown) {
        this.viewCreators.set(type, creator);
      },
      unregisterView(type: string) {
        this.viewCreators.delete(type);
      },
      registerEditorView(contribution: { id: string }) {
        this.editorViews.set(contribution.id, contribution);
        return () => {
          this.editorViews.delete(contribution.id);
        };
      },
      registerExtensions() {},
      unregisterExtensions() {},
      updateOptions() {},
      onLayoutReady(callback: () => void) {
        callback();
      },
      getLeavesOfType(type: string) {
        return this.leaves.filter(
          (leaf) => leaf.view.getViewType() === type,
        );
      },
      iterateAllLeaves(callback: (leaf: unknown) => unknown) {
        for (const leaf of this.leaves) callback(leaf);
      },
      revealLeaf() {},
      getLeaf() {
        return {
          setViewState: async () => {},
          openFile: async () => {},
        };
      },
      leftRibbon: {
        addItem() {
          return () => {};
        },
      },
    },
    metadataCache: {
      on: metadataCacheEvents.on.bind(metadataCacheEvents),
      offref: metadataCacheEvents.offref.bind(metadataCacheEvents),
      addProcessor() {},
      removeProcessor() {},
      getFirstLinkpathDest() {
        return null;
      },
    },
    embedRegistry: {
      register() {
        return () => {};
      },
      unregister() {},
      get() {
        return null;
      },
    },
    metadataTypeManager: {
      registeredTypeWidgets: {},
      setType() {},
      registerTypeWidget() {},
      unregisterTypeWidget() {},
    },
    registerEditorSuggest() {},
    unregisterEditorSuggest() {},
    registerEditorExtension() {},
    unregisterEditorExtension() {},
    registerMarkdownPostProcessor() {},
    unregisterMarkdownPostProcessor() {},
    registerMarkdownCodeBlockProcessor() {},
    unregisterMarkdownCodeBlockProcessor() {},
    registerMarkdownDirectiveRenderer() {},
    unregisterMarkdownDirectiveRenderer() {},
    registerMarkdownViewMenuItem() {},
    unregisterMarkdownViewMenuItem() {},
    configuration,
    contextKeys: new ContextKeyService(),
    statusBar: new StatusBarManager(),
    notifications: {
      records: [],
      activeProgress: [],
      on: notificationEvents.on.bind(notificationEvents),
      offref: notificationEvents.offref.bind(notificationEvents),
      async loadPersisted() {},
      async withProgress(
        _options: unknown,
        task: (
          progress: {
            report: () => void;
            complete: () => void;
            fail: () => void;
            cancelled: () => void;
            throwIfCancellationRequested: () => void;
            signal: AbortSignal;
          },
          token: {
            throwIfCancellationRequested: () => void;
            signal: AbortSignal;
          },
        ) => Promise<unknown>,
      ) {
        const controller = new AbortController();
        const progress = {
          report() {},
          complete() {},
          fail() {},
          cancelled() {},
          throwIfCancellationRequested() {},
          signal: controller.signal,
        };
        return task(progress, progress);
      },
      async clear() {},
      async clearAll() {},
      async markRead() {},
      async cancel() {},
    },
    languageServices,
    workspaceTrust,
    fileManager: {
      getAvailablePathForAttachment(path: string) {
        return path;
      },
    },
    setting() {
      return {
        addItem(callback?: (item: any) => void) {
          callback?.({
            setTitle() {
              return this;
            },
            setId() {
              return this;
            },
            setTab() {
              return this;
            },
          });
        },
        removeItem() {},
      };
    },
  } as unknown as App;

  const plugins = new PluginManager(
    app,
    "/.obsidian/plugins",
    adapter,
    options,
  );
  (app as App & { plugins: PluginManager }).plugins = plugins;
  plugins.registerDependencies({
    obsidian: { Plugin },
    "@lapis-notes/api": { Plugin },
  });

  return {
    app: app as App & {
      commands: typeof commands;
      configuration: typeof configuration;
      languageServices: typeof languageServices;
      plugins: PluginManager;
      workspaceTrust: typeof workspaceTrust;
    },
    adapter,
  };
}

async function seedCommunityPlugin(
  app: App,
  pluginId: string,
  mainJs: string,
  manifest: Partial<{
    name: string;
    author: string;
    version: string;
    description: string;
    minAppVersion: string;
    isDesktopOnly: boolean;
    supportedRuntimes: string[];
    requiredCapabilities: HostedPluginCapability[];
    lapis: LapisExtensionManifest | Record<string, unknown>;
  }> = {},
) {
  const pluginPath = `/.obsidian/plugins/${pluginId}`;
  await app.vault.mkpath(pluginPath);
  await app.vault.create(
    `${pluginPath}/manifest.json`,
    JSON.stringify(
      {
        id: pluginId,
        name: manifest.name ?? pluginId,
        author: manifest.author ?? "test",
        version: manifest.version ?? "1.0.0",
        description: manifest.description ?? "",
        minAppVersion: manifest.minAppVersion ?? "0.0.0",
        isDesktopOnly: manifest.isDesktopOnly ?? false,
        supportedRuntimes: manifest.supportedRuntimes,
        requiredCapabilities: manifest.requiredCapabilities,
        lapis: manifest.lapis,
      },
      null,
      2,
    ),
  );
  await app.vault.create(`${pluginPath}/main.js`, mainJs);
}

async function seedCommunityPluginFiles(
  app: App,
  pluginId: string,
  files: Record<string, string>,
  manifest: Partial<{
    name: string;
    author: string;
    version: string;
    description: string;
    minAppVersion: string;
    isDesktopOnly: boolean;
    supportedRuntimes: string[];
    requiredCapabilities: HostedPluginCapability[];
    lapis: LapisExtensionManifest | Record<string, unknown>;
  }> = {},
) {
  const pluginPath = `/.obsidian/plugins/${pluginId}`;
  await app.vault.mkpath(pluginPath);
  await app.vault.create(
    `${pluginPath}/manifest.json`,
    JSON.stringify(
      {
        id: pluginId,
        name: manifest.name ?? pluginId,
        author: manifest.author ?? "test",
        version: manifest.version ?? "1.0.0",
        description: manifest.description ?? "",
        minAppVersion: manifest.minAppVersion ?? "0.0.0",
        isDesktopOnly: manifest.isDesktopOnly ?? false,
        supportedRuntimes: manifest.supportedRuntimes,
        requiredCapabilities: manifest.requiredCapabilities,
        lapis: manifest.lapis,
      },
      null,
      2,
    ),
  );
  for (const [relativePath, content] of Object.entries(files)) {
    const parentPath = relativePath.split("/").slice(0, -1).join("/");
    if (parentPath) {
      await app.vault.mkpath(`${pluginPath}/${parentPath}`);
    }
    await app.vault.create(`${pluginPath}/${relativePath}`, content);
  }
}

async function seedInstalledPluginRecord(
  app: App,
  pluginId: string,
  provenance: "official" | "community" | "manual" = "official",
): Promise<void> {
  const now = new Date(0).toISOString();
  await app.vault.create(
    "/.obsidian/installed-plugins.json",
    JSON.stringify(
      {
        schemaVersion: 1,
        updatedAt: now,
        plugins: {
          [pluginId]: {
            pluginId,
            installedVersion: "1.0.0",
            installedAt: now,
            updatedAt: now,
            provenance,
            files: [],
          },
        },
      },
      null,
      2,
    ),
  );
}

type TestPluginAssetServer = PluginAssetServer & {
  requests: PluginAssetUrlRequest[];
};

function createModuleDataUrl(source: string, sourceName: string): string {
  const sanitizedSourceName = sourceName.replace(/[^a-zA-Z0-9_.-]/g, "-");
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(
    `${source}\n//# sourceURL=${sanitizedSourceName}`,
  )}`;
}

function createTestPluginAssetServer(
  modules: Record<string, string>,
): TestPluginAssetServer {
  const requests: PluginAssetUrlRequest[] = [];
  return {
    requests,
    getPluginAssetUrl(request) {
      requests.push(request);
      const source =
        modules[`${request.pluginId}/${request.relativePath}`] ??
        modules[request.relativePath];
      if (source === undefined) {
        throw new Error(
          `Missing test plugin asset module ${request.pluginId}/${request.relativePath}`,
        );
      }
      return createModuleDataUrl(
        source,
        `${request.pluginId}-${request.relativePath}`,
      );
    },
  };
}

type TestElement = {
  id: string;
  textContent: string | null;
  children: TestElement[];
  style: Record<string, string>;
  classList: {
    add: (...classNames: string[]) => void;
    remove: (...classNames: string[]) => void;
    contains: (className: string) => boolean;
  };
  createDiv: () => TestElement;
  detach: () => void;
  addEventListener: () => void;
  removeEventListener: () => void;
  append: (...children: TestElement[]) => void;
  prepend: (...children: TestElement[]) => void;
  appendChild: (child: TestElement) => TestElement;
  removeChild: (child: TestElement) => TestElement;
  replaceChildren: (...children: TestElement[]) => void;
};

let styleElements: Map<string, TestElement>;

function createFakeElement(): TestElement {
  const children: TestElement[] = [];
  const element: TestElement = {
    id: "",
    textContent: "",
    children,
    style: {},
    classList: {
      add() {},
      remove() {},
      contains: () => false,
    },
    detach() {
      if (element.id) {
        styleElements.delete(`#${element.id}`);
      }
    },
    addEventListener() {},
    removeEventListener() {},
    append(...nextChildren: TestElement[]) {
      element.children.push(...nextChildren);
    },
    prepend(...nextChildren: TestElement[]) {
      element.children.unshift(...nextChildren);
    },
    appendChild(child: TestElement) {
      element.children.push(child);
      return child;
    },
    removeChild(child: TestElement) {
      element.children = element.children.filter(
        (candidate) => candidate !== child,
      );
      return child;
    },
    replaceChildren(...nextChildren: TestElement[]) {
      element.children = nextChildren;
    },
    createDiv() {
      return createFakeElement();
    },
  };
  return element;
}

function getPluginStyle(pluginId: string): HTMLStyleElement | undefined {
  return styleElements.get(
    `#plugin-css-${pluginId}`,
  ) as unknown as HTMLStyleElement;
}

describe("PluginManager", () => {
  beforeEach(() => {
    setNativeDesktopBridge(null);
    styleElements = new Map();

    const body = createFakeElement();
    const statusBar = createFakeElement();
    globalThis.createDiv = () =>
      createFakeElement() as unknown as HTMLDivElement;
    globalThis.document = {
      createElement: () => createFakeElement(),
      createTextNode: () => createFakeElement(),
      createComment: () => createFakeElement(),
      createDocumentFragment: () => createFakeElement(),
      getElementById: (id: string) => (id === "status-bar" ? statusBar : null),
      querySelector: (selector: string) =>
        selector === "#status-bar"
          ? statusBar
          : (styleElements.get(selector) ?? null),
      addEventListener() {},
      removeEventListener() {},
      body,
      baseURI: "http://localhost/",
      currentScript: null,
      head: {
        appendChild(element: TestElement) {
          if (element.id) {
            styleElements.set(`#${element.id}`, element);
          }
          return element;
        },
        prepend() {},
      },
      documentElement: {
        classList: {
          contains: () => false,
        },
        style: {},
      },
    } as unknown as Document;
    globalThis.window = {
      document: globalThis.document,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
    } as any;
    globalThis.getComputedStyle = () =>
      ({
        backgroundColor: "rgb(255, 255, 255)",
      }) as CSSStyleDeclaration;
    const localStorageItems = new Map<string, string>();
    globalThis.localStorage = {
      get length() {
        return localStorageItems.size;
      },
      clear() {
        localStorageItems.clear();
      },
      getItem(key: string) {
        return localStorageItems.get(key) ?? null;
      },
      key(index: number) {
        return [...localStorageItems.keys()][index] ?? null;
      },
      removeItem(key: string) {
        localStorageItems.delete(key);
      },
      setItem(key: string, value: string) {
        localStorageItems.set(key, value);
      },
    } as Storage;
    globalThis.Worker = class Worker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      constructor() {}
      addEventListener() {}
      removeEventListener() {}
      postMessage() {}
      terminate() {}
    } as unknown as typeof Worker;
  });

  it("keeps boot moving when a bundled plugin fails to enable", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    class BrokenCorePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "broken-core",
          name: "Broken Core",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      async onload() {
        this.addCommand({
          id: "explode",
          name: "Explode",
          callback: () => true,
        });
        throw new Error("boom");
      }
    }

    class HealthyCorePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "healthy-core",
          name: "Healthy Core",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {
        this.addCommand({
          id: "healthy",
          name: "Healthy",
          callback: () => true,
        });
      }
    }

    app.plugins.registerCorePlugins([BrokenCorePlugin, HealthyCorePlugin]);
    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("healthy-core")?.enabled).toBe(true);
    expect(app.plugins.plugins.get("broken-core")?.state).toBe("failed");
    expect(app.commands.commands["healthy-core:healthy"]).toBeDefined();
    expect(app.commands.commands["broken-core:explode"]).toBeUndefined();
  });

  it("loads bundled core plugin CSS on enable and removes it on disable", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    class StyledCorePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "styled-core",
          name: "Styled Core",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {}
    }

    app.plugins.registerCorePlugins([
      {
        plugin: StyledCorePlugin,
        styles: ".styled-core { color: rebeccapurple; }",
      },
    ]);

    await app.plugins.loadPlugins();

    expect(getPluginStyle("styled-core")?.textContent).toContain(
      "color: rebeccapurple",
    );

    await app.plugins.disablePlugin("styled-core");

    expect(getPluginStyle("styled-core")).toBeUndefined();
  });

  it("waits for configured community plugins before emitting plugins-loaded", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "delayed-community",
      `module.exports = class DelayedCommunityPlugin extends require("obsidian").Plugin {
        async onload() {
          await new Promise((resolve) => setTimeout(resolve, 0));
          this.addCommand({
            id: "ready",
            name: "Ready",
            callback() {
              return true;
            }
          });
        }
      }`,
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["delayed-community"], null, 2),
    );
    app.plugins.registerDependencies({ obsidian: { Plugin } });

    let enabledAtLoadedEvent = false;
    app.plugins.on("plugins-loaded", () => {
      const plugin = app.plugins.plugins.get("delayed-community");
      enabledAtLoadedEvent = plugin?.enabled === true;
    });

    await app.plugins.loadPlugins();

    expect(enabledAtLoadedEvent).toBe(true);
    expect(app.plugins.plugins.get("delayed-community")?.enabled).toBe(true);
    expect(app.commands.commands["delayed-community:ready"]).toBeDefined();
  });

  it("loads multi-file CommonJS community plugins with relative chunks", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    await seedCommunityPluginFiles(app, "chunked-community", {
      "main.js": `module.exports = require("./runtime-chunk.cjs").ChunkedCommunityPlugin;`,
      "runtime-chunk.cjs": `
        const { Plugin } = require("@lapis-notes/api");
        class ChunkedCommunityPlugin extends Plugin {
          async onload() {
            this.addCommand({
              id: "chunked-ready",
              name: "Chunked Ready",
              callback() {
                return "loaded";
              }
            });
          }
        }
        module.exports = { ChunkedCommunityPlugin };
      `,
    });
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["chunked-community"], null, 2),
    );
    app.plugins.registerDependencies({
      obsidian: { Plugin },
      "@lapis-notes/api": { Plugin },
    });

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("chunked-community")?.enabled).toBe(true);
    await expect(
      app.commands.executeCommand("chunked-community:chunked-ready"),
    ).resolves.toBe("loaded");
  });

  it("loads recursive CommonJS local module graphs with directory indexes", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    await seedCommunityPluginFiles(app, "recursive-graph-community", {
      "main.js": `module.exports = require("./lib").default;`,
      "lib/index.js": `
        const { answer } = require("./nested/helper.mjs");
        const { Plugin } = require("obsidian");
        class RecursiveGraphCommunityPlugin extends Plugin {
          async onload() {
            this.addCommand({
              id: "recursive-ready",
              name: "Recursive Ready",
              callback() {
                return answer;
              }
            });
          }
        }
        module.exports = { default: RecursiveGraphCommunityPlugin };
      `,
      "lib/nested/helper.mjs": `exports.answer = "recursive-local-graph";`,
    });
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["recursive-graph-community"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("recursive-graph-community")?.enabled).toBe(
      true,
    );
    await expect(
      app.commands.executeCommand("recursive-graph-community:recursive-ready"),
    ).resolves.toBe("recursive-local-graph");
  });

  it("normalizes allowed scoped CommonJS dependency suffixes", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "scoped-suffix-community",
      `
        const { Plugin } = require("@lapis-notes/api/index.js");
        module.exports = class ScopedSuffixCommunityPlugin extends Plugin {
          async onload() {
            const pluginId = this.manifest.id;
            this.addCommand({
              id: "scoped-suffix-ready",
              name: "Scoped Suffix Ready",
              callback() {
                return pluginId;
              }
            });
          }
        };
      `,
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["scoped-suffix-community"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("scoped-suffix-community")?.enabled).toBe(
      true,
    );
    await expect(
      app.commands.executeCommand(
        "scoped-suffix-community:scoped-suffix-ready",
      ),
    ).resolves.toBe("scoped-suffix-community");
  });



  it("classifies installed official plugins as external core plugins while preserving community enablement config", async () => {
    const { app, adapter } = createTestApp();
    const pluginId = "lapis-official-test";
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      pluginId,
      `
        const { Plugin } = require("@lapis-notes/api");
        module.exports = class OfficialPlugin extends Plugin {
          onload() {
            this.addCommand({
              id: "ready",
              name: "Ready",
              callback() {
                return "official";
              }
            });
          }
        };
      `,
    );
    await seedInstalledPluginRecord(app, pluginId, "official");
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify([pluginId], null, 2),
    );

    await app.plugins.loadPlugins({ communityPlugins: "disabled" });

    const plugin = app.plugins.plugins.get(pluginId);
    expect(plugin?.source).toBe("official");
    expect(plugin?.provenance).toBe("official");
    expect(plugin?.enabled).toBe(true);
    expect(
      app.plugins.communityPlugins.map((entry) => entry.manifest.id),
    ).toEqual([]);
    expect(
      app.plugins.corePluginEntries.map((entry) => entry.manifest.id),
    ).toContain(pluginId);
    expect(app.plugins.getCommunityPluginDiagnostics(pluginId)).toMatchObject({
      source: "official",
      provenance: "official",
      state: "enabled",
    });
    await expect(
      app.commands.executeCommand(`${pluginId}:ready`),
    ).resolves.toBe("official");

    await expect(app.plugins.disablePlugin(pluginId)).resolves.toBe(true);
    await (
      app.plugins as unknown as {
        saveCommunityPluginState: { flush?: () => Promise<void> | void };
      }
    ).saveCommunityPluginState.flush?.();

    expect(
      JSON.parse(await adapter.read("/.obsidian/community-plugins.json")),
    ).toEqual([]);
  });

  it("disables installed official plugins with optional-core Safe Mode", async () => {
    const { app } = createTestApp();
    const pluginId = "lapis-official-safe-mode";
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      pluginId,
      `
        const { Plugin } = require("@lapis-notes/api");
        module.exports = class OfficialPlugin extends Plugin {
          onload() {
            this.addCommand({
              id: "ready",
              name: "Ready",
              callback() {
                return true;
              }
            });
          }
        };
      `,
    );
    await seedInstalledPluginRecord(app, pluginId, "official");
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify([pluginId], null, 2),
    );

    await app.plugins.loadPlugins({
      communityPlugins: "configured",
      optionalCorePlugins: "disabled",
    });

    expect(app.plugins.plugins.get(pluginId)?.source).toBe("official");
    expect(app.plugins.plugins.get(pluginId)?.enabled).toBe(false);
    expect(app.plugins.communityPlugins).toEqual([]);
    expect(
      app.plugins.corePluginEntries.find(
        (entry) => entry.manifest.id === pluginId,
      ),
    ).toMatchObject({
      enabled: false,
      source: "official",
      provenance: "official",
    });
  });



  it("loads community plugins through the configured execution host", async () => {
    const requests: CommunityPluginEvaluationRequest[] = [];

    class HostedCommunityPlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "hosted-community",
          name: "Hosted Community",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {
        this.addCommand({
          id: "hosted-ready",
          name: "Hosted Ready",
          callback: () => true,
        });
      }
    }

    const host: CommunityPluginExecutionHost = {
      id: "test-host",
      async evaluate(request) {
        requests.push(request);
        return HostedCommunityPlugin;
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "hosted-community",
      "throw new Error('renderer evaluator should not run');",
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["hosted-community"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      pluginId: "hosted-community",
      pluginPath: "/.obsidian/plugins/hosted-community",
      modulePath: "/.obsidian/plugins/hosted-community/main.js",
    });
    expect(app.plugins.plugins.get("hosted-community")?.enabled).toBe(true);
    expect(
      app.commands.commands["hosted-community:hosted-ready"],
    ).toBeDefined();
  });

  it("classifies and indexes Lapis contributions before evaluating plugin code", async () => {
    let indexedBeforeEvaluation = false;

    class IndexedHybridPlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "indexed-hybrid",
          name: "Indexed Hybrid",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {}
    }

    const host: CommunityPluginExecutionHost = {
      id: "electron-plugin-sidecar",
      async evaluate() {
        const indexed = app.plugins.getLapisExtension("indexed-hybrid");
        indexedBeforeEvaluation =
          indexed?.classification === "hybrid" &&
          indexed.contributions.some(
            (entry) =>
              entry.kind === "commands" && entry.id === "indexed.ready",
          );
        return IndexedHybridPlugin;
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "indexed-hybrid",
      "throw new Error('host should supply the plugin class');",
      {
        requiredCapabilities: ["vault:read"],
        lapis: {
          manifestVersion: 1,
          permissions: ["commands", "vault.read"],
          contributes: {
            commands: [
              {
                command: "indexed.ready",
                title: "Indexed Ready",
              },
            ],
          },
        },
      },
    );

    await app.plugins.loadPlugins();

    expect(indexedBeforeEvaluation).toBe(true);
    expect(app.plugins.getLapisExtension("indexed-hybrid")).toMatchObject({
      pluginId: "indexed-hybrid",
      classification: "hybrid",
      requestedCapabilities: ["vault:read", "commands"],
      grantedCapabilities: [
        "vault:read",
        "vault:write",
        "plugin:data",
        "commands",
        "notices",
        "settings",
        "metadata:query",
        "events",
        "logging",
      ],
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("indexed-hybrid"),
    ).toMatchObject({
      author: "test",
      activationMode: "code",
      classification: "hybrid",
      description: "",
      indexedContributionCount: 1,
      selectedRuntimeEntry: "main.js",
      version: "1.0.0",
    });
  });

  it("installs declarative configuration when hybrid Lapis plugins enable", async () => {
    class HybridConfigPlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "hybrid-config",
          name: "Hybrid Config",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {}
    }

    const host: CommunityPluginExecutionHost = {
      id: "electron-plugin-sidecar",
      async evaluate() {
        return HybridConfigPlugin;
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "hybrid-config",
      "throw new Error('host should supply the plugin class');",
      {
        lapis: {
          manifestVersion: 1,
          permissions: ["commands", "settings.read"],
          contributes: {
            configuration: [
              {
                id: "hybrid-config",
                title: "Hybrid Config",
                properties: {
                  enabled: {
                    type: "boolean",
                    default: true,
                  },
                },
              },
            ],
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["hybrid-config"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("hybrid-config")?.enabled).toBe(true);
    expect(app.configuration.schema.registeredSchemas).toHaveLength(1);
    expect(
      app.plugins.getCommunityPluginDiagnostics("hybrid-config"),
    ).toMatchObject({
      activationMode: "code",
      classification: "hybrid",
      state: "enabled",
    });

    await app.plugins.disablePlugin("hybrid-config");

    expect(app.configuration.schema.registeredSchemas).toHaveLength(0);
    expect(
      app.plugins.getCommunityPluginDiagnostics("hybrid-config"),
    ).toMatchObject({
      activationMode: "code",
      state: "disabled",
    });
  });

  it("registers declarative configuration once for enabled hybrid core plugins", async () => {
    class HybridCoreConfigPlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "hybrid-core-config",
          name: "Hybrid Core Config",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
          lapis: {
            manifestVersion: 1,
            source: "bundled",
            contributes: {
              configuration: [
                {
                  id: "hybrid-core-config",
                  title: "Hybrid Core Config",
                  properties: {
                    enabled: {
                      type: "boolean",
                      default: true,
                    },
                  },
                },
              ],
            },
          },
        });
      }

      onload() {}
    }

    const { app } = createTestApp();
    await app.vault.load();
    app.plugins.registerCorePlugins([HybridCoreConfigPlugin]);
    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("hybrid-core-config")?.enabled).toBe(true);
    expect(app.configuration.schema.registeredSchemas).toHaveLength(1);
    expect(app.plugins.getLapisExtension("hybrid-core-config")).toMatchObject({
      classification: "hybrid",
    });
  });

  it("registers declarative configuration for disabled hybrid core plugins", async () => {
    class HybridCoreConfigPlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "hybrid-core-config",
          name: "Hybrid Core Config",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
          lapis: {
            manifestVersion: 1,
            source: "bundled",
            contributes: {
              configuration: [
                {
                  id: "hybrid-core-config",
                  title: "Hybrid Core Config",
                  properties: {
                    enabled: {
                      type: "boolean",
                      default: true,
                    },
                  },
                },
              ],
            },
          },
        });
      }

      onload() {}
    }

    const { app } = createTestApp();
    await app.vault.load();
    app.plugins.registerCorePlugins([
      { plugin: HybridCoreConfigPlugin, enabledByDefault: false },
    ]);
    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("hybrid-core-config")?.enabled).toBe(false);
    expect(app.configuration.schema.registeredSchemas).toHaveLength(1);
  });

  it("indexes manifest-only Lapis extensions without requiring main.js", async () => {
    const host: CommunityPluginExecutionHost = {
      id: "renderer",
      async evaluate() {
        throw new Error("manifest-only extension should not evaluate code");
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    const pluginPath = "/.obsidian/plugins/manifest-only";
    await app.vault.mkpath(pluginPath);
    await app.vault.create(
      `${pluginPath}/manifest.json`,
      JSON.stringify(
        {
          id: "manifest-only",
          name: "Manifest Only",
          author: "test",
          version: "1.0.0",
          description: "",
          minAppVersion: "0.0.0",
          lapis: {
            manifestVersion: 1,
            contributes: {
              commands: [
                {
                  command: "say-hello",
                  title: "Say Hello",
                },
              ],
              configuration: [
                {
                  id: "manifest-only",
                  title: "Manifest Only",
                  properties: {
                    enabled: {
                      type: "boolean",
                      default: true,
                    },
                  },
                },
              ],
              languages: [
                {
                  id: "lapis-example",
                  extensions: [".lapis"],
                },
              ],
            },
          },
        },
        null,
        2,
      ),
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["manifest-only"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.has("manifest-only")).toBe(false);
    expect(app.plugins.getLapisExtension("manifest-only")).toMatchObject({
      pluginId: "manifest-only",
      classification: "lapis-extension",
      enabled: true,
    });
    expect(
      app.plugins.getLapisExtension("manifest-only")?.contributions,
    ).toHaveLength(3);
    expect(app.commands.commands["manifest-only:say-hello"]).toMatchObject({
      name: "manifest-only: Say Hello",
    });
    expect(app.configuration.schema.registeredSchemas).toHaveLength(1);
    expect(
      app.plugins.getCommunityPluginDiagnostics("manifest-only"),
    ).toMatchObject({
      activationMode: "manifest-only",
      author: "test",
      classification: "lapis-extension",
      description: "",
      state: "enabled",
      indexedContributionCount: 3,
      selectedRuntimeEntry: null,
      version: "1.0.0",
      contributionDiagnostics: [
        "Contribution languages:lapis-example is indexed but not installed in this phase",
      ],
    });

    await app.plugins.disablePlugin("manifest-only");

    expect(app.commands.commands["manifest-only:say-hello"]).toBeUndefined();
    expect(app.configuration.schema.registeredSchemas).toHaveLength(0);
    expect(
      app.statusBar.getVisibleItems("right", app.contextKeys),
    ).toHaveLength(0);
  });

  it("installs manifest status bar items with ordering and teardown", async () => {
    const host: CommunityPluginExecutionHost = {
      id: "renderer",
      async evaluate() {
        throw new Error(
          "manifest-only status bar extension should not run code",
        );
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    const pluginPath = "/.obsidian/plugins/status-bar-manifest";
    await app.vault.mkpath(pluginPath);
    await app.vault.create(
      `${pluginPath}/manifest.json`,
      JSON.stringify(
        {
          id: "status-bar-manifest",
          name: "Status Bar Manifest",
          author: "test",
          version: "1.0.0",
          description: "",
          minAppVersion: "0.0.0",
          lapis: {
            manifestVersion: 1,
            contributes: {
              commands: [
                {
                  command: "say-hello",
                  title: "Say Hello",
                },
              ],
              statusBarItems: [
                {
                  id: "left-item",
                  text: "Left",
                  alignment: "left",
                  priority: 5,
                },
                {
                  id: "right-item",
                  text: "Right",
                  command: "say-hello",
                  priority: 10,
                  when: "workspace.trusted",
                },
              ],
            },
          },
        },
        null,
        2,
      ),
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["status-bar-manifest"], null, 2),
    );
    app.contextKeys.set("workspace.trusted", true);

    await app.plugins.loadPlugins();

    expect(
      app.statusBar
        .getVisibleItems("left", app.contextKeys)
        .map((item) => item.id),
    ).toEqual(["status-bar-manifest:left-item"]);
    expect(
      app.statusBar.getVisibleItems("right", app.contextKeys),
    ).toMatchObject([
      {
        id: "status-bar-manifest:right-item",
        command: "status-bar-manifest:say-hello",
      },
    ]);

    await app.plugins.disablePlugin("status-bar-manifest");

    expect(app.statusBar.getVisibleItems("left", app.contextKeys)).toHaveLength(
      0,
    );
    expect(
      app.statusBar.getVisibleItems("right", app.contextKeys),
    ).toHaveLength(0);
  });

  it("installs manifest editor views with teardown", async () => {
    const host: CommunityPluginExecutionHost = {
      id: "renderer",
      async evaluate() {
        throw new Error(
          "manifest-only editor view extension should not run code",
        );
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    const pluginPath = "/.obsidian/plugins/editor-view-manifest";
    await app.vault.mkpath(pluginPath);
    await app.vault.create(
      `${pluginPath}/manifest.json`,
      JSON.stringify(
        {
          id: "editor-view-manifest",
          name: "Editor View Manifest",
          author: "test",
          version: "1.0.0",
          description: "",
          minAppVersion: "0.0.0",
          lapis: {
            manifestVersion: 1,
            contributes: {
              editorViews: [
                {
                  id: "editor-view-manifest.preview",
                  viewType: "custom-preview",
                  label: "Custom Preview",
                  filenamePatterns: ["*.ptest"],
                  priority: "option",
                },
              ],
            },
          },
        },
        null,
        2,
      ),
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["editor-view-manifest"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(
      app.workspace.editorViews.get("editor-view-manifest.preview"),
    ).toMatchObject({
      id: "editor-view-manifest.preview",
      viewType: "custom-preview",
      label: "Custom Preview",
      filenamePatterns: ["*.ptest"],
      pluginId: "editor-view-manifest",
      source: "manifest",
    });

    await app.plugins.disablePlugin("editor-view-manifest");

    expect(
      app.workspace.editorViews.get("editor-view-manifest.preview"),
    ).toBeUndefined();
  });

  it("surfaces invalid and unsupported contribution diagnostics without installing them", async () => {
    const host: CommunityPluginExecutionHost = {
      id: "renderer",
      async evaluate() {
        throw new Error(
          "invalid manifest-only extension should not evaluate code",
        );
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    const pluginPath = "/.obsidian/plugins/invalid-contributions";
    await app.vault.mkpath(pluginPath);
    await app.vault.create(
      `${pluginPath}/manifest.json`,
      JSON.stringify(
        {
          id: "invalid-contributions",
          name: "Invalid Contributions",
          author: "test",
          version: "1.0.0",
          description: "",
          minAppVersion: "0.0.0",
          lapis: {
            manifestVersion: 1,
            contributes: {
              commands: [
                {
                  command: "ready",
                  title: "Ready",
                },
                {
                  title: "Missing command",
                },
                {
                  command: "ready",
                  title: "Duplicate Ready",
                },
              ],
              configuration: {
                id: "invalid-config",
              },
              menus: [
                {
                  command: "ready",
                },
              ],
            },
          },
        },
        null,
        2,
      ),
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["invalid-contributions"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(
      app.commands.commands["invalid-contributions:ready"],
    ).toBeUndefined();
    expect(app.configuration.schema.registeredSchemas).toHaveLength(0);
    expect(
      app.plugins.getCommunityPluginDiagnostics("invalid-contributions"),
    ).toMatchObject({
      activationMode: "manifest-only",
      classification: "lapis-extension",
      state: "enabled",
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("invalid-contributions")
        ?.contributionDiagnostics,
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "invalid lapis contribution commands:commands[1]",
        ),
        expect.stringContaining(
          "expected an object with string `command` and `title` fields",
        ),
        expect.stringContaining(
          "invalid lapis contribution configuration:configuration",
        ),
        expect.stringContaining(
          "expected lapis.contributes.configuration to be an array",
        ),
        expect.stringContaining("unsupported lapis.contributes.menus"),
        expect.stringContaining("duplicate lapis contribution commands:ready"),
      ]),
    );
  });

  it("loads lapis extensions from a workspace runtime entry", async () => {
    const requests: CommunityPluginEvaluationRequest[] = [];

    class WorkspaceRuntimePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "workspace-runtime",
          name: "Workspace Runtime",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {}
    }

    const host: CommunityPluginExecutionHost = {
      id: "renderer",
      async evaluate(request) {
        requests.push(request);
        return WorkspaceRuntimePlugin;
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "workspace-runtime",
      {
        "workspace-entry.js":
          "module.exports = class WorkspaceRuntime extends require('obsidian').Plugin {};",
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            workspace: "workspace-entry.js",
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["workspace-runtime"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      pluginId: "workspace-runtime",
      modulePath: "/.obsidian/plugins/workspace-runtime/workspace-entry.js",
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("workspace-runtime"),
    ).toMatchObject({
      activationMode: "code",
      hostMode: "renderer",
      state: "enabled",
    });
  });

  it("loads structured CommonJS runtime entries and records selector diagnostics", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    app.plugins.registerDependencies({
      zod: { marker: "zod-host-module" },
    });
    await seedCommunityPluginFiles(
      app,
      "structured-runtime",
      {
        "structured-runtime.cjs": `
          const zod = require("zod");
          module.exports = class StructuredRuntimePlugin extends require("obsidian").Plugin {
            async onload() {
              this.addCommand({
                id: "structured-ready",
                name: "Structured Ready",
                callback() {
                  return "structured-runtime";
                }
              });
            }
          };
        `,
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            entries: {
              workspace: {
                path: "structured-runtime.cjs",
                format: "commonjs",
                sharedDependencies: [
                  "obsidian",
                  "svelte/internal/client",
                  "not-a-host-module",
                ],
              },
            },
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["structured-runtime"], null, 2),
    );

    await app.plugins.loadPlugins();

    await expect(
      app.commands.executeCommand("structured-runtime:structured-ready"),
    ).resolves.toBe("structured-runtime");
    expect(
      app.plugins.getCommunityPluginDiagnostics("structured-runtime"),
    ).toMatchObject({
      activationMode: "code",
      hostMode: "renderer",
      selectedRuntimeHost: "workspace",
      selectedRuntimeEntry: "structured-runtime.cjs",
      moduleFormat: "commonjs",
      fallbackRuntimeEntry: null,
      fallbackUsed: false,
      requiresReloadOnUpdate: false,
      sharedDependencies: [
        "obsidian",
        "svelte/internal/client",
        "not-a-host-module",
      ],
      usedSharedDependencies: ["obsidian", "zod"],
      undeclaredSharedDependencies: ["zod"],
      missingSharedDependencies: ["not-a-host-module"],
      deprecatedSharedDependencies: ["svelte/internal/client"],
      privateSharedDependencies: ["svelte/internal/client"],
      state: "enabled",
    });
  });

  it("loads structured ESM runtime entries through plugin asset URLs", async () => {
    class EsmRuntimePlugin extends Plugin {
      async onload() {
        this.addCommand({
          id: "esm-ready",
          name: "ESM Ready",
          callback() {
            return "esm-runtime";
          },
        });
      }
    }
    (globalThis as any).__lapisTestEsmRuntimePlugin = EsmRuntimePlugin;
    const pluginAssetServer = createTestPluginAssetServer({
      "esm-runtime/main.mjs":
        "export default globalThis.__lapisTestEsmRuntimePlugin;",
    });
    const { app } = createTestApp({ pluginAssetServer });
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "esm-runtime",
      {
        "main.mjs": "export default globalThis.__lapisTestEsmRuntimePlugin;",
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            entries: {
              workspace: {
                path: "main.mjs",
                format: "esm",
                sharedDependencies: ["obsidian"],
                requiresReloadOnUpdate: true,
              },
            },
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["esm-runtime"], null, 2),
    );

    await app.plugins.loadPlugins();

    await expect(
      app.commands.executeCommand("esm-runtime:esm-ready"),
    ).resolves.toBe("esm-runtime");
    expect(pluginAssetServer.requests).toHaveLength(1);
    expect(pluginAssetServer.requests[0]).toMatchObject({
      pluginId: "esm-runtime",
      pluginPath: "/.obsidian/plugins/esm-runtime",
      relativePath: "main.mjs",
      version: "1.0.0",
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("esm-runtime"),
    ).toMatchObject({
      activationMode: "code",
      hostMode: "renderer",
      selectedRuntimeHost: "workspace",
      selectedRuntimeEntry: "main.mjs",
      moduleFormat: "esm",
      fallbackRuntimeEntry: null,
      fallbackUsed: false,
      requiresReloadOnUpdate: true,
      sharedDependencies: ["obsidian"],
      assetUrlMode: "custom",
      state: "enabled",
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("esm-runtime")?.pluginAssetUrl,
    ).toContain("data:text/javascript");
  });

  it("selects electron renderer ESM entries when plugin assets are available", async () => {
    setNativeDesktopBridge({
      runtime: "electron-desktop",
      capabilities: {
        "plugin-assets": {
          id: "plugin-assets",
          status: "available",
          provider: "test",
        },
      },
      async invoke() {
        return undefined as never;
      },
      toFileUrl(path: string) {
        return `file://${path}`;
      },
    } as NativeDesktopBridge);

    class ElectronRendererRuntimePlugin extends Plugin {
      async onload() {
        this.addCommand({
          id: "renderer-ready",
          name: "Renderer Ready",
          callback() {
            return "electron-renderer-runtime";
          },
        });
      }
    }
    (globalThis as any).__lapisTestElectronRendererPlugin =
      ElectronRendererRuntimePlugin;
    const pluginAssetServer = createTestPluginAssetServer({
      "electron-renderer-runtime/renderer.mjs":
        "export default globalThis.__lapisTestElectronRendererPlugin;",
    });
    const { app } = createTestApp({ pluginAssetServer });
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "electron-renderer-runtime",
      {
        "renderer.mjs":
          "export default globalThis.__lapisTestElectronRendererPlugin;",
        "workspace.cjs": "module.exports = {};",
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            entries: {
              workspace: {
                path: "workspace.cjs",
                format: "commonjs",
              },
              electronRenderer: {
                path: "renderer.mjs",
                format: "esm",
              },
            },
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["electron-renderer-runtime"], null, 2),
    );

    await app.plugins.loadPlugins();

    await expect(
      app.commands.executeCommand("electron-renderer-runtime:renderer-ready"),
    ).resolves.toBe("electron-renderer-runtime");
    expect(pluginAssetServer.requests).toHaveLength(1);
    expect(pluginAssetServer.requests[0]).toMatchObject({
      pluginId: "electron-renderer-runtime",
      relativePath: "renderer.mjs",
      version: "1.0.0",
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("electron-renderer-runtime"),
    ).toMatchObject({
      activationMode: "code",
      hostMode: "renderer",
      selectedRuntimeHost: "electron-renderer",
      selectedRuntimeEntry: "renderer.mjs",
      moduleFormat: "esm",
      state: "enabled",
    });
  });

  it("falls back to CommonJS when an ESM entry declares a fallback", async () => {
    class FallbackRuntimePlugin extends Plugin {
      async onload() {
        this.addCommand({
          id: "fallback-ready",
          name: "Fallback Ready",
          callback() {
            return "commonjs-fallback";
          },
        });
      }
    }
    (globalThis as any).__lapisTestFallbackRuntimePlugin =
      FallbackRuntimePlugin;
    const pluginAssetServer = createTestPluginAssetServer({
      "esm-with-fallback/main.mjs": 'throw new Error("esm import failed");',
    });
    const { app } = createTestApp({ pluginAssetServer });
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "esm-with-fallback",
      {
        "main.mjs": "export default {};",
        "main.js":
          "module.exports = globalThis.__lapisTestFallbackRuntimePlugin;",
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            entries: {
              workspace: {
                path: "main.mjs",
                format: "esm",
                fallbackPath: "main.js",
              },
            },
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["esm-with-fallback"], null, 2),
    );

    await app.plugins.loadPlugins();

    await expect(
      app.commands.executeCommand("esm-with-fallback:fallback-ready"),
    ).resolves.toBe("commonjs-fallback");
    expect(pluginAssetServer.requests).toHaveLength(1);
    expect(
      app.plugins.getCommunityPluginDiagnostics("esm-with-fallback"),
    ).toMatchObject({
      activationMode: "code",
      selectedRuntimeEntry: "main.mjs",
      moduleFormat: "esm",
      fallbackRuntimeEntry: "main.js",
      fallbackUsed: true,
      state: "enabled",
    });
  });

  it("fails ESM imports without falling back when no fallback is declared", async () => {
    const pluginAssetServer = createTestPluginAssetServer({
      "esm-without-fallback/main.mjs":
        'throw new Error("esm import failed without fallback");',
    });
    const { app } = createTestApp({ pluginAssetServer });
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "esm-without-fallback",
      {
        "main.mjs": "export default {};",
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            entries: {
              workspace: {
                path: "main.mjs",
                format: "esm",
              },
            },
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["esm-without-fallback"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.has("esm-without-fallback")).toBe(false);
    expect(pluginAssetServer.requests).toHaveLength(1);
    expect(
      app.plugins.getCommunityPluginDiagnostics("esm-without-fallback"),
    ).toMatchObject({
      selectedRuntimeEntry: "main.mjs",
      moduleFormat: "esm",
      fallbackRuntimeEntry: null,
      state: "failed",
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("esm-without-fallback")
        ?.lastFailureMessage,
    ).toContain("Error importing ESM plugin module for esm-without-fallback");
  });

  it("keeps CommonJS plugins on the CommonJS host when asset serving is enabled", async () => {
    class CommonJsRuntimePlugin extends Plugin {
      async onload() {
        this.addCommand({
          id: "commonjs-ready",
          name: "CommonJS Ready",
          callback() {
            return "commonjs-runtime";
          },
        });
      }
    }
    (globalThis as any).__lapisTestCommonJsRuntimePlugin =
      CommonJsRuntimePlugin;
    const pluginAssetServer = createTestPluginAssetServer({});
    const { app } = createTestApp({ pluginAssetServer });
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "commonjs-runtime",
      "module.exports = globalThis.__lapisTestCommonJsRuntimePlugin;",
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["commonjs-runtime"], null, 2),
    );

    await app.plugins.loadPlugins();

    await expect(
      app.commands.executeCommand("commonjs-runtime:commonjs-ready"),
    ).resolves.toBe("commonjs-runtime");
    expect(pluginAssetServer.requests).toEqual([]);
    expect(
      app.plugins.getCommunityPluginDiagnostics("commonjs-runtime"),
    ).toMatchObject({
      activationMode: "code",
      selectedRuntimeEntry: "main.js",
      moduleFormat: "commonjs",
      state: "enabled",
    });
  });

  it("keeps workspace Lapis plugins on the renderer under the desktop host", async () => {
    const bridgeCalls: string[] = [];
    const { app, adapter } = createTestApp();
    const host = new NativeDesktopCommunityPluginExecutionHost(adapter, {
      async invoke(command: string) {
        bridgeCalls.push(command);
        return undefined;
      },
    } as never);

    app.plugins = new PluginManager(app, "/.obsidian/plugins", adapter, {
      communityPluginHost: host,
    });
    app.plugins.registerDependencies({
      obsidian: { Plugin },
    });

    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "workspace-hybrid",
      "module.exports = class WorkspaceHybrid extends require('obsidian').Plugin {};",
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            workspace: "main.js",
          },
          permissions: ["commands", "settings.read", "metadata.query"],
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["workspace-hybrid"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(bridgeCalls).toEqual([]);
    expect(app.plugins.plugins.has("workspace-hybrid")).toBe(true);
    expect(
      app.plugins.getCommunityPluginDiagnostics("workspace-hybrid"),
    ).toMatchObject({
      activationMode: "code",
      hostMode: "renderer",
      selectedRuntimeEntry: "main.js",
      state: "enabled",
      requestedCapabilities: ["commands", "settings", "metadata:query"],
    });
  });

  it("routes sidecar plugin evaluation and lifecycle through the desktop bridge", async () => {
    const bridgeCalls: Array<{
      command: string;
      payload: Record<string, unknown>;
    }> = [];
    const { app, adapter } = createTestApp();
    const host = new NativeDesktopCommunityPluginExecutionHost(adapter, {
      async invoke(command: string, payload: Record<string, unknown>) {
        bridgeCalls.push({ command, payload });
        return { status: "ok" };
      },
    } as never);

    app.plugins = new PluginManager(app, "/.obsidian/plugins", adapter, {
      communityPluginHost: host,
    });
    app.plugins.registerDependencies({
      obsidian: { Plugin },
    });

    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "sidecar-bridge",
      "module.exports = class SidecarBridge extends require('obsidian').Plugin {};",
      {
        requiredCapabilities: ["vault:read"],
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["sidecar-bridge"], null, 2),
    );

    await app.plugins.loadPlugins();
    await app.plugins.disablePlugin("sidecar-bridge");

    expect(bridgeCalls.map((call) => call.command)).toEqual([
      "desktop_plugin_host_prepare",
      "desktop_plugin_host_evaluate",
      "desktop_plugin_host_activate",
      "desktop_plugin_host_deactivate",
    ]);
    expect(bridgeCalls[1]?.payload).toMatchObject({
      pluginId: "sidecar-bridge",
      pluginPath: "/.obsidian/plugins/sidecar-bridge",
      modulePath: "/.obsidian/plugins/sidecar-bridge/main.js",
      selectedRuntime: {
        host: "electron-sidecar",
        path: "main.js",
        format: "commonjs",
      },
    });
    expect(bridgeCalls[2]?.payload).toMatchObject({
      pluginId: "sidecar-bridge",
    });
    expect(bridgeCalls[3]?.payload).toMatchObject({
      pluginId: "sidecar-bridge",
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("sidecar-bridge"),
    ).toMatchObject({
      hostMode: "electron-plugin-sidecar",
      selectedRuntimeEntry: "main.js",
      state: "disabled",
    });
  });

  it("preserves sidecar dependency diagnostics with host and format context", async () => {
    const { app, adapter } = createTestApp();
    const host = new NativeDesktopCommunityPluginExecutionHost(adapter, {
      async invoke(command: string) {
        if (command === "desktop_plugin_host_evaluate") {
          throw new Error(
            "Unsupported sidecar dependency svelte in plugin sidecar-bad-dep (host=electron-sidecar, format=commonjs, entry=/.obsidian/plugins/sidecar-bad-dep/main.js)",
          );
        }
        return { status: "ok" };
      },
    } as never);

    app.plugins = new PluginManager(app, "/.obsidian/plugins", adapter, {
      communityPluginHost: host,
    });
    app.plugins.registerDependencies({
      obsidian: { Plugin },
    });

    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "sidecar-bad-dep",
      "module.exports = class SidecarBadDep {};",
      {
        requiredCapabilities: ["vault:read"],
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["sidecar-bad-dep"], null, 2),
    );

    await app.plugins.loadPlugins();

    const diagnostics =
      app.plugins.getCommunityPluginDiagnostics("sidecar-bad-dep");
    expect(diagnostics).toMatchObject({
      hostMode: "electron-plugin-sidecar",
      moduleFormat: "commonjs",
      state: "failed",
    });
    expect(diagnostics?.lastFailureMessage).toContain(
      "Plugin sidecar-bad-dep failed in electron-plugin-sidecar while evaluating commonjs entry main.js",
    );
    expect(diagnostics?.lastFailureMessage).toContain(
      "Unsupported sidecar dependency svelte",
    );
  });

  it("preserves sidecar local require bundle-required diagnostics", async () => {
    const { app, adapter } = createTestApp();
    const host = new NativeDesktopCommunityPluginExecutionHost(adapter, {
      async invoke(command: string) {
        if (command === "desktop_plugin_host_evaluate") {
          throw new Error(
            "Local require ./chunk.js is not supported in Electron sidecar v1 for plugin sidecar-local-require (host=electron-sidecar, format=commonjs, entry=main.js). Bundle sidecar plugins into a single CommonJS file before loading.",
          );
        }
        return { status: "ok" };
      },
    } as never);

    app.plugins = new PluginManager(app, "/.obsidian/plugins", adapter, {
      communityPluginHost: host,
    });
    app.plugins.registerDependencies({
      obsidian: { Plugin },
    });

    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "sidecar-local-require",
      "module.exports = class SidecarLocalRequire {};",
      {
        requiredCapabilities: ["vault:read"],
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["sidecar-local-require"], null, 2),
    );

    await app.plugins.loadPlugins();

    const diagnostics = app.plugins.getCommunityPluginDiagnostics(
      "sidecar-local-require",
    );
    expect(diagnostics).toMatchObject({
      hostMode: "electron-plugin-sidecar",
      moduleFormat: "commonjs",
      state: "failed",
    });
    expect(diagnostics?.lastFailureMessage).toContain(
      "Plugin sidecar-local-require failed in electron-plugin-sidecar while evaluating commonjs entry main.js",
    );
    expect(diagnostics?.lastFailureMessage).toContain(
      "Local require ./chunk.js is not supported in Electron sidecar v1",
    );
    expect(diagnostics?.lastFailureMessage).toContain(
      "Bundle sidecar plugins into a single CommonJS file before loading.",
    );
  });

  it("loads lapis extensions from a trusted desktop runtime entry", async () => {
    const requests: CommunityPluginEvaluationRequest[] = [];

    class DesktopRuntimePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "desktop-runtime",
          name: "Desktop Runtime",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {}
    }

    const host: CommunityPluginExecutionHost = {
      id: "electron-plugin-sidecar",
      async evaluate(request) {
        requests.push(request);
        return DesktopRuntimePlugin;
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "desktop-runtime",
      {
        "desktop-entry.js":
          "module.exports = class DesktopRuntime extends require('obsidian').Plugin {};",
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            trustedDesktop: "desktop-entry.js",
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["desktop-runtime"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      pluginId: "desktop-runtime",
      modulePath: "/.obsidian/plugins/desktop-runtime/desktop-entry.js",
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("desktop-runtime"),
    ).toMatchObject({
      activationMode: "code",
      hostMode: "electron-plugin-sidecar",
      state: "enabled",
    });
  });

  it("blocks trusted desktop runtime entries until the workspace is trusted", async () => {
    const requests: CommunityPluginEvaluationRequest[] = [];
    const host: CommunityPluginExecutionHost = {
      id: "electron-plugin-sidecar",
      async evaluate(request) {
        requests.push(request);
        return class TrustedDesktopPlugin extends Plugin {
          async onload() {}
        };
      },
    };
    const { app } = createTestApp(
      { communityPluginHost: host },
      { workspaceTrusted: false },
    );
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "desktop-runtime",
      {
        "desktop-entry.js":
          "module.exports = class DesktopRuntime extends require('obsidian').Plugin {};",
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            trustedDesktop: "desktop-entry.js",
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["desktop-runtime"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(requests).toEqual([]);
    expect(app.plugins.plugins.has("desktop-runtime")).toBe(false);
    const blockedDiagnostics = structuredClone(
      app.plugins.getCommunityPluginDiagnostics("desktop-runtime"),
    );
    expect(blockedDiagnostics).toMatchObject({
      hostMode: "electron-plugin-sidecar",
      state: "failed",
    });
    expect(blockedDiagnostics?.lastFailureMessage).toContain(
      "Plugin desktop-runtime requires a trusted workspace before loading trusted desktop runtime code",
    );

    await app.workspaceTrust.grant();
    await app.plugins.enablePlugin("desktop-runtime");

    expect(requests).toHaveLength(1);
    expect(app.plugins.plugins.has("desktop-runtime")).toBe(true);
  });

  it("blocks brokered capabilities until the workspace is trusted", async () => {
    const host: CommunityPluginExecutionHost = {
      id: "electron-plugin-sidecar",
      async evaluate() {
        return class BrokeredPlugin extends Plugin {
          async onload() {}
        };
      },
    };
    const { app } = createTestApp(
      { communityPluginHost: host },
      { workspaceTrusted: false },
    );
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "needs-vault-read",
      "module.exports = class NeedsVaultRead extends require('obsidian').Plugin {};",
      {
        requiredCapabilities: ["vault:read"],
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["needs-vault-read"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.has("needs-vault-read")).toBe(false);
    const blockedDiagnostics = structuredClone(
      app.plugins.getCommunityPluginDiagnostics("needs-vault-read"),
    );
    expect(blockedDiagnostics).toMatchObject({
      grantedCapabilities: [],
      requestedCapabilities: ["vault:read"],
      state: "failed",
    });
    expect(blockedDiagnostics?.lastFailureMessage).toContain(
      "Plugin needs-vault-read requires a trusted workspace before using brokered plugin capabilities",
    );

    await app.workspaceTrust.grant();
    await app.plugins.enablePlugin("needs-vault-read");

    const trustedDiagnostics =
      app.plugins.getCommunityPluginDiagnostics("needs-vault-read");
    expect(trustedDiagnostics?.state).toBe("enabled");
    expect(trustedDiagnostics?.grantedCapabilities).toEqual(
      expect.arrayContaining(["vault:read"]),
    );
  });

  it("rejects lapis runtime entries that escape the plugin root", async () => {
    const evaluationRequests: CommunityPluginEvaluationRequest[] = [];
    const host: CommunityPluginExecutionHost = {
      id: "renderer",
      async evaluate(request) {
        evaluationRequests.push(request);
        throw new Error("preflight should stop evaluation");
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "invalid-runtime-path",
      {},
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            workspace: "../escape.js",
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["invalid-runtime-path"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(evaluationRequests).toEqual([]);
    expect(app.plugins.plugins.has("invalid-runtime-path")).toBe(false);
    expect(
      app.plugins.getCommunityPluginDiagnostics("invalid-runtime-path"),
    ).toMatchObject({
      activationMode: "not-activated",
      selectedRuntimeEntry: "../escape.js",
      state: "failed",
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("invalid-runtime-path")
        ?.lastFailureMessage,
    ).toContain("outside the plugin root");
  });

  it("rejects invalid Lapis metadata before evaluation", async () => {
    const evaluationRequests: CommunityPluginEvaluationRequest[] = [];
    const host: CommunityPluginExecutionHost = {
      id: "renderer",
      async evaluate(request) {
        evaluationRequests.push(request);
        throw new Error("preflight should stop evaluation");
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "invalid-lapis",
      "module.exports = class InvalidLapis extends require('obsidian').Plugin {};",
      {
        lapis: {
          manifestVersion: 2,
          permissions: ["unknown.permission"],
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["invalid-lapis"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(evaluationRequests).toEqual([]);
    expect(app.plugins.plugins.has("invalid-lapis")).toBe(false);
    expect(
      app.plugins.getCommunityPluginDiagnostics("invalid-lapis")
        ?.lastFailureMessage,
    ).toContain("unsupported lapis.manifestVersion");
  });

  it("registers Lapis language-service providers from service declarations", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    await seedCommunityPlugin(
      app,
      "language-service-plugin",
      `module.exports = class LanguageServicePlugin extends require("obsidian").Plugin {
        onload() {
          this.registerLapisServiceProvider({
            service: "language-service",
            id: "markdown-tools",
            provider: {
              async provideDiagnostics() {
                return [];
              },
              dispose() {
                globalThis.__lapisLanguageServiceDisposed = true;
              }
            }
          });
        }
      }`,
      {
        lapis: {
          manifestVersion: 1,
          contributes: {
            services: [
              {
                id: "markdown-tools",
                service: "language-service",
                languages: ["markdown"],
                runtime: "workspace",
                priority: 25,
                capabilities: {
                  diagnostics: true,
                },
              },
            ],
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["language-service-plugin"], null, 2),
    );
    app.plugins.registerDependencies({ obsidian: { Plugin } });

    await app.plugins.loadPlugins();

    expect(
      (app as any).languageServices.providers[
        "language-service-plugin:markdown-tools"
      ]?.metadata,
    ).toMatchObject({
      id: "language-service-plugin:markdown-tools",
      languages: ["markdown"],
      runtime: "in-process",
      priority: 25,
      capabilities: {
        diagnostics: true,
      },
    });

    await app.plugins.disablePlugin("language-service-plugin");

    expect(
      (app as any).languageServices.providers[
        "language-service-plugin:markdown-tools"
      ],
    ).toBeUndefined();
    expect((globalThis as any).__lapisLanguageServiceDisposed).toBe(true);
    delete (globalThis as any).__lapisLanguageServiceDisposed;
  });

  it("installs locked manifest-only system extensions for language services", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    app.plugins.registerSystemExtensions([
      {
        manifest: {
          id: "markdown-lint-system",
          name: "Markdown Lint",
          author: "Lapis Notes",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "System markdown diagnostics",
          lapis: {
            manifestVersion: 1,
            source: "system",
            locked: true,
            contributes: {
              services: [
                {
                  id: "markdown-lint",
                  service: "language-service",
                  languages: ["markdown"],
                  runtime: "workspace",
                  priority: 25,
                  capabilities: {
                    diagnostics: true,
                  },
                },
              ],
            },
          },
        },
        serviceProviders: [
          {
            id: "markdown-lint",
            service: "language-service",
            provider: {
              async provideDiagnostics() {
                return [];
              },
              dispose() {
                (globalThis as any).__lapisSystemLanguageServiceDisposed = true;
              },
            },
          },
        ],
      },
    ]);

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.has("markdown-lint-system")).toBe(false);
    expect(app.plugins.getLapisExtension("markdown-lint-system")).toMatchObject(
      {
        pluginId: "markdown-lint-system",
        source: "system",
        classification: "lapis-extension",
        locked: true,
      },
    );
    expect(
      (app as any).languageServices.providers[
        "markdown-lint-system:markdown-lint"
      ]?.metadata,
    ).toMatchObject({
      id: "markdown-lint-system:markdown-lint",
      languages: ["markdown"],
      runtime: "in-process",
      priority: 25,
      capabilities: {
        diagnostics: true,
      },
    });
    expect(
      app.plugins.getEnabledInternalPluginById("markdown-lint-system")?.manifest
        .id,
    ).toBe("markdown-lint-system");

    expect(await app.plugins.disablePlugin("markdown-lint-system")).toBe(false);

    expect(
      (app as any).languageServices.providers[
        "markdown-lint-system:markdown-lint"
      ],
    ).toBeDefined();
  });

  it("allows optional manifest-only system extensions to be disabled and re-enabled", async () => {
    const { app, adapter } = createTestApp();
    await app.vault.load();

    app.plugins.registerSystemExtensions([
      {
        manifest: {
          id: "markdown-lint-system",
          name: "Markdown Lint",
          author: "Lapis Notes",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "System markdown diagnostics",
          lapis: {
            manifestVersion: 1,
            source: "system",
            locked: false,
            enabledByDefault: true,
            contributes: {
              services: [
                {
                  id: "markdown-lint",
                  service: "language-service",
                  languages: ["markdown"],
                  runtime: "workspace",
                  priority: 25,
                  capabilities: {
                    diagnostics: true,
                  },
                },
              ],
            },
          },
        },
        serviceProviders: [
          {
            id: "markdown-lint",
            service: "language-service",
            provider: {
              async provideDiagnostics() {
                return [];
              },
            },
          },
        ],
      },
    ]);

    await app.plugins.loadPlugins();

    expect(
      (app as any).languageServices.providers[
        "markdown-lint-system:markdown-lint"
      ]?.metadata,
    ).toMatchObject({
      id: "markdown-lint-system:markdown-lint",
      languages: ["markdown"],
      runtime: "in-process",
      priority: 25,
      capabilities: {
        diagnostics: true,
      },
    });
    expect(
      app.plugins.getEnabledInternalPluginById("markdown-lint-system")?.manifest
        .id,
    ).toBe("markdown-lint-system");

    await expect(
      app.plugins.disablePlugin("markdown-lint-system"),
    ).resolves.toBe(true);
    await (
      app.plugins as unknown as {
        saveCorePluginState: { flush?: () => Promise<void> | void };
      }
    ).saveCorePluginState.flush?.();

    expect(
      (app as any).languageServices.providers[
        "markdown-lint-system:markdown-lint"
      ],
    ).toBeUndefined();
    expect(
      app.plugins.getEnabledInternalPluginById("markdown-lint-system"),
    ).toBeNull();
    expect(
      JSON.parse(await adapter.read("/.obsidian/core-plugins.json")),
    ).toEqual(["markdown-lint-system"]);

    await expect(
      app.plugins.enablePlugin("markdown-lint-system"),
    ).resolves.toBe(true);
    await (
      app.plugins as unknown as {
        saveCorePluginState: { flush?: () => Promise<void> | void };
      }
    ).saveCorePluginState.flush?.();

    expect(
      (app as any).languageServices.providers[
        "markdown-lint-system:markdown-lint"
      ]?.metadata,
    ).toMatchObject({
      id: "markdown-lint-system:markdown-lint",
    });
    expect(
      app.plugins.getEnabledInternalPluginById("markdown-lint-system")?.manifest
        .id,
    ).toBe("markdown-lint-system");
    expect(
      JSON.parse(await adapter.read("/.obsidian/core-plugins.json")),
    ).toEqual([]);
  });

  it("allows community plugins to register and clean up Bases views", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    class BasesCorePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "bases",
          name: "Bases",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {}
    }

    app.plugins.registerCorePlugins([BasesCorePlugin]);
    await seedCommunityPlugin(
      app,
      "bases-community",
      `module.exports = class BasesCommunityPlugin extends require("obsidian").Plugin {
        onload() {
          const registered = this.registerBasesView("custom-view", {
            name: "Custom View",
            icon: "lucide-file",
            factory() {
              return { type: "custom-view", config: {}, onDataUpdated() {} };
            }
          });

          if (!registered) {
            throw new Error("bases registration failed");
          }
        }
      }`,
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["bases-community"], null, 2),
    );
    app.plugins.registerDependencies({ obsidian: { Plugin } });

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("bases-community")?.enabled).toBe(true);
    expect(
      app.plugins.getBasesViewRegistrations().get("custom-view"),
    ).toMatchObject({
      name: "Custom View",
    });
    expect(
      app.plugins.getEnabledInternalPluginById("bases")?.registrations[
        "custom-view"
      ],
    ).toMatchObject({
      name: "Custom View",
    });

    await app.plugins.disablePlugin("bases-community");

    expect(app.plugins.getBasesViewRegistrations().has("custom-view")).toBe(
      false,
    );
    expect(
      app.plugins.getEnabledInternalPluginById("bases")?.registrations[
        "custom-view"
      ],
    ).toBeUndefined();
  });

  it("stores Bases view registrations before the Bases core plugin is enabled", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    await seedCommunityPlugin(
      app,
      "bases-community",
      `module.exports = class BasesCommunityPlugin extends require("obsidian").Plugin {
        onload() {
          const registered = this.registerBasesView("custom-view", {
            name: "Custom View",
            icon: "lucide-file",
            factory() {
              return { type: "custom-view", config: {}, onDataUpdated() {} };
            }
          });

          if (!registered) {
            throw new Error("bases registration failed");
          }
        }
      }`,
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["bases-community"], null, 2),
    );
    app.plugins.registerDependencies({ obsidian: { Plugin } });

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("bases-community")?.enabled).toBe(true);
    expect(
      app.plugins.getBasesViewRegistrations().get("custom-view"),
    ).toMatchObject({
      name: "Custom View",
    });
    expect(app.plugins.getEnabledInternalPluginById("bases")).toBeNull();
  });

  it("treats manifest preflight failures as non-fatal", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    await app.vault.mkpath("/.obsidian/plugins/missing-main");
    await app.vault.create(
      "/.obsidian/plugins/missing-main/manifest.json",
      JSON.stringify(
        {
          id: "missing-main",
          name: "Missing Main",
          author: "test",
          version: "1.0.0",
          description: "",
          minAppVersion: "0.0.0",
        },
        null,
        2,
      ),
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["missing-main"], null, 2),
    );

    const errors: string[] = [];
    app.plugins.on("plugin-error", (_id, message) => {
      errors.push(message);
    });

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.has("missing-main")).toBe(false);
    expect(errors.some((message) => message.includes("missing main.js"))).toBe(
      true,
    );
  });

  it("surfaces community plugin evaluation failures without masking them as invalid exports", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    await seedCommunityPlugin(
      app,
      "broken-eval",
      [
        'throw new Error("boom during evaluation");',
        'module.exports = class BrokenEvalPlugin extends require("obsidian").Plugin {};',
      ].join("\n"),
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["broken-eval"], null, 2),
    );

    const errors: string[] = [];
    app.plugins.on("plugin-error", (_id, message) => {
      errors.push(message);
    });

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.has("broken-eval")).toBe(false);
    expect(
      errors.some(
        (message) =>
          message.includes("Error evaluating plugin module for broken-eval") &&
          message.includes("boom during evaluation") &&
          !message.includes("does not export a valid plugin class"),
      ),
    ).toBe(true);
  });

  it("rejects unsupported runtime and capability declarations before evaluation", async () => {
    const evaluationRequests: CommunityPluginEvaluationRequest[] = [];
    const host: CommunityPluginExecutionHost = {
      id: "renderer",
      async evaluate(request) {
        evaluationRequests.push(request);
        throw new Error("preflight should stop evaluation");
      },
    };
    const { app } = createTestApp({ communityPluginHost: host });
    await app.vault.load();

    await seedCommunityPlugin(
      app,
      "sidecar-only",
      "module.exports = class SidecarOnly extends require('obsidian').Plugin {};",
      { supportedRuntimes: ["electron-plugin-sidecar"] },
    );
    await seedCommunityPlugin(
      app,
      "needs-vault-read",
      "module.exports = class NeedsVaultRead extends require('obsidian').Plugin {};",
      { requiredCapabilities: ["vault:read"] },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["sidecar-only", "needs-vault-read"], null, 2),
    );

    await app.plugins.loadPlugins();

    expect(evaluationRequests).toEqual([]);
    expect(app.plugins.plugins.has("sidecar-only")).toBe(false);
    expect(app.plugins.plugins.has("needs-vault-read")).toBe(false);
    expect(
      app.plugins.getCommunityPluginDiagnostics("sidecar-only"),
    ).toMatchObject({
      activationMode: "not-activated",
      hostMode: "renderer",
      selectedRuntimeEntry: "main.js",
      state: "failed",
      requestedCapabilities: [],
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("sidecar-only")
        ?.lastFailureMessage,
    ).toContain("does not support host renderer");
    expect(
      app.plugins.getCommunityPluginDiagnostics("needs-vault-read"),
    ).toMatchObject({
      activationMode: "not-activated",
      hostMode: "renderer",
      selectedRuntimeEntry: "main.js",
      state: "failed",
      requestedCapabilities: ["vault:read"],
      grantedCapabilities: [],
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("needs-vault-read")
        ?.lastFailureMessage,
    ).toContain("requires unavailable capabilities: vault:read");
  });

  it("tracks last community plugin failure and can restart the plugin", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    await seedCommunityPlugin(
      app,
      "flaky-community",
      `let attempts = 0;
      module.exports = class FlakyCommunityPlugin extends require("obsidian").Plugin {
        onload() {
          attempts += 1;
          if (attempts === 1) {
            throw new Error("first load failed");
          }
          this.addCommand({
            id: "ready",
            name: "Ready",
            callback() {
              return true;
            }
          });
        }
      }`,
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["flaky-community"], null, 2),
    );
    app.plugins.registerDependencies({ obsidian: { Plugin } });

    await app.plugins.loadPlugins();

    const plugin = app.plugins.plugins.get("flaky-community");
    expect(plugin?.state).toBe("failed");
    expect(plugin?.lastFailureMessage).toContain("first load failed");
    expect(
      app.plugins.getCommunityPluginDiagnostics("flaky-community"),
    ).toMatchObject({
      hostMode: "renderer",
      state: "failed",
      lastFailureMessage: "first load failed",
    });

    await expect(app.plugins.restartPlugin("flaky-community")).resolves.toBe(
      true,
    );

    expect(app.plugins.plugins.get("flaky-community")?.enabled).toBe(true);
    expect(app.commands.commands["flaky-community:ready"]).toBeDefined();
    expect(
      app.plugins.getCommunityPluginDiagnostics("flaky-community"),
    ).toMatchObject({
      hostMode: "renderer",
      state: "enabled",
      lastFailureMessage: "first load failed",
    });
  });

  it("prunes configured community plugins whose manifest is missing", async () => {
    const { app, adapter } = createTestApp();
    await app.vault.load();
    await app.vault.mkpath("/.obsidian/plugins/plugin-diagnostics");
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["plugin-diagnostics"], null, 2),
    );

    const prunedPluginIds: string[][] = [];
    const errors: string[] = [];
    app.plugins.on("community-plugin-config-pruned", (pluginIds) => {
      prunedPluginIds.push(pluginIds);
    });
    app.plugins.on("plugin-error", (_id, message) => {
      errors.push(message);
    });

    await app.plugins.loadPlugins();

    expect(prunedPluginIds).toEqual([["plugin-diagnostics"]]);
    expect(app.plugins.enabledPlugins).toEqual([]);
    expect(
      JSON.parse(await adapter.read("/.obsidian/community-plugins.json")),
    ).toEqual([]);
    expect(errors.some((message) => message.includes("manifest.json"))).toBe(
      false,
    );
  });

  it("respects disabled core plugin config while keeping required core plugins active", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    class RequiredCorePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "required-core",
          name: "Required Core",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {
        this.addCommand({
          id: "required",
          name: "Required",
          callback: () => true,
        });
      }
    }

    class OptionalCorePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "optional-core",
          name: "Optional Core",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {
        this.addCommand({
          id: "optional",
          name: "Optional",
          callback: () => true,
        });
      }
    }

    await app.vault.mkpath("/.obsidian");
    await app.vault.create(
      "/.obsidian/core-plugins.json",
      JSON.stringify(["optional-core"], null, 2),
    );

    app.plugins.registerCorePlugins([
      { plugin: RequiredCorePlugin, required: true },
      OptionalCorePlugin,
    ]);

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("required-core")?.enabled).toBe(true);
    expect(app.plugins.plugins.get("optional-core")?.enabled).toBe(false);
    expect(app.commands.commands["required-core:required"]).toBeDefined();
    expect(app.commands.commands["optional-core:optional"]).toBeUndefined();
  });

  it("keeps default-disabled core plugins off until explicitly enabled", async () => {
    const { app, adapter } = createTestApp();
    await app.vault.load();

    class OptionalCorePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "optional-core",
          name: "Optional Core",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {
        this.addCommand({
          id: "optional",
          name: "Optional",
          callback: () => true,
        });
      }
    }

    app.plugins.registerCorePlugins([
      { plugin: OptionalCorePlugin, enabledByDefault: false },
    ]);

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("optional-core")?.enabled).toBe(false);
    expect(app.commands.commands["optional-core:optional"]).toBeUndefined();

    await expect(app.plugins.enablePlugin("optional-core")).resolves.toBe(true);
    await (
      app.plugins as unknown as {
        saveCorePluginState: { flush?: () => Promise<void> | void };
      }
    ).saveCorePluginState.flush?.();

    expect(app.plugins.plugins.get("optional-core")?.enabled).toBe(true);
    expect(
      JSON.parse(await adapter.read("/.obsidian/core-plugins.json")),
    ).toEqual({
      disabled: [],
      enabled: ["optional-core"],
    });
  });

  it("classifies statically linked first-party plugins without using community persistence", async () => {
    const { app, adapter } = createTestApp();
    await app.vault.load();

    class BundledPlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "bundled-plugin",
          name: "Bundled Plugin",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }
      onload() {}
    }

    class FirstPartyPlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "first-party-plugin",
          name: "First-party Plugin",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }
      onload() {}
    }

    app.plugins.registerCorePlugins([
      BundledPlugin,
      {
        plugin: FirstPartyPlugin,
        distribution: "first-party-external",
      },
    ]);
    await app.plugins.loadPlugins();

    expect(app.plugins.corePluginEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          manifest: expect.objectContaining({ id: "bundled-plugin" }),
          source: "core",
          provenance: "bundled",
          distribution: "bundled",
        }),
        expect.objectContaining({
          manifest: expect.objectContaining({ id: "first-party-plugin" }),
          source: "core",
          provenance: "official",
          distribution: "first-party-external",
        }),
      ]),
    );

    await expect(
      app.plugins.disablePlugin("first-party-plugin"),
    ).resolves.toBe(true);
    await (
      app.plugins as unknown as {
        saveCorePluginState: { flush?: () => Promise<void> | void };
      }
    ).saveCorePluginState.flush?.();

    expect(
      JSON.parse(await adapter.read("/.obsidian/core-plugins.json")),
    ).toEqual(["first-party-plugin"]);
    const communityConfig = JSON.parse(
      await adapter.read("/.obsidian/community-plugins.json"),
    );
    expect(communityConfig).not.toContain("first-party-plugin");
  });

  it("preserves plugin-owned leaves as missing views and restores them on enable", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    class ViewPlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "view-plugin",
          name: "View Plugin",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }
      onload() {
        this.registerView("owned-view", () => ({}) as never);
      }
    }

    app.plugins.registerCorePlugins([ViewPlugin]);
    await app.plugins.loadPlugins();

    let state = {
      type: "owned-view",
      state: { selected: "role-1" } as Record<string, unknown>,
      pinned: true,
    };
    const leaf = {
      view: { getViewType: () => state.type },
      captureCurrentViewState: () => structuredClone(state),
      getViewState: () => structuredClone(state),
      async setViewState(next: typeof state) {
        const missing = next.state["__missingViewType"];
        const creators = (
          app.workspace as unknown as {
            viewCreators: Map<string, unknown>;
          }
        ).viewCreators;
        if (
          next.type === "empty" &&
          typeof missing === "string" &&
          creators.has(missing)
        ) {
          const restored = { ...next.state };
          delete restored["__missingViewType"];
          state = { ...next, type: missing, state: restored };
          return;
        }
        state = structuredClone(next);
      },
    };
    (
      app.workspace as unknown as { leaves: Array<typeof leaf>; activeLeaf: unknown }
    ).leaves.push(leaf);
    (app.workspace as unknown as { activeLeaf: unknown }).activeLeaf = leaf;

    await expect(app.plugins.disablePlugin("view-plugin")).resolves.toBe(true);
    expect(state).toEqual({
      type: "empty",
      state: { selected: "role-1", __missingViewType: "owned-view" },
      pinned: true,
    });
    expect((app.workspace as unknown as { activeLeaf: unknown }).activeLeaf).toBe(
      leaf,
    );

    await expect(app.plugins.enablePlugin("view-plugin")).resolves.toBe(true);
    expect(state).toEqual({
      type: "owned-view",
      state: { selected: "role-1" },
      pinned: true,
    });
    expect((app.workspace as unknown as { activeLeaf: unknown }).activeLeaf).toBe(
      leaf,
    );
  });

  it("copies legacy plugin data aliases without overwriting target data", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    await app.configuration.updatePluginData("docs", {
      theme: "legacy",
      version: 1,
    });

    await expect(
      app.plugins.migratePluginDataAliases([
        { fromPluginId: "docs", toPluginId: "lapis-docs" },
      ]),
    ).resolves.toEqual(["docs:lapis-docs"]);

    expect(app.configuration.getPluginData("docs")).toEqual({
      theme: "legacy",
      version: 1,
    });
    expect(app.configuration.getPluginData("lapis-docs")).toEqual({
      theme: "legacy",
      version: 1,
    });

    await app.configuration.updatePluginData("lapis-docs", {
      theme: "current",
    });
    await expect(
      app.plugins.migratePluginDataAliases([
        { fromPluginId: "docs", toPluginId: "lapis-docs" },
      ]),
    ).resolves.toEqual([]);
    expect(app.configuration.getPluginData("lapis-docs")).toEqual({
      theme: "current",
    });
  });

  it("ignores bundled core plugin state folders during community discovery", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    class CorePluginWithData extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "core-with-data",
          name: "Core With Data",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      async onload() {
        await this.saveData({ enabled: true });
      }
    }

    const pluginErrors: Array<{ id: string; message: string }> = [];
    app.plugins.on("plugin-error", (id, message) => {
      pluginErrors.push({ id, message });
    });

    app.plugins.registerCorePlugins([CorePluginWithData]);
    await app.plugins.enablePlugin("core-with-data");

    expect(
      app.vault.getFileByPath("/.obsidian/core-with-data.json"),
    ).toBeTruthy();
    expect(
      app.vault.getFileByPath("/.obsidian/plugins/core-with-data/data.json"),
    ).toBeNull();

    await app.plugins.loadPlugins();

    expect(app.plugins.plugins.get("core-with-data")?.enabled).toBe(true);
    expect(
      pluginErrors.some(
        ({ id, message }) =>
          id === "/.obsidian/plugins/core-with-data" &&
          message.includes("manifest.json"),
      ),
    ).toBe(false);
  });

  it("mirrors configuration-driven community plugin data updates into legacy files", async () => {
    const { app, adapter } = createTestApp();
    await app.vault.load();

    await seedCommunityPlugin(
      app,
      "mirrored-community",
      "module.exports = class MirroredCommunity extends require('obsidian').Plugin { onload() {} }",
    );

    await app.plugins.loadPlugin("/.obsidian/plugins/mirrored-community");
    await app.configuration.updatePluginData("mirrored-community", {
      enabled: true,
      source: "config",
    });
    await waitForAsyncPluginDataSync();

    expect(
      JSON.parse(
        await adapter.read("/.obsidian/plugins/mirrored-community/data.json"),
      ),
    ).toEqual({ enabled: true, source: "config" });
  });

  it("removes legacy plugin data files when canonical plugin data is removed", async () => {
    const { app, adapter } = createTestApp();
    await app.vault.load();

    await seedCommunityPlugin(
      app,
      "removable-community",
      "module.exports = class RemovableCommunity extends require('obsidian').Plugin { onload() {} }",
    );

    await app.plugins.loadPlugin("/.obsidian/plugins/removable-community");
    await app.configuration.updatePluginData("removable-community", {
      enabled: true,
    });
    await waitForAsyncPluginDataSync();
    expect(
      await adapter.exists("/.obsidian/plugins/removable-community/data.json"),
    ).toBe(true);

    await app.configuration.removePluginData("removable-community");
    await waitForAsyncPluginDataSync();

    expect(
      await adapter.exists("/.obsidian/plugins/removable-community/data.json"),
    ).toBe(false);
  });

  it("does not allow disabling required plugins", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    class RequiredCorePlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "required-core",
          name: "Required Core",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
        });
      }

      onload() {}
    }

    app.plugins.registerCorePlugins([
      { plugin: RequiredCorePlugin, required: true },
    ]);
    await app.plugins.loadPlugins();

    await expect(app.plugins.disablePlugin("required-core")).resolves.toBe(
      false,
    );
    expect(app.plugins.plugins.get("required-core")?.enabled).toBe(true);
  });

  it("activates a deferred Lapis command contribution on first execution", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "lazy-command",
      {
        "plugin.js": `module.exports = class LazyCommandPlugin extends require("obsidian").Plugin {
          onload() {
            this.addCommand({
              id: "hello",
              name: "Hello",
              callback() {
                return "activated";
              }
            });
          }
        }`,
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            workspace: "plugin.js",
          },
          contributes: {
            commands: [
              {
                command: "hello",
                title: "Hello",
              },
            ],
            configuration: [
              {
                id: "lazy-command",
                title: "Lazy Command",
                properties: {
                  enabled: { type: "boolean" },
                },
              },
            ],
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["lazy-command"], null, 2),
    );
    app.plugins.registerDependencies({ obsidian: { Plugin } });

    await app.plugins.loadPlugins();

    expect(
      app.plugins.getCommunityPluginDiagnostics("lazy-command"),
    ).toMatchObject({
      activationMode: "not-activated",
      state: "dormant",
    });
    expect(app.commands.commands["lazy-command:hello"]).toBeDefined();
    expect(app.configuration.schema.registeredSchemas).toHaveLength(1);

    await expect(
      app.commands.executeCommand("lazy-command:hello"),
    ).resolves.toBe("activated");

    expect(app.plugins.plugins.get("lazy-command")?.enabled).toBe(true);
    expect(
      app.plugins.getCommunityPluginDiagnostics("lazy-command"),
    ).toMatchObject({
      activationMode: "code",
      activationTrigger: "command:lazy-command:hello",
      state: "enabled",
    });
  });

  it("activates a deferred Lapis service contribution when the service type is resolved", async () => {
    const { app } = createTestApp();
    await app.vault.load();
    await seedCommunityPluginFiles(
      app,
      "lazy-language-service",
      {
        "plugin.js": `module.exports = class LazyLanguageServicePlugin extends require("obsidian").Plugin {
          onload() {
            this.registerLapisServiceProvider({
              service: "language-service",
              id: "markdown-tools",
              provider: {
                async provideDiagnostics() {
                  return [];
                }
              }
            });
          }
        }`,
      },
      {
        lapis: {
          manifestVersion: 1,
          runtime: {
            workspace: "plugin.js",
          },
          contributes: {
            services: [
              {
                id: "markdown-tools",
                service: "language-service",
                languages: ["markdown"],
                runtime: "workspace",
                priority: 25,
                capabilities: {
                  diagnostics: true,
                },
              },
            ],
          },
        },
      },
    );
    await app.vault.create(
      "/.obsidian/community-plugins.json",
      JSON.stringify(["lazy-language-service"], null, 2),
    );
    app.plugins.registerDependencies({ obsidian: { Plugin } });

    await app.plugins.loadPlugins();

    expect(
      app.plugins.getCommunityPluginDiagnostics("lazy-language-service"),
    ).toMatchObject({
      activationMode: "not-activated",
      state: "dormant",
    });
    expect(
      (app as any).languageServices.providers[
        "lazy-language-service:markdown-tools"
      ],
    ).toBeUndefined();

    await expect(
      app.plugins.activateForService("language-service"),
    ).resolves.toBe(true);

    expect(
      (app as any).languageServices.providers[
        "lazy-language-service:markdown-tools"
      ]?.metadata,
    ).toMatchObject({
      id: "lazy-language-service:markdown-tools",
      languages: ["markdown"],
      runtime: "in-process",
      priority: 25,
      capabilities: {
        diagnostics: true,
      },
    });
    expect(
      app.plugins.getCommunityPluginDiagnostics("lazy-language-service"),
    ).toMatchObject({
      activationMode: "code",
      activationTrigger: "service:language-service",
      state: "enabled",
    });
  });

  it("supports code-backed system extensions with deferred renderer activation", async () => {
    const { app } = createTestApp();
    await app.vault.load();

    class LazySystemExtensionPlugin extends Plugin {
      constructor(app: App) {
        super(app, {
          id: "lazy-system",
          name: "Lazy System",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "",
          author: "test",
          lapis: {
            manifestVersion: 1,
            source: "system",
            contributes: {
              commands: [
                {
                  command: "open",
                  title: "Open",
                },
              ],
            },
          },
        });
      }

      onload() {
        this.addCommand({
          id: "open",
          name: "Open",
          callback: () => "system-activated",
        });
      }
    }

    app.plugins.registerSystemExtensions([
      {
        manifest: {
          id: "lazy-system",
          name: "Lazy System",
          version: "1.0.0",
          minAppVersion: "0.0.0",
          description: "Deferred system extension",
          author: "Lapis Notes",
          lapis: {
            manifestVersion: 1,
            source: "system",
            locked: true,
            enabledByDefault: true,
            contributes: {
              commands: [
                {
                  command: "open",
                  title: "Open",
                },
              ],
            },
          },
        },
        plugin: LazySystemExtensionPlugin,
        locked: true,
        enabledByDefault: true,
        privileges: ["app.host"],
      },
    ]);

    await app.plugins.loadPlugins();

    expect(app.commands.commands["lazy-system:open"]).toBeDefined();
    expect(
      app.plugins.corePluginEntries.some(
        (entry) => entry.manifest.id === "lazy-system",
      ),
    ).toBe(true);

    await expect(app.commands.executeCommand("lazy-system:open")).resolves.toBe(
      "system-activated",
    );

    expect(app.plugins.plugins.get("lazy-system")?.source).toBe("system");
    expect(
      app.plugins.getCommunityPluginDiagnostics("lazy-system"),
    ).toMatchObject({
      activationMode: "code",
      privileges: ["app.host"],
      activationTrigger: "command:lazy-system:open",
    });
  });
});
