import type { App } from "./context.svelte";
import type { DataAdapter } from "./storage/fs";
import { Platform } from "./platform";
import {
  getNativeDesktopBridge,
  type NativeDesktopBridge,
} from "./storage/desktop-native";
import {
  activationEventForContribution,
  buildLapisContributionIndex,
  classifyLapisPlugin,
  commandContributionToCommand,
  isLapisManifest,
  normalizeManifestCommandId,
  permissionsToCapabilities,
  validateLapisManifest,
  type LapisEditorViewContribution,
  type LapisConfigurationContribution,
  type LapisContributionIndexEntry,
  type LapisIndexedExtension,
  type LapisStatusBarItemContribution,
  type LapisPluginClassification,
  type LapisServiceContribution,
  type LapisServiceProviderRegistration,
  type LapisSystemExtensionRegistration,
  type LapisSystemServiceProviderRegistration,
} from "./lapis-extension";
import {
  selectPluginRuntimeEntry,
  type PluginExecutionHostId,
  type SelectedPluginRuntimeEntry,
} from "./plugin-runtime-entry";
import type {
  LanguageServiceProvider,
  LanguageServiceProviderCapabilities,
  LanguageServiceProviderMetadata,
  LanguageServiceRuntime,
} from "./language-service";
import {
  Plugin,
  type PluginConstructor,
  type PluginManifest,
  type PluginSource,
  resolvePluginDataPath,
} from "./plugin";
import {
  HOSTED_PLUGIN_CAPABILITIES,
  type HostedPluginCapability,
} from "./plugin-capability-facade";
import {
  isPluginDependencyResolver,
  LegacyObjectDependencyResolver,
  type PluginDependencyContext,
  type PluginDependencyResolver,
  type PluginDependencyResolverFactory,
} from "./plugin-dependency-resolver";
import {
  ELECTRON_PLUGIN_ASSET_SCHEME,
  WEB_PLUGIN_ASSET_ROUTE_PREFIX,
  type PluginAssetServer,
} from "./plugin-asset-server";
import { scanBarePluginDependencySpecifiers } from "./plugin-dependency-scanner";
import pluginHostModuleRegistry from "./generated/plugin-host-modules.schema.generated";
import { InstalledPluginStateStore } from "./plugin-distribution/installed-plugin-state";
import type { PluginProvenance } from "./plugin-distribution/types";
import { dirname, getAdapterVaultId, joinPath, normalizePath } from "./storage";
import { debounce } from "lodash-es";
import { EventDispatcher } from "./events";
import type { ViewState } from "./view.svelte";
import type { WorkspaceLeaf } from "./workspace.svelte";

function formatPluginError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function resolvePluginModuleExport(moduleExports: unknown): unknown {
  const exportRecord = isRecord(moduleExports) ? moduleExports : {};
  for (const [, value] of Object.entries(exportRecord)) {
    if (value === Plugin) {
      return value;
    }
  }
  return (
    (moduleExports as any)?.default ||
    Object.values(exportRecord)[0] ||
    moduleExports
  );
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissingPathError(error: unknown): boolean {
  const err = error as { name?: string; code?: string };
  return err?.name === "NotFoundError" || err?.code === "ENOENT";
}

function pluginSourceForProvenance(provenance: PluginProvenance): PluginSource {
  return provenance === "official" ? "official" : "community";
}

function provenanceForPluginSource(source: PluginSource): PluginProvenance {
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

function isExternalPluginSource(
  source: PluginSource,
): source is "community" | "official" {
  return source === "community" || source === "official";
}

export interface PluginLoader {
  pluginsPath: string;
}

export interface StaticPluginRegistration {
  plugin: PluginConstructor;
  required?: boolean;
  enabledByDefault?: boolean;
  distribution?: CorePluginDistribution;
  styles?: CorePluginStyles;
}

/** @deprecated Use {@link StaticPluginRegistration}. */
export type CorePluginRegistration = StaticPluginRegistration;

export type PluginProfile = readonly (
  | PluginConstructor
  | StaticPluginRegistration
)[];

export type CorePluginDistribution = "bundled" | "first-party-external";

export type CorePluginStyles = string | (() => string | Promise<string>);

export interface CommunityPluginEvaluationRequest {
  pluginId: string;
  pluginPath: string;
  modulePath: string;
  manifest: PluginManifest;
  selectedRuntime?: SelectedPluginRuntimeEntry | null;
}

export interface CommunityPluginExecutionHost {
  readonly id: string;
  hostIdForManifest?(manifest: PluginManifest): string;
  registerDependencies?(deps: Record<string, any>): void;
  evaluate(request: CommunityPluginEvaluationRequest): Promise<unknown>;
}

export interface PluginManagerOptions {
  communityPluginHost?: CommunityPluginExecutionHost;
  createCommunityPluginDependencyResolver?: PluginDependencyResolverFactory;
  pluginAssetServer?: PluginAssetServer;
}

export interface PluginDataAliasMigration {
  fromPluginId: string;
  toPluginId: string;
  removeSource?: boolean;
}

export interface PluginLoadProgress {
  id: string;
  name: string;
  index: number;
  total: number;
}

export interface PluginLoadOptions {
  communityPlugins?: "configured" | "disabled";
  optionalCorePlugins?: "configured" | "disabled";
  onProgress?: (progress: PluginLoadProgress) => void;
}

export interface CommunityPluginDiagnostics {
  pluginId: string;
  name?: string;
  version?: string;
  author?: string;
  description?: string;
  source: PluginSource;
  provenance: PluginProvenance;
  classification: LapisPluginClassification;
  hostMode: string;
  activationMode: "code" | "manifest-only" | "not-activated";
  activationTrigger: string | null;
  selectedRuntimeHost: PluginExecutionHostId | null;
  selectedRuntimeEntry: string | null;
  moduleFormat: "esm" | "commonjs" | "node-esm" | null;
  fallbackRuntimeEntry: string | null;
  fallbackUsed: boolean;
  requiresReloadOnUpdate: boolean;
  sharedDependencies: string[];
  usedSharedDependencies: string[];
  undeclaredSharedDependencies: string[];
  missingSharedDependencies: string[];
  deprecatedSharedDependencies: string[];
  privateSharedDependencies: string[];
  assetUrlMode: "web" | "electron" | "custom" | null;
  pluginAssetUrl: string | null;
  requestedCapabilities: HostedPluginCapability[];
  grantedCapabilities: HostedPluginCapability[];
  privileges: string[];
  indexedContributionCount: number;
  contributionDiagnostics: string[];
  lastFailureMessage: string | null;
  state: string;
}

function requiresWorkspaceTrust(manifest: PluginManifest): boolean {
  const hostRequiresBrokeredCapabilities =
    normalizeStringArray(manifest.requiredCapabilities).length > 0;
  return Boolean(
    hostRequiresBrokeredCapabilities || manifest.lapis?.runtime?.trustedDesktop,
  );
}

function trustFailureMessage(manifest: PluginManifest): string {
  if (manifest.lapis?.runtime?.trustedDesktop) {
    return `Plugin ${manifest.id} requires a trusted workspace before loading trusted desktop runtime code`;
  }

  return `Plugin ${manifest.id} requires a trusted workspace before using brokered plugin capabilities`;
}

function hasDeclaredLapisRuntimeCode(manifest: PluginManifest): boolean {
  const runtime = manifest.lapis?.runtime;
  if (!isRecord(runtime)) {
    return false;
  }
  if (
    typeof runtime.workspace === "string" ||
    typeof runtime.desktop === "string" ||
    typeof runtime.trustedDesktop === "string"
  ) {
    return true;
  }
  if (!isRecord(runtime.entries)) {
    return false;
  }
  return Object.values(runtime.entries).some(
    (entry) => isRecord(entry) && typeof entry.path === "string",
  );
}

export interface CorePluginListEntry {
  manifest: PluginManifest;
  enabled: boolean;
  required: boolean;
  source: PluginSource;
  provenance: PluginProvenance;
  distribution: CorePluginDistribution;
  errorMessage: string | null;
}

export class RendererCommunityPluginExecutionHost
  implements CommunityPluginExecutionHost
{
  readonly id = "renderer";
  private readonly resolver: PluginDependencyResolver;

  constructor(
    private readonly adapter: DataAdapter,
    dependenciesOrResolver: Record<string, any> | PluginDependencyResolver,
  ) {
    this.resolver = isPluginDependencyResolver(dependenciesOrResolver)
      ? dependenciesOrResolver
      : new LegacyObjectDependencyResolver(dependenciesOrResolver);
  }

  async evaluate(request: CommunityPluginEvaluationRequest): Promise<unknown> {
    try {
      const dependencyContext: PluginDependencyContext = {
        pluginId: request.pluginId,
        pluginPath: request.pluginPath,
        manifest: request.manifest,
        host: request.selectedRuntime?.host ?? "workspace",
        format: "commonjs",
      };
      const moduleSources = await this.readPluginModuleSources(
        request.pluginPath,
      );
      await this.resolver.prepare(
        getBareDependencySpecifiersFromSources(moduleSources),
        dependencyContext,
      );
      const moduleCache = new Map<
        string,
        { exports: Record<string, unknown> | unknown }
      >();
      const loadModule = (modulePath: string) => {
        const normalizedModulePath = normalizePath(modulePath);
        const cached = moduleCache.get(normalizedModulePath);
        if (cached) {
          return cached.exports;
        }

        const code = moduleSources.get(normalizedModulePath);
        if (code === undefined) {
          throw new Error(
            `Cannot find local module ${normalizedModulePath} in plugin ${request.pluginId}`,
          );
        }

        const exports = {};
        const module = { exports };
        moduleCache.set(normalizedModulePath, module);
        const executeModule = new Function(
          "exports",
          "module",
          "require",
          code,
        );
        executeModule(exports, module, (dep: string) =>
          this.requireDependency(
            normalizedModulePath,
            dep,
            moduleSources,
            loadModule,
            dependencyContext,
          ),
        );
        return module.exports;
      };

      const moduleExports = loadModule(request.modulePath);
      return resolvePluginModuleExport(moduleExports);
    } catch (error) {
      throw new Error(
        `Error evaluating plugin module for ${request.pluginId}: ${formatPluginError(error)}`,
      );
    }
  }

  private requireDependency(
    importerPath: string,
    dep: string,
    moduleSources: Map<string, string>,
    loadModule: (modulePath: string) => unknown,
    dependencyContext: PluginDependencyContext,
  ): unknown {
    if (dep.startsWith("./") || dep.startsWith("../")) {
      return loadModule(
        this.resolveLocalModulePath(importerPath, dep, moduleSources),
      );
    }

    return this.wrapDependencyForRequire(
      dep,
      this.resolver.require(dep, dependencyContext),
    );
  }

  private wrapDependencyForRequire(dep: string, dependency: unknown): unknown {
    if (!isRecord(dependency)) {
      return dependency;
    }
    return new Proxy(dependency, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (value === undefined) {
          console.log(`error: Unable to find: ${prop.toString()} in ${dep}`);
        }
        return value;
      },
    });
  }

  private resolveLocalModulePath(
    importerPath: string,
    dep: string,
    moduleSources: Map<string, string>,
  ): string {
    const basePath = normalizePath(joinPath(dirname(importerPath), dep));
    const candidates = [
      basePath,
      `${basePath}.js`,
      `${basePath}.cjs`,
      `${basePath}.mjs`,
      joinPath(basePath, "index.js"),
      joinPath(basePath, "index.cjs"),
      joinPath(basePath, "index.mjs"),
    ];
    return candidates.find((path) => moduleSources.has(path)) ?? basePath;
  }

  private async readPluginModuleSources(
    pluginPath: string,
  ): Promise<Map<string, string>> {
    const sources = new Map<string, string>();
    const visit = async (folderPath: string) => {
      const listing = await this.adapter.list(folderPath);
      await Promise.all(
        listing.files
          .filter((file) => /\.(?:cjs|mjs|js)$/i.test(file))
          .map(async (file) => {
            const filePath = normalizePath(joinPath(folderPath, file));
            sources.set(filePath, await this.adapter.read(filePath));
          }),
      );
      for (const folder of listing.folders) {
        await visit(joinPath(folderPath, folder));
      }
    };

    await visit(pluginPath);
    return sources;
  }
}

export class RendererEsmPluginExecutionHost
  implements CommunityPluginExecutionHost
{
  readonly id = "renderer";
  private readonly resolver: PluginDependencyResolver;

  constructor(
    private readonly adapter: DataAdapter,
    private readonly pluginAssetServer: PluginAssetServer,
    dependenciesOrResolver: Record<string, any> | PluginDependencyResolver,
    private readonly diagnostics: {
      onPluginAssetUrl?: (pluginId: string, url: string) => void;
    } = {},
  ) {
    this.resolver = isPluginDependencyResolver(dependenciesOrResolver)
      ? dependenciesOrResolver
      : new LegacyObjectDependencyResolver(dependenciesOrResolver);
  }

  async evaluate(request: CommunityPluginEvaluationRequest): Promise<unknown> {
    const selectedRuntime = request.selectedRuntime;
    if (selectedRuntime?.format !== "esm") {
      throw new Error(
        `Plugin ${request.pluginId} was routed to the renderer ESM host without an ESM runtime entry`,
      );
    }

    const dependencyContext: PluginDependencyContext = {
      pluginId: request.pluginId,
      pluginPath: request.pluginPath,
      manifest: request.manifest,
      host: selectedRuntime.host,
      format: "esm",
    };
    await this.prepareDependencies(request.modulePath, dependencyContext);

    const moduleUrl = await this.pluginAssetServer.getPluginAssetUrl({
      pluginId: request.pluginId,
      pluginPath: request.pluginPath,
      relativePath: selectedRuntime.path,
      version: request.manifest.version,
    });
    this.diagnostics.onPluginAssetUrl?.(request.pluginId, moduleUrl);

    try {
      const moduleExports = await import(/* @vite-ignore */ moduleUrl);
      return resolvePluginModuleExport(moduleExports);
    } catch (error) {
      throw new Error(
        `Error importing ESM plugin module for ${request.pluginId} from ${moduleUrl}: ${formatPluginError(error)}`,
      );
    }
  }

  registerDependencies(_deps: Record<string, any>): void {}

  private async prepareDependencies(
    modulePath: string,
    dependencyContext: PluginDependencyContext,
  ): Promise<void> {
    let source = "";
    try {
      source = await this.adapter.read(modulePath);
    } catch {
      // Preflight already checks the selected entry path. Preserve import failure
      // as the actionable error if the file disappears between preflight/import.
    }
    await this.resolver.prepare(
      source ? scanBarePluginDependencySpecifiers(source) : [],
      dependencyContext,
    );
  }
}

export class HybridCommunityPluginExecutionHost
  implements CommunityPluginExecutionHost
{
  readonly id: string;

  constructor(
    private readonly commonJsHost: CommunityPluginExecutionHost,
    private readonly esmHost: RendererEsmPluginExecutionHost,
    private readonly diagnostics: {
      onFallbackUsed?: (pluginId: string, fallbackPath: string) => void;
    } = {},
  ) {
    this.id = commonJsHost.id;
  }

  hostIdForManifest(manifest: PluginManifest): string {
    return (
      this.commonJsHost.hostIdForManifest?.(manifest) ?? this.commonJsHost.id
    );
  }

  registerDependencies(deps: Record<string, any>): void {
    this.commonJsHost.registerDependencies?.(deps);
    this.esmHost.registerDependencies?.(deps);
  }

  async evaluate(request: CommunityPluginEvaluationRequest): Promise<unknown> {
    if (
      request.selectedRuntime?.format !== "esm" ||
      request.selectedRuntime.host === "electron-sidecar"
    ) {
      return this.commonJsHost.evaluate(request);
    }

    try {
      return await this.esmHost.evaluate(request);
    } catch (error) {
      const fallbackPath = request.selectedRuntime.fallbackPath;
      if (!fallbackPath) {
        throw error;
      }
      this.diagnostics.onFallbackUsed?.(request.pluginId, fallbackPath);
      return this.commonJsHost.evaluate({
        ...request,
        modulePath: normalizePath(joinPath(request.pluginPath, fallbackPath)),
        selectedRuntime: {
          ...request.selectedRuntime,
          path: fallbackPath,
          format: "commonjs",
        },
      });
    }
  }
}

export class NativeDesktopCommunityPluginExecutionHost
  implements CommunityPluginExecutionHost
{
  readonly id = "electron-plugin-sidecar";
  private prepared = false;
  private readonly contextId: string;
  private readonly rootPath?: string;
  private readonly dependencies: Record<string, any> = {};
  private readonly rendererHost: RendererCommunityPluginExecutionHost;

  constructor(
    private readonly adapter: DataAdapter,
    private readonly bridge: NativeDesktopBridge = requireNativeDesktopBridge(),
    createRendererDependencyResolver?: PluginDependencyResolverFactory,
  ) {
    const rendererDependenciesOrResolver =
      createRendererDependencyResolver?.(this.dependencies) ??
      this.dependencies;
    this.rendererHost = new RendererCommunityPluginExecutionHost(
      adapter,
      rendererDependenciesOrResolver,
    );
    this.contextId = getAdapterVaultId(adapter);
    this.rootPath =
      typeof (adapter as { rootPath?: unknown }).rootPath === "string"
        ? (adapter as unknown as { rootPath: string }).rootPath
        : undefined;
  }

  async evaluate(request: CommunityPluginEvaluationRequest): Promise<unknown> {
    if (!this.shouldUseSidecar(request.manifest)) {
      return this.rendererHost.evaluate(request);
    }

    await this.prepare();
    try {
      await this.bridge.invoke("desktop_plugin_host_evaluate", {
        contextId: this.contextId,
        pluginId: request.pluginId,
        pluginPath: request.pluginPath,
        modulePath: request.modulePath,
        manifest: request.manifest,
        selectedRuntime: request.selectedRuntime,
      });
    } catch (error) {
      const runtime = request.selectedRuntime;
      throw new Error(
        `Plugin ${request.pluginId} failed in ${this.id} while evaluating ${runtime?.format ?? "commonjs"} entry ${runtime?.path ?? request.modulePath}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }

    const host = this;
    return class NativeDesktopHostedCommunityPlugin extends Plugin {
      async onload(): Promise<void> {
        await host.activate({
          pluginId: this.manifest.id,
          manifest: this.manifest,
        });
      }

      async onunload(): Promise<void> {
        await host.deactivate({
          pluginId: this.manifest.id,
        });
      }
    };
  }

  hostIdForManifest(manifest: PluginManifest): string {
    return this.shouldUseSidecar(manifest) ? this.id : "renderer";
  }

  registerDependencies(deps: Record<string, any>): void {
    for (const [key, value] of Object.entries(deps)) {
      if (isRecord(this.dependencies[key]) && isRecord(value)) {
        this.dependencies[key] = { ...this.dependencies[key], ...value };
        continue;
      }
      this.dependencies[key] = value;
    }
  }

  private shouldUseSidecar(manifest: PluginManifest): boolean {
    if (normalizeStringArray(manifest.requiredCapabilities).length) {
      return true;
    }
    const supportedRuntimes = normalizeStringArray(
      manifest.supportedRuntimes,
    ).map((runtime) => runtime.toLowerCase());
    if (
      supportedRuntimes.some((runtime) =>
        [
          "desktop",
          "electron",
          "electron-sidecar",
          "electron-plugin-sidecar",
          "plugin-sidecar",
        ].includes(runtime),
      )
    ) {
      return true;
    }
    return Boolean(
      manifest.lapis?.runtime?.desktop ||
        manifest.lapis?.runtime?.trustedDesktop,
    );
  }

  private async prepare(): Promise<void> {
    if (this.prepared) {
      return;
    }
    await this.bridge.invoke("desktop_plugin_host_prepare", {
      contextId: this.contextId,
      rootPath: this.rootPath,
    });
    this.prepared = true;
  }

  private async activate(payload: Record<string, unknown>): Promise<void> {
    await this.prepare();
    await this.bridge.invoke("desktop_plugin_host_activate", {
      ...payload,
      contextId: this.contextId,
    });
  }

  private async deactivate(payload: Record<string, unknown>): Promise<void> {
    await this.bridge.invoke("desktop_plugin_host_deactivate", {
      ...payload,
      contextId: this.contextId,
    });
  }
}

function requireNativeDesktopBridge(): NativeDesktopBridge {
  const bridge = getNativeDesktopBridge();
  if (!bridge) {
    throw new Error("Native desktop bridge is unavailable");
  }
  return bridge;
}

interface CorePluginStateConfig {
  disabled: string[];
  enabled: string[];
}

interface BasesViewRegistrationEntry {
  pluginId: string;
  registration: any;
}

interface IndexedContributionDisposer {
  kind: string;
  id: string;
  dispose: () => void;
}

interface DeferredIndexedExtensionState {
  pluginId: string;
  source: PluginSource;
  mode: "manifest-only" | "lazy-code";
}

interface CommunityPluginDependencyDiagnostics {
  usedSharedDependencies: string[];
  undeclaredSharedDependencies: string[];
  missingSharedDependencies: string[];
  deprecatedSharedDependencies: string[];
  privateSharedDependencies: string[];
}

interface CommunityPluginRuntimeExecutionDiagnostics {
  fallbackUsed: boolean;
  assetUrlMode: CommunityPluginDiagnostics["assetUrlMode"];
  pluginAssetUrl: string | null;
}

export interface PluginEvents {
  "plugins-loaded": [];
  "css-change": [];
  "plugin-loaded": [plugin: Plugin];
  "plugin-enabled": [plugin: Plugin];
  "plugin-disabled": [plugin: Plugin];
  "community-plugin-config-pruned": [pluginIds: string[]];
  "plugin-error": [id: string, message: string, error?: any];
}

export class PluginManager extends EventDispatcher<PluginEvents> {
  readonly plugins: Map<string, Plugin> = new Map();
  dependencies: Record<string, any> = {};
  #loaded: boolean = false;
  #configuredCommunityPlugins: Set<string> = new Set();
  #disabledCorePlugins: Set<string> = new Set();
  #enabledCorePlugins: Set<string> = new Set();
  #defaultDisabledCorePlugins: Set<string> = new Set();
  #corePluginStyles: Map<string, CorePluginStyles> = new Map();
  #corePluginDistribution: Map<string, CorePluginDistribution> = new Map();
  #installedPluginProvenance: Map<string, PluginProvenance> = new Map();
  #installedPluginStateStore: InstalledPluginStateStore;
  #basesViewRegistrations: Map<string, BasesViewRegistrationEntry> = new Map();
  #communityPluginDiagnostics: Map<string, CommunityPluginDiagnostics> =
    new Map();
  #communityPluginDependencyDiagnostics: Map<
    string,
    CommunityPluginDependencyDiagnostics
  > = new Map();
  #communityPluginRuntimeExecutionDiagnostics: Map<
    string,
    CommunityPluginRuntimeExecutionDiagnostics
  > = new Map();
  #lapisExtensionIndex: Map<string, LapisIndexedExtension> = new Map();
  #manifestContributionDisposers: Map<string, IndexedContributionDisposer[]> =
    new Map();
  #manifestContributionDiagnostics: Map<string, string[]> = new Map();
  #systemExtensionManifests: Map<string, PluginManifest> = new Map();
  #systemExtensionPlugins: Map<string, PluginConstructor> = new Map();
  #systemExtensionServiceProviders: Map<
    string,
    Map<string, LapisSystemServiceProviderRegistration>
  > = new Map();
  #indexedActivationRegistry: Map<string, Set<string>> = new Map();
  #deferredIndexedExtensions: Map<string, DeferredIndexedExtensionState> =
    new Map();
  #communityPluginHost: CommunityPluginExecutionHost;
  #pluginAssetServer?: PluginAssetServer;

  constructor(
    readonly app: App,
    readonly pluginsPath: string,
    readonly adapter: DataAdapter,
    options: PluginManagerOptions = {},
  ) {
    super();
    this.#installedPluginStateStore = new InstalledPluginStateStore(adapter);
    const dependencyResolver =
      options.createCommunityPluginDependencyResolver?.(this.dependencies) ??
      this.dependencies;
    this.#pluginAssetServer = options.pluginAssetServer;
    const commonJsHost =
      options.communityPluginHost ??
      new RendererCommunityPluginExecutionHost(adapter, dependencyResolver);
    this.#communityPluginHost = options.pluginAssetServer
      ? new HybridCommunityPluginExecutionHost(
          commonJsHost,
          new RendererEsmPluginExecutionHost(
            adapter,
            options.pluginAssetServer,
            dependencyResolver,
            {
              onPluginAssetUrl: (pluginId, url) =>
                this.recordPluginAssetUrlDiagnostics(pluginId, url),
            },
          ),
          {
            onFallbackUsed: (pluginId) =>
              this.recordPluginFallbackDiagnostics(pluginId),
          },
        )
      : commonJsHost;
    this.app.configuration.on("plugin-data-updated", (event) => {
      if (event.origin === "plugin-save") {
        return;
      }
      void this.syncLegacyPluginData(event.pluginId);
    });
  }

  getPluginFolder() {
    return this.pluginsPath;
  }

  get corePlugins(): Plugin[] {
    return [...this.plugins.values()].filter(
      (plugin) => plugin.source === "core" || plugin.source === "official",
    );
  }

  get communityPlugins(): Plugin[] {
    return [...this.plugins.values()].filter(
      (plugin) => plugin.source === "community",
    );
  }

  isPluginEnabled(pluginId: string): boolean {
    return Boolean(this.plugins.get(pluginId)?.enabled);
  }

  get corePluginEntries(): CorePluginListEntry[] {
    const runtimePlugins = this.corePlugins.map((plugin) => ({
      manifest: plugin.manifest,
      enabled: plugin.enabled,
      required: plugin.required,
      source: plugin.source,
      provenance: plugin.provenance,
      distribution:
        this.#corePluginDistribution.get(plugin.manifest.id) ??
        (plugin.source === "official"
          ? "first-party-external"
          : "bundled"),
      errorMessage: plugin.errorMessage,
    }));

    const runtimeSystemPlugins = [...this.plugins.values()].filter(
      (plugin) => plugin.source === "system",
    );
    const runtimePluginIds = new Set(
      [...runtimePlugins, ...runtimeSystemPlugins].map(
        (plugin) => plugin.manifest.id,
      ),
    );
    const systemExtensions = [
      ...runtimeSystemPlugins.map((plugin) => ({
        manifest: plugin.manifest,
        enabled: plugin.enabled,
        required: plugin.required,
        source: plugin.source,
        provenance: plugin.provenance,
        distribution: "bundled" as const,
        errorMessage: plugin.errorMessage,
      })),
      ...this.systemExtensions
        .filter((extension) => !runtimePluginIds.has(extension.pluginId))
        .map((extension) => {
          const diagnostics = this.#communityPluginDiagnostics.get(
            extension.pluginId,
          );
          return {
            manifest: this.#systemExtensionManifests.get(
              extension.pluginId,
            ) ?? {
              id: extension.pluginId,
              name: extension.name ?? extension.pluginId,
              author: "Lapis Notes",
              version: "0.0.0",
              minAppVersion: "0.0.0",
              description: "",
            },
            enabled: extension.enabled,
            required: extension.locked,
            source: "system" as const,
            provenance: "bundled" as const,
            distribution: "bundled" as const,
            errorMessage:
              diagnostics?.state === "failed"
                ? diagnostics.lastFailureMessage
                : null,
          };
        }),
    ];

    return [...runtimePlugins, ...systemExtensions];
  }

  get communityPluginHostId(): string {
    return this.#communityPluginHost.id;
  }

  get pluginAssetServer(): PluginAssetServer | undefined {
    return this.#pluginAssetServer;
  }

  get communityPluginDiagnostics(): CommunityPluginDiagnostics[] {
    return [...this.#communityPluginDiagnostics.values()];
  }

  get lapisExtensions(): LapisIndexedExtension[] {
    return [...this.#lapisExtensionIndex.values()];
  }

  get systemExtensions(): LapisIndexedExtension[] {
    return this.lapisExtensions.filter(
      (extension) => extension.source === "system",
    );
  }

  getLapisExtension(pluginId: string): LapisIndexedExtension | null {
    return this.#lapisExtensionIndex.get(pluginId) ?? null;
  }

  getLapisContributionDiagnostics(pluginId: string): string[] {
    return [...(this.#manifestContributionDiagnostics.get(pluginId) ?? [])];
  }

  getCommunityPluginDiagnostics(
    pluginId: string,
  ): CommunityPluginDiagnostics | null {
    return this.#communityPluginDiagnostics.get(pluginId) ?? null;
  }

  registerDependencies(deps: Record<string, any>) {
    for (const [key, value] of Object.entries(deps)) {
      if (isRecord(this.dependencies[key]) && isRecord(value)) {
        this.dependencies[key] = { ...this.dependencies[key], ...value };
        continue;
      }
      this.dependencies[key] = value;
    }
    this.#communityPluginHost.registerDependencies?.(deps);
  }

  async migratePluginDataAliases(
    migrations: PluginDataAliasMigration[],
  ): Promise<string[]> {
    const migrated: string[] = [];
    for (const migration of migrations) {
      if (
        !this.app.configuration.hasPluginData(migration.fromPluginId) ||
        this.app.configuration.hasPluginData(migration.toPluginId)
      ) {
        continue;
      }

      await this.app.configuration.updatePluginData(
        migration.toPluginId,
        this.app.configuration.getPluginData(migration.fromPluginId),
        { origin: "configuration-update" },
      );
      if (migration.removeSource) {
        await this.app.configuration.removePluginData(migration.fromPluginId, {
          origin: "configuration-update",
        });
      }
      migrated.push(`${migration.fromPluginId}:${migration.toPluginId}`);
    }
    return migrated;
  }

  registerStaticPlugins(profile: PluginProfile): void {
    for (const registration of profile) {
      const {
        plugin: PluginType,
        required = false,
        enabledByDefault = true,
        distribution = "bundled",
        styles,
      } = typeof registration === "function"
        ? {
            plugin: registration,
            required: false,
            enabledByDefault: true,
            distribution: "bundled" as const,
            styles: undefined,
          }
        : registration;
      try {
        const plugin = new PluginType(this.app);
        const pluginPath = normalizePath(
          joinPath(this.pluginsPath, plugin.manifest.id),
        );
        plugin.manifest.dir ??= pluginPath;
        if (!required && !enabledByDefault) {
          this.#defaultDisabledCorePlugins.add(plugin.manifest.id);
        }
        const registeredPlugin = this.registerPlugin(plugin, {
          source: "core",
          provenance:
            distribution === "first-party-external"
              ? "official"
              : "bundled",
          required,
          basePath: pluginPath,
        });
        this.#corePluginDistribution.set(
          registeredPlugin.manifest.id,
          distribution,
        );
        this.registerCorePluginManifestContributions(
          registeredPlugin,
          pluginPath,
          { required, enabledByDefault },
        );
        if (styles !== undefined) {
          this.#corePluginStyles.set(registeredPlugin.manifest.id, styles);
        }
      } catch (error) {
        this.reportPluginError(
          "core",
          `Failed to register core plugin: ${formatPluginError(error)}`,
          error,
        );
      }
    }
  }

  /** @deprecated Use {@link registerStaticPlugins}. */
  registerCorePlugins(profile: PluginProfile): void {
    this.registerStaticPlugins(profile);
  }

  private registerCorePluginManifestContributions(
    plugin: Plugin,
    pluginPath: string,
    options: { required: boolean; enabledByDefault: boolean },
  ): void {
    if (plugin.manifest.lapis === undefined) {
      return;
    }

    const diagnostics = validateLapisManifest(
      plugin.manifest.id,
      plugin.manifest.lapis,
    );
    if (diagnostics.length) {
      throw new Error(diagnostics.join("; "));
    }
    if (!isLapisManifest(plugin.manifest.lapis)) {
      throw new Error(
        `Plugin ${plugin.manifest.id} has invalid lapis metadata`,
      );
    }

    const indexedExtension = buildLapisContributionIndex({
      pluginId: plugin.manifest.id,
      name: plugin.manifest.name,
      source: "system",
      manifestPath: joinPath(pluginPath, "manifest.json"),
      classification: classifyLapisPlugin(plugin.manifest, { hasMainJs: true }),
      lapis: {
        ...plugin.manifest.lapis,
        source: "system",
        locked: plugin.manifest.lapis.locked ?? options.required,
        enabledByDefault:
          plugin.manifest.lapis.enabledByDefault ?? options.enabledByDefault,
      },
      requestedCapabilities: this.getRequestedCapabilities(plugin.manifest),
      grantedCapabilities: this.getGrantedCapabilities(plugin.manifest),
    });

    this.#lapisExtensionIndex.set(plugin.manifest.id, indexedExtension);
    this.#manifestContributionDiagnostics.set(
      plugin.manifest.id,
      indexedExtension.contributions.flatMap((entry) => entry.diagnostics),
    );
    this.syncIndexedExtensionActivation(indexedExtension);
    this.recordCommunityPluginDiagnostics(plugin.manifest, "disabled");

    const configurationDisposers: IndexedContributionDisposer[] = [];
    for (const entry of indexedExtension.contributions) {
      if (entry.kind !== "configuration" || entry.state === "invalid") {
        continue;
      }

      configurationDisposers.push({
        kind: entry.kind,
        id: entry.id,
        dispose: this.installManifestConfiguration(entry),
      });
    }
    if (configurationDisposers.length > 0) {
      this.#manifestContributionDisposers.set(
        plugin.manifest.id,
        configurationDisposers,
      );
    }
  }

  registerSystemExtensions(
    registrations: LapisSystemExtensionRegistration[],
  ): void {
    for (const registration of registrations) {
      const manifest = this.createSystemExtensionManifest(registration);
      if (
        this.plugins.has(manifest.id) ||
        this.#lapisExtensionIndex.has(manifest.id)
      ) {
        throw new Error(`Plugin id ${manifest.id} is already registered`);
      }

      const diagnostics = validateLapisManifest(manifest.id, manifest.lapis);
      if (diagnostics.length) {
        throw new Error(diagnostics.join("; "));
      }
      if (!isLapisManifest(manifest.lapis)) {
        throw new Error(`Plugin ${manifest.id} has invalid lapis metadata`);
      }

      const requestedCapabilities = permissionsToCapabilities(
        manifest.lapis.permissions,
      );
      const indexedExtension = buildLapisContributionIndex({
        pluginId: manifest.id,
        name: manifest.name,
        source: "system",
        manifestPath: this.getSystemExtensionManifestPath(
          registration.basePath,
          manifest.id,
        ),
        classification: classifyLapisPlugin(manifest, { hasMainJs: false }),
        lapis: manifest.lapis,
        requestedCapabilities,
        grantedCapabilities: [...requestedCapabilities],
        privileges: registration.privileges,
      });
      this.#manifestContributionDiagnostics.set(
        manifest.id,
        indexedExtension.contributions.flatMap((entry) => entry.diagnostics),
      );

      if (!indexedExtension.locked && !indexedExtension.enabledByDefault) {
        this.#defaultDisabledCorePlugins.add(manifest.id);
      }

      this.#lapisExtensionIndex.set(manifest.id, indexedExtension);
      this.#systemExtensionManifests.set(manifest.id, manifest);
      if (registration.plugin) {
        this.#systemExtensionPlugins.set(manifest.id, registration.plugin);
      }
      this.storeSystemExtensionServiceProviders(
        manifest.id,
        registration.serviceProviders ?? [],
      );
      this.syncIndexedExtensionActivation(indexedExtension);
      this.recordIndexedExtensionDiagnostics(manifest.id, "disabled");
    }
  }

  async loadPlugins(options: PluginLoadOptions = {}): Promise<void> {
    return this.app.telemetry.measureAsync(
      "plugins.load_all",
      async (span) => {
        span.setAttribute("plugins.path", this.pluginsPath);
        await this.app.workspaceTrust.ready();
        this.#loaded = false;
        const communityPluginsEnabled = options.communityPlugins !== "disabled";
        const optionalCorePluginsEnabled =
          options.optionalCorePlugins !== "disabled";
        span.setAttribute(
          "plugins.community_plugins_enabled",
          communityPluginsEnabled,
        );
        span.setAttribute(
          "plugins.optional_core_plugins_enabled",
          optionalCorePluginsEnabled,
        );

        try {
          await this.app.vault.mkpath(this.pluginsPath);
        } catch (error) {
          this.reportPluginError(
            this.pluginsPath,
            `Failed to initialize plugin folder ${this.pluginsPath}: ${formatPluginError(error)}`,
            error,
          );
        }

        await this.refreshInstalledPluginProvenance();

        try {
          const pluginFolders = await this.adapter.list(this.pluginsPath);
          span.setAttribute(
            "plugins.discovered_folder_count",
            pluginFolders.folders.length,
          );
          for (const folder of pluginFolders.folders) {
            const registeredPlugin = this.plugins.get(folder);
            if (registeredPlugin) {
              continue;
            }
            await this.loadPlugin(joinPath(this.pluginsPath, folder));
          }
        } catch (error) {
          this.reportPluginError(
            this.pluginsPath,
            `Failed to discover plugins in ${this.pluginsPath}: ${formatPluginError(error)}`,
            error,
          );
        }

        const corePluginState = await this.readCorePluginStateConfig();
        this.#disabledCorePlugins = new Set(corePluginState.disabled);
        this.#enabledCorePlugins = new Set(corePluginState.enabled);
        this.#configuredCommunityPlugins = new Set(
          await this.readPluginListConfig("community-plugins.json", {
            createIfMissing: true,
          }),
        );
        const prunedCommunityPlugins =
          await this.pruneMissingConfiguredCommunityPlugins();
        span.setAttribute(
          "plugins.pruned_community_config_count",
          prunedCommunityPlugins.length,
        );
        const activationOrder = [
          ...new Set([
            ...this.corePlugins
              .filter(
                (plugin) =>
                  plugin.source === "core" &&
                  (plugin.required ||
                    (optionalCorePluginsEnabled &&
                      this.isCorePluginEnabled(plugin.manifest.id))),
              )
              .map((plugin) => plugin.manifest.id),
            ...[...this.#configuredCommunityPlugins].filter((pluginId) => {
              const plugin = this.plugins.get(pluginId);
              if (!plugin) {
                return false;
              }
              if (plugin.source === "official") {
                return optionalCorePluginsEnabled;
              }
              return plugin.source === "community" && communityPluginsEnabled;
            }),
          ]),
        ];

        span.setAttribute("plugins.activation_count", activationOrder.length);
        for (const [index, pluginId] of activationOrder.entries()) {
          const plugin = this.plugins.get(pluginId);
          options.onProgress?.({
            id: pluginId,
            name: plugin?.manifest.name ?? pluginId,
            index,
            total: activationOrder.length,
          });
          await this.enablePlugin(pluginId);
        }
        await this.enableConfiguredIndexedExtensions({
          communityPluginsEnabled,
          optionalCorePluginsEnabled,
        });
        await this.activateIndexedExtensionsForWorkspace();
        this.#loaded = true;
        this.emit("plugins-loaded");
        await this.activateByEvent("onStartupFinished");
      },
      {
        attributes: { "plugins.path": this.pluginsPath },
        slowThresholdMs: 500,
      },
    );
  }

  get enabledPlugins(): string[] {
    return [...this.#configuredCommunityPlugins];
  }

  getBasesViewRegistrations(): Map<string, any> {
    return new Map(
      [...this.#basesViewRegistrations.entries()].map(
        ([viewId, entry]) => [viewId, entry.registration] as const,
      ),
    );
  }

  registerBasesView(
    pluginId: string,
    viewId: string,
    registration: any,
  ): boolean {
    const existing = this.#basesViewRegistrations.get(viewId);
    if (existing && existing.pluginId !== pluginId) {
      throw new Error(`Bases view ${viewId} is already registered`);
    }

    this.#basesViewRegistrations.set(viewId, { pluginId, registration });
    return true;
  }

  unregisterBasesView(pluginId: string, viewId: string): boolean {
    const existing = this.#basesViewRegistrations.get(viewId);
    if (!existing) {
      return false;
    }

    if (existing.pluginId !== pluginId) {
      throw new Error(
        `Bases view ${viewId} is owned by plugin ${existing.pluginId}`,
      );
    }

    this.#basesViewRegistrations.delete(viewId);
    return true;
  }

  registerLapisServiceProvider(
    registration: LapisServiceProviderRegistration,
  ): () => void {
    if (!isLanguageServiceId(registration.service)) {
      throw new Error(
        `Unsupported Lapis service provider: ${registration.service}`,
      );
    }

    const declaration = this.getLapisServiceContribution(
      registration.pluginId,
      registration.id,
      registration.service,
    );
    const metadata = this.createLanguageServiceProviderMetadata(
      registration,
      declaration,
    );
    const provider = {
      ...(registration.provider as LanguageServiceProvider),
      metadata,
    };

    const disposeProvider =
      this.app.languageServices.registerProvider(provider);
    return () => {
      disposeProvider();
      void registration.dispose?.();
    };
  }

  private getLapisServiceContribution(
    pluginId: string,
    providerId: string,
    service: string,
  ): LapisServiceContribution | null {
    const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
    const contribution = indexedExtension?.contributions.find(
      (entry): entry is LapisContributionIndexEntry<LapisServiceContribution> =>
        entry.kind === "services" &&
        entry.id === providerId &&
        isLanguageServiceId(
          (entry.contribution as LapisServiceContribution).service,
        ) &&
        isLanguageServiceId(service),
    );
    return contribution?.contribution ?? null;
  }

  private createLanguageServiceProviderMetadata(
    registration: LapisServiceProviderRegistration,
    declaration: LapisServiceContribution | null,
  ): LanguageServiceProviderMetadata {
    const explicitMetadata = isRecord(registration.metadata)
      ? (registration.metadata as Partial<LanguageServiceProviderMetadata>)
      : {};
    const providerId = scopeLapisProviderId(
      registration.pluginId,
      explicitMetadata.id ?? registration.id,
    );
    const capabilities = normalizeLanguageServiceCapabilities(
      explicitMetadata.capabilities ?? declaration?.capabilities,
    );
    const languages = normalizeStringArray(
      explicitMetadata.languages ?? declaration?.languages,
    );
    if (!languages.length) {
      throw new Error(
        `Lapis language-service provider ${registration.id} must declare languages`,
      );
    }

    return {
      ...explicitMetadata,
      id: providerId,
      languages,
      runtime:
        explicitMetadata.runtime ??
        languageServiceRuntimeFromDeclaration(declaration?.runtime),
      priority: explicitMetadata.priority ?? declaration?.priority,
      capabilities,
    };
  }

  getEnabledInternalPluginById(pluginId: string): any | null {
    const plugin = this.plugins.get(pluginId);
    if (!plugin?.enabled) {
      const systemExtension = this.#lapisExtensionIndex.get(pluginId);
      if (systemExtension?.source === "system" && systemExtension.enabled) {
        return {
          manifest: this.#systemExtensionManifests.get(pluginId) ?? {
            id: pluginId,
            name: systemExtension.name ?? pluginId,
            author: "Lapis Notes",
            version: "0.0.0",
            minAppVersion: "0.0.0",
            description: "",
          },
        };
      }

      return null;
    }

    if (pluginId === "bases") {
      return {
        manifest: plugin.manifest,
        registrations: Object.fromEntries(this.getBasesViewRegistrations()),
      };
    }

    return { manifest: plugin.manifest };
  }

  get internalPlugins(): {
    plugins: Record<string, { manifest: PluginManifest }>;
    getEnabledPluginById: (pluginId: string) => any | null;
  } {
    const plugins = Object.fromEntries(
      this.corePluginEntries.map((plugin) => [plugin.manifest.id, plugin]),
    );

    return {
      plugins,
      getEnabledPluginById: (pluginId: string) =>
        this.getEnabledInternalPluginById(pluginId),
    };
  }

  private getPluginStatePath(filename: string): string {
    return normalizePath(joinPath(`${this.pluginsPath}/../`, filename));
  }

  private async refreshInstalledPluginProvenance(): Promise<void> {
    try {
      const installed = await this.#installedPluginStateStore.list();
      this.#installedPluginProvenance = new Map(
        installed.map((record) => [record.pluginId, record.provenance]),
      );
    } catch (error) {
      this.#installedPluginProvenance = new Map();
      this.reportPluginError(
        "installed-plugins",
        `Failed to load installed plugin provenance: ${formatPluginError(error)}`,
        error,
      );
    }
  }

  private resolveExternalPluginSource(
    pluginId: string,
    provenanceOverride?: PluginProvenance,
  ): { source: PluginSource; provenance: PluginProvenance } {
    const provenance =
      provenanceOverride ??
      this.#installedPluginProvenance.get(pluginId) ??
      "community";
    return {
      source: pluginSourceForProvenance(provenance),
      provenance,
    };
  }

  private async readPluginListConfig(
    filename: string,
    options: { createIfMissing?: boolean } = {},
  ): Promise<string[]> {
    const configPath = this.getPluginStatePath(filename);
    try {
      const exists = await this.adapter.exists(configPath);
      if (!exists) {
        if (options.createIfMissing) {
          await this.adapter.write(configPath, "[]");
        }
        return [];
      }
      const data = await this.adapter.read(configPath);
      const plugins = JSON.parse(data);
      if (Array.isArray(plugins)) {
        return plugins.map((it) => it.toString());
      }
    } catch (error) {
      this.reportPluginError(
        configPath,
        `Failed to load plugin config ${configPath}: ${formatPluginError(error)}`,
        error,
      );
    }

    return [];
  }

  private async readCorePluginStateConfig(): Promise<CorePluginStateConfig> {
    const configPath = this.getPluginStatePath("core-plugins.json");
    try {
      const exists = await this.adapter.exists(configPath);
      if (!exists) {
        return { disabled: [], enabled: [] };
      }

      const data = await this.adapter.read(configPath);
      const config = JSON.parse(data);

      if (Array.isArray(config)) {
        return {
          disabled: config.map((it) => it.toString()),
          enabled: [],
        };
      }

      if (isRecord(config)) {
        return {
          disabled: Array.isArray(config.disabled)
            ? config.disabled.map((it) => it.toString())
            : [],
          enabled: Array.isArray(config.enabled)
            ? config.enabled.map((it) => it.toString())
            : [],
        };
      }
    } catch (error) {
      this.reportPluginError(
        configPath,
        `Failed to load plugin config ${configPath}: ${formatPluginError(error)}`,
        error,
      );
    }

    return { disabled: [], enabled: [] };
  }

  private async savePluginListConfig(
    filename: string,
    pluginIds: Iterable<string>,
  ): Promise<void> {
    const configPath = this.getPluginStatePath(filename);
    try {
      const file = this.app.vault.getFileByPath(configPath);
      const payload = JSON.stringify([...pluginIds], null, 2);
      if (file) {
        await this.app.vault.modify(file, payload);
        return;
      }

      await this.app.vault.create(configPath, payload);
    } catch (error) {
      this.reportPluginError(
        configPath,
        `Failed to save plugin config ${configPath}: ${formatPluginError(error)}`,
        error,
      );
    }
  }

  private async saveCorePluginStateConfig(): Promise<void> {
    const configPath = this.getPluginStatePath("core-plugins.json");
    try {
      const file = this.app.vault.getFileByPath(configPath);
      const payload =
        this.#enabledCorePlugins.size === 0
          ? JSON.stringify([...this.#disabledCorePlugins], null, 2)
          : JSON.stringify(
              {
                disabled: [...this.#disabledCorePlugins],
                enabled: [...this.#enabledCorePlugins],
              },
              null,
              2,
            );

      if (file) {
        await this.app.vault.modify(file, payload);
        return;
      }

      await this.app.vault.create(configPath, payload);
    } catch (error) {
      this.reportPluginError(
        configPath,
        `Failed to save plugin config ${configPath}: ${formatPluginError(error)}`,
        error,
      );
    }
  }

  private saveCommunityPluginState = debounce(() => {
    return void this.savePluginListConfig(
      "community-plugins.json",
      this.#configuredCommunityPlugins,
    );
  }, 500);

  private saveCorePluginState = debounce(() => {
    return void this.saveCorePluginStateConfig();
  }, 500);

  flushPendingConfigWrites(): void {
    this.saveCommunityPluginState.flush();
    this.saveCorePluginState.flush();
  }

  private isCorePluginEnabled(pluginId: string): boolean {
    if (this.#disabledCorePlugins.has(pluginId)) {
      return false;
    }

    if (this.#enabledCorePlugins.has(pluginId)) {
      return true;
    }

    return !this.#defaultDisabledCorePlugins.has(pluginId);
  }

  private async pruneMissingConfiguredCommunityPlugins(): Promise<string[]> {
    const missingPluginIds: string[] = [];

    for (const pluginId of this.#configuredCommunityPlugins) {
      const manifestPath = joinPath(
        this.pluginsPath,
        pluginId,
        "manifest.json",
      );
      let exists = false;

      try {
        exists = await this.adapter.exists(manifestPath);
      } catch (error) {
        if (!isMissingPathError(error)) {
          throw error;
        }
      }

      if (!exists) {
        missingPluginIds.push(pluginId);
      }
    }

    if (!missingPluginIds.length) {
      return [];
    }

    for (const pluginId of missingPluginIds) {
      this.#configuredCommunityPlugins.delete(pluginId);
    }

    await this.savePluginListConfig(
      "community-plugins.json",
      this.#configuredCommunityPlugins,
    );
    this.emit("community-plugin-config-pruned", missingPluginIds);
    return missingPluginIds;
  }

  private async enableConfiguredIndexedExtensions(options: {
    communityPluginsEnabled: boolean;
    optionalCorePluginsEnabled: boolean;
  }): Promise<void> {
    for (const indexedExtension of this.#lapisExtensionIndex.values()) {
      if (this.plugins.has(indexedExtension.pluginId)) {
        continue;
      }

      if (indexedExtension.source === "community") {
        if (
          !options.communityPluginsEnabled ||
          !this.#configuredCommunityPlugins.has(indexedExtension.pluginId)
        ) {
          continue;
        }
      } else if (indexedExtension.source === "official") {
        if (
          !options.optionalCorePluginsEnabled ||
          !this.#configuredCommunityPlugins.has(indexedExtension.pluginId)
        ) {
          continue;
        }
      } else if (
        !indexedExtension.locked &&
        !this.isCorePluginEnabled(indexedExtension.pluginId)
      ) {
        continue;
      }

      if (this.shouldDeferIndexedExtensionActivation(indexedExtension)) {
        this.enableDeferredIndexedExtension(indexedExtension.pluginId);
        continue;
      }

      if (
        indexedExtension.source === "system" &&
        this.#systemExtensionPlugins.has(indexedExtension.pluginId)
      ) {
        const plugin = this.instantiateSystemExtensionPlugin(
          indexedExtension.pluginId,
        );
        if (plugin) {
          await this.enablePlugin(plugin.manifest.id);
        }
        continue;
      }

      if (this.hasIndexedExtensionCodeEntry(indexedExtension)) {
        continue;
      }

      this.enableManifestOnlyExtension(indexedExtension.pluginId);
    }
  }

  async loadPlugin(
    pluginPath: string,
    options: {
      loadDeferredRuntime?: boolean;
      provenance?: PluginProvenance;
      source?: PluginSource;
    } = {},
  ): Promise<Plugin | null> {
    return this.app.telemetry.measureAsync(
      "plugin.load",
      async (span) => {
        span.setAttribute(
          "plugin.path",
          pluginPath.split("/").at(-1) ?? pluginPath,
        );
        let manifest: PluginManifest | null = null;
        let pluginId = pluginPath.split("/").at(-1) ?? pluginPath;
        try {
          const manifestPath = joinPath(pluginPath, "manifest.json");
          if (!(await this.adapter.exists(manifestPath))) {
            return null;
          }
          const manifestContent = await this.adapter.read(manifestPath);
          manifest = JSON.parse(manifestContent) as PluginManifest;
          pluginId = manifest.id || pluginId;
          span.setAttribute("plugin.id", manifest.id);
          manifest.dir ??= pluginPath;
          const runtimeSource =
            options.source !== undefined
              ? {
                  source: options.source,
                  provenance:
                    options.provenance ??
                    provenanceForPluginSource(options.source),
                }
              : this.resolveExternalPluginSource(
                  manifest.id,
                  options.provenance,
                );
          span.setAttribute("plugin.source", runtimeSource.source);
          span.setAttribute("plugin.provenance", runtimeSource.provenance);

          const mainModulePath = joinPath(pluginPath, "main.js");
          const hasMainJs = await this.pathExists(mainModulePath);
          const classification = this.indexCommunityManifest(
            manifest,
            manifestPath,
            hasMainJs,
            runtimeSource.source,
            runtimeSource.provenance,
          );
          span.setAttribute("plugin.host", this.getHostIdForManifest(manifest));
          span.setAttribute("plugin.classification", classification);
          await this.preflightManifest(
            manifest,
            pluginPath,
            runtimeSource.source,
            {
              classification,
              hasMainJs,
            },
          );

          if (
            this.isManifestOnlyLapisExtension(
              manifest,
              classification,
              hasMainJs,
            )
          ) {
            this.recordCommunityPluginDiagnostics(manifest, "indexed");
            return null;
          }

          if (
            !options.loadDeferredRuntime &&
            this.shouldDeferManifestActivation(manifest.id)
          ) {
            this.recordCommunityPluginDiagnostics(manifest, "dormant");
            return null;
          }

          const modulePath = this.getSelectedCommunityModulePath(
            manifest,
            pluginPath,
            classification,
            hasMainJs,
          );
          if (!modulePath) {
            throw new Error(`Plugin ${manifest.id} does not have a code entry`);
          }

          await this.updateCommunityPluginDependencyDiagnostics(
            manifest,
            pluginPath,
            classification,
            hasMainJs,
          );

          const PluginClass = await this.#communityPluginHost.evaluate({
            pluginId: manifest.id,
            pluginPath,
            modulePath,
            manifest,
            selectedRuntime: this.selectRuntimeEntryForManifest(manifest, {
              classification,
              hasMainJs,
            }),
          });

          if (!PluginClass || typeof PluginClass !== "function") {
            throw new Error(
              `Plugin ${manifest.id} does not export a valid plugin class`,
            );
          }

          const PluginType = PluginClass as new (
            app: App,
            manifest: PluginManifest,
          ) => Plugin;
          const plugin = new PluginType(this.app, manifest);
          if (!(plugin instanceof Plugin)) {
            throw new Error(
              `Plugin ${manifest.id} does not extend the Plugin base class`,
            );
          }

          return this.registerPlugin(plugin, {
            source: runtimeSource.source,
            provenance: runtimeSource.provenance,
            basePath: pluginPath,
          });
        } catch (error) {
          const message = `Failed to load plugin from ${pluginPath}: ${formatPluginError(error)}`;
          this.recordCommunityPluginFailure(pluginId, manifest, message);
          this.reportPluginError(pluginPath, message, error);
          return null;
        }
      },
      { slowThresholdMs: 200 },
    );
  }

  private registerPlugin(
    plugin: Plugin,
    options: {
      source: PluginSource;
      provenance?: PluginProvenance;
      basePath?: string;
      required?: boolean;
    },
  ): Plugin {
    if (!plugin.manifest.id?.trim()) {
      throw new Error("Plugin manifest is missing an id");
    }

    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(`Plugin id ${plugin.manifest.id} is already registered`);
    }

    plugin.configureRuntime({
      source: options.source,
      provenance: options.provenance,
      basePath: options.basePath,
      required: options.required,
      hostMode: isExternalPluginSource(options.source)
        ? this.getHostIdForManifest(plugin.manifest)
        : options.source === "system"
          ? this.getHostIdForIndexedExtension(
              this.#lapisExtensionIndex.get(plugin.manifest.id) ?? {
                pluginId: plugin.manifest.id,
                source: "system",
                classification: "lapis-extension",
                manifestPath: plugin.manifest.dir ?? "",
                activationEvents: [],
                runtime: plugin.manifest.lapis?.runtime,
                permissions: [],
                requestedCapabilities: [],
                grantedCapabilities: [],
                enabled: false,
                locked: plugin.required,
                enabledByDefault: true,
                activationErrors: [],
                privileges: [],
                contributions: [],
              },
            )
          : "renderer",
      requestedCapabilities: isExternalPluginSource(options.source)
        ? this.getRequestedCapabilities(plugin.manifest)
        : options.source === "system"
          ? (this.#lapisExtensionIndex.get(plugin.manifest.id)
              ?.requestedCapabilities ?? [])
          : [],
      grantedCapabilities: isExternalPluginSource(options.source)
        ? this.getGrantedCapabilities(plugin.manifest)
        : options.source === "system"
          ? (this.#lapisExtensionIndex.get(plugin.manifest.id)
              ?.grantedCapabilities ?? [])
          : [],
    });
    this.plugins.set(plugin.manifest.id, plugin);
    if (
      isExternalPluginSource(options.source) ||
      this.#lapisExtensionIndex.get(plugin.manifest.id)?.source === "system"
    ) {
      this.updatePluginDiagnosticsFromPlugin(plugin);
    }
    this.emit("plugin-loaded", plugin);
    void this.syncLegacyPluginData(plugin.manifest.id);
    return plugin;
  }

  private async syncLegacyPluginData(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return;
    }

    const path = resolvePluginDataPath(
      plugin.manifest.id,
      plugin.source,
      plugin.basePath,
    );
    if (!path) {
      return;
    }

    try {
      if (!this.app.configuration.hasPluginData(pluginId)) {
        const file = this.app.vault.getFileByPath(path);
        if (file) {
          await this.app.vault.delete(file, true);
        }
        return;
      }

      const payload = JSON.stringify(
        this.app.configuration.getPluginData(pluginId),
        null,
        2,
      );
      const file = this.app.vault.getFileByPath(path);
      if (file) {
        await this.app.vault.modify(file, payload);
        return;
      }

      await this.app.vault.mkpath(dirname(path));
      await this.app.vault.create(path, payload);
    } catch (error) {
      this.reportPluginError(
        pluginId,
        `Failed to sync legacy plugin data for ${pluginId}: ${formatPluginError(error)}`,
        error,
      );
    }
  }

  async enablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
      if (indexedExtension) {
        if (this.shouldDeferIndexedExtensionActivation(indexedExtension)) {
          const enabled = this.enableDeferredIndexedExtension(pluginId);
          if (enabled && this.#loaded) {
            if (
              indexedExtension.source === "community" ||
              indexedExtension.source === "official"
            ) {
              this.#configuredCommunityPlugins.add(pluginId);
              this.saveCommunityPluginState();
            } else if (!indexedExtension.locked) {
              this.#disabledCorePlugins.delete(pluginId);
              if (this.#defaultDisabledCorePlugins.has(pluginId)) {
                this.#enabledCorePlugins.add(pluginId);
              } else {
                this.#enabledCorePlugins.delete(pluginId);
              }
              this.saveCorePluginState();
            }
          }
          return enabled;
        }

        if (
          indexedExtension.source === "system" &&
          this.#systemExtensionPlugins.has(pluginId)
        ) {
          const runtimePlugin = this.instantiateSystemExtensionPlugin(pluginId);
          if (runtimePlugin) {
            return this.enablePlugin(pluginId);
          }
        }

        if (
          (indexedExtension.source === "community" ||
            indexedExtension.source === "official") &&
          this.hasIndexedExtensionCodeEntry(indexedExtension)
        ) {
          const loadedPlugin = await this.loadPlugin(
            dirname(indexedExtension.manifestPath),
          );
          if (loadedPlugin) {
            return this.enablePlugin(pluginId);
          }
          return false;
        }

        const enabled = this.enableManifestOnlyExtension(pluginId);
        if (enabled && this.#loaded) {
          if (
            indexedExtension.source === "community" ||
            indexedExtension.source === "official"
          ) {
            this.#configuredCommunityPlugins.add(pluginId);
            this.saveCommunityPluginState();
          } else if (!indexedExtension.locked) {
            this.#disabledCorePlugins.delete(pluginId);
            if (this.#defaultDisabledCorePlugins.has(pluginId)) {
              this.#enabledCorePlugins.add(pluginId);
            } else {
              this.#enabledCorePlugins.delete(pluginId);
            }
            this.saveCorePluginState();
          }
        }
        return enabled;
      }

      const communityPluginPath = joinPath(this.pluginsPath, pluginId);
      const communityManifestPath = joinPath(
        communityPluginPath,
        "manifest.json",
      );
      if (await this.pathExists(communityManifestPath)) {
        const loadedPlugin = await this.loadPlugin(communityPluginPath);
        if (loadedPlugin) {
          return this.enablePlugin(pluginId);
        }
        return false;
      }

      this.reportPluginError(pluginId, `Unknown plugin: ${pluginId}`);
      return false;
    }
    return this.app.telemetry.measureAsync(
      "plugin.enable",
      async (span) => {
        span.setAttribute("plugin.id", pluginId);
        span.setAttribute("plugin.source", plugin.source);
        span.setAttribute("plugin.required", plugin.required);
        try {
          await plugin.enable();
          await this.restorePluginOwnedLeaves(plugin);
          const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
          if (
            indexedExtension?.classification === "hybrid" &&
            !this.#manifestContributionDisposers.has(pluginId)
          ) {
            this.enableManifestOnlyExtension(pluginId);
          }
          await this.loadPluginStyles(plugin);
          this.updatePluginDiagnosticsFromPlugin(plugin);
          this.emit("plugin-enabled", plugin);
          if (this.#loaded) {
            if (plugin.source === "community" || plugin.source === "official") {
              this.#configuredCommunityPlugins.add(pluginId);
              this.saveCommunityPluginState();
            } else if (
              (plugin.source === "core" || plugin.source === "system") &&
              !plugin.required
            ) {
              this.#disabledCorePlugins.delete(pluginId);
              if (this.#defaultDisabledCorePlugins.has(pluginId)) {
                this.#enabledCorePlugins.add(pluginId);
              } else {
                this.#enabledCorePlugins.delete(pluginId);
              }
              this.saveCorePluginState();
            }
          }
          return true;
        } catch (error) {
          this.updatePluginDiagnosticsFromPlugin(plugin);
          this.reportPluginError(
            pluginId,
            `Failed to enable plugin ${pluginId}: ${formatPluginError(error)}`,
            error,
          );
          return false;
        }
      },
      {
        attributes: {
          "plugin.id": pluginId,
          "plugin.source": plugin.source,
        },
        slowThresholdMs: 300,
      },
    );
  }

  async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
      if (indexedExtension) {
        if (indexedExtension.source === "system" && indexedExtension.locked) {
          this.reportPluginError(
            pluginId,
            `Plugin ${pluginId} is required and cannot be disabled`,
          );
          return false;
        }

        this.disableManifestOnlyExtension(pluginId);
        if (this.#loaded) {
          if (
            indexedExtension.source === "community" ||
            indexedExtension.source === "official"
          ) {
            this.#configuredCommunityPlugins.delete(pluginId);
            this.saveCommunityPluginState();
          } else {
            this.#enabledCorePlugins.delete(pluginId);
            if (this.#defaultDisabledCorePlugins.has(pluginId)) {
              this.#disabledCorePlugins.delete(pluginId);
            } else {
              this.#disabledCorePlugins.add(pluginId);
            }
            this.saveCorePluginState();
          }
        }
        return true;
      }

      if (this.#configuredCommunityPlugins.delete(pluginId)) {
        this.disableManifestOnlyExtension(pluginId);
        this.saveCommunityPluginState();
        const diagnostics = this.#communityPluginDiagnostics.get(pluginId);
        if (diagnostics) {
          this.#communityPluginDiagnostics.set(pluginId, {
            ...diagnostics,
            state: "disabled",
          });
        }
        return true;
      }
      this.reportPluginError(pluginId, `Unknown plugin: ${pluginId}`);
      return false;
    }
    if (plugin.required) {
      this.reportPluginError(
        pluginId,
        `Plugin ${pluginId} is required and cannot be disabled`,
      );
      return false;
    }
    return this.app.telemetry.measureAsync(
      "plugin.disable",
      async (span) => {
        span.setAttribute("plugin.id", pluginId);
        span.setAttribute("plugin.source", plugin.source);
        try {
          const ownedLeaves = this.capturePluginOwnedLeaves(plugin);
          await plugin.disable();
          await this.replacePluginOwnedLeaves(ownedLeaves);
          if (this.#manifestContributionDisposers.has(pluginId)) {
            this.disposeInstalledManifestContributions(pluginId);
          }
          this.unloadPluginCSS(pluginId);
          this.updatePluginDiagnosticsFromPlugin(plugin);
          this.emit("plugin-disabled", plugin);
          if (this.#loaded) {
            if (plugin.source === "community" || plugin.source === "official") {
              this.#configuredCommunityPlugins.delete(pluginId);
              this.saveCommunityPluginState();
            } else if (plugin.source === "core" || plugin.source === "system") {
              this.#enabledCorePlugins.delete(pluginId);
              if (this.#defaultDisabledCorePlugins.has(pluginId)) {
                this.#disabledCorePlugins.delete(pluginId);
              } else {
                this.#disabledCorePlugins.add(pluginId);
              }
              this.saveCorePluginState();
            }
          }
          return true;
        } catch (error) {
          this.updatePluginDiagnosticsFromPlugin(plugin);
          this.reportPluginError(
            pluginId,
            `Failed to disable plugin ${pluginId}: ${formatPluginError(error)}`,
            error,
          );
          return false;
        }
      },
      {
        attributes: {
          "plugin.id": pluginId,
          "plugin.source": plugin.source,
        },
        slowThresholdMs: 300,
      },
    );
  }

  async restartPlugin(pluginId: string): Promise<boolean> {
    let plugin = this.plugins.get(pluginId);
    if (!plugin) {
      plugin =
        (await this.loadPlugin(joinPath(this.pluginsPath, pluginId))) ??
        undefined;
    }
    if (!plugin && this.#lapisExtensionIndex.has(pluginId)) {
      this.disableManifestOnlyExtension(pluginId);
      return this.enablePlugin(pluginId);
    }
    if (!plugin) {
      this.reportPluginError(pluginId, `Unknown plugin: ${pluginId}`);
      return false;
    }

    try {
      if (plugin.loaded || plugin.enabled || plugin.state === "failed") {
        await plugin.disable();
        this.unloadPluginCSS(pluginId);
        this.updatePluginDiagnosticsFromPlugin(plugin);
      }
    } catch (error) {
      this.updatePluginDiagnosticsFromPlugin(plugin);
      this.reportPluginError(
        pluginId,
        `Failed to restart plugin ${pluginId}: ${formatPluginError(error)}`,
        error,
      );
      return false;
    }

    return this.enablePlugin(pluginId);
  }

  private capturePluginOwnedLeaves(
    plugin: Plugin,
  ): Array<{ leaf: WorkspaceLeaf; state: ViewState }> {
    const leaves = new Set<WorkspaceLeaf>();
    for (const viewType of plugin.registeredViewTypes) {
      for (const leaf of this.app.workspace.getLeavesOfType(viewType)) {
        leaves.add(leaf);
      }
    }
    return [...leaves].map((leaf) => ({
      leaf,
      state: leaf.captureCurrentViewState(),
    }));
  }

  private async replacePluginOwnedLeaves(
    entries: Array<{ leaf: WorkspaceLeaf; state: ViewState }>,
  ): Promise<void> {
    await Promise.all(
      entries.map(({ leaf, state }) =>
        leaf.setViewState(
          {
            ...state,
            type: "empty",
            state: {
              ...(state.state ?? {}),
              __missingViewType: state.type,
            },
          },
          { history: false, activatePlugins: false },
        ),
      ),
    );
  }

  private async restorePluginOwnedLeaves(plugin: Plugin): Promise<void> {
    const leaves: WorkspaceLeaf[] = [];
    this.app.workspace.iterateAllLeaves((leaf) => {
      const state = leaf.getViewState();
      const missingViewType = state.state?.["__missingViewType"];
      if (
        state.type === "empty" &&
        typeof missingViewType === "string" &&
        plugin.registeredViewTypes.has(missingViewType)
      ) {
        leaves.push(leaf);
      }
    });
    await Promise.all(
      leaves.map((leaf) =>
        leaf.setViewState(leaf.getViewState(), { history: false }),
      ),
    );
  }

  private isVersionCompatible(minVersion: string) {
    const appVersion = this.app.version;
    const appParts = appVersion.split(".").map(Number);
    const minParts = minVersion.split(".").map(Number);

    for (let i = 0; i < Math.max(appParts.length, minParts.length); i++) {
      const appPart = appParts[i] || 0;
      const minPart = minParts[i] || 0;
      if (appPart > minPart) return true;
      if (appPart < minPart) return false;
    }
    return true;
  }

  async enableAllPlugins(...pluginIds: Array<string | string[]>) {
    const ids = pluginIds.flat().filter((it) => it);
    const targetIds = pluginIds.length > 0 ? ids : [...this.plugins.keys()];
    for (const id of targetIds) {
      await this.enablePlugin(id);
    }
  }

  private async loadPluginStyles(plugin: Plugin): Promise<void> {
    if (plugin.source === "core") {
      const handled = await this.loadCorePluginStyles(plugin);
      if (handled) {
        return;
      }
    }

    if (!plugin.basePath) {
      return;
    }

    const cssPath = joinPath(plugin.basePath, "styles.css");
    let exists = false;
    try {
      exists = await this.adapter.exists(cssPath);
    } catch (error) {
      if (isMissingPathError(error)) {
        return;
      }
      throw error;
    }
    if (!exists) {
      return;
    }

    try {
      await this.loadPluginCSS(plugin.manifest.id, cssPath);
    } catch (error) {
      this.reportPluginError(
        plugin.manifest.id,
        `Failed to load plugin styles for ${plugin.manifest.id}: ${formatPluginError(error)}`,
        error,
      );
    }
  }

  private async loadCorePluginStyles(plugin: Plugin): Promise<boolean> {
    const styleSource = this.#corePluginStyles.get(plugin.manifest.id);
    if (styleSource === undefined) {
      return false;
    }

    try {
      const cssContent =
        typeof styleSource === "function" ? await styleSource() : styleSource;
      if (cssContent.trim()) {
        this.loadPluginCSSContent(plugin.manifest.id, cssContent);
      } else {
        this.unloadPluginCSS(plugin.manifest.id);
      }
    } catch (error) {
      this.reportPluginError(
        plugin.manifest.id,
        `Failed to load bundled plugin styles for ${plugin.manifest.id}: ${formatPluginError(error)}`,
        error,
      );
    }

    return true;
  }

  private unloadPluginCSS(pluginId: string) {
    const el = document.querySelector<HTMLStyleElement>(
      `#plugin-css-${pluginId}`,
    );
    if (el) {
      el.detach();
      this.emit("css-change");
    }
  }

  private async loadPluginCSS(pluginId: string, cssPath: string) {
    const cssContent = await this.adapter.read(cssPath);
    this.loadPluginCSSContent(pluginId, cssContent);
  }

  private loadPluginCSSContent(pluginId: string, cssContent: string) {
    const id = `plugin-css-${pluginId}`;
    const el =
      document.querySelector<HTMLStyleElement>(`#${id}`) ||
      document.createElement("style");
    el.id = id;
    el.textContent = cssContent;
    document.head.appendChild(el);
    this.emit("css-change");
  }

  private async preflightManifest(
    manifest: PluginManifest,
    pluginPath: string,
    source: PluginSource,
    options: {
      classification?: LapisPluginClassification;
      hasMainJs?: boolean;
    } = {},
  ): Promise<void> {
    if (!manifest.id?.trim()) {
      throw new Error(`Plugin at ${pluginPath} is missing a manifest id`);
    }

    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin id ${manifest.id} is already registered`);
    }

    if (
      manifest.minAppVersion &&
      !this.isVersionCompatible(manifest.minAppVersion)
    ) {
      throw new Error(
        `Plugin ${manifest.id} requires app version ${manifest.minAppVersion} or newer`,
      );
    }

    if (manifest.isDesktopOnly && !Platform.isDesktopApp) {
      throw new Error(`Plugin ${manifest.id} can only run in the desktop app`);
    }

    if (isExternalPluginSource(source)) {
      if (
        requiresWorkspaceTrust(manifest) &&
        !this.app.workspaceTrust.trusted
      ) {
        throw new Error(trustFailureMessage(manifest));
      }

      if (!this.isRuntimeSupported(manifest)) {
        throw new Error(
          `Plugin ${manifest.id} does not support host ${this.getHostIdForManifest(manifest)}`,
        );
      }

      const invalidCapabilities = this.getInvalidRequiredCapabilities(manifest);
      if (invalidCapabilities.length) {
        throw new Error(
          `Plugin ${manifest.id} declares unknown required capabilities: ${invalidCapabilities.join(", ")}`,
        );
      }

      const grantedCapabilities = new Set(
        this.getGrantedCapabilities(manifest),
      );
      const missingCapabilities = this.getRequestedCapabilities(
        manifest,
      ).filter((capability) => !grantedCapabilities.has(capability));
      if (missingCapabilities.length) {
        throw new Error(
          `Plugin ${manifest.id} requires unavailable capabilities: ${missingCapabilities.join(", ")}`,
        );
      }

      const mainPath = joinPath(pluginPath, "main.js");
      const hasMainJs = options.hasMainJs ?? (await this.pathExists(mainPath));
      const classification =
        options.classification ??
        classifyLapisPlugin(manifest, {
          hasMainJs,
        });
      const selectedEntry = this.getSelectedCodeEntry(
        manifest,
        classification,
        hasMainJs,
      );
      if (!selectedEntry) {
        if (classification === "obsidian-compatible" && !hasMainJs) {
          throw new Error(`Plugin ${manifest.id} is missing main.js`);
        }
        if (hasDeclaredLapisRuntimeCode(manifest)) {
          throw new Error(
            `Plugin ${manifest.id} does not have a supported Lapis runtime entry for host ${this.getHostIdForManifest(manifest)}`,
          );
        }
        return;
      }

      const modulePath = this.getSelectedCommunityModulePath(
        manifest,
        pluginPath,
        classification,
        hasMainJs,
      );
      if (!modulePath || !(await this.pathExists(modulePath))) {
        if (selectedEntry === "main.js") {
          throw new Error(`Plugin ${manifest.id} is missing main.js`);
        }
        throw new Error(
          `Plugin ${manifest.id} is missing Lapis runtime entry ${selectedEntry}`,
        );
      }
    }
  }

  private reportPluginError(id: string, message: string, error?: unknown) {
    console.error(message, error);
    this.app.telemetry.recordEvent("plugin.error", {
      "plugin.id": id,
      "plugin.message": message,
    });
    this.emit("plugin-error", id, message, error);
  }

  private isRuntimeSupported(manifest: PluginManifest): boolean {
    const runtimes = normalizeStringArray(manifest.supportedRuntimes);
    if (!runtimes.length) {
      return true;
    }

    const hostId = this.getHostIdForManifest(manifest);
    return runtimes.some((runtime) =>
      runtimeMatchesHost(runtime.toLowerCase(), hostId),
    );
  }

  private getRequestedCapabilities(
    manifest: PluginManifest,
  ): HostedPluginCapability[] {
    const validCapabilities = new Set(HOSTED_PLUGIN_CAPABILITIES);
    return [
      ...new Set([
        ...normalizeStringArray(manifest.requiredCapabilities).filter(
          (capability): capability is HostedPluginCapability =>
            validCapabilities.has(capability as HostedPluginCapability),
        ),
        ...permissionsToCapabilities(manifest.lapis?.permissions),
      ]),
    ];
  }

  private getInvalidRequiredCapabilities(manifest: PluginManifest): string[] {
    const validCapabilities = new Set(HOSTED_PLUGIN_CAPABILITIES);
    return normalizeStringArray(manifest.requiredCapabilities).filter(
      (capability) =>
        !validCapabilities.has(capability as HostedPluginCapability),
    );
  }

  private getGrantedCapabilities(
    manifest: PluginManifest,
  ): HostedPluginCapability[] {
    if (!this.getRequestedCapabilities(manifest).length) {
      return [];
    }
    if (!this.app.workspaceTrust.trusted) {
      return [];
    }
    if (isSidecarHost(this.getHostIdForManifest(manifest))) {
      return [...HOSTED_PLUGIN_CAPABILITIES];
    }
    return permissionsToCapabilities(manifest.lapis?.permissions);
  }

  private recordCommunityPluginDiagnostics(
    manifest: PluginManifest,
    state: string,
    runtime: {
      source?: PluginSource;
      provenance?: PluginProvenance;
    } = {},
  ): void {
    this.syncPluginContextKeys(manifest.id, state);
    const previous = this.#communityPluginDiagnostics.get(manifest.id);
    const indexedExtension = this.#lapisExtensionIndex.get(manifest.id);
    const source =
      runtime.source ??
      this.plugins.get(manifest.id)?.source ??
      indexedExtension?.source ??
      previous?.source ??
      "community";
    const provenance =
      runtime.provenance ??
      this.plugins.get(manifest.id)?.provenance ??
      previous?.provenance ??
      provenanceForPluginSource(source);
    const classification =
      indexedExtension?.classification ??
      previous?.classification ??
      "obsidian-compatible";
    const selectedRuntime = this.selectRuntimeEntryForManifest(manifest, {
      classification,
    });
    const dependencyDiagnostics =
      this.getCommunityPluginDependencyDiagnosticsForRecord(
        manifest.id,
        previous,
      );
    const runtimeDiagnostics =
      this.getCommunityPluginRuntimeExecutionDiagnosticsForRecord(
        manifest.id,
        previous,
      );
    this.#communityPluginDiagnostics.set(manifest.id, {
      pluginId: manifest.id,
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      description: manifest.description,
      source,
      provenance,
      classification,
      hostMode: this.getHostIdForManifest(manifest),
      activationMode: "not-activated",
      activationTrigger: previous?.activationTrigger ?? null,
      selectedRuntimeHost: selectedRuntime?.host ?? null,
      selectedRuntimeEntry: selectedRuntime?.path ?? null,
      moduleFormat: selectedRuntime?.format ?? null,
      fallbackRuntimeEntry: selectedRuntime?.fallbackPath ?? null,
      fallbackUsed: runtimeDiagnostics.fallbackUsed,
      requiresReloadOnUpdate: selectedRuntime?.requiresReloadOnUpdate ?? false,
      sharedDependencies: selectedRuntime?.sharedDependencies ?? [],
      usedSharedDependencies: dependencyDiagnostics.usedSharedDependencies,
      undeclaredSharedDependencies:
        dependencyDiagnostics.undeclaredSharedDependencies,
      missingSharedDependencies:
        dependencyDiagnostics.missingSharedDependencies,
      deprecatedSharedDependencies:
        dependencyDiagnostics.deprecatedSharedDependencies,
      privateSharedDependencies:
        dependencyDiagnostics.privateSharedDependencies,
      assetUrlMode: runtimeDiagnostics.assetUrlMode,
      pluginAssetUrl: runtimeDiagnostics.pluginAssetUrl,
      requestedCapabilities: this.getRequestedCapabilities(manifest),
      grantedCapabilities: this.getGrantedCapabilities(manifest),
      privileges: indexedExtension?.privileges ?? previous?.privileges ?? [],
      indexedContributionCount:
        indexedExtension?.contributions.length ??
        previous?.indexedContributionCount ??
        0,
      contributionDiagnostics: [
        ...(this.#manifestContributionDiagnostics.get(manifest.id) ??
          previous?.contributionDiagnostics ??
          []),
      ],
      lastFailureMessage: previous?.lastFailureMessage ?? null,
      state,
    });
  }

  private recordCommunityPluginFailure(
    pluginId: string,
    manifest: PluginManifest | null,
    message: string,
  ): void {
    this.syncPluginContextKeys(pluginId, "failed");
    const previous = this.#communityPluginDiagnostics.get(pluginId);
    const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
    const source =
      this.plugins.get(pluginId)?.source ??
      indexedExtension?.source ??
      previous?.source ??
      (manifest
        ? this.resolveExternalPluginSource(manifest.id).source
        : "community");
    const provenance =
      this.plugins.get(pluginId)?.provenance ??
      previous?.provenance ??
      provenanceForPluginSource(source);
    const classification =
      indexedExtension?.classification ??
      previous?.classification ??
      "obsidian-compatible";
    const selectedRuntime = manifest
      ? this.selectRuntimeEntryForManifest(manifest, { classification })
      : null;
    const dependencyDiagnostics =
      this.getCommunityPluginDependencyDiagnosticsForRecord(pluginId, previous);
    const runtimeDiagnostics =
      this.getCommunityPluginRuntimeExecutionDiagnosticsForRecord(
        pluginId,
        previous,
      );
    this.#communityPluginDiagnostics.set(pluginId, {
      pluginId,
      name: manifest?.name ?? previous?.name,
      version: manifest?.version ?? previous?.version,
      author: manifest?.author ?? previous?.author,
      description: manifest?.description ?? previous?.description,
      source,
      provenance,
      classification,
      hostMode: manifest
        ? this.getHostIdForManifest(manifest)
        : (previous?.hostMode ?? this.#communityPluginHost.id),
      activationMode: manifest
        ? "not-activated"
        : (previous?.activationMode ?? "not-activated"),
      activationTrigger: previous?.activationTrigger ?? null,
      selectedRuntimeHost:
        selectedRuntime?.host ?? previous?.selectedRuntimeHost ?? null,
      selectedRuntimeEntry:
        selectedRuntime?.path ?? previous?.selectedRuntimeEntry ?? null,
      moduleFormat: selectedRuntime?.format ?? previous?.moduleFormat ?? null,
      fallbackRuntimeEntry:
        selectedRuntime?.fallbackPath ?? previous?.fallbackRuntimeEntry ?? null,
      fallbackUsed: runtimeDiagnostics.fallbackUsed,
      requiresReloadOnUpdate:
        selectedRuntime?.requiresReloadOnUpdate ??
        previous?.requiresReloadOnUpdate ??
        false,
      sharedDependencies:
        selectedRuntime?.sharedDependencies ??
        previous?.sharedDependencies ??
        [],
      usedSharedDependencies: dependencyDiagnostics.usedSharedDependencies,
      undeclaredSharedDependencies:
        dependencyDiagnostics.undeclaredSharedDependencies,
      missingSharedDependencies:
        dependencyDiagnostics.missingSharedDependencies,
      deprecatedSharedDependencies:
        dependencyDiagnostics.deprecatedSharedDependencies,
      privateSharedDependencies:
        dependencyDiagnostics.privateSharedDependencies,
      assetUrlMode: runtimeDiagnostics.assetUrlMode,
      pluginAssetUrl: runtimeDiagnostics.pluginAssetUrl,
      requestedCapabilities: manifest
        ? this.getRequestedCapabilities(manifest)
        : (previous?.requestedCapabilities ?? []),
      grantedCapabilities: manifest
        ? this.getGrantedCapabilities(manifest)
        : (previous?.grantedCapabilities ?? []),
      privileges: indexedExtension?.privileges ?? previous?.privileges ?? [],
      indexedContributionCount:
        indexedExtension?.contributions.length ??
        previous?.indexedContributionCount ??
        0,
      contributionDiagnostics: [
        ...(this.#manifestContributionDiagnostics.get(pluginId) ??
          previous?.contributionDiagnostics ??
          []),
      ],
      lastFailureMessage: message,
      state: "failed",
    });
  }

  private updatePluginDiagnosticsFromPlugin(plugin: Plugin): void {
    this.syncPluginContextKeys(plugin.manifest.id, plugin.state);
    if (
      !isExternalPluginSource(plugin.source) &&
      this.#lapisExtensionIndex.get(plugin.manifest.id)?.source !== "system"
    ) {
      return;
    }
    const previous = this.#communityPluginDiagnostics.get(plugin.manifest.id);
    const indexedExtension = this.#lapisExtensionIndex.get(plugin.manifest.id);
    const classification =
      indexedExtension?.classification ??
      previous?.classification ??
      "obsidian-compatible";
    const selectedRuntime = this.selectRuntimeEntryForManifest(
      plugin.manifest,
      {
        classification,
      },
    );
    const dependencyDiagnostics =
      this.getCommunityPluginDependencyDiagnosticsForRecord(
        plugin.manifest.id,
        previous,
      );
    const runtimeDiagnostics =
      this.getCommunityPluginRuntimeExecutionDiagnosticsForRecord(
        plugin.manifest.id,
        previous,
      );
    this.#communityPluginDiagnostics.set(plugin.manifest.id, {
      pluginId: plugin.manifest.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      author: plugin.manifest.author,
      description: plugin.manifest.description,
      source: plugin.source,
      provenance: plugin.provenance,
      classification,
      hostMode: plugin.hostMode,
      activationMode: "code",
      activationTrigger: previous?.activationTrigger ?? null,
      selectedRuntimeHost: selectedRuntime?.host ?? null,
      selectedRuntimeEntry: selectedRuntime?.path ?? null,
      moduleFormat: selectedRuntime?.format ?? null,
      fallbackRuntimeEntry: selectedRuntime?.fallbackPath ?? null,
      fallbackUsed: runtimeDiagnostics.fallbackUsed,
      requiresReloadOnUpdate: selectedRuntime?.requiresReloadOnUpdate ?? false,
      sharedDependencies: selectedRuntime?.sharedDependencies ?? [],
      usedSharedDependencies: dependencyDiagnostics.usedSharedDependencies,
      undeclaredSharedDependencies:
        dependencyDiagnostics.undeclaredSharedDependencies,
      missingSharedDependencies:
        dependencyDiagnostics.missingSharedDependencies,
      deprecatedSharedDependencies:
        dependencyDiagnostics.deprecatedSharedDependencies,
      privateSharedDependencies:
        dependencyDiagnostics.privateSharedDependencies,
      assetUrlMode: runtimeDiagnostics.assetUrlMode,
      pluginAssetUrl: runtimeDiagnostics.pluginAssetUrl,
      requestedCapabilities: plugin.requestedCapabilities,
      grantedCapabilities: plugin.grantedCapabilities,
      privileges: indexedExtension?.privileges ?? previous?.privileges ?? [],
      indexedContributionCount:
        indexedExtension?.contributions.length ??
        previous?.indexedContributionCount ??
        0,
      contributionDiagnostics: [
        ...(this.#manifestContributionDiagnostics.get(plugin.manifest.id) ??
          previous?.contributionDiagnostics ??
          []),
      ],
      lastFailureMessage:
        plugin.lastFailureMessage ?? previous?.lastFailureMessage ?? null,
      state: plugin.state,
    });
  }

  private async updateCommunityPluginDependencyDiagnostics(
    manifest: PluginManifest,
    pluginPath: string,
    classification: LapisPluginClassification,
    hasMainJs: boolean,
  ): Promise<void> {
    const selectedRuntime = this.selectRuntimeEntryForManifest(manifest, {
      classification,
      hasMainJs,
    });
    const moduleSources =
      await this.readCommunityPluginModuleSources(pluginPath);
    const usedSharedDependencies =
      getBareDependencySpecifiersFromSources(moduleSources);
    const declaredSharedDependencies =
      selectedRuntime?.sharedDependencies ?? [];
    const declarationsAreExplicit =
      selectedRuntime?.source === "lapis-runtime-entry" ||
      declaredSharedDependencies.length > 0;
    const declared = new Set(declaredSharedDependencies);
    const undeclaredSharedDependencies = declarationsAreExplicit
      ? usedSharedDependencies.filter(
          (specifier) =>
            this.isKnownHostDependency(specifier, selectedRuntime?.host) &&
            !declared.has(specifier),
        )
      : [];
    const missingSharedDependencies = declaredSharedDependencies.filter(
      (specifier) =>
        !this.isKnownHostDependency(specifier, selectedRuntime?.host),
    );
    const declaredOrUsedSharedDependencies = [
      ...new Set([...declaredSharedDependencies, ...usedSharedDependencies]),
    ].sort();
    const deprecatedSharedDependencies =
      declaredOrUsedSharedDependencies.filter((specifier) => {
        const metadata = this.getHostDependencyMetadata(specifier);
        return Boolean(
          metadata && "deprecated" in metadata && metadata.deprecated === true,
        );
      });
    const privateSharedDependencies = declaredOrUsedSharedDependencies.filter(
      (specifier) =>
        this.getHostDependencyMetadata(specifier)?.public === false,
    );

    this.#communityPluginDependencyDiagnostics.set(manifest.id, {
      usedSharedDependencies,
      undeclaredSharedDependencies,
      missingSharedDependencies,
      deprecatedSharedDependencies,
      privateSharedDependencies,
    });
  }

  private getCommunityPluginDependencyDiagnosticsForRecord(
    pluginId: string,
    previous?: CommunityPluginDiagnostics,
  ): CommunityPluginDependencyDiagnostics {
    return (
      this.#communityPluginDependencyDiagnostics.get(pluginId) ?? {
        usedSharedDependencies: previous?.usedSharedDependencies ?? [],
        undeclaredSharedDependencies:
          previous?.undeclaredSharedDependencies ?? [],
        missingSharedDependencies: previous?.missingSharedDependencies ?? [],
        deprecatedSharedDependencies:
          previous?.deprecatedSharedDependencies ?? [],
        privateSharedDependencies: previous?.privateSharedDependencies ?? [],
      }
    );
  }

  private getCommunityPluginRuntimeExecutionDiagnosticsForRecord(
    pluginId: string,
    previous?: CommunityPluginDiagnostics,
  ): CommunityPluginRuntimeExecutionDiagnostics {
    return (
      this.#communityPluginRuntimeExecutionDiagnostics.get(pluginId) ?? {
        fallbackUsed: previous?.fallbackUsed ?? false,
        assetUrlMode: previous?.assetUrlMode ?? null,
        pluginAssetUrl: previous?.pluginAssetUrl ?? null,
      }
    );
  }

  private recordPluginAssetUrlDiagnostics(pluginId: string, url: string): void {
    const previous =
      this.#communityPluginRuntimeExecutionDiagnostics.get(pluginId);
    this.#communityPluginRuntimeExecutionDiagnostics.set(pluginId, {
      ...previous,
      fallbackUsed: false,
      assetUrlMode: getPluginAssetUrlMode(url),
      pluginAssetUrl: url,
    });
  }

  private recordPluginFallbackDiagnostics(pluginId: string): void {
    const previous =
      this.#communityPluginRuntimeExecutionDiagnostics.get(pluginId);
    this.#communityPluginRuntimeExecutionDiagnostics.set(pluginId, {
      fallbackUsed: true,
      assetUrlMode: previous?.assetUrlMode ?? null,
      pluginAssetUrl: previous?.pluginAssetUrl ?? null,
    });
  }

  private isKnownHostDependency(
    specifier: string,
    host: PluginExecutionHostId | undefined,
  ): boolean {
    const metadata = this.getHostDependencyMetadata(specifier);
    if (!metadata) {
      return false;
    }
    if (!host) {
      return true;
    }
    return metadata.platforms.some((platform) =>
      hostPlatformMatchesDependencyPlatform(host, platform),
    );
  }

  private getHostDependencyMetadata(
    specifier: string,
  ):
    | (typeof pluginHostModuleRegistry)[keyof typeof pluginHostModuleRegistry]
    | undefined {
    return (
      pluginHostModuleRegistry[
        specifier as keyof typeof pluginHostModuleRegistry
      ] ?? undefined
    );
  }

  private async readCommunityPluginModuleSources(
    pluginPath: string,
  ): Promise<Map<string, string>> {
    const sources = new Map<string, string>();
    const visit = async (folderPath: string) => {
      const listing = await this.adapter.list(folderPath);
      await Promise.all(
        listing.files
          .filter((file) => /\.(?:cjs|mjs|js)$/i.test(file))
          .map(async (file) => {
            const filePath = normalizePath(joinPath(folderPath, file));
            sources.set(filePath, await this.adapter.read(filePath));
          }),
      );
      for (const folder of listing.folders) {
        await visit(joinPath(folderPath, folder));
      }
    };

    await visit(pluginPath);
    return sources;
  }

  private indexCommunityManifest(
    manifest: PluginManifest,
    manifestPath: string,
    hasMainJs: boolean,
    source: PluginSource = "community",
    provenance: PluginProvenance = provenanceForPluginSource(source),
  ): LapisPluginClassification {
    const classification = classifyLapisPlugin(manifest, { hasMainJs });
    if (manifest.lapis === undefined) {
      this.#lapisExtensionIndex.delete(manifest.id);
      this.recordCommunityPluginDiagnostics(manifest, "disabled", {
        source,
        provenance,
      });
      return classification;
    }

    const diagnostics = validateLapisManifest(manifest.id, manifest.lapis);
    if (diagnostics.length) {
      throw new Error(diagnostics.join("; "));
    }
    if (!isLapisManifest(manifest.lapis)) {
      throw new Error(`Plugin ${manifest.id} has invalid lapis metadata`);
    }

    const indexedExtension = buildLapisContributionIndex({
      pluginId: manifest.id,
      name: manifest.name,
      source: isExternalPluginSource(source) ? source : "community",
      manifestPath,
      classification,
      lapis: manifest.lapis,
      requestedCapabilities: this.getRequestedCapabilities(manifest),
      grantedCapabilities: this.getGrantedCapabilities(manifest),
    });
    this.#lapisExtensionIndex.set(manifest.id, indexedExtension);
    this.#manifestContributionDiagnostics.set(
      manifest.id,
      indexedExtension.contributions.flatMap((entry) => entry.diagnostics),
    );
    this.syncIndexedExtensionActivation(indexedExtension);
    this.recordCommunityPluginDiagnostics(manifest, "disabled", {
      source,
      provenance,
    });
    return classification;
  }

  private enableManifestOnlyExtension(pluginId: string): boolean {
    const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
    if (!indexedExtension) {
      return false;
    }

    this.disableManifestOnlyExtension(pluginId);
    this.#deferredIndexedExtensions.delete(pluginId);

    const disposers: IndexedContributionDisposer[] = [];
    const diagnostics: string[] = indexedExtension.contributions.flatMap(
      (entry) => entry.diagnostics,
    );
    const contributions = indexedExtension.contributions.map((entry) => ({
      ...entry,
      diagnostics: [...entry.diagnostics],
      state: entry.state,
    }));

    for (const entry of contributions) {
      if (entry.state === "invalid") {
        continue;
      }
      try {
        switch (entry.kind) {
          case "commands":
            disposers.push({
              kind: entry.kind,
              id: entry.id,
              dispose: this.installManifestCommand(entry),
            });
            break;
          case "configuration":
            disposers.push({
              kind: entry.kind,
              id: entry.id,
              dispose: this.installManifestConfiguration(entry),
            });
            break;
          case "statusBarItems":
            disposers.push({
              kind: entry.kind,
              id: entry.id,
              dispose: this.installManifestStatusBarItem(entry),
            });
            break;
          case "editorViews":
            disposers.push({
              kind: entry.kind,
              id: entry.id,
              dispose: this.installManifestEditorView(entry),
            });
            break;
          case "services":
            if (indexedExtension.source === "system") {
              disposers.push({
                kind: entry.kind,
                id: entry.id,
                dispose: this.installManifestService(entry),
              });
              break;
            }
            {
              const message = `Contribution ${entry.kind}:${entry.id} is indexed but not installed in this phase`;
              entry.diagnostics.push(message);
              diagnostics.push(message);
              break;
            }
          default: {
            const message = `Contribution ${entry.kind}:${entry.id} is indexed but not installed in this phase`;
            entry.diagnostics.push(message);
            diagnostics.push(message);
          }
        }
      } catch (error) {
        entry.state = "invalid";
        const message = `Failed to install contribution ${entry.kind}:${entry.id}: ${formatPluginError(error)}`;
        entry.diagnostics.push(message);
        diagnostics.push(message);
      }
    }

    this.#manifestContributionDisposers.set(pluginId, disposers);
    this.#manifestContributionDiagnostics.set(pluginId, diagnostics);
    this.#lapisExtensionIndex.set(pluginId, {
      ...indexedExtension,
      contributions,
    });
    this.recordIndexedExtensionDiagnostics(pluginId, "enabled");
    return true;
  }

  private enableDeferredIndexedExtension(pluginId: string): boolean {
    const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
    if (!indexedExtension) {
      return false;
    }

    this.disableManifestOnlyExtension(pluginId);
    const disposers: IndexedContributionDisposer[] = [];
    const diagnostics: string[] = indexedExtension.contributions.flatMap(
      (entry) => entry.diagnostics,
    );
    const contributions = indexedExtension.contributions.map((entry) => ({
      ...entry,
      diagnostics: [...entry.diagnostics],
      state: entry.state,
    }));

    for (const entry of contributions) {
      if (entry.state === "invalid") {
        continue;
      }
      try {
        switch (entry.kind) {
          case "commands":
            disposers.push({
              kind: entry.kind,
              id: entry.id,
              dispose: this.installManifestCommand(entry, {
                activateEvent:
                  activationEventForContribution(pluginId, entry) ??
                  `onCommand:${entry.id}`,
              }),
            });
            break;
          case "configuration":
            disposers.push({
              kind: entry.kind,
              id: entry.id,
              dispose: this.installManifestConfiguration(entry),
            });
            break;
          case "statusBarItems":
            disposers.push({
              kind: entry.kind,
              id: entry.id,
              dispose: this.installManifestStatusBarItem(entry),
            });
            break;
          case "editorViews":
            disposers.push({
              kind: entry.kind,
              id: entry.id,
              dispose: this.installManifestEditorView(entry),
            });
            break;
          default:
            break;
        }
      } catch (error) {
        entry.state = "invalid";
        const message = `Failed to install deferred contribution ${entry.kind}:${entry.id}: ${formatPluginError(error)}`;
        entry.diagnostics.push(message);
        diagnostics.push(message);
      }
    }

    this.#manifestContributionDisposers.set(pluginId, disposers);
    this.#manifestContributionDiagnostics.set(pluginId, diagnostics);
    this.#lapisExtensionIndex.set(pluginId, {
      ...indexedExtension,
      contributions,
      enabled: true,
    });
    this.#deferredIndexedExtensions.set(pluginId, {
      pluginId,
      source: indexedExtension.source,
      mode: "lazy-code",
    });
    this.recordIndexedExtensionDiagnostics(pluginId, "dormant");
    return true;
  }

  private disableManifestOnlyExtension(pluginId: string): void {
    this.disposeInstalledManifestContributions(pluginId);
    this.#deferredIndexedExtensions.delete(pluginId);
    this.recordIndexedExtensionDiagnostics(pluginId, "disabled");
  }

  private disposeInstalledManifestContributions(pluginId: string): void {
    const disposers = this.#manifestContributionDisposers.get(pluginId) ?? [];
    for (const entry of [...disposers].reverse()) {
      try {
        entry.dispose();
      } catch (error) {
        this.reportPluginError(
          pluginId,
          `Failed to dispose manifest contribution for ${pluginId}: ${formatPluginError(error)}`,
          error,
        );
      }
    }
    this.#manifestContributionDisposers.delete(pluginId);
    this.#manifestContributionDiagnostics.delete(pluginId);
  }

  private installManifestCommand(
    entry: LapisContributionIndexEntry,
    options: { activateEvent?: string } = {},
  ): () => void {
    const command = commandContributionToCommand(
      entry.contribution as Parameters<typeof commandContributionToCommand>[0],
    );
    const idPrefix = `${entry.pluginId}:`;
    if (!command.id.startsWith(idPrefix)) {
      command.id = `${idPrefix}${command.id}`;
    }
    if (!command.name.startsWith(idPrefix)) {
      command.name = `${idPrefix} ${command.name}`;
    }
    const commandId = command.id;
    const activateEvent = options.activateEvent ?? null;
    command.sourcePlugin = entry.pluginId;
    command.activationEvent = activateEvent ?? undefined;
    command.callback = async (...args: unknown[]) => {
      if (!activateEvent) {
        this.reportPluginError(
          entry.pluginId,
          `Manifest command ${entry.id} is declarative; runtime activation is not implemented yet`,
        );
        return;
      }

      this.app.commands.unregisterCommand(commandId);
      const activated = await this.activateByEvent(
        activateEvent,
        `command:${commandId}`,
      );
      if (activated && this.app.commands.getCommand(commandId)) {
        return this.app.commands.executeCommand(commandId, ...args);
      }
      this.app.commands.registerCommand(command);
      this.reportPluginError(
        entry.pluginId,
        `Deferred command ${commandId} did not activate a runtime command`,
      );
    };

    this.app.commands.registerCommand(command);
    return () => {
      this.app.commands.unregisterCommand(command.id);
    };
  }

  private installManifestConfiguration(
    entry: LapisContributionIndexEntry,
  ): () => void {
    const contribution = entry.contribution as LapisConfigurationContribution;
    const schema = {
      id: contribution.id ?? entry.pluginId,
      title: contribution.title ?? entry.id,
      type: "object",
      properties: contribution.properties ?? {},
    };
    this.app.configuration.schema.register(schema);
    void this.app.configuration.materializeSchemaDefaults();
    return () => {
      this.app.configuration.schema.unregister(schema);
    };
  }

  private installManifestStatusBarItem(
    entry: LapisContributionIndexEntry,
  ): () => void {
    const contribution = entry.contribution as LapisStatusBarItemContribution;
    return this.app.statusBar.registerItem({
      id: `${entry.pluginId}:${contribution.id}`,
      text: contribution.text,
      icon: contribution.icon,
      tooltip: contribution.tooltip,
      when: contribution.when,
      alignment: contribution.alignment,
      priority: contribution.priority,
      command: contribution.command
        ? normalizeManifestCommandId(entry.pluginId, contribution.command)
        : undefined,
      sourcePlugin: entry.pluginId,
    });
  }

  private installManifestEditorView(
    entry: LapisContributionIndexEntry,
  ): () => void {
    const contribution = entry.contribution as LapisEditorViewContribution;
    return this.app.workspace.registerEditorView({
      ...contribution,
      pluginId: entry.pluginId,
      source: "manifest",
    });
  }

  private installManifestService(
    entry: LapisContributionIndexEntry,
  ): () => void {
    const contribution = entry.contribution as LapisServiceContribution;
    const registration = this.getSystemExtensionServiceProviderRegistration(
      entry.pluginId,
      contribution.service,
      entry.id,
    );
    if (!registration) {
      throw new Error(
        `System extension ${entry.pluginId} is missing a provider binding for ${contribution.service}:${entry.id}`,
      );
    }

    const provider = registration.createProvider
      ? registration.createProvider(this.app)
      : registration.provider;
    if (provider === undefined) {
      throw new Error(
        `System extension ${entry.pluginId} did not return a provider for ${contribution.service}:${entry.id}`,
      );
    }

    return this.registerLapisServiceProvider({
      pluginId: entry.pluginId,
      service: contribution.service,
      id: entry.id,
      metadata: registration.metadata,
      provider,
      dispose: registration.dispose,
    });
  }

  private recordIndexedExtensionDiagnostics(
    pluginId: string,
    state: string,
  ): void {
    this.syncPluginContextKeys(pluginId, state);
    const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
    if (!indexedExtension) {
      return;
    }
    const updatedExtension = {
      ...indexedExtension,
      enabled: state === "enabled",
    };
    this.#lapisExtensionIndex.set(pluginId, updatedExtension);
    const previous = this.#communityPluginDiagnostics.get(pluginId);
    const selectedRuntime =
      this.selectRuntimeEntryForIndexedExtension(updatedExtension);
    const dependencyDiagnostics =
      this.getCommunityPluginDependencyDiagnosticsForRecord(pluginId, previous);
    const runtimeDiagnostics =
      this.getCommunityPluginRuntimeExecutionDiagnosticsForRecord(
        pluginId,
        previous,
      );
    this.#communityPluginDiagnostics.set(pluginId, {
      pluginId,
      name: updatedExtension.name ?? previous?.name,
      version: previous?.version,
      author: previous?.author,
      description: previous?.description,
      source:
        updatedExtension.source === "system"
          ? "system"
          : updatedExtension.source,
      provenance:
        updatedExtension.source === "official"
          ? "official"
          : updatedExtension.source === "system"
            ? "bundled"
            : (previous?.provenance ?? "community"),
      classification: updatedExtension.classification,
      hostMode: this.getHostIdForIndexedExtension(updatedExtension),
      activationMode:
        state === "enabled"
          ? this.#deferredIndexedExtensions.get(pluginId)?.mode === "lazy-code"
            ? "not-activated"
            : "manifest-only"
          : "not-activated",
      activationTrigger: previous?.activationTrigger ?? null,
      selectedRuntimeHost: selectedRuntime?.host ?? null,
      selectedRuntimeEntry: selectedRuntime?.path ?? null,
      moduleFormat: selectedRuntime?.format ?? null,
      fallbackRuntimeEntry: selectedRuntime?.fallbackPath ?? null,
      fallbackUsed: runtimeDiagnostics.fallbackUsed,
      requiresReloadOnUpdate: selectedRuntime?.requiresReloadOnUpdate ?? false,
      sharedDependencies: selectedRuntime?.sharedDependencies ?? [],
      usedSharedDependencies: dependencyDiagnostics.usedSharedDependencies,
      undeclaredSharedDependencies:
        dependencyDiagnostics.undeclaredSharedDependencies,
      missingSharedDependencies:
        dependencyDiagnostics.missingSharedDependencies,
      deprecatedSharedDependencies:
        dependencyDiagnostics.deprecatedSharedDependencies,
      privateSharedDependencies:
        dependencyDiagnostics.privateSharedDependencies,
      assetUrlMode: runtimeDiagnostics.assetUrlMode,
      pluginAssetUrl: runtimeDiagnostics.pluginAssetUrl,
      requestedCapabilities: updatedExtension.requestedCapabilities,
      grantedCapabilities: updatedExtension.grantedCapabilities,
      privileges: updatedExtension.privileges,
      indexedContributionCount: updatedExtension.contributions.length,
      contributionDiagnostics: this.getLapisContributionDiagnostics(pluginId),
      lastFailureMessage: previous?.lastFailureMessage ?? null,
      state,
    });
  }

  private syncPluginContextKeys(pluginId: string, state: string): void {
    this.app.contextKeys.set(`plugin.state.${pluginId}`, state);
    this.app.contextKeys.set(
      `plugin.enabled.${pluginId}`,
      state === "enabled" || state === "enabling" || state === "dormant",
    );
  }

  async activateByEvent(
    event: string,
    trigger: string | null = event,
  ): Promise<boolean> {
    const pluginIds = [...(this.#indexedActivationRegistry.get(event) ?? [])];
    if (!pluginIds.length) {
      return false;
    }

    let activated = false;
    for (const pluginId of pluginIds) {
      activated =
        (await this.activateDeferredIndexedExtension(pluginId, trigger)) ||
        activated;
    }
    return activated;
  }

  async activateForViewType(viewType: string): Promise<boolean> {
    return this.activateByEvent(`onView:${viewType}`, `view:${viewType}`);
  }

  async activateForService(serviceId: string): Promise<boolean> {
    return this.activateByEvent(
      `onService:${serviceId}`,
      `service:${serviceId}`,
    );
  }

  async activateForLanguage(languageId: string): Promise<boolean> {
    return this.activateByEvent(
      `onLanguage:${languageId}`,
      `language:${languageId}`,
    );
  }

  async activateForPath(path: string): Promise<boolean> {
    const events = this.matchingPathActivationEvents(path);
    let activated = false;
    for (const event of events) {
      activated =
        (await this.activateByEvent(event, `path:${path}`)) || activated;
    }
    return activated;
  }

  private async activateIndexedExtensionsForWorkspace(): Promise<void> {
    const files = this.app.vault.getFiles().map((file) => file.path);
    for (const filePath of files) {
      await this.activateForPath(filePath);
      const languageIds = this.findLanguageIdsForPath(filePath);
      for (const languageId of languageIds) {
        await this.activateForLanguage(languageId);
      }
    }
  }

  private async activateDeferredIndexedExtension(
    pluginId: string,
    trigger: string | null,
  ): Promise<boolean> {
    const deferred = this.#deferredIndexedExtensions.get(pluginId);
    if (!deferred) {
      return false;
    }
    if (this.plugins.get(pluginId)?.enabled) {
      return false;
    }

    const diagnostics = this.#communityPluginDiagnostics.get(pluginId);
    if (diagnostics) {
      this.#communityPluginDiagnostics.set(pluginId, {
        ...diagnostics,
        activationTrigger: trigger,
        state: "enabling",
      });
    }

    const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
    const commandShims =
      this.#manifestContributionDisposers
        .get(pluginId)
        ?.filter((entry) => entry.kind === "commands") ?? [];
    for (const entry of commandShims) {
      entry.dispose();
    }
    if (commandShims.length) {
      const remaining =
        this.#manifestContributionDisposers
          .get(pluginId)
          ?.filter((entry) => entry.kind !== "commands") ?? [];
      this.#manifestContributionDisposers.set(pluginId, remaining);
    }

    let enabled = false;
    try {
      if (
        indexedExtension?.source === "system" &&
        this.#systemExtensionPlugins.has(pluginId)
      ) {
        const runtimePlugin = this.instantiateSystemExtensionPlugin(pluginId);
        if (!runtimePlugin) {
          return false;
        }
        enabled = await this.enablePlugin(pluginId);
      } else {
        const pluginPath = joinPath(this.pluginsPath, pluginId);
        const runtimePlugin =
          (await this.loadPlugin(pluginPath, {
            loadDeferredRuntime: true,
          })) ?? null;
        if (!runtimePlugin) {
          return false;
        }
        enabled = await this.enablePlugin(pluginId);
      }
    } catch (error) {
      const message = `Failed to activate deferred extension ${pluginId}: ${formatPluginError(error)}`;
      this.recordCommunityPluginFailure(
        pluginId,
        this.plugins.get(pluginId)?.manifest ??
          this.#systemExtensionManifests.get(pluginId) ??
          null,
        message,
      );
      this.enableDeferredIndexedExtension(pluginId);
      return false;
    }

    if (!enabled) {
      this.enableDeferredIndexedExtension(pluginId);
      return false;
    }
    this.#deferredIndexedExtensions.delete(pluginId);
    const updatedDiagnostics = this.#communityPluginDiagnostics.get(pluginId);
    if (updatedDiagnostics) {
      this.#communityPluginDiagnostics.set(pluginId, {
        ...updatedDiagnostics,
        activationTrigger: trigger,
      });
    }
    return true;
  }

  private shouldDeferManifestActivation(pluginId: string): boolean {
    const indexedExtension = this.#lapisExtensionIndex.get(pluginId);
    return indexedExtension
      ? this.shouldDeferIndexedExtensionActivation(indexedExtension)
      : false;
  }

  private shouldDeferIndexedExtensionActivation(
    indexedExtension: LapisIndexedExtension,
  ): boolean {
    if (indexedExtension.classification !== "lapis-extension") {
      return false;
    }
    if (indexedExtension.source === "system") {
      return this.#systemExtensionPlugins.has(indexedExtension.pluginId);
    }
    if (!this.getSelectedRuntimeEntryForIndexedExtension(indexedExtension)) {
      return false;
    }
    const allEvents =
      this.collectIndexedExtensionActivationEvents(indexedExtension);
    if (!allEvents.length) {
      return false;
    }
    return indexedExtension.contributions.every((entry) => {
      if (entry.kind === "configuration") {
        return true;
      }
      return Boolean(
        activationEventForContribution(indexedExtension.pluginId, entry),
      );
    });
  }

  private collectIndexedExtensionActivationEvents(
    indexedExtension: LapisIndexedExtension,
  ): string[] {
    const events = new Set<string>(indexedExtension.activationEvents);
    for (const entry of indexedExtension.contributions) {
      const event = activationEventForContribution(
        indexedExtension.pluginId,
        entry,
      );
      if (event) {
        events.add(event);
      }
      if (entry.kind === "services") {
        const contribution = entry.contribution as LapisServiceContribution;
        events.add(`onService:${contribution.service}`);
      }
    }
    return [...events];
  }

  private syncIndexedExtensionActivation(
    indexedExtension: LapisIndexedExtension,
  ): void {
    for (const pluginIds of this.#indexedActivationRegistry.values()) {
      pluginIds.delete(indexedExtension.pluginId);
    }
    if (!this.shouldDeferIndexedExtensionActivation(indexedExtension)) {
      return;
    }
    for (const event of this.collectIndexedExtensionActivationEvents(
      indexedExtension,
    )) {
      const pluginIds = this.#indexedActivationRegistry.get(event) ?? new Set();
      pluginIds.add(indexedExtension.pluginId);
      this.#indexedActivationRegistry.set(event, pluginIds);
    }
  }

  private matchingPathActivationEvents(path: string): string[] {
    const matches: string[] = [];
    for (const event of this.#indexedActivationRegistry.keys()) {
      if (!event.startsWith("workspaceContains:")) {
        if (event.startsWith("onFileSystem:")) {
          const pattern = event.slice("onFileSystem:".length);
          if (matchesGlob(path, pattern)) {
            matches.push(event);
          }
        }
        continue;
      }
      const pattern = event.slice("workspaceContains:".length);
      if (matchesGlob(path, pattern)) {
        matches.push(event);
      }
    }
    return matches;
  }

  findLanguageIdsForPath(path: string): string[] {
    const languageIds = new Set<string>();
    const fileName = path.split("/").at(-1) ?? path;
    for (const extension of this.#lapisExtensionIndex.values()) {
      for (const entry of extension.contributions) {
        if (entry.kind !== "languages") {
          continue;
        }
        const contribution = entry.contribution as {
          id?: string;
          extensions?: string[];
          filenames?: string[];
        };
        const normalizedExtensions = (contribution.extensions ?? []).map(
          (it) => (it.startsWith(".") ? it : `.${it}`),
        );
        if (
          normalizedExtensions.some((suffix) =>
            path.toLowerCase().endsWith(suffix.toLowerCase()),
          ) ||
          (contribution.filenames ?? []).includes(fileName)
        ) {
          if (typeof contribution.id === "string" && contribution.id) {
            languageIds.add(contribution.id);
          }
        }
      }
    }
    return [...languageIds];
  }

  private instantiateSystemExtensionPlugin(pluginId: string): Plugin | null {
    const PluginType = this.#systemExtensionPlugins.get(pluginId);
    const manifest = this.#systemExtensionManifests.get(pluginId);
    if (!PluginType || !manifest || this.plugins.has(pluginId)) {
      return this.plugins.get(pluginId) ?? null;
    }

    const plugin = new PluginType(this.app);
    if (!(plugin instanceof Plugin)) {
      throw new Error(
        `System extension ${pluginId} does not extend the Plugin base class`,
      );
    }
    plugin.manifest.dir ??= dirname(
      this.getSystemExtensionManifestPath(undefined, pluginId),
    );
    this.registerPlugin(plugin, {
      source: "system",
      basePath: plugin.manifest.dir,
      required: this.#lapisExtensionIndex.get(pluginId)?.locked ?? false,
    });
    return plugin;
  }

  private createSystemExtensionManifest(
    registration: LapisSystemExtensionRegistration,
  ): PluginManifest {
    return {
      id: registration.manifest.id,
      name: registration.manifest.name,
      author: registration.manifest.author ?? "Lapis Notes",
      version: registration.manifest.version,
      minAppVersion: registration.manifest.minAppVersion ?? "0.0.0",
      description: registration.manifest.description ?? "",
      lapis: {
        ...registration.manifest.lapis,
        source: "system",
        enabledByDefault:
          registration.enabledByDefault ??
          registration.manifest.lapis.enabledByDefault,
        locked: registration.locked ?? registration.manifest.lapis.locked,
      },
    };
  }

  private getSystemExtensionManifestPath(
    basePath: string | undefined,
    pluginId: string,
  ): string {
    if (basePath) {
      return normalizePath(joinPath(basePath, "manifest.json"));
    }
    return `/.lapis/system-extensions/${pluginId}/manifest.json`;
  }

  private storeSystemExtensionServiceProviders(
    pluginId: string,
    registrations: LapisSystemServiceProviderRegistration[],
  ): void {
    const providers = new Map<string, LapisSystemServiceProviderRegistration>();
    for (const registration of registrations) {
      providers.set(
        createSystemExtensionServiceProviderKey(
          registration.service,
          registration.id,
        ),
        registration,
      );
    }
    this.#systemExtensionServiceProviders.set(pluginId, providers);
  }

  private getSystemExtensionServiceProviderRegistration(
    pluginId: string,
    service: string,
    providerId: string,
  ): LapisSystemServiceProviderRegistration | null {
    return (
      this.#systemExtensionServiceProviders
        .get(pluginId)
        ?.get(createSystemExtensionServiceProviderKey(service, providerId)) ??
      null
    );
  }

  private isManifestOnlyLapisExtension(
    manifest: PluginManifest,
    classification: LapisPluginClassification,
    hasMainJs: boolean,
  ): boolean {
    return (
      classification === "lapis-extension" &&
      !hasMainJs &&
      !hasDeclaredLapisRuntimeCode(manifest)
    );
  }

  private hasIndexedExtensionCodeEntry(
    indexedExtension: LapisIndexedExtension,
  ): boolean {
    return (
      this.getSelectedRuntimeEntryForIndexedExtension(indexedExtension) !== null
    );
  }

  private getSelectedCodeEntry(
    manifest: PluginManifest,
    classification: LapisPluginClassification,
    hasMainJs?: boolean,
  ): string | null {
    return (
      this.selectRuntimeEntryForManifest(manifest, {
        classification,
        hasMainJs,
      })?.path ?? null
    );
  }

  private getSelectedCommunityModulePath(
    manifest: PluginManifest,
    pluginPath: string,
    classification: LapisPluginClassification,
    hasMainJs?: boolean,
  ): string | null {
    const entry = this.getSelectedCodeEntry(
      manifest,
      classification,
      hasMainJs,
    );
    if (!entry) {
      return null;
    }
    if (entry === "main.js") {
      return joinPath(pluginPath, entry);
    }
    return this.resolveValidatedRuntimeEntryPath(
      manifest.id,
      pluginPath,
      entry,
    );
  }

  private getSelectedLapisRuntimeEntry(
    manifest: PluginManifest,
  ): string | null {
    const selected = this.selectRuntimeEntryForManifest(manifest, {
      hasMainJs: false,
      classification: "lapis-extension",
    });
    if (selected?.source === "obsidian-main") {
      return null;
    }
    return selected?.path ?? null;
  }

  private getHostIdForManifest(manifest: PluginManifest): string {
    return (
      this.#communityPluginHost.hostIdForManifest?.(manifest) ??
      this.#communityPluginHost.id
    );
  }

  private getHostIdForIndexedExtension(
    indexedExtension: LapisIndexedExtension,
  ): string {
    return isSidecarHost(this.#communityPluginHost.id) &&
      (indexedExtension.runtime?.desktop ||
        indexedExtension.runtime?.trustedDesktop ||
        indexedExtension.requestedCapabilities.length)
      ? this.#communityPluginHost.id
      : "renderer";
  }

  private getSelectedRuntimeEntryForManifest(
    manifest: PluginManifest,
    classification?: LapisPluginClassification,
  ): string | null {
    return (
      this.selectRuntimeEntryForManifest(manifest, {
        classification,
      })?.path ?? null
    );
  }

  private getSelectedRuntimeEntryForIndexedExtension(
    indexedExtension: LapisIndexedExtension,
  ): string | null {
    return (
      this.selectRuntimeEntryForIndexedExtension(indexedExtension)?.path ?? null
    );
  }

  private selectRuntimeEntryForManifest(
    manifest: PluginManifest,
    options: {
      classification?: LapisPluginClassification;
      hasMainJs?: boolean;
    } = {},
  ): SelectedPluginRuntimeEntry | null {
    const classification = options.classification;
    const requestedHost = this.getRequestedPluginExecutionHost(manifest);
    return selectPluginRuntimeEntry({
      manifest,
      requestedHost,
      supportsEsm: this.supportsRendererEsm(requestedHost),
      supportsNodeEsm: false,
      hasMainJs: options.hasMainJs ?? classification !== "lapis-extension",
    });
  }

  private selectRuntimeEntryForIndexedExtension(
    indexedExtension: LapisIndexedExtension,
  ): SelectedPluginRuntimeEntry | null {
    return selectPluginRuntimeEntry({
      manifest: {
        id: indexedExtension.pluginId,
        name: indexedExtension.name ?? indexedExtension.pluginId,
        author: "",
        version: "0.0.0",
        minAppVersion: "0.0.0",
        description: "",
        lapis: {
          manifestVersion: 1,
          runtime: indexedExtension.runtime,
        },
      },
      requestedHost: this.getRequestedPluginExecutionHostForHostId(
        this.getHostIdForIndexedExtension(indexedExtension),
      ),
      supportsEsm: this.supportsRendererEsm(
        this.getRequestedPluginExecutionHostForHostId(
          this.getHostIdForIndexedExtension(indexedExtension),
        ),
      ),
      supportsNodeEsm: false,
      hasMainJs: indexedExtension.classification !== "lapis-extension",
    });
  }

  private supportsRendererEsm(host: PluginExecutionHostId): boolean {
    return Boolean(this.#pluginAssetServer) && host !== "electron-sidecar";
  }

  private getRequestedPluginExecutionHost(
    manifest: PluginManifest,
  ): PluginExecutionHostId {
    return this.getRequestedPluginExecutionHostForHostId(
      this.getHostIdForManifest(manifest),
    );
  }

  private getRequestedPluginExecutionHostForHostId(
    hostId: string,
  ): PluginExecutionHostId {
    if (isSidecarHost(hostId)) {
      return "electron-sidecar";
    }
    return getNativeDesktopBridge()?.capabilities?.["plugin-assets"]?.status ===
      "available"
      ? "electron-renderer"
      : "workspace";
  }

  private resolveValidatedRuntimeEntryPath(
    pluginId: string,
    pluginPath: string,
    runtimeEntry: string,
  ): string {
    const normalizedPluginPath = normalizePath(pluginPath);
    const normalizedEntry = runtimeEntry.trim();
    if (!normalizedEntry) {
      throw new Error(
        `Plugin ${pluginId} is missing a Lapis runtime entry path`,
      );
    }
    if (normalizedEntry.startsWith("/")) {
      throw new Error(
        `Plugin ${pluginId} declares absolute Lapis runtime entry ${runtimeEntry}`,
      );
    }
    if (!/\.(?:[cm]?js)$/u.test(normalizedEntry)) {
      throw new Error(
        `Plugin ${pluginId} declares unsupported Lapis runtime entry ${runtimeEntry}`,
      );
    }

    const modulePath = normalizePath(
      joinPath(normalizedPluginPath, normalizedEntry),
    );
    if (
      modulePath === normalizedPluginPath ||
      !modulePath.startsWith(`${normalizedPluginPath}/`)
    ) {
      throw new Error(
        `Plugin ${pluginId} declares Lapis runtime entry ${runtimeEntry} outside the plugin root`,
      );
    }
    return modulePath;
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      return await this.adapter.exists(path);
    } catch (error) {
      if (isMissingPathError(error)) {
        return false;
      }
      throw error;
    }
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(value.filter((it): it is string => typeof it === "string")),
  ];
}

function matchesGlob(path: string, pattern: string): boolean {
  const normalizedPattern = pattern.trim();
  if (!normalizedPattern) {
    return false;
  }
  const escaped = normalizedPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const withDoubleStar = escaped.replace(/\*\*/g, "__DOUBLE_STAR__");
  const regex = new RegExp(
    `^${withDoubleStar
      .replace(/\*/g, "[^/]*")
      .replace(/__DOUBLE_STAR__/g, ".*")
      .replace(/\?/g, ".")}$`,
    "u",
  );
  return regex.test(path);
}

function isLanguageServiceId(service: string): boolean {
  return ["language-service", "lapis.languageService"].includes(service);
}

function scopeLapisProviderId(pluginId: string, providerId: string): string {
  const prefix = `${pluginId}:`;
  return providerId.startsWith(prefix) ? providerId : `${prefix}${providerId}`;
}

function createSystemExtensionServiceProviderKey(
  service: string,
  providerId: string,
): string {
  return `${service}:${providerId}`;
}

function normalizeLanguageServiceCapabilities(
  value: unknown,
): LanguageServiceProviderCapabilities {
  if (!isRecord(value)) {
    return {};
  }
  return {
    diagnostics: value.diagnostics === true,
    completion: value.completion === true,
    hover: value.hover === true,
    definition: value.definition === true,
    codeActions: value.codeActions === true,
  };
}

function languageServiceRuntimeFromDeclaration(
  runtime: string | undefined,
): LanguageServiceRuntime {
  switch (runtime) {
    case "desktop":
      return "native";
    case "browserWorker":
      return "worker";
    case "workspace":
    default:
      return "in-process";
  }
}

function runtimeMatchesHost(runtime: string, hostId: string): boolean {
  if (runtime === hostId) {
    return true;
  }
  if (hostId === "renderer") {
    return ["renderer", "browser", "pwa", "web"].includes(runtime);
  }
  if (isSidecarHost(hostId)) {
    return [
      "desktop",
      "electron",
      "electron-sidecar",
      "electron-plugin-sidecar",
      "plugin-sidecar",
    ].includes(runtime);
  }
  return false;
}

function isSidecarHost(hostId: string): boolean {
  return [
    "electron-plugin-sidecar",
    "plugin-sidecar",
    "electron-sidecar",
  ].includes(hostId);
}

function hostPlatformMatchesDependencyPlatform(
  host: PluginExecutionHostId,
  platform: string,
): boolean {
  switch (host) {
    case "electron-sidecar":
      return platform === "electron-sidecar";
    case "electron-renderer":
      return platform === "electron-renderer" || platform === "web";
    case "workspace":
    default:
      return platform === "web" || platform === "electron-renderer";
  }
}

function getPluginAssetUrlMode(
  url: string,
): CommunityPluginDiagnostics["assetUrlMode"] {
  if (url.startsWith(`${ELECTRON_PLUGIN_ASSET_SCHEME}://`)) {
    return "electron";
  }
  try {
    const parsed = new URL(url, "http://lapis.local");
    if (parsed.pathname.startsWith(`${WEB_PLUGIN_ASSET_ROUTE_PREFIX}/`)) {
      return "web";
    }
  } catch {
    // Fall through to custom for opaque or host-specific URL shapes.
  }
  return "custom";
}

function getBareDependencySpecifiersFromSources(
  moduleSources: Map<string, string>,
): string[] {
  return [
    ...new Set(
      [...moduleSources.values()].flatMap((source) =>
        scanBarePluginDependencySpecifiers(source),
      ),
    ),
  ].sort();
}
