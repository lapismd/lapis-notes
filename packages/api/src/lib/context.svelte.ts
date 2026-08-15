import { Workspace } from "./workspace.svelte";
import {
  getAdapterVaultId,
  TFile,
  Vault,
  type AppDatabase,
  type DataAdapter,
  type VaultSession,
} from "./storage";
import { AppSettings } from "./settings.svelte";
import type { Extension } from "@codemirror/state";
import {
  NativeDesktopCommunityPluginExecutionHost,
  PluginManager,
} from "./plugin-manager";
import type { PluginDependencyResolverFactory } from "./plugin-dependency-resolver";
import type { PluginAssetServer } from "./plugin-asset-server";
import { hasNativeDesktopCapability } from "./storage/desktop-native";
import { Configuration } from "./configuration.svelte";
import {
  CommandManager,
  Keymap,
  Scope,
  type UserEvent,
} from "./command.svelte";
import { MetadataCache } from "./cache.svelte";
import type {
  MarkdownDirectiveRenderer,
  MarkdownPostProcessor,
  MarkdownViewMenuItemProvider,
} from "./markdown";
import { logging, type Logger } from "./logging";
import type { Component } from "./view.svelte";
import { MetadataTypeManager } from "./metadata.svelte";
import type { EditorSuggest } from "./suggest";
import { FileManager } from "./file-manager";
import { EmbedRegistry } from "./embed-registry";
import {
  findOpenFileLeaf,
  leafFilePath,
  applyOpenViewStateToLeaf,
} from "./open-file";
import type { OpenViewState, WorkspaceLeaf } from "./workspace.svelte";
import {
  LocalizationManager,
  localeManager,
} from "./localization-manager.svelte";
import { NotificationManager } from "./notifications";
import { NoopTelemetryService, type TelemetryService } from "./telemetry";
import {
  LanguageServiceManager,
  type LanguageServiceCodeAction,
  type VirtualDocument,
} from "./language-service";
import { ContextKeyService } from "./context-keys.svelte";
import { StatusBarManager } from "./status-bar.svelte";
import { AppUrlService } from "./app-url";
import { WorkspaceTrustService } from "./workspace-trust";
import {
  DefaultPluginDistributionManager,
  type DefaultPluginDistributionManagerOptions,
} from "./plugin-distribution";
import { ConfigurationOptionSourceRegistry } from "./configuration-option-source-registry";
import { resolveMetadataFieldValues } from "./configuration-option-source-providers";
import type { Editor } from "./editor.svelte";
import { SearchDocumentProviderRegistry } from "./search-document-provider";
import {
  installApplicationCompatibility,
  resolveApplication,
} from "./application-compatibility";
import {
  provideApplicationState,
  useApplicationState,
} from "./application-state.svelte";

export {
  getApplicationCompatibility,
  installApplicationCompatibility,
  resolveApplication,
} from "./application-compatibility";
export {
  provideApplicationState,
  useApplicationState,
} from "./application-state.svelte";

/**
 * Bootstrap dependencies required to construct an {@link App} instance.
 *
 * @public
 */
export interface AppWorkspaceShellApplicationProperties {
  /** Application name shown by the shell's About surface. */
  name?: string;
  /** Optional application logo. Use `null` to fall back to the shell icon. */
  logoUrl?: string | null;
  buildTime?: string | null;
  commitHash?: string;
  copyright?: string;
}

/** Host-owned metadata and minimal static chrome for the workspace shell. */
export interface AppWorkspaceShellProperties {
  application?: AppWorkspaceShellApplicationProperties;
  /** Enable design-core's notification center and status affordance. */
  notifications?: boolean;
}

export type AppStateProperties = {
  version: string;
  configPath: string;
  adapter?: DataAdapter;
  session?: VaultSession;
  appDatabase?: AppDatabase;
  safeMode?: AppSafeModeState;
  createCommunityPluginDependencyResolver?: PluginDependencyResolverFactory;
  pluginAssetServer?: PluginAssetServer;
  pluginDistributionOptions?: AppPluginDistributionOptions;
  workspaceShell?: AppWorkspaceShellProperties;
  markdownRenderer: (
    markdown: string,
    el: HTMLElement,
    sourcePath: string,
    component: Component,
  ) => Promise<void>;
};

export type AppPluginDistributionOptions = Omit<
  DefaultPluginDistributionManagerOptions,
  "adapter" | "appVersion" | "platform" | "workspaceTrusted" | "pluginManager"
>;

export type ExtType = Extension | ((context: Record<string, any>) => Extension);

/**
 * Details about the last startup failure that caused safe mode to activate.
 *
 * @public
 */
export interface AppSafeModeFailure {
  task: string | null;
  message: string;
  detail: string;
  pluginId: string | null;
}

/**
 * Safe mode flags that disable risky startup behavior after a failed launch.
 *
 * @public
 */
export interface AppSafeModeState {
  active: boolean;
  disableCommunityPlugins: boolean;
  disableOptionalCorePlugins: boolean;
  skipLayoutRestore: boolean;
  disableNotebookExecution: boolean;
  lastStartupFailure: AppSafeModeFailure | null;
}

/**
 * Create the default safe mode state used for a normal startup.
 *
 * @public
 */
export function createDefaultAppSafeModeState(): AppSafeModeState {
  return {
    active: false,
    disableCommunityPlugins: false,
    disableOptionalCorePlugins: false,
    skipLayoutRestore: false,
    disableNotebookExecution: false,
    lastStartupFailure: null,
  };
}

/**
 * Ephemeral renderer state shared while processing a markdown view.
 *
 * @public
 */
export class RenderContext {
  hoverPopover: null = null;
}

/**
 * In-memory secret store used by runtime services and plugins.
 *
 * Hosts may replace or mirror this with stronger persisted storage, but the API
 * surface intentionally stays small and synchronous for plugin code.
 *
 * @public
 */
export class SecretStorage {
  private secrets: Record<string, string> = {};

  /**
   * Store or replace a secret value.
   *
   * @param id - Stable identifier for the secret.
   * @param secret - Raw secret value to store.
   * @public
   */
  setSecret(id: string, secret: string): void {
    if (!/^[a-z0-9-]+$/.test(id)) {
      throw new Error(`Invalid secret id: ${id}`);
    }
    this.secrets[id] = secret;
  }

  /**
   * Look up a secret by id.
   *
   * @param id - Stable identifier for the secret.
   * @returns The stored secret value, or `null` if no secret exists.
   * @public
   */
  getSecret(id: string): string | null {
    return this.secrets[id] ?? null;
  }

  /**
   * List the ids of all stored secrets.
   *
   * @public
   */
  listSecrets(): string[] {
    return Object.keys(this.secrets);
  }
}

/**
 * Central runtime service container exposed to plugins, views, and renderer
 * integrations.
 *
 * `App` owns the active vault session, workspace layout, plugin runtime,
 * commands, metadata cache, notifications, and related shared services.
 *
 * @public
 */
export class App {
  readonly i18n: LocalizationManager = localeManager;
  readonly workspace: Workspace;
  readonly vault: Vault = $state()!;
  readonly appDatabase: AppDatabase;
  readonly session?: VaultSession;
  readonly safeMode: AppSafeModeState;
  plugins: PluginManager = $state()!;
  scope: Scope = $state(new Scope(undefined, this));
  keymap: Keymap = $state(new Keymap(this.scope));
  readonly settings: AppSettings = $state(new AppSettings());
  readonly editors: Map<string, Set<ExtType>> = new Map();
  readonly editorSuggest: Map<string, Set<EditorSuggest<any>>> = new Map();
  readonly configuration: Configuration;
  readonly fileManager: FileManager = new FileManager(this);
  readonly contextKeys: ContextKeyService = new ContextKeyService();
  readonly statusBar: StatusBarManager = new StatusBarManager();
  readonly urls: AppUrlService = new AppUrlService(this);
  readonly workspaceTrust: WorkspaceTrustService;
  readonly pluginDistribution: DefaultPluginDistributionManager;

  mardownPostProcessor: Array<MarkdownPostProcessor> = $state([]);
  mardownCodeBlockPostProcessor: Record<string, Array<MarkdownPostProcessor>> =
    $state({});
  markdownDirectiveRenderers: Record<string, MarkdownDirectiveRenderer> =
    $state({});
  readonly markdownViewMenuItems: Set<MarkdownViewMenuItemProvider> = new Set();
  metadataTypeManager: MetadataTypeManager = $state()!;

  commands: CommandManager = $state(new CommandManager(this))!;
  settingsOpen: boolean = $state(false);
  settingsTabId: string | null = $state(null);
  metadataCache: MetadataCache = $state()!;
  embedRegistry: EmbedRegistry = new EmbedRegistry();
  readonly configurationOptionSources = new ConfigurationOptionSourceRegistry();
  readonly searchDocumentProviders = new SearchDocumentProviderRegistry();
  lastEvent: UserEvent | null = $state(null);
  renderContext: RenderContext = new RenderContext();
  secretStorage: SecretStorage = new SecretStorage();
  notifications: NotificationManager = $state()!;
  telemetry: TelemetryService = new NoopTelemetryService();
  readonly languageServices: LanguageServiceManager =
    new LanguageServiceManager({
      onBeforeResolve: async (languageId) => {
        await this.plugins?.activateForLanguage(languageId);
        await this.plugins?.activateForService("language-service");
        await this.plugins?.activateForService("lapis.languageService");
      },
    });

  get internalPlugins() {
    return this.plugins.internalPlugins;
  }

  readonly logger: Logger = logging.getLogger("app");

  /**
   * Create the application service container for a mounted vault session.
   *
   * @param props - Runtime services and adapters required to bootstrap the app.
   * @public
   */
  constructor(readonly props: AppStateProperties) {
    const adapter = props.session?.vaultAdapter ?? props.adapter;
    if (!adapter) {
      throw new Error("App requires a vault adapter or vault session");
    }
    this.session = props.session;
    this.safeMode = props.safeMode ?? createDefaultAppSafeModeState();
    const appDatabase = props.session?.appDatabase ?? props.appDatabase;
    if (!appDatabase) {
      throw new Error(
        `App requires an app database for vault ${getAdapterVaultId(adapter)}`,
      );
    }
    this.appDatabase = appDatabase;
    this.workspace = new Workspace(this);
    const editorViewsSource = this.configurationOptionSources.register(
      "workspace.editorViews",
      {
        label: "Workspace editor views",
        description:
          "Registered editor views available for editor associations.",
        getOptions: () =>
          this.workspace.editorViews.getAll().map((view) => ({
            value: view.id,
            label: view.label,
            description: view.description,
          })),
      },
    );
    this.workspace.editorViews.on("changed", () => {
      editorViewsSource.invalidate();
    });
    this.settings.addGroup((options) =>
      options.setId("options").setTitle("Options"),
    );
    this.settings.addGroup((options) =>
      options.setId("core-plugins").setTitle("Core plugins"),
    );
    this.settings.addGroup((options) =>
      options.setId("community-plugins").setTitle("Community plugins"),
    );
    this.configuration = new Configuration(this, props.configPath);
    this.workspace.bindConfiguration();
    this.vault = new Vault(adapter);
    this.workspaceTrust = new WorkspaceTrustService(adapter);
    this.metadataCache = new MetadataCache(this);
    this.notifications = new NotificationManager(this.appDatabase);
    this.plugins = new PluginManager(this, "/.obsidian/plugins", adapter, {
      communityPluginHost: hasNativeDesktopCapability("plugin-sidecar")
        ? new NativeDesktopCommunityPluginExecutionHost(
            adapter,
            undefined,
            props.createCommunityPluginDependencyResolver,
          )
        : undefined,
      createCommunityPluginDependencyResolver:
        props.createCommunityPluginDependencyResolver,
      pluginAssetServer: props.pluginAssetServer,
    });
    this.workspace.bindPlugins();
    const languageServiceDiagnostics =
      this.workspace.diagnostics.createCollection("lapis:language-service", {
        label: "Language service",
        buildItemMenu: (menu, entry) =>
          this.languageServices.buildDiagnosticItemMenu(menu, entry),
      });
    this.languageServices.bindDiagnostics({
      collection: languageServiceDiagnostics,
      applyCodeAction: (document, action) =>
        this.applyLanguageServiceCodeAction(document, action),
    });
    this.pluginDistribution = new DefaultPluginDistributionManager({
      ...props.pluginDistributionOptions,
      adapter,
      appVersion: this.version,
      platform:
        props.session?.runtime === "electron-desktop" ? "electron" : "web",
      workspaceTrusted: async () => (await this.workspaceTrust.ready()).trusted,
      pluginManager: this.plugins,
    });
    this.metadataTypeManager = new MetadataTypeManager(this);
    const metadataFieldValuesSource = this.configurationOptionSources.register(
      "metadata.fieldValues",
      {
        label: "Metadata field values",
        description: "Known frontmatter values for a metadata field.",
        cache: "session",
        getOptions: (context) =>
          resolveMetadataFieldValues(
            (field) => this.metadataTypeManager.getValues(field),
            context.schema,
            context.query,
            context.limit,
          ),
      },
    );
    this.metadataCache.on("changed", () => {
      metadataFieldValuesSource.invalidate();
    });
    this.metadataCache.on("deleted", () => {
      metadataFieldValuesSource.invalidate();
    });
    this.initializeContextKeys();
  }

  private async applyLanguageServiceCodeAction(
    document: VirtualDocument,
    action: LanguageServiceCodeAction,
  ): Promise<void> {
    const path = document.uri.startsWith("vault:///")
      ? decodeURI(document.uri.slice("vault:///".length))
      : null;
    const file = path ? this.vault.getFileByPath(path) : null;
    if (!file || !action.edit || typeof action.edit !== "object") return;
    const changes = (action.edit as { changes?: unknown }).changes;
    if (!Array.isArray(changes)) return;
    const edits = changes
      .map((change) => {
        if (!change || typeof change !== "object") return null;
        const record = change as Record<string, unknown>;
        const from = typeof record.from === "number" ? record.from : null;
        const to = typeof record.to === "number" ? record.to : from;
        const insert =
          typeof record.insert === "string"
            ? record.insert
            : typeof record.text === "string"
              ? record.text
              : null;
        if (from === null || to === null || insert === null) return null;
        return { from, to, insert };
      })
      .filter(
        (edit): edit is { from: number; to: number; insert: string } =>
          edit !== null,
      )
      .sort((left, right) => right.from - left.from);
    if (!edits.length) return;
    let value = document.text;
    for (const edit of edits) {
      value = `${value.slice(0, edit.from)}${edit.insert}${value.slice(edit.to)}`;
    }

    const openEditor = this.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view as
        | { editor?: Editor; file?: { path?: string } | null }
        | undefined;
      return view?.editor && view.file?.path === file.path
        ? view.editor
        : undefined;
    });
    openEditor?.view.dispatch({
      changes: [...edits]
        .sort((left, right) => left.from - right.from)
        .map((edit) => ({
          from: edit.from,
          to: edit.to,
          insert: edit.insert,
        })),
      userEvent: "input.complete",
    });
    await this.vault.modify(file, value);
    await this.languageServices.diagnostics({
      ...document,
      version: document.version + 1,
      text: value,
    });
  }

  private initializeContextKeys(): void {
    this.contextKeys.set("workspace.trusted", this.workspaceTrust.trusted);
    this.workspaceTrust.on("changed", (state) => {
      this.contextKeys.set("workspace.trusted", state.trusted);
    });
    this.contextKeys.set("safeMode.active", this.safeMode.active);
    this.contextKeys.set(
      "safeMode.notebookExecutionDisabled",
      this.safeMode.disableNotebookExecution,
    );
    const runtimeHost = hasNativeDesktopCapability("resource")
      ? "desktop"
      : "browser";
    this.contextKeys.set("runtime.host", runtimeHost);
    this.contextKeys.set("runtime.desktop", runtimeHost === "desktop");
    this.contextKeys.set("runtime.browser", runtimeHost === "browser");
    this.contextKeys.set(
      "runtime.nativeHost",
      hasNativeDesktopCapability("resource"),
    );
    this.syncWorkspaceContextKeys();
    this.workspace.on("active-leaf-change", () => {
      this.syncWorkspaceContextKeys();
    });
    this.workspace.on("editor-updated", (editor) => {
      if (editor === this.workspace.activeEditor?.editor) {
        this.syncWorkspaceContextKeys();
      }
    });
    void this.workspaceTrust.ready().then((state) => {
      this.contextKeys.set("workspace.trusted", state.trusted);
    });
  }

  private syncWorkspaceContextKeys(): void {
    const activeLeaf = this.workspace.activeLeaf;
    const activeView = activeLeaf?.view;
    const activeEditor = this.workspace.activeEditor?.editor;

    this.contextKeys.set("view.focused", Boolean(activeView));
    this.contextKeys.set("editor.active", Boolean(activeEditor));
    this.contextKeys.set(
      "editor.hasSelection",
      Boolean(activeEditor?.somethingSelected()),
    );

    if (activeView) {
      this.contextKeys.set("view.id", activeView.getViewType());
    } else {
      this.contextKeys.reset("view.id");
    }

    const language = this.workspace.activeEditor?.file?.extension;
    if (language) {
      this.contextKeys.set("editor.language", language);
    } else {
      this.contextKeys.reset("editor.language");
    }
  }

  setWorkspaceTrusted(trusted: boolean): void {
    this.contextKeys.set("workspace.trusted", trusted);
  }

  openFile(file: TFile, openState?: OpenViewState) {
    return this.telemetry.measureAsync(
      "app.open_file",
      async (span) => {
        span.setAttribute("file.extension", file.extension);
        const existingLeaf = findOpenFileLeaf<WorkspaceLeaf>(
          this.workspace,
          file,
        );

        if (existingLeaf) {
          span.setAttribute("workspace.file_already_open", true);
          await applyOpenViewStateToLeaf(existingLeaf, openState);
          this.workspace.activateLeaf(existingLeaf, {
            operation: "open-existing-file",
          });
          return;
        }

        const reusedRootLeaf = Boolean(this.workspace.activeRootLeaf);
        const leaf = this.workspace.getLeaf();
        span.setAttribute("workspace.reused_active_leaf", reusedRootLeaf);
        this.workspace.activeLeaf = leaf;
        if (leafFilePath(leaf) === file.path) {
          span.setAttribute("workspace.file_already_open", true);
          if (openState?.state) {
            await applyOpenViewStateToLeaf(leaf, openState);
          }
          return;
        }
        const viewState = openState?.state
          ? {
              type:
                this.workspace.determineViewTypeForPath(file.path) ??
                this.workspace.determineViewType(file.extension) ??
                "",
              state: openState.state,
            }
          : undefined;
        return leaf.openFile(file, { state: viewState });
      },
      {
        attributes: { "file.extension": file.extension },
        slowThresholdMs: 250,
      },
    );
  }

  editorExtensions(
    viewType: string,
    context: Record<string, any> = {},
  ): Extension[] {
    const extensions: Array<Extension> = [];
    const type = this.workspace.determineViewType(viewType);
    if (type) {
      [...(this.editors.get(type) ?? [])].forEach((ext) => {
        if (typeof ext === "function") {
          extensions.push(ext(context));
        } else {
          extensions.push(ext);
        }
      });
    }
    return extensions;
  }

  /**
   * Registers a CodeMirror 6 extension. To reconfigure cm6 extensions for a
   * plugin on the fly, an array should be passed in, and modified dynamically.
   * Once this array is modified, calling {@link Workspace#updateOptions} will
   * apply the changes.
   *
   * @param extension - Must be a CodeMirror 6 `Extension`, or an array of
   *   Extensions.
   * @public
   */
  registerEditorExtension(
    extension: ExtType,
    viewType: string = "markdown",
  ): void {
    viewType = this.workspace.determineViewType(viewType) ?? "markdown";
    if (!this.editors.get(viewType)) {
      this.editors.set(viewType, new Set());
    }
    this.editors.get(viewType)!.add(extension);
  }

  unregisterEditorExtension(
    extension: ExtType,
    viewType: string = "markdown",
  ): void {
    viewType = this.editors.has(viewType)
      ? viewType
      : (this.workspace.determineViewType(viewType) ?? "markdown");
    this.editors.get(viewType)?.delete(extension);
  }

  registerEditorSuggest(
    suggest: EditorSuggest<any>,
    viewType: string = "markdown",
  ) {
    viewType = this.workspace.determineViewType(viewType) ?? "markdown";
    if (!this.editorSuggest.get(viewType)) {
      this.editorSuggest.set(viewType, new Set());
    }
    this.editorSuggest.get(viewType)!.add(suggest);
  }

  unregisterEditorSuggest(
    suggest: EditorSuggest<any>,
    viewType: string = "markdown",
  ) {
    viewType = this.workspace.determineViewType(viewType) ?? "markdown";
    this.editorSuggest.get(viewType)?.delete(suggest);
  }

  registerMarkdownPostProcessor(postProcessor: MarkdownPostProcessor) {
    const processors: Array<MarkdownPostProcessor> = [
      ...new Set([...this.mardownPostProcessor, postProcessor]),
    ].sort((a, b) => {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
    this.mardownPostProcessor = processors;
  }

  unregisterMarkdownPostProcessor(postProcessor: MarkdownPostProcessor) {
    this.mardownPostProcessor = this.mardownPostProcessor.filter(
      (it) => it !== postProcessor,
    );
  }

  registerMarkdownCodeBlockProcessor(
    language: string,
    postProcessor: MarkdownPostProcessor,
  ) {
    this.mardownCodeBlockPostProcessor[language] ||= [];
    const processors: Array<MarkdownPostProcessor> = [
      ...new Set([
        ...this.mardownCodeBlockPostProcessor[language],
        postProcessor,
      ]),
    ].sort((a, b) => {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
    this.mardownCodeBlockPostProcessor[language] = processors;
  }

  unregisterMarkdownCodeBlockProcessor(
    language: string,
    postProcessor: MarkdownPostProcessor,
  ) {
    this.mardownCodeBlockPostProcessor[language] ||= [];
    this.mardownCodeBlockPostProcessor[language] =
      this.mardownCodeBlockPostProcessor[language].filter(
        (it) => it !== postProcessor,
      );
  }

  registerMarkdownDirectiveRenderer(
    directive: string,
    renderer: MarkdownDirectiveRenderer,
  ) {
    this.markdownDirectiveRenderers = {
      ...this.markdownDirectiveRenderers,
      [directive]: renderer,
    };
  }

  unregisterMarkdownDirectiveRenderer(directive: string) {
    const { [directive]: _removed, ...rest } = this.markdownDirectiveRenderers;
    this.markdownDirectiveRenderers = rest;
  }

  registerMarkdownViewMenuItem(provider: MarkdownViewMenuItemProvider): void {
    this.markdownViewMenuItems.add(provider);
  }

  unregisterMarkdownViewMenuItem(provider: MarkdownViewMenuItemProvider): void {
    this.markdownViewMenuItems.delete(provider);
  }

  get version() {
    return this.props.version;
  }

  get isDarkMode() {
    return document.documentElement.classList.contains("theme-dark");
  }

  loadLocalStorage(key: string): string | null {
    return localStorage.getItem(key);
  }

  saveLocalStorage(key: string, data: string): void {
    localStorage.setItem(key, data);
  }

  /**
   * Force mobile or desktop workspace layout and reload the app.
   *
   * Intended for devtools/console use when testing mobile shell behavior on
   * desktop viewports.
   *
   * @param enable - When true or omitted, forces mobile layout; when false,
   *   forces desktop layout.
   * @public
   */
  async emulateMobile(enable = true): Promise<void> {
    const mode = enable ? "always" : "never";
    await this.configuration
      .getConfiguration()
      .update("workspace.mobile.mode", mode);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  setting(id: "options" | "core-plugins" | "community-plugins") {
    return this.settings.find(id)!;
  }
}

export type AppState = App;

let legacyApplicationLease: (() => void) | null = null;

export function setApplicationState(props: AppStateProperties): AppState {
  const application = new App(props);
  provideApplicationState(application);
  legacyApplicationLease?.();
  legacyApplicationLease = installApplicationCompatibility(application);
  return application;
}
