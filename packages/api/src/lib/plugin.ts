import type {
  IndexedProjectionContributor,
  MetadataProcessor,
} from "./cache.svelte";
import type {
  SearchDocumentProvider,
  SearchDocumentProviderRegistration,
} from "./search-document-provider";
import type { Command, KeymapEventHandler } from "./command.svelte";
import type { ContextKeyValue, ScopedContextKey } from "./context-keys.svelte";
import type { App, ExtType } from "./context.svelte";
import type {
  LapisExtensionContributions,
  LapisExtensionKind,
  LapisExtensionManifest,
  LapisExtensionPermission,
  LapisExtensionRuntimeHost,
  LapisPluginClassification,
  LapisServiceProviderRegistration,
  LapisSystemExtensionRegistration,
} from "./lapis-extension";
import type { EditorViewContribution } from "./editor-view-registry";
import type {
  ConfigurationOptionSourceProvider,
  ConfigurationOptionSourceRegistration,
} from "./configuration-option-source-registry";
import type { HostedPluginCapability } from "./plugin-capability-facade";
import type {
  MarkdownDirectiveRenderer,
  MarkdownPostProcessor,
  MarkdownPostProcessorContext,
  MarkdownViewMenuItemProvider,
} from "./markdown";
import type { TypeWidget } from "./metadata.svelte";
import type { PluginSettingTab } from "./settings.svelte";
import { dirname, joinPath } from "./storage";
import type { EditorSuggest } from "./suggest";
import type {
  TelemetryAttributes,
  TelemetryMeasurementOptions,
  TelemetrySpan,
  TelemetrySpanOptions,
} from "./telemetry";
import type { PluginProvenance } from "./plugin-distribution/types";
import { Component } from "./view.svelte";
import type { ViewCreator } from "./workspace.svelte";
import type {
  DiagnosticCollection,
  DiagnosticCollectionOptions,
} from "./diagnostics";
import type { AppTool, AppToolRegistration } from "./agent-tools";
import type {
  AgentResultViewDefinition,
  AgentResultViewRegistration,
} from "./agent-result-views";
import type {
  AppSkillSourceRegistration,
  AppSlashCommandDefinition,
  AppSlashCommandRegistration,
  ProgrammaticAppSkill,
} from "./agent-skills";

/**
 * A concise, plugin-owned palette command that opens a registered view.
 *
 * @public
 */
export type ViewOpenCommand = Omit<
  Command,
  "id" | "name" | "sourcePlugin" | "title" | "callback"
> & {
  /** @public */
  id: `open-${string}`;
  /** @public */
  name: `Open ${string}`;
  /** @public */
  callback: NonNullable<Command["callback"]>;
};

/**
 * Declares how a registered view is reached.
 *
 * First-party source must classify every registration. The optional parameter
 * preserves the established third-party plugin API.
 *
 * @public
 */
export type ViewAccess =
  | { kind: "command"; command: ViewOpenCommand }
  | { kind: "file" }
  | { kind: "internal" }
  | { kind: "alias"; canonicalViewType: string };

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T>)?.then === "function";
}

export interface PluginManifest {
  /**
   * Vault path to the plugin folder in the config directory.
   *
   * @public
   */
  dir?: string;
  /**
   * The plugin ID.
   *
   * @public
   */
  id: string;
  /**
   * The display name.
   *
   * @public
   */
  name: string;
  /**
   * The author's name.
   *
   * @public
   */
  author: string;
  /**
   * The current version, using {@link https://semver.org/ Semantic Versioning}.
   *
   * @public
   */
  version: string;
  /**
   * The minimum required Obsidian version to run this plugin.
   *
   * @public
   */
  minAppVersion: string;
  /**
   * A description of the plugin.
   *
   * @public
   */
  description: string;
  /**
   * A URL to the author's website.
   *
   * @public
   */
  authorUrl?: string;

  /**
   * Whether the plugin can be used only on desktop.
   *
   * @public
   */
  isDesktopOnly?: boolean;

  /**
   * Runtime host IDs this plugin explicitly supports.
   *
   * Missing or empty values preserve baseline Obsidian manifest behavior.
   *
   * @public
   */
  supportedRuntimes?: string[];

  /**
   * Structured host capabilities required before the plugin can be evaluated.
   *
   * @public
   */
  requiredCapabilities?: HostedPluginCapability[];

  /**
   * Optional host-specific execution hints for future sidecar scheduling.
   *
   * @public
   */
  executionHints?: Record<string, unknown>;

  /**
   * Optional Lapis extension metadata. Existing Obsidian-compatible manifests
   * can omit this namespace and continue to load unchanged.
   *
   * @public
   */
  lapis?: LapisExtensionManifest;
}

export type {
  LapisExtensionContributions,
  LapisExtensionKind,
  LapisExtensionManifest,
  LapisExtensionPermission,
  LapisExtensionRuntimeHost,
  LapisPluginClassification,
  LapisSystemExtensionRegistration,
};

/**
 * Identifies where a plugin was loaded from.
 *
 * @public
 */
export type PluginSource = "core" | "community" | "official" | "system";

/**
 * Resolve the compatibility data path used by `loadData()` and `saveData()`.
 *
 * Community plugins store data beside their manifest folder, while bundled and
 * system plugins use the shared `/.obsidian/<id>.json` location.
 *
 * @public
 */
export function resolvePluginDataPath(
  pluginId: string,
  source: PluginSource,
  basePath?: string,
): string | null {
  if (source === "core" || source === "system") {
    return joinPath("/.obsidian", `${pluginId}.json`);
  }

  if (!basePath) {
    return null;
  }

  return joinPath(basePath, "data.json");
}

export type PluginRuntimeState =
  | "disabled"
  | "enabling"
  | "enabled"
  | "disabling"
  | "failed";

export type PluginConstructor<T extends Plugin = Plugin> = new (app: App) => T;

/**
 * Runtime metadata applied to a plugin instance before activation.
 *
 * @public
 */
export interface PluginRuntimeOptions {
  basePath?: string;
  source?: PluginSource;
  provenance?: PluginProvenance;
  required?: boolean;
  hostMode?: string;
  requestedCapabilities?: HostedPluginCapability[];
  grantedCapabilities?: HostedPluginCapability[];
}

function formatPluginError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Base class for Lapis plugins.
 *
 * Plugins extend {@link Component}, so teardown callbacks, events, commands, and
 * DOM listeners registered through helper methods are cleaned up when the
 * plugin unloads.
 *
 * @public
 */
export abstract class Plugin extends Component {
  basePath: string = "";
  #runtimeState: PluginRuntimeState = "disabled";
  #failureMessage: string | null = null;
  #lastFailureMessage: string | null = null;
  #failureCount: number = 0;
  #source: PluginSource = "community";
  #provenance: PluginProvenance = "community";
  #required: boolean = false;
  #hostMode: string = "renderer";
  readonly #registeredViewTypes = new Set<string>();
  #requestedCapabilities: HostedPluginCapability[] = [];
  #grantedCapabilities: HostedPluginCapability[] = [];

  constructor(
    readonly app: App,
    readonly manifest: PluginManifest,
  ) {
    super();
  }

  /**
   * Load plugin state and register plugin-owned resources.
   *
   * @public
   */
  abstract onload(): Promise<void> | void;

  /**
   * Release plugin-owned resources before the plugin unloads.
   *
   * @public
   */
  onunload(): Promise<void> | void {}

  /**
   * Apply runtime metadata resolved by the plugin manager before activation.
   *
   * @param options - Runtime source, host, and capability information.
   * @public
   */
  configureRuntime(options: PluginRuntimeOptions = {}): void {
    if (options.basePath !== undefined) {
      this.basePath = options.basePath;
    }
    if (options.source) {
      this.#source = options.source;
      this.#provenance = defaultPluginProvenance(options.source);
    }
    if (options.provenance) {
      this.#provenance = options.provenance;
    }
    if (options.required !== undefined) {
      this.#required = options.required;
    }
    if (options.hostMode !== undefined) {
      this.#hostMode = options.hostMode;
    }
    if (options.requestedCapabilities !== undefined) {
      this.#requestedCapabilities = [...options.requestedCapabilities];
    }
    if (options.grantedCapabilities !== undefined) {
      this.#grantedCapabilities = [...options.grantedCapabilities];
    }
  }

  /**
   * Enable the plugin and run its `onload()` lifecycle.
   *
   * @returns A promise that resolves when activation completes.
   * @public
   */
  async enable(): Promise<void> {
    if (!this.app.plugins.plugins.has(this.id)) {
      this.app.plugins.plugins.set(this.id, this);
    }
    if (this.enabled) return;

    this.#runtimeState = "enabling";
    this.#failureMessage = null;

    try {
      await this.loadAsync();
      this.#runtimeState = "enabled";
      this.emit("enable");
    } catch (error) {
      this.#runtimeState = "failed";
      this.#failureMessage = formatPluginError(error);
      this.#lastFailureMessage = this.#failureMessage;
      this.#failureCount += 1;
      throw error;
    }
  }

  get enabled() {
    return this.#runtimeState === "enabled";
  }

  get source(): PluginSource {
    return this.#source;
  }

  get provenance(): PluginProvenance {
    return this.#provenance;
  }

  get required(): boolean {
    return this.#required;
  }

  /** View types owned by this plugin across enable and disable cycles. */
  get registeredViewTypes(): ReadonlySet<string> {
    return this.#registeredViewTypes;
  }

  get state(): PluginRuntimeState {
    return this.#runtimeState;
  }

  get errorMessage(): string | null {
    return this.#failureMessage;
  }

  get lastFailureMessage(): string | null {
    return this.#lastFailureMessage;
  }

  get failureCount(): number {
    return this.#failureCount;
  }

  get hostMode(): string {
    return this.#hostMode;
  }

  get requestedCapabilities(): HostedPluginCapability[] {
    return [...this.#requestedCapabilities];
  }

  get grantedCapabilities(): HostedPluginCapability[] {
    return [...this.#grantedCapabilities];
  }

  get id() {
    return this.manifest.id;
  }

  private getDataPath(): string | null {
    return resolvePluginDataPath(this.manifest.id, this.source, this.basePath);
  }

  private async readLegacyData(): Promise<any> {
    const path = this.getDataPath();
    if (!path) {
      return null;
    }

    const file = this.app.vault.getFileByPath(path);
    if (!file) {
      return null;
    }

    return JSON.parse(await this.app.vault.read(file));
  }

  private async writeLegacyData(data: any): Promise<void> {
    const path = this.getDataPath();
    if (!path) {
      return;
    }

    const payload = JSON.stringify(data, null, 2);
    const file = this.app.vault.getFileByPath(path);
    if (file) {
      await this.app.vault.modify(file, payload);
      return;
    }

    await this.app.vault.mkpath(dirname(path));
    await this.app.vault.create(path, payload);
  }

  protected telemetryAttributes(
    attributes: TelemetryAttributes = {},
  ): TelemetryAttributes {
    return {
      "plugin.id": this.manifest.id,
      "plugin.name": this.manifest.name,
      "plugin.source": this.source,
      ...attributes,
    };
  }

  startTelemetrySpan(
    name: string,
    options: TelemetrySpanOptions = {},
  ): TelemetrySpan {
    return this.app.telemetry.startSpan(name, {
      ...options,
      attributes: this.telemetryAttributes(options.attributes),
    });
  }

  measureTelemetry<T>(
    name: string,
    callback: (span: TelemetrySpan) => T,
    options: TelemetryMeasurementOptions = {},
  ): T {
    return this.app.telemetry.measure(name, callback, {
      ...options,
      attributes: this.telemetryAttributes(options.attributes),
    });
  }

  measureTelemetryAsync<T>(
    name: string,
    callback: (span: TelemetrySpan) => Promise<T>,
    options: TelemetryMeasurementOptions = {},
  ): Promise<T> {
    return this.app.telemetry.measureAsync(name, callback, {
      ...options,
      attributes: this.telemetryAttributes(options.attributes),
    });
  }

  async disable(): Promise<void> {
    if (!this.loaded) {
      this.#runtimeState = "disabled";
      this.#failureMessage = null;
      return;
    }

    this.#runtimeState = "disabling";

    try {
      await this.unloadAsync();
      this.#runtimeState = "disabled";
      this.#failureMessage = null;
      this.emit("disable");
    } catch (error) {
      this.#runtimeState = "failed";
      this.#failureMessage = formatPluginError(error);
      this.#lastFailureMessage = this.#failureMessage;
      this.#failureCount += 1;
      throw error;
    }
  }

  addStatusBarItem(): HTMLElement {
    let parent: HTMLElement | null =
      this.app.workspace.statusCompatEl ??
      document.querySelector<HTMLElement>("#status-bar");

    if (!parent) {
      parent = document.querySelector<HTMLElement>(
        "#lapis-status-bar-compat-fallback",
      );
    }

    if (!parent) {
      parent = document.body.createDiv({
        attr: {
          id: "lapis-status-bar-compat-fallback",
          hidden: "true",
          "aria-hidden": "true",
        },
      });
    }

    this.app.workspace.statusCompatEl = parent;

    const statusEl = parent.createDiv({
      cls: "status-bar-item plugin-" + this.manifest.id,
    });
    this.register(() => {
      statusEl.detach();
    });
    return statusEl;
  }

  /**
   * Load settings data from disk. Data is stored in `data.json` in the plugin
   * folder.
   *
   * @public
   * @see {@link https://docs.obsidian.md/Plugins/User+interface/Settings}
   */
  loadData(): Promise<any> {
    return this.measureTelemetryAsync("plugin.load_data", async () => {
      if (this.app.configuration.hasPluginData(this.id)) {
        const data = this.app.configuration.getPluginData(this.id);
        await this.writeLegacyData(data);
        return data;
      }

      const legacyData = await this.readLegacyData();
      if (legacyData !== null) {
        await this.app.configuration.updatePluginData(this.id, legacyData);
      }
      return legacyData;
    });
  }

  /**
   * Write settings data to disk. Data is stored in `data.json` in the plugin
   * folder.
   *
   * @public
   * @see {@link https://docs.obsidian.md/Plugins/User+interface/Settings}
   */
  saveData(data: any): Promise<void> {
    return this.measureTelemetryAsync("plugin.save_data", async () => {
      await this.app.configuration.updatePluginData(this.id, data, {
        origin: "plugin-save",
      });
      await this.writeLegacyData(data);
    });
  }

  async loadGeneratedState<T>(key: string): Promise<T | null> {
    return (
      (await this.app.appDatabase.getMeta<T>(
        this.generatedStateMetaKey(this.requireGeneratedStateKey(key)),
      )) ?? null
    );
  }

  async saveGeneratedState(key: string, value: unknown): Promise<void> {
    await this.app.appDatabase.setMeta(
      this.generatedStateMetaKey(this.requireGeneratedStateKey(key)),
      value,
    );
  }

  async deleteGeneratedState(key: string): Promise<void> {
    await this.app.appDatabase.setMeta(
      this.generatedStateMetaKey(this.requireGeneratedStateKey(key)),
      undefined,
    );
  }

  async migrateDataToGeneratedState<T = unknown>(
    legacyKey: string,
    options: {
      generatedKey?: string;
      pruneLegacyKey?: boolean;
    } = {},
  ): Promise<T | null> {
    const sourceKey = this.requireGeneratedStateKey(legacyKey);
    const generatedKey = this.requireGeneratedStateKey(
      options.generatedKey ?? legacyKey,
    );
    const migrationMetaKey = this.generatedStateMigrationMetaKey(sourceKey);
    const existing = await this.loadGeneratedState<T>(generatedKey);
    if (existing !== null) {
      await this.saveGeneratedState(migrationMetaKey, true);
      return existing;
    }

    const migrated =
      (await this.app.appDatabase.getMeta<boolean>(migrationMetaKey)) === true;
    if (migrated) {
      return null;
    }

    const data = await this.loadData();
    if (!data || typeof data !== "object") {
      await this.saveGeneratedState(migrationMetaKey, true);
      return null;
    }

    const record = data as Record<string, unknown>;
    if (!(sourceKey in record)) {
      await this.saveGeneratedState(migrationMetaKey, true);
      return null;
    }

    const value = (record[sourceKey] ?? null) as T | null;
    await this.saveGeneratedState(generatedKey, value);
    await this.saveGeneratedState(migrationMetaKey, true);

    if (options.pruneLegacyKey) {
      const next = { ...record };
      delete next[sourceKey];
      await this.saveData(next);
    }

    return value;
  }

  private requireGeneratedStateKey(key: string): string {
    const normalized = key.trim();
    if (!normalized) {
      throw new Error("Generated state key must not be empty");
    }
    return normalized;
  }

  private generatedStateMetaKey(key: string): string {
    return `plugin.generated:${this.manifest.id}:${key}`;
  }

  private generatedStateMigrationMetaKey(key: string): string {
    return `plugin.generated:${this.manifest.id}:__migrated__:${key}`;
  }

  addRibbonIcon(
    icon: string,
    title: string,
    callback: (evt: MouseEvent) => any,
  ) {
    const id = `${this.manifest.id}:${title}`;
    this.register(
      this.app.workspace.leftRibbon.addItem({
        id,
        title,
        hidden: false,
        callback,
        icon,
      }),
    );
  }

  addCommand(command: Command): Command {
    command.sourcePlugin ??= this.manifest.id;
    command.title ??= command.name;

    if (!["app"].includes(this.manifest.id)) {
      let prefix = `${this.manifest.id}:`;
      if (!command.id.startsWith(prefix)) {
        command.id = prefix + command.id;
      }

      prefix = `${this.manifest.name}:`;
      if (!command.name.startsWith(prefix)) {
        command.name = prefix + " " + command.name;
      }
    }

    this.app.commands.registerCommand(command);
    this.register(() => {
      this.app.commands.unregisterCommand(command.id);
    });
    return command;
  }

  removeCommand(commandId: string): void {
    this.app.commands.unregisterCommand(commandId);
  }

  registerContextKey(
    key: string,
    defaultValue?: ContextKeyValue,
  ): ScopedContextKey {
    const handle = this.app.contextKeys.createScopedKey(
      `plugin.${this.manifest.id}`,
      key,
      defaultValue,
    );
    this.register(() => {
      handle.reset();
    });
    return handle;
  }

  registerShortcut(handler: KeymapEventHandler) {
    this.register(() => handler.scope.unregister(handler));
  }

  registerView(
    type: string,
    viewCreator: ViewCreator,
    access?: ViewAccess,
  ): void {
    this.#registeredViewTypes.add(type);
    const instrumentedViewCreator: ViewCreator = (leaf) =>
      this.measureTelemetry("plugin.view.create", () => viewCreator(leaf), {
        attributes: { "view.type": type },
        slowThresholdMs: 50,
      });
    this.app.workspace.registerView(type, instrumentedViewCreator);
    this.register(() => {
      this.app.workspace.unregisterView(type);
    });
    if (access?.kind === "command") {
      this.addCommand(access.command);
    }
  }

  registerSidebarView(
    type: string,
    viewCreator: ViewCreator,
    options: {
      side?: "left" | "right";
      group?: string;
      groupTitle?: string;
      groupIcon?: string;
      title?: string;
      icon?: string;
      hidden?: boolean;
    } = {},
    access?: ViewAccess,
  ): void {
    this.registerView(type, viewCreator, access);
    this.app.workspace.registerSidebarView(type, options);
    this.register(() => {
      this.app.workspace.unregisterSidebarView(type);
    });
  }

  registerEditorView(contribution: EditorViewContribution): void {
    const dispose = this.app.workspace.registerEditorView({
      ...contribution,
      pluginId: contribution.pluginId ?? this.manifest.id,
      source: contribution.source ?? "plugin",
    });
    this.register(dispose);
  }

  registerConfigurationOptionSource(
    id: string,
    provider: Omit<ConfigurationOptionSourceProvider, "pluginId">,
  ): ConfigurationOptionSourceRegistration {
    const sourceId =
      id.includes(".") || id.includes(":") ? id : `${this.manifest.id}.${id}`;
    const registration = this.app.configurationOptionSources.register(
      sourceId,
      {
        ...provider,
        pluginId: this.manifest.id,
      },
    );
    this.register(registration.dispose);
    return registration;
  }

  registerHoverLinkSource(id: string, info: any): void {
    this.app.workspace.registerHoverLinkSource(id, info);
    this.register(() => {
      this.app.workspace.unregisterHoverLinkSource(id);
    });
  }

  registerObsidianProtocolHandler(
    action: string,
    handler: (params: Record<string, string>) => any,
  ): void {
    const dispose = this.app.urls.registerProtocolHandler(action, handler);
    this.register(dispose);
  }

  registerCliHandler(
    name: string,
    prefix: string,
    callback: (...args: any[]) => any,
  ): void {
    this.register(() => {});
  }

  registerBasesView(viewId: string, registration: any): boolean {
    const registered = this.app.plugins.registerBasesView(
      this.manifest.id,
      viewId,
      registration,
    );

    if (registered) {
      this.register(() => {
        this.app.plugins.unregisterBasesView(this.manifest.id, viewId);
      });
    }

    return registered;
  }

  registerLapisServiceProvider(
    registration: Omit<LapisServiceProviderRegistration, "pluginId">,
  ): void {
    const disposer = this.app.plugins.registerLapisServiceProvider({
      ...registration,
      pluginId: this.manifest.id,
    });
    this.register(disposer);
  }

  /** Create an owner-scoped diagnostic collection disposed with this plugin. */
  createDiagnosticCollection(
    id: string,
    options: DiagnosticCollectionOptions = {},
  ): DiagnosticCollection {
    const collection = this.app.workspace.diagnostics.createCollection(
      `plugin:${this.manifest.id}:${id}`,
      options,
    );
    this.register(() => collection.dispose());
    return collection;
  }

  onUserEnable(): Promise<void> | void {}

  onExternalSettingsChange(): Promise<void> | void {}

  registerExtensions(
    extensions: string[],
    viewType: string = "markdown",
  ): void {
    this.app.workspace.registerExtensions(extensions, viewType);
    this.register(() => {
      this.app.workspace.unregisterExtensions(extensions, viewType);
    });
  }

  registerTypeWidget(widget: TypeWidget) {
    const existing =
      this.app.metadataTypeManager.registeredTypeWidgets[widget.type];
    this.app.metadataTypeManager.registerTypeWidget(widget);
    this.register(() => {
      this.app.metadataTypeManager.unregisterTypeWidget(widget);
      if (existing) {
        this.app.metadataTypeManager.registerTypeWidget(existing);
      }
    });
  }

  /**
   * Register an EditorSuggest which can provide live suggestions while the user
   * is typing.
   *
   * @public
   */
  registerEditorSuggest(
    editorSuggest: EditorSuggest<any>,
    viewType: string = "markdown",
  ): void {
    this.app.registerEditorSuggest(editorSuggest, viewType);
    this.register(() => {
      this.app.unregisterEditorSuggest(editorSuggest, viewType);
    });
  }

  /**
   * Registers a CodeMirror 6 extension. To reconfigure cm6 extensions for a
   * plugin on the fly, an array should be passed in, and modified dynamically.
   * Once this array is modified, calling {@link Workspace.updateOptions} will
   * apply the changes.
   *
   * @param extension - Must be a CodeMirror 6 `Extension`, or an array of
   *   Extensions.
   * @public
   */
  registerEditorExtension(extension: ExtType, viewType?: string): void {
    this.app.registerEditorExtension(extension, viewType);
    this.register(() => {
      this.app.unregisterEditorExtension(extension, viewType);
    });
  }

  /**
   * Registers a post processor, to change how the document looks in reading
   * mode.
   *
   * @public
   * @see {@link https://docs.obsidian.md/Plugins/Editor/Markdown+post+processing}
   */
  registerMarkdownPostProcessor(
    postProcessor: MarkdownPostProcessor,
    sortOrder?: number,
  ): MarkdownPostProcessor {
    postProcessor.sortOrder = sortOrder ?? postProcessor.sortOrder ?? 0;
    const wrappedPostProcessor: MarkdownPostProcessor = (el, ctx) => {
      const attributes = this.telemetryAttributes({
        "plugin.processor.kind": "markdown-post-processor",
        "plugin.processor.sort_order": postProcessor.sortOrder ?? 0,
        "markdown.source_path": ctx.sourcePath,
      });
      const execute = () => postProcessor(el, ctx);
      const result = execute();
      if (isPromiseLike(result)) {
        return this.app.telemetry.measureAsync(
          "plugin.markdown_post_processor",
          async () => result,
          { attributes, slowThresholdMs: 50 },
        );
      }
      return this.app.telemetry.measure(
        "plugin.markdown_post_processor",
        () => result,
        { attributes, slowThresholdMs: 50 },
      );
    };
    wrappedPostProcessor.sortOrder = postProcessor.sortOrder;
    this.app.registerMarkdownPostProcessor(wrappedPostProcessor);
    this.register(() => {
      this.app.unregisterMarkdownPostProcessor(wrappedPostProcessor);
    });
    return wrappedPostProcessor;
  }

  registerMarkdownCodeBlockProcessor(
    language: string,
    handler: (
      source: string,
      el: HTMLElement,
      ctx: MarkdownPostProcessorContext,
    ) => Promise<any> | void,
    sortOrder?: number,
  ): MarkdownPostProcessor {
    language = language.trim().toLocaleLowerCase();
    const postProcessor: MarkdownPostProcessor = (
      el: HTMLElement,
      ctx: MarkdownPostProcessorContext,
    ) => {
      const source = ctx.getSectionInfo(el)?.text || "";
      const execute = () =>
        handler(
          source.replace(/^([`]{3}[^\n]*\n+)|\n+[`]{3}\n*$/g, ""),
          el,
          ctx,
        );
      const attributes = this.telemetryAttributes({
        "plugin.processor.kind": "markdown-code-block-processor",
        "plugin.processor.language": language,
        "markdown.source_path": ctx.sourcePath,
      });
      const result = execute();
      if (isPromiseLike(result)) {
        return this.app.telemetry.measureAsync(
          "plugin.markdown_code_block_processor",
          async () => result,
          { attributes, slowThresholdMs: 50 },
        );
      }
      return this.app.telemetry.measure(
        "plugin.markdown_code_block_processor",
        () => result,
        { attributes, slowThresholdMs: 50 },
      );
    };
    postProcessor.sortOrder = sortOrder ?? postProcessor.sortOrder ?? 0;
    this.app.registerMarkdownCodeBlockProcessor(language, postProcessor);
    this.register(() => {
      this.app.unregisterMarkdownCodeBlockProcessor(language, postProcessor);
    });
    return postProcessor;
  }

  registerMarkdownDirectiveRenderer(
    directive: string,
    renderer: MarkdownDirectiveRenderer,
  ): void {
    this.app.registerMarkdownDirectiveRenderer(directive, renderer);
    this.register(() => {
      this.app.unregisterMarkdownDirectiveRenderer(directive);
    });
  }

  registerMarkdownViewMenuItem(provider: MarkdownViewMenuItemProvider): void {
    this.app.registerMarkdownViewMenuItem(provider);
    this.register(() => {
      this.app.unregisterMarkdownViewMenuItem(provider);
    });
  }

  registerMetadataProcessor(processor: MetadataProcessor, ext: string = "md") {
    this.app.metadataCache.addProcessor(ext, processor);
    this.register(() => {
      this.app.metadataCache.removeProcessor(ext, processor);
    });
  }

  registerIndexedProjectionContributor(
    contributor: IndexedProjectionContributor,
  ) {
    this.app.metadataCache.addIndexedProjectionContributor(contributor);
    this.register(() => {
      this.app.metadataCache.removeIndexedProjectionContributor(contributor);
    });
  }

  /**
   * Contribute normalized searchable content without writing generated state.
   * The local id is namespaced by this plugin's runtime id.
   */
  registerSearchDocumentProvider(
    localId: string,
    provider: Omit<SearchDocumentProvider, "id">,
  ): SearchDocumentProviderRegistration {
    const normalizedLocalId = localId.trim();
    if (!normalizedLocalId) {
      throw new Error("Search document provider local id must not be empty.");
    }
    const id = `${this.id}:${normalizedLocalId}`;
    const registration = this.app.searchDocumentProviders.register({
      ...provider,
      id,
    });
    this.register(() => registration.dispose());
    return registration;
  }

  /** Register an application tool under this plugin's lifecycle and identity. */
  registerAgentTool<TInput>(tool: AppTool<TInput>): AppToolRegistration {
    const registration = this.app.agentTools.register(
      {
        pluginId: this.id,
        source: this.source,
        provenance: this.provenance,
      },
      tool,
    );
    this.register(() => registration.dispose());
    return registration;
  }

  /** Register a directory that contains one skill. */
  registerAgentSkillDirectory(path: string): AppSkillSourceRegistration {
    const registration = this.app.agentSkills.registerDirectory(
      { pluginId: this.id },
      path,
    );
    this.register(() => registration.dispose());
    return registration;
  }

  /** Register a root that may contain many skill directories. */
  registerAgentSkillRoot(path: string): AppSkillSourceRegistration {
    const registration = this.app.agentSkills.registerRoot(
      { pluginId: this.id },
      path,
    );
    this.register(() => registration.dispose());
    return registration;
  }

  /** Register a programmatic skill under this plugin's lifecycle. */
  registerAgentSkill(skill: ProgrammaticAppSkill): AppSkillSourceRegistration {
    const registration = this.app.agentSkills.registerSkill(
      { pluginId: this.id },
      skill,
    );
    this.register(() => registration.dispose());
    return registration;
  }

  /** Register a composer slash command. This is not a workspace palette command. */
  registerAgentSlashCommand(
    command: AppSlashCommandDefinition,
  ): AppSlashCommandRegistration {
    const registration = this.app.agentSlashCommands.register(
      { pluginId: this.id },
      command,
    );
    this.register(() => registration.dispose());
    return registration;
  }

  /** Register a transcript result view. This is not a workspace palette command. */
  registerAgentResultView(
    view: AgentResultViewDefinition<App>,
  ): AgentResultViewRegistration {
    const registration = this.app.agentResultViews.register(this.id, view);
    this.register(() => registration.dispose());
    return registration;
  }

  /**
   * Register a settings tab, which allows users to change settings.
   *
   * @public
   * @see {@link https://docs.obsidian.md/Plugins/User+interface/Settings#Register+a+settings+tab}
   */
  addSettingTab(settingTab: PluginSettingTab): void {
    if (this.source === "community" && !this.app.workspaceTrust.trusted) {
      throw new Error(
        `Plugin ${this.manifest.id} cannot register settings while the workspace is untrusted`,
      );
    }

    this.app.configuration.schema.registerWebView(
      settingTab.plugin.manifest.id,
      settingTab.plugin.manifest.name,
      settingTab,
    );

    this.register(() => {
      this.app.configuration.schema.removeWebView(
        settingTab.plugin.manifest.id,
      );
    });

    const setting = this.app.setting(
      this.source === "core" || this.source === "official"
        ? "core-plugins"
        : "community-plugins",
    );
    setting.addItem((opt) =>
      opt
        .setTitle(settingTab.plugin.manifest.name)
        .setId(settingTab.plugin.manifest.id)
        .setTab(settingTab),
    );
    this.register(() => {
      setting.removeItem(settingTab.plugin.manifest.id);
    });
  }
}

function defaultPluginProvenance(source: PluginSource): PluginProvenance {
  switch (source) {
    case "core":
    case "system":
      return "bundled";
    case "official":
      return "official";
    default:
      return "community";
  }
}
