import { appStatePath } from "../storage/path";
import { EventDispatcher } from "$lib/events";
import type { DataAdapter } from "$lib/storage/fs";
import { hasNativeDesktopCapability } from "$lib/storage/desktop-native";
import {
  checkCatalogEntryCompatibility,
  checkCatalogReleaseCompatibility,
  compareVersions,
} from "./compatibility";
import { PluginDistributionError } from "./errors";
import { InstalledPluginStateStore } from "./installed-plugin-state";
import {
  type InstallVerifiedPluginBundleOptions,
  type InstallVerifiedPluginOptions,
  type PluginBinaryFetch,
  type PluginInstallerProgressEvent,
  type PluginInstallerManager,
  VerifiedPluginInstaller,
} from "./installer";
import type { PluginBundleVerificationMode } from "./plugin-bundle-worker";
import {
  parseNostrPluginBundle,
  type ParsedNostrPluginBundle,
} from "./plugin-bundle";
import type { VerifiedPluginBundlePayload } from "./plugin-bundle-verifier";
import { PluginRegistryCache } from "./registry-cache";
import { PluginRegistryClient } from "./registry-client";
import { PluginRegistrySourcePreferenceStore } from "./registry-source-state";
import type {
  InstalledPluginRecord,
  PluginCatalogDetail,
  PluginCatalogEntry,
  PluginCatalogIndex,
  PluginCompatibilityInput,
  PluginCompatibilityResult,
  PluginDownloadStatsSummary,
  PluginPlatform,
  PluginProvenance,
  PluginRegistryChannel,
  PluginRevocationIndex,
  PluginRevocationRecord,
  PluginRegistrySource,
  PluginRegistrySourceKind,
  PluginRegistrySourceState,
  TrustedSigningKey,
} from "./types";

export type PluginInstallPhase =
  | "resolving"
  | "fetching-catalog"
  | "fetching-release"
  | "verifying-signature"
  | "downloading-bundle"
  | "verifying-bundle"
  | "extracting-files"
  | "verifying-files"
  | "staging"
  | "installing"
  | "loading"
  | "enabling"
  | "complete"
  | "failed";

export interface PluginInstallProgressEvent {
  pluginId: string;
  phase: PluginInstallPhase;
  message?: string;
  downloadedBytes?: number;
  processedBytes?: number;
  totalBytes?: number;
  filePath?: string;
  fileIndex?: number;
  fileCount?: number;
}

export type PluginInstallProgressListener = (
  event: PluginInstallProgressEvent,
) => void;

export interface PluginSearchQuery {
  text?: string;
  category?: string;
  channel?: PluginRegistryChannel | "all";
  installed?: boolean;
  compatibleOnly?: boolean;
}

export interface InstallPluginOptions {
  version?: string;
  /**
   * Defaults to true for direct installs. Updates pass the previous enabled
   * state explicitly so disabled plugins stay disabled.
   */
  enable?: boolean;
  registryId?: string;
  requireOfficial?: boolean;
  signal?: AbortSignal;
}

export interface InstallPluginBundleOptions {
  /** Defaults to true for manually selected official bundles. */
  enable?: boolean;
  signal?: AbortSignal;
}

export interface UpdatePluginOptions {
  signal?: AbortSignal;
}

export interface UninstallPluginOptions {
  removeData?: boolean;
}

export interface PluginUpdateInfo {
  id: string;
  name: string;
  currentVersion: string;
  latestVersion: string;
  targetVersion: string;
  provenance: PluginProvenance;
  registryId?: string;
  compatible: boolean;
  canUpdate: boolean;
  bundleSize?: number;
  status: "update-available" | "incompatible" | "revoked";
  reasons: PluginCompatibilityResult["reasons"];
  revoked?: PluginRevocationRecord;
}

export interface PluginDistributionManager {
  refreshCatalog(options?: { force?: boolean }): Promise<PluginCatalogIndex>;
  getDownloadStats?(options?: {
    force?: boolean;
  }): Promise<PluginDownloadStatsSummary | null>;
  listSources(): readonly PluginRegistrySourceState[];
  setSourceEnabled(sourceId: string, enabled: boolean): Promise<void>;
  search(query?: PluginSearchQuery): PluginCatalogEntry[];
  getCatalogEntry(pluginId: string): PluginCatalogEntry | undefined;
  getCompatibility?(pluginId: string): PluginCompatibilityResult | null;
  getPluginDetail(
    pluginId: string,
    options?: { registryId?: string },
  ): Promise<PluginCatalogDetail | null>;
  install(
    pluginId: string,
    options?: InstallPluginOptions,
  ): Promise<InstalledPluginRecord>;
  installBundle(
    bundle: ArrayBuffer | Uint8Array,
    options?: InstallPluginBundleOptions,
  ): Promise<InstalledPluginRecord>;
  update(
    pluginId: string,
    version?: string,
    options?: UpdatePluginOptions,
  ): Promise<InstalledPluginRecord | null>;
  uninstall(pluginId: string, options?: UninstallPluginOptions): Promise<void>;
  listInstalled(): Promise<InstalledPluginRecord[]>;
  getInstalled(pluginId: string): Promise<InstalledPluginRecord | null>;
  listUpdates(): Promise<PluginUpdateInfo[]>;
  addProgressListener(listener: PluginInstallProgressListener): () => void;
}

export interface PluginRegistryAdapterRefreshResult {
  index: PluginCatalogIndex;
  revocations?: PluginRevocationIndex;
  /** Nostr adapters set this only after their configured relay quorum agrees. */
  installReady: boolean;
  stale?: boolean;
  message?: string;
}

export interface PluginRegistryAdapter {
  refresh(
    source: PluginRegistrySource,
    options?: { force?: boolean },
  ): Promise<PluginRegistryAdapterRefreshResult>;
  getDetail(
    source: PluginRegistrySource,
    entry: PluginCatalogEntry,
  ): Promise<PluginCatalogDetail>;
  getDownloadStats?(
    source: PluginRegistrySource,
    options?: { force?: boolean },
  ): Promise<PluginDownloadStatsSummary | null>;
  /**
   * Nostr adapters verify the portable proof and payload before returning it.
   * The manager still applies compatibility, runtime, staging, and lifecycle
   * checks through the normal installer.
   */
  getVerifiedBundle?(
    source: PluginRegistrySource,
    entry: PluginCatalogEntry,
    detail: PluginCatalogDetail,
    version: string,
    options?: { signal?: AbortSignal },
  ): Promise<VerifiedPluginBundlePayload>;
  /** Verify a self-contained offline Nostr bundle without claiming freshness. */
  verifyOfflineBundle?(
    source: PluginRegistrySource,
    bundle: ParsedNostrPluginBundle,
    options?: { signal?: AbortSignal },
  ): Promise<VerifiedPluginBundlePayload>;
  /** Revalidate a stored Nostr proof against a live install-ready source. */
  revalidateInstalledProof?(
    source: PluginRegistrySource,
    record: InstalledPluginRecord,
    options?: { signal?: AbortSignal },
  ): Promise<NonNullable<InstalledPluginRecord["nostrProof"]>>;
}

export interface DefaultPluginDistributionManagerOptions {
  adapter: DataAdapter;
  appVersion: string;
  platform?: PluginPlatform;
  unavailablePlugins?: PluginCompatibilityInput["unavailablePlugins"];
  workspaceTrusted?: () => Promise<boolean> | boolean;
  registries?: PluginRegistrySource[];
  trustedKeys?: TrustedSigningKey[];
  fetch?: PluginBinaryFetch;
  pluginManager?: PluginInstallerManager;
  bundleVerification?: PluginBundleVerificationMode;
  registryAdapters?: Partial<
    Record<PluginRegistrySourceKind, PluginRegistryAdapter>
  >;
}

export const DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE: PluginRegistrySource = {
  id: "lapis-official",
  name: "Lapis Official Plugins",
  url: "https://registry.lapis.md/v2/index.json",
  downloadStatsUrl: "https://registry.lapis.md/stats/summary.json",
  trustTier: "official",
  enabled: true,
  builtin: true,
};

export const DEFAULT_PLUGIN_REGISTRY_SOURCES: PluginRegistrySource[] = [
  DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE,
];

export const EMBEDDED_PLUGIN_REGISTRY_KEYS: TrustedSigningKey[] = [
  {
    keyId: "lapis-registry-2026-06",
    alg: "ed25519",
    publicKey: "/MmGQHJ5rOUECVsU5Ee/PLTouW8V3TyxGBnPKJT87JA=",
    trustTier: "official",
  },
  {
    keyId: "lapis-plugin-release-2026-06",
    alg: "ed25519",
    publicKey: "bMPnlO7b+Xtthfk5wGUQAWWUV7NuIAhED4kX2EGzJqc=",
    trustTier: "official",
  },
];

export class DefaultPluginDistributionManager
  extends EventDispatcher<{ progress: [PluginInstallProgressEvent] }>
  implements PluginDistributionManager
{
  private catalog: PluginCatalogIndex | null = null;
  private readonly httpClients = new Map<string, PluginRegistryClient>();
  private readonly sourceCatalogs = new Map<
    string,
    PluginRegistryAdapterRefreshResult
  >();
  private readonly stateStore: InstalledPluginStateStore;
  private readonly sourcePreferenceStore: PluginRegistrySourcePreferenceStore;
  private readonly installer: VerifiedPluginInstaller;
  private registries: PluginRegistrySource[];
  private readonly trustedKeys: TrustedSigningKey[];
  private readonly registryAdapters: ReadonlyMap<
    PluginRegistrySourceKind,
    PluginRegistryAdapter
  >;
  private readonly sourceStates = new Map<string, PluginRegistrySourceState>();
  private readonly entrySources = new Map<string, PluginRegistrySource>();
  private installedIds: Set<string> = new Set();
  private revocations: PluginRevocationIndex | null = null;
  private sourcePreferencesLoaded: Promise<void> | null = null;

  constructor(
    private readonly options: DefaultPluginDistributionManagerOptions,
  ) {
    super();
    this.registries = (
      options.registries ?? DEFAULT_PLUGIN_REGISTRY_SOURCES
    ).map((source) => ({ ...source }));
    this.trustedKeys = options.trustedKeys ?? EMBEDDED_PLUGIN_REGISTRY_KEYS;
    this.stateStore = new InstalledPluginStateStore(options.adapter);
    this.sourcePreferenceStore = new PluginRegistrySourcePreferenceStore(
      options.adapter,
    );
    const httpAdapter: PluginRegistryAdapter = {
      refresh: async (source) => {
        const result = await this.httpClient(source).refresh(source);
        return {
          index: result.index,
          revocations: result.revocations,
          installReady: true,
          stale: result.stale,
          ...(result.stale
            ? { message: "Using cached registry metadata" }
            : {}),
        };
      },
      getDetail: async (source, entry) =>
        (await this.httpClient(source).getDetail(entry)).detail,
      getDownloadStats: (source, refreshOptions) =>
        this.httpClient(source).getDownloadStats(source, refreshOptions),
    };
    this.registryAdapters = new Map([
      ["http", httpAdapter],
      ...Object.entries(options.registryAdapters ?? {}).filter(
        (entry): entry is [PluginRegistrySourceKind, PluginRegistryAdapter] =>
          entry[1] !== undefined,
      ),
    ]);
    this.syncSourceStates();
    this.installer = new VerifiedPluginInstaller({
      adapter: options.adapter,
      trustedKeys: this.trustedKeys,
      fetch: options.fetch,
      stateStore: this.stateStore,
      pluginManager: options.pluginManager,
      bundleVerification:
        options.bundleVerification ??
        (this.platform === "web" ? "auto" : "main-thread"),
    });
  }

  async refreshCatalog(
    _options: { force?: boolean } = {},
  ): Promise<PluginCatalogIndex> {
    await this.ensureSourcePreferencesLoaded();
    this.emitProgress("*", "fetching-catalog");
    this.entrySources.clear();
    this.syncSourceStates();
    const sources = this.registries.filter((registry) => registry.enabled);
    if (!sources.length) {
      this.catalog = {
        schemaVersion: 1,
        generatedAt: new Date(0).toISOString(),
        plugins: [],
      };
      this.revocations = null;
      return this.catalog;
    }
    const indexes: Array<{
      source: PluginRegistrySource;
      result: PluginRegistryAdapterRefreshResult;
    }> = [];
    const errors: unknown[] = [];
    for (const source of sources) {
      const adapter = this.adapterForSource(source);
      if (!adapter) {
        const message = `No ${this.sourceKind(source)} registry adapter is available`;
        this.sourceStates.set(source.id, {
          source,
          phase: "error",
          installReady: false,
          message,
        });
        errors.push(new Error(message));
        continue;
      }
      try {
        const result = await adapter.refresh(source, _options);
        indexes.push({ source, result });
        this.sourceCatalogs.set(source.id, result);
        this.sourceStates.set(source.id, {
          source,
          phase: result.stale ? "degraded" : "ready",
          installReady: result.installReady,
          ...(result.message ? { message: result.message } : {}),
        });
      } catch (error) {
        errors.push(error);
        this.sourceStates.set(source.id, {
          source,
          phase: "error",
          installReady: false,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (!indexes.length)
      throw errors[0] ?? new Error("No registry source is available");

    const plugins: PluginCatalogEntry[] = [];
    const seen = new Set<string>();
    const registries: NonNullable<PluginCatalogIndex["registries"]> = {};
    for (const { source, result } of [...indexes].sort(
      (a, b) =>
        Number(this.sourceKind(a.source) === "nostr") -
        Number(this.sourceKind(b.source) === "nostr"),
    )) {
      registries[source.id] = {
        name: source.name,
        trustTier: source.trustTier,
      };
      for (const entry of result.index.plugins) {
        if (seen.has(entry.id)) continue;
        seen.add(entry.id);
        plugins.push(entry);
        this.entrySources.set(entry.id, source);
      }
    }
    this.catalog = {
      schemaVersion: 2,
      generatedAt: indexes
        .map(({ result }) => result.index.generatedAt)
        .sort()
        .at(-1)!,
      registries,
      plugins,
    };
    this.revocations = {
      schemaVersion: 1,
      generatedAt: this.catalog.generatedAt,
      revoked: indexes.flatMap(
        ({ result }) => result.revocations?.revoked ?? [],
      ),
    };
    await this.applyRevocationsToInstalled();
    await this.revalidateInstalledNostrProofs();
    return this.catalog;
  }

  async getDownloadStats(
    options: { force?: boolean } = {},
  ): Promise<PluginDownloadStatsSummary | null> {
    await this.ensureSourcePreferencesLoaded();
    for (const source of this.registries.filter((entry) => entry.enabled)) {
      const adapter = this.adapterForSource(source);
      if (!adapter?.getDownloadStats) continue;
      const result = await adapter.getDownloadStats(source, options);
      if (result) return result;
    }
    return null;
  }

  listSources(): readonly PluginRegistrySourceState[] {
    return this.registries.map(
      (source) =>
        this.sourceStates.get(source.id) ?? {
          source,
          phase: "idle",
          installReady: false,
        },
    );
  }

  async setSourceEnabled(sourceId: string, enabled: boolean): Promise<void> {
    await this.ensureSourcePreferencesLoaded();
    const target = this.registries.find((source) => source.id === sourceId);
    if (!target) {
      throw new PluginDistributionError(
        "metadata-invalid",
        `Registry source ${sourceId} is not configured.`,
      );
    }
    this.registries = this.registries.map((source) =>
      source.id === sourceId ? { ...source, enabled } : source,
    );
    this.catalog = null;
    this.revocations = null;
    this.entrySources.clear();
    this.syncSourceStates();
    await this.sourcePreferenceStore.save({
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      sources: Object.fromEntries(
        this.registries.map((source) => [
          source.id,
          { enabled: source.enabled },
        ]),
      ),
    });
  }

  search(query: PluginSearchQuery = {}): PluginCatalogEntry[] {
    const text = query.text?.trim().toLowerCase();
    return (this.catalog?.plugins ?? []).filter((entry) => {
      if (text) {
        const haystack =
          `${entry.name} ${entry.id} ${entry.description} ${entry.author}`.toLowerCase();
        if (!haystack.includes(text)) return false;
      }
      if (query.category && !entry.categories.includes(query.category)) {
        return false;
      }
      if (
        query.channel &&
        query.channel !== "all" &&
        entry.channel !== query.channel
      ) {
        return false;
      }
      if (
        typeof query.installed === "boolean" &&
        this.installedIds.has(entry.id) !== query.installed
      ) {
        return false;
      }
      if (query.compatibleOnly) {
        if (!this.getCompatibility(entry.id)?.compatible) return false;
      }
      return true;
    });
  }

  getCatalogEntry(pluginId: string): PluginCatalogEntry | undefined {
    return this.catalog?.plugins.find((entry) => entry.id === pluginId);
  }

  getCompatibility(pluginId: string): PluginCompatibilityResult | null {
    const entry = this.getCatalogEntry(pluginId);
    return entry
      ? checkCatalogEntryCompatibility(entry, this.compatibilityInput(false))
      : null;
  }

  async getPluginDetail(
    pluginId: string,
    options: { registryId?: string } = {},
  ): Promise<PluginCatalogDetail | null> {
    const entry = this.entryForSource(pluginId, options.registryId);
    if (!entry) return null;
    const source = options.registryId
      ? this.registries.find((candidate) => candidate.id === options.registryId)
      : this.sourceForEntry(entry);
    const adapter = source ? this.adapterForSource(source) : undefined;
    if (!source || !adapter) return null;
    return adapter.getDetail(source, entry);
  }

  async install(
    pluginId: string,
    options: InstallPluginOptions = {},
  ): Promise<InstalledPluginRecord> {
    try {
      this.emitProgress(pluginId, "resolving", "Resolving plugin");
      const entry = this.entryForSource(pluginId, options.registryId);
      if (!entry)
        throw new PluginDistributionError(
          "metadata-invalid",
          `Plugin ${pluginId} is unavailable from the requested source.`,
        );
      if (["pending", "disabled", "revoked"].includes(entry.status ?? "active"))
        throw new PluginDistributionError(
          "metadata-invalid",
          `Plugin ${pluginId} is ${entry.status}.`,
        );
      if (options.requireOfficial && entry.channel !== "official") {
        throw new PluginDistributionError(
          "metadata-invalid",
          `Plugin ${pluginId} is not an official registry entry.`,
        );
      }
      const entryCompatibility = checkCatalogEntryCompatibility(
        entry,
        this.compatibilityInput(false),
      );
      if (!entryCompatibility.compatible) {
        throw new PluginDistributionError(
          "compatibility-failed",
          `Plugin ${pluginId} is not compatible: ${entryCompatibility.reasons.join(", ")}`,
          { details: { reasons: entryCompatibility.reasons } },
        );
      }

      this.emitProgress(
        pluginId,
        "fetching-release",
        "Fetching release metadata",
      );
      const detail = await this.getPluginDetail(pluginId, {
        registryId: options.registryId,
      });
      if (!detail) {
        throw new PluginDistributionError(
          "metadata-invalid",
          `Plugin ${pluginId} is missing registry detail metadata.`,
        );
      }
      const release = detail.versions[options.version ?? detail.latestVersion];
      if (!release) {
        throw new PluginDistributionError(
          "metadata-invalid",
          `Plugin ${pluginId} has no requested release.`,
        );
      }
      const releaseCompatibility = checkCatalogReleaseCompatibility(
        release,
        this.compatibilityInput(false),
        pluginId,
      );
      if (!releaseCompatibility.compatible) {
        throw new PluginDistributionError(
          "compatibility-failed",
          `Plugin ${pluginId} release is not compatible: ${releaseCompatibility.reasons.join(", ")}`,
          { details: { reasons: releaseCompatibility.reasons } },
        );
      }

      this.emitProgress(
        pluginId,
        "verifying-signature",
        "Verifying release signature",
      );
      const source = options.registryId
        ? this.registries.find(
            (candidate) => candidate.id === options.registryId,
          )
        : this.sourceForEntry(entry);
      const adapter = source ? this.adapterForSource(source) : undefined;
      const installOptions: InstallVerifiedPluginOptions = {
        entry,
        detail,
        version: options.version,
        enable: options.enable,
        registryId: source?.id,
        registryUrl: source?.url,
        provenance: entry.channel,
        compatibility: this.compatibilityInput(await this.isWorkspaceTrusted()),
        signal: options.signal,
        onProgress: ({ phase, message, ...details }) => {
          this.emitProgress(pluginId, phase, message, details);
        },
      };
      let record: InstalledPluginRecord;
      if (source && adapter?.getVerifiedBundle) {
        const sourceState = this.sourceStates.get(source.id);
        if (!sourceState?.installReady) {
          throw new PluginDistributionError(
            "metadata-invalid",
            `Registry source ${source.name} has not reached install quorum.`,
          );
        }
        const version = options.version ?? detail.latestVersion;
        const payload = await adapter.getVerifiedBundle(
          source,
          entry,
          detail,
          version,
          { signal: options.signal },
        );
        if (
          payload.releaseManifest.pluginId !== entry.id ||
          payload.releaseManifest.version !== version ||
          payload.releaseManifest.channel !== entry.channel
        ) {
          throw new PluginDistributionError(
            "metadata-invalid",
            "Verified registry payload does not match catalog metadata.",
          );
        }
        record = await this.installer.installVerifiedPayload(payload, {
          enable: installOptions.enable,
          registryId: installOptions.registryId,
          registryUrl: installOptions.registryUrl,
          provenance: installOptions.provenance,
          compatibility: installOptions.compatibility,
          signal: installOptions.signal,
          onProgress: installOptions.onProgress,
        });
      } else {
        record = await this.installer.install(installOptions);
      }
      this.installedIds.add(pluginId);
      this.emitProgress(pluginId, "complete", "Plugin installed");
      return record;
    } catch (error) {
      this.emitProgress(
        pluginId,
        "failed",
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async installBundle(
    bundle: ArrayBuffer | Uint8Array,
    options: InstallPluginBundleOptions = {},
  ): Promise<InstalledPluginRecord> {
    let progressPluginId = "*";
    try {
      this.emitProgress(
        progressPluginId,
        "verifying-signature",
        "Verifying plugin bundle",
      );
      const onProgress = ({
        phase,
        message,
        ...details
      }: PluginInstallerProgressEvent) => {
        this.emitProgress(progressPluginId, phase, message, details);
      };
      const commonOptions = {
        enable: options.enable,
        compatibility: this.compatibilityInput(await this.isWorkspaceTrusted()),
        signal: options.signal,
        onProgress,
      };
      const portable = parseNostrPluginBundle(bundle, {
        onProgress: commonOptions.onProgress,
      });
      let record: InstalledPluginRecord;
      if (portable) {
        const verified = await this.verifyOfflineNostrBundle(
          portable,
          options.signal,
        );
        record = await this.installer.installVerifiedPayload(verified.payload, {
          ...commonOptions,
          provenance: verified.payload.releaseManifest.channel,
          registryId: verified.source.id,
          registryUrl: verified.source.url,
        });
      } else {
        record = await this.installer.installBundle({
          bundle,
          ...commonOptions,
          provenance: "official",
        });
      }
      progressPluginId = record.pluginId;
      this.installedIds.add(record.pluginId);
      this.emitProgress(record.pluginId, "complete", "Plugin installed");
      return record;
    } catch (error) {
      this.emitProgress(
        progressPluginId,
        "failed",
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  private async verifyOfflineNostrBundle(
    bundle: ParsedNostrPluginBundle,
    signal?: AbortSignal,
  ): Promise<{
    payload: VerifiedPluginBundlePayload;
    source: PluginRegistrySource;
  }> {
    await this.ensureSourcePreferencesLoaded();
    const failures: unknown[] = [];
    for (const source of this.registries.filter(
      (candidate) =>
        candidate.enabled && this.sourceKind(candidate) === "nostr",
    )) {
      const adapter = this.adapterForSource(source);
      if (!adapter?.verifyOfflineBundle) continue;
      try {
        return {
          payload: await adapter.verifyOfflineBundle(source, bundle, {
            signal,
          }),
          source,
        };
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length) throw failures[0];
    throw new PluginDistributionError(
      "metadata-invalid",
      "No enabled Nostr source can verify this offline plugin bundle.",
    );
  }

  async update(
    pluginId: string,
    version?: string,
    options: UpdatePluginOptions = {},
  ): Promise<InstalledPluginRecord | null> {
    const installed = await this.getInstalled(pluginId);
    const pinnedSource = installed
      ? this.installedSource(installed)
      : undefined;
    const entry = pinnedSource
      ? this.entryForSource(pluginId, pinnedSource.id)
      : undefined;
    if (!installed || !entry || !pinnedSource) return null;
    const targetVersion =
      version ?? installed.revoked?.replacementVersion ?? entry.latestVersion;
    if (compareVersions(targetVersion, installed.installedVersion) <= 0) {
      return installed;
    }
    const wasEnabled = Boolean(
      this.options.pluginManager?.isPluginEnabled?.(pluginId),
    );
    const updated = await this.install(pluginId, {
      version: targetVersion,
      registryId: pinnedSource.id,
      enable: wasEnabled,
      signal: options.signal,
    });
    if (updated.installedAt !== installed.installedAt) {
      const merged = { ...updated, installedAt: installed.installedAt };
      await this.stateStore.upsert(merged);
      return merged;
    }
    return updated;
  }

  async uninstall(
    pluginId: string,
    options: UninstallPluginOptions = {},
  ): Promise<void> {
    await this.installer.uninstall(pluginId, options);
    this.installedIds.delete(pluginId);
  }

  async listInstalled(): Promise<InstalledPluginRecord[]> {
    const installed = await this.stateStore.list();
    this.installedIds = new Set(installed.map((record) => record.pluginId));
    return installed;
  }

  getInstalled(pluginId: string): Promise<InstalledPluginRecord | null> {
    return this.stateStore.get(pluginId);
  }

  async listUpdates(): Promise<PluginUpdateInfo[]> {
    const installed = await this.listInstalled();
    const updates: PluginUpdateInfo[] = [];
    for (const record of installed) {
      if (record.provenance !== "official") continue;
      const pinnedSource = this.installedSource(record);
      const entry = pinnedSource
        ? this.entryForSource(record.pluginId, pinnedSource.id)
        : undefined;
      const revoked = this.revocationFor(record) ?? record.revoked;
      if (!entry) {
        if (revoked) {
          updates.push({
            id: record.pluginId,
            name: record.pluginId,
            currentVersion: record.installedVersion,
            latestVersion: record.installedVersion,
            targetVersion: record.installedVersion,
            provenance: record.provenance,
            registryId: record.registryId,
            compatible: false,
            canUpdate: false,
            status: "revoked",
            reasons: ["revoked"],
            revoked,
          });
        }
        continue;
      }

      const targetVersion = revoked?.replacementVersion ?? entry.latestVersion;
      const hasNewerTarget =
        compareVersions(targetVersion, record.installedVersion) > 0;
      if (!hasNewerTarget && !revoked) continue;

      let compatibility: PluginCompatibilityResult =
        checkCatalogEntryCompatibility(entry, this.compatibilityInput(false));
      const detail = await this.getPluginDetail(record.pluginId, {
        registryId: pinnedSource?.id,
      });
      const targetRelease = detail?.versions[targetVersion];
      if (targetRelease) {
        compatibility = checkCatalogReleaseCompatibility(
          targetRelease,
          this.compatibilityInput(false),
          record.pluginId,
        );
      }

      const canUpdate = hasNewerTarget && compatibility.compatible;
      const update: PluginUpdateInfo = {
        id: record.pluginId,
        name: entry.name,
        currentVersion: record.installedVersion,
        latestVersion: entry.latestVersion,
        targetVersion,
        provenance: record.provenance,
        registryId: record.registryId,
        compatible: compatibility.compatible,
        canUpdate,
        bundleSize: targetRelease?.bundle.size,
        status: revoked
          ? "revoked"
          : compatibility.compatible
            ? "update-available"
            : "incompatible",
        reasons: compatibility.reasons,
      };
      if (revoked) update.revoked = revoked;
      updates.push(update);
    }
    return updates;
  }

  addProgressListener(listener: PluginInstallProgressListener): () => void {
    this.on("progress", listener);
    return () => this.off("progress", listener);
  }

  private httpClient(source: PluginRegistrySource): PluginRegistryClient {
    const key = `${source.id}:${source.url}`;
    let client = this.httpClients.get(key);
    if (!client) {
      client = new PluginRegistryClient({
        trustedKeys: this.trustedKeys.filter(
          (key) => key.trustTier === source.trustTier,
        ),
        fetch: this.options.fetch,
        cache: new PluginRegistryCache({
          adapter: this.options.adapter,
          cachePath: appStatePath(
            `plugin-registry-cache/${encodeURIComponent(source.id)}/${encodeURIComponent(source.url)}.json`,
          ),
        }),
      });
      this.httpClients.set(key, client);
    }
    return client;
  }

  private entryForSource(
    pluginId: string,
    registryId?: string,
  ): PluginCatalogEntry | undefined {
    if (!registryId) return this.getCatalogEntry(pluginId);
    const state = this.sourceStates.get(registryId);
    if (!state?.source.enabled || !state.installReady) return undefined;
    return this.sourceCatalogs
      .get(registryId)
      ?.index.plugins.find((entry) => entry.id === pluginId);
  }

  private installedSource(
    record: Pick<InstalledPluginRecord, "registryId" | "registryUrl">,
  ): PluginRegistrySource | undefined {
    const source = record.registryId
      ? this.registries.find((candidate) => candidate.id === record.registryId)
      : this.registries.find(
          (candidate) => candidate.url === record.registryUrl,
        );
    if (!source) return undefined;
    if (!record.registryUrl || record.registryUrl === source.url) return source;
    if (
      source.id === "lapis-official" &&
      source.url === "https://registry.lapis.md/v2/index.json" &&
      record.registryUrl === "https://registry.lapis.md/v1/index.json"
    )
      return source;
    return undefined;
  }

  private requireEntry(pluginId: string): PluginCatalogEntry {
    const entry = this.getCatalogEntry(pluginId);
    if (!entry) {
      throw new PluginDistributionError(
        "metadata-invalid",
        `Plugin ${pluginId} is not in the current registry catalog.`,
      );
    }
    return entry;
  }

  private sourceForEntry(
    entry: PluginCatalogEntry,
  ): PluginRegistrySource | null {
    return this.entrySources.get(entry.id) ?? null;
  }

  private sourceKind(source: PluginRegistrySource): PluginRegistrySourceKind {
    return source.kind ?? "http";
  }

  private adapterForSource(
    source: PluginRegistrySource,
  ): PluginRegistryAdapter | undefined {
    return this.registryAdapters.get(this.sourceKind(source));
  }

  private compatibilityInput(
    workspaceTrusted: boolean,
  ): PluginCompatibilityInput {
    return {
      appVersion: this.options.appVersion,
      platform: this.platform,
      workspaceTrusted,
      unavailablePlugins: this.options.unavailablePlugins,
    };
  }

  private get platform(): PluginPlatform {
    return (
      this.options.platform ??
      (hasNativeDesktopCapability("resource") ? "electron" : "web")
    );
  }

  private async isWorkspaceTrusted(): Promise<boolean> {
    return Boolean(await this.options.workspaceTrusted?.());
  }

  private ensureSourcePreferencesLoaded(): Promise<void> {
    this.sourcePreferencesLoaded ??= this.loadSourcePreferences();
    return this.sourcePreferencesLoaded;
  }

  private async loadSourcePreferences(): Promise<void> {
    const preferences = await this.sourcePreferenceStore.load();
    this.registries = this.registries.map((source) => {
      const preference = preferences.sources[source.id];
      return preference
        ? { ...source, enabled: preference.enabled }
        : { ...source };
    });
    this.syncSourceStates();
  }

  private syncSourceStates(): void {
    const configuredIds = new Set(this.registries.map((source) => source.id));
    for (const sourceId of this.sourceStates.keys()) {
      if (!configuredIds.has(sourceId)) this.sourceStates.delete(sourceId);
    }
    for (const source of this.registries) {
      const previous = this.sourceStates.get(source.id);
      this.sourceStates.set(source.id, {
        source,
        phase: source.enabled ? (previous?.phase ?? "idle") : "idle",
        installReady: source.enabled
          ? (previous?.installReady ?? false)
          : false,
        ...(source.enabled && previous?.message
          ? { message: previous.message }
          : {}),
      });
    }
  }

  private async applyRevocationsToInstalled(): Promise<void> {
    const installed = await this.stateStore.list();
    for (const record of installed) {
      if (record.provenance !== "official") continue;
      const source = this.installedSource(record);
      if (
        !source ||
        this.sourceStates.get(source.id)?.phase !== "ready" ||
        !this.sourceCatalogs.get(source.id)?.revocations
      )
        continue;
      const revoked = this.revocationFor(record);
      if (sameRevocation(record.revoked, revoked)) continue;
      const next: InstalledPluginRecord = {
        ...record,
        updatedAt: new Date().toISOString(),
      };
      if (revoked) {
        next.revoked = revoked;
      } else {
        delete next.revoked;
      }
      await this.stateStore.upsert(next);
    }
  }

  private async revalidateInstalledNostrProofs(): Promise<void> {
    const installed = await this.stateStore.list();
    for (const record of installed) {
      if (!record.nostrProof?.requiresRelayRefresh || !record.registryId) {
        continue;
      }
      const state = this.sourceStates.get(record.registryId);
      if (!state?.installReady || state.phase !== "ready") continue;
      const adapter = this.adapterForSource(state.source);
      if (!adapter?.revalidateInstalledProof) continue;
      try {
        const nostrProof = await adapter.revalidateInstalledProof(
          state.source,
          record,
        );
        await this.stateStore.upsert({
          ...record,
          nostrProof,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // A live source must positively revalidate the same release before the
        // offline warning can be cleared. Failures retain the warning.
      }
    }
  }

  private revocationFor(
    record: Pick<
      InstalledPluginRecord,
      "pluginId" | "installedVersion" | "registryId" | "registryUrl"
    >,
  ): PluginRevocationRecord | undefined {
    const source = this.installedSource(record);
    const match = (
      source ? this.sourceCatalogs.get(source.id)?.revocations : undefined
    )?.revoked.find(
      (revocation) =>
        revocation.pluginId === record.pluginId &&
        revocation.versions.includes(record.installedVersion),
    );
    if (!match) return undefined;
    const { pluginId: _pluginId, versions: _versions, ...revocation } = match;
    return revocation;
  }

  private emitProgress(
    pluginId: string,
    phase: PluginInstallPhase,
    message?: string,
    details: Omit<
      Partial<PluginInstallProgressEvent>,
      "pluginId" | "phase" | "message"
    > = {},
  ): void {
    this.dispatch("progress", { pluginId, phase, message, ...details });
  }
}

const sameRevocation = (
  left: PluginRevocationRecord | undefined,
  right: PluginRevocationRecord | undefined,
): boolean =>
  (!left && !right) ||
  Boolean(
    left &&
      right &&
      left.revokedAt === right.revokedAt &&
      left.reason === right.reason &&
      left.message === right.message &&
      left.replacementVersion === right.replacementVersion,
  );
