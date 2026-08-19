import { Workspace } from "./workspace.svelte";
import { TFile, Vault, type AppDatabase, type DataAdapter, type VaultSession } from "./storage";
import { AppSettings } from "./settings.svelte";
import type { Extension } from "@codemirror/state";
import { PluginManager } from "./plugin-manager";
import { Configuration } from "./configuration.svelte";
import { CommandManager, Keymap, Scope, type UserEvent } from "./command.svelte";
import { MetadataCache } from "./cache.svelte";
import type { MarkdownDirectiveRenderer, MarkdownPostProcessor, MarkdownViewMenuItemProvider } from "./markdown";
import { type Logger } from "./logging";
import type { Component } from "./view.svelte";
import { MetadataTypeManager } from "./metadata.svelte";
import type { EditorSuggest } from "./suggest";
import { FileManager } from "./file-manager";
import { EmbedRegistry } from "./embed-registry";
import type { OpenViewState } from "./workspace.svelte";
import { LocalizationManager } from "./localization-manager.svelte";
import { NotificationManager } from "./notifications";
import { type TelemetryService } from "./telemetry";
import { LanguageServiceManager } from "./language-service";
import { ContextKeyService } from "./context-keys.svelte";
import { StatusBarManager } from "./status-bar.svelte";
import { AppUrlService } from "./app-url";
import { WorkspaceTrustService } from "./workspace-trust";
import { DefaultPluginDistributionManager, type DefaultPluginDistributionManagerOptions } from "./plugin-distribution";
import type { PluginDependencyResolverFactory } from "./plugin-dependency-resolver";
import type { PluginAssetServer } from "./plugin-asset-server";
import { SearchDocumentProviderRegistry } from "./search-document-provider";
import { AppToolRegistry } from "./agent-tools";
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
/**
 * Bootstrap dependencies required to construct an {@link App} instance.
 *
 * @public
 */
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
    markdownRenderer: (markdown: string, el: HTMLElement, sourcePath: string, component: Component) => Promise<void>;
};
export type AppPluginDistributionOptions = Omit<DefaultPluginDistributionManagerOptions, "adapter" | "appVersion" | "platform" | "workspaceTrusted" | "pluginManager">;
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
export declare function createDefaultAppSafeModeState(): AppSafeModeState;
/**
 * Ephemeral renderer state shared while processing a markdown view.
 *
 * @public
 */
export declare class RenderContext {
    hoverPopover: null;
}
/**
 * In-memory secret store used by runtime services and plugins.
 *
 * Hosts may replace or mirror this with stronger persisted storage, but the API
 * surface intentionally stays small and synchronous for plugin code.
 *
 * @public
 */
export declare class SecretStorage {
    private secrets;
    /**
     * Store or replace a secret value.
     *
     * @param id - Stable identifier for the secret.
     * @param secret - Raw secret value to store.
     * @public
     */
    setSecret(id: string, secret: string): void;
    /**
     * Look up a secret by id.
     *
     * @param id - Stable identifier for the secret.
     * @returns The stored secret value, or `null` if no secret exists.
     * @public
     */
    getSecret(id: string): string | null;
    /**
     * List the ids of all stored secrets.
     *
     * @public
     */
    listSecrets(): string[];
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
export declare class App {
    readonly props: AppStateProperties;
    readonly i18n: LocalizationManager;
    readonly workspace: Workspace;
    readonly vault: Vault;
    readonly appDatabase: AppDatabase;
    readonly session?: VaultSession;
    readonly safeMode: AppSafeModeState;
    plugins: PluginManager;
    scope: Scope;
    keymap: Keymap;
    readonly settings: AppSettings;
    readonly editors: Map<string, Set<ExtType>>;
    readonly editorSuggest: Map<string, Set<EditorSuggest<any>>>;
    readonly configuration: Configuration;
    readonly fileManager: FileManager;
    readonly contextKeys: ContextKeyService;
    readonly statusBar: StatusBarManager;
    readonly urls: AppUrlService;
    readonly workspaceTrust: WorkspaceTrustService;
    readonly pluginDistribution: DefaultPluginDistributionManager;
    mardownPostProcessor: Array<MarkdownPostProcessor>;
    mardownCodeBlockPostProcessor: Record<string, Array<MarkdownPostProcessor>>;
    markdownDirectiveRenderers: Record<string, MarkdownDirectiveRenderer>;
    readonly markdownViewMenuItems: Set<MarkdownViewMenuItemProvider>;
    metadataTypeManager: MetadataTypeManager;
    commands: CommandManager;
    settingsOpen: boolean;
    settingsTabId: string | null;
    metadataCache: MetadataCache;
    embedRegistry: EmbedRegistry;
    readonly searchDocumentProviders: SearchDocumentProviderRegistry;
    readonly agentTools: AppToolRegistry;
    readonly agentSkills: import("./agent-skills").AppSkillRegistry;
    readonly agentSlashCommands: import("./agent-skills").AppSlashCommandRegistry;
    readonly agentResultViews: import("./agent-result-views").AppResultViewRegistry;
    lastEvent: UserEvent | null;
    renderContext: RenderContext;
    secretStorage: SecretStorage;
    notifications: NotificationManager;
    telemetry: TelemetryService;
    readonly languageServices: LanguageServiceManager;
    get internalPlugins(): {
        plugins: Record<string, {
            manifest: import("./plugin").PluginManifest;
        }>;
        getEnabledPluginById: (pluginId: string) => any | null;
    };
    readonly logger: Logger;
    /**
     * Create the application service container for a mounted vault session.
     *
     * @param props - Runtime services and adapters required to bootstrap the app.
     * @public
     */
    constructor(props: AppStateProperties);
    private initializeContextKeys;
    private syncWorkspaceContextKeys;
    setWorkspaceTrusted(trusted: boolean): void;
    openFile(file: TFile, openState?: OpenViewState): Promise<void>;
    editorExtensions(viewType: string, context?: Record<string, any>): Extension[];
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
    registerEditorExtension(extension: ExtType, viewType?: string): void;
    unregisterEditorExtension(extension: ExtType, viewType?: string): void;
    registerEditorSuggest(suggest: EditorSuggest<any>, viewType?: string): void;
    unregisterEditorSuggest(suggest: EditorSuggest<any>, viewType?: string): void;
    registerMarkdownPostProcessor(postProcessor: MarkdownPostProcessor): void;
    unregisterMarkdownPostProcessor(postProcessor: MarkdownPostProcessor): void;
    registerMarkdownCodeBlockProcessor(language: string, postProcessor: MarkdownPostProcessor): void;
    unregisterMarkdownCodeBlockProcessor(language: string, postProcessor: MarkdownPostProcessor): void;
    registerMarkdownDirectiveRenderer(directive: string, renderer: MarkdownDirectiveRenderer): void;
    unregisterMarkdownDirectiveRenderer(directive: string): void;
    registerMarkdownViewMenuItem(provider: MarkdownViewMenuItemProvider): void;
    unregisterMarkdownViewMenuItem(provider: MarkdownViewMenuItemProvider): void;
    get version(): string;
    get isDarkMode(): boolean;
    loadLocalStorage(key: string): string | null;
    saveLocalStorage(key: string, data: string): void;
    setting(id: "options" | "core-plugins" | "community-plugins"): import("./settings.svelte").SettingGroup;
}
export type AppState = App;
declare global {
    var app: App;
}
export declare function setApplicationState(props: AppStateProperties): AppState;
export { getApplicationCompatibility, installApplicationCompatibility, resolveApplication } from "./application-compatibility";
export { provideApplicationState, useApplicationState } from "./application-state.svelte";
