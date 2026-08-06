import { basename, dirname, joinPath } from "$lib/storage/path";
import type { DataAdapter } from "$lib/storage/fs";
import type { PluginManifest } from "../plugin";
import { checkReleaseManifestCompatibility } from "./compatibility";
import { PluginDistributionError } from "./errors";
import {
  InstalledPluginStateStore,
  ensureFolder,
} from "./installed-plugin-state";
import {
  canUsePluginBundleWorker,
  verifyPluginBundlePayloadInWorker,
  type PluginBundleVerificationMode,
} from "./plugin-bundle-worker";
import {
  exactArrayBuffer,
  throwIfAborted,
  verifyPluginBundlePayload,
  type VerifiedPluginBundlePayload,
} from "./plugin-bundle-verifier";
import { assertPluginIdAllowedForProvenance } from "./reserved-ids";
import { validatePluginReleaseRuntime } from "./runtime-validation";
import type {
  InstalledPluginRecord,
  PluginCatalogDetail,
  PluginCatalogEntry,
  PluginCatalogRelease,
  PluginCompatibilityInput,
  PluginProvenance,
  PluginReleaseManifest,
  RemoteFileReference,
  TrustedSigningKey,
} from "./types";

export type PluginBinaryFetch = (
  url: string,
  init?: RequestInit,
) => Promise<PluginBinaryResponse>;

export type PluginBinaryResponse = Pick<
  Response,
  "ok" | "status" | "statusText" | "arrayBuffer" | "text"
> & {
  body?: ReadableStream<Uint8Array> | null;
};

export type PluginInstallerProgressPhase =
  | "downloading-bundle"
  | "verifying-bundle"
  | "extracting-files"
  | "verifying-files"
  | "staging"
  | "installing"
  | "loading"
  | "enabling";

export interface PluginInstallerProgressEvent {
  phase: PluginInstallerProgressPhase;
  message?: string;
  downloadedBytes?: number;
  processedBytes?: number;
  totalBytes?: number;
  filePath?: string;
  fileIndex?: number;
  fileCount?: number;
}

export interface PluginInstallerManager {
  loadPlugin?(
    pluginPath: string,
    options?: { provenance?: PluginProvenance },
  ): Promise<unknown>;
  enablePlugin?(pluginId: string): Promise<boolean>;
  disablePlugin?(pluginId: string): Promise<boolean>;
  isPluginEnabled?(pluginId: string): boolean;
  getCommunityPluginDiagnostics?(pluginId: string): {
    state?: string;
    lastFailureMessage?: string | null;
  } | null;
}

export interface InstallVerifiedPluginOptions {
  entry: PluginCatalogEntry;
  detail: PluginCatalogDetail;
  version?: string;
  enable?: boolean;
  registryId?: string;
  registryUrl?: string;
  provenance?: PluginProvenance;
  compatibility?: PluginCompatibilityInput;
  signal?: AbortSignal;
  onProgress?: (event: PluginInstallerProgressEvent) => void;
}

export interface InstallVerifiedPluginBundleOptions {
  bundle: ArrayBuffer | Uint8Array;
  enable?: boolean;
  registryId?: string;
  registryUrl?: string;
  provenance?: PluginProvenance;
  compatibility?: PluginCompatibilityInput;
  signal?: AbortSignal;
  onProgress?: (event: PluginInstallerProgressEvent) => void;
}

export interface UninstallVerifiedPluginOptions {
  removeData?: boolean;
}

export class VerifiedPluginInstaller {
  private readonly fetchImpl: PluginBinaryFetch;
  private readonly stateStore: InstalledPluginStateStore;

  constructor(
    private readonly options: {
      adapter: DataAdapter;
      trustedKeys: TrustedSigningKey[];
      pluginsPath?: string;
      stateStore?: InstalledPluginStateStore;
      fetch?: PluginBinaryFetch;
      pluginManager?: PluginInstallerManager;
      now?: () => Date;
      bundleVerification?: PluginBundleVerificationMode;
    },
  ) {
    this.fetchImpl =
      options.fetch ??
      ((url, init) =>
        globalThis.fetch(url, init) as Promise<PluginBinaryResponse>);
    this.stateStore =
      options.stateStore ??
      new InstalledPluginStateStore(options.adapter, { now: options.now });
  }

  async install(
    options: InstallVerifiedPluginOptions,
  ): Promise<InstalledPluginRecord> {
    throwIfAborted(options.signal);
    const release = this.resolveRelease(options.detail, options.version);
    const bundleUrl = new URL(
      release.bundle.url,
      options.entry.detail,
    ).toString();
    const bundle = await this.fetchBundle(bundleUrl, release.bundle, options);
    const payload = await this.verifyPluginBundle(bundle, {
      ...options,
      expectedBundle: release.bundle,
    });
    this.assertReleaseMatchesCatalog(
      options.entry,
      options.detail,
      release,
      payload.releaseManifest,
    );

    return this.installVerifiedBundlePayload(payload, {
      enable: options.enable,
      registryId: options.registryId,
      registryUrl: options.registryUrl,
      provenance: options.provenance ?? options.entry.channel,
      compatibility: options.compatibility,
      signal: options.signal,
      onProgress: options.onProgress,
    });
  }

  async installBundle(
    options: InstallVerifiedPluginBundleOptions,
  ): Promise<InstalledPluginRecord> {
    throwIfAborted(options.signal);
    const payload = await this.verifyPluginBundle(options.bundle, options);
    return this.installVerifiedBundlePayload(payload, {
      ...options,
      provenance: options.provenance ?? "official",
    });
  }

  async uninstall(
    pluginId: string,
    options: UninstallVerifiedPluginOptions = {},
  ): Promise<void> {
    await this.options.pluginManager?.disablePlugin?.(pluginId);
    const pluginPath = joinPath(this.pluginsPath, pluginId);

    if (options.removeData) {
      await this.removeIfExists(pluginPath);
    } else {
      await this.removePluginCodeButKeepData(pluginPath);
    }

    await this.removeCommunityPluginEnabledState(pluginId);
    await this.stateStore.remove(pluginId);
  }

  private resolveRelease(
    detail: PluginCatalogDetail,
    version?: string,
  ): PluginCatalogRelease {
    const release = detail.versions[version ?? detail.latestVersion];
    if (!release) {
      throw new PluginDistributionError(
        "metadata-invalid",
        `No release metadata found for ${detail.id}@${version ?? detail.latestVersion}.`,
      );
    }
    return release;
  }

  private assertReleaseMatchesCatalog(
    entry: PluginCatalogEntry,
    detail: PluginCatalogDetail,
    release: PluginCatalogRelease,
    manifest: PluginReleaseManifest,
  ): void {
    if (
      entry.id !== detail.id ||
      entry.id !== manifest.pluginId ||
      release.version !== manifest.version ||
      entry.channel !== manifest.channel
    ) {
      throw new PluginDistributionError(
        "metadata-invalid",
        "Release manifest does not match catalog metadata.",
        {
          details: {
            entryId: entry.id,
            detailId: detail.id,
            releaseVersion: release.version,
            manifestPluginId: manifest.pluginId,
            manifestVersion: manifest.version,
          },
        },
      );
    }
  }

  private async fetchBundle(
    url: string,
    expectedBundle: RemoteFileReference,
    options: Pick<InstallVerifiedPluginOptions, "signal" | "onProgress">,
  ): Promise<Uint8Array> {
    throwIfAborted(options.signal);
    const response = await this.fetchImpl(url, { signal: options.signal });
    if (!response.ok) {
      throw new PluginDistributionError(
        "metadata-invalid",
        `Plugin bundle fetch failed for ${url}: ${response.status} ${response.statusText}`,
        { details: { url, status: response.status } },
      );
    }
    const bytes = await this.readBundleResponseBytes(response, {
      signal: options.signal,
      onProgress: options.onProgress,
      totalBytes: expectedBundle.size,
    });
    return bytes;
  }

  private async verifyPluginBundle(
    bundle: ArrayBuffer | Uint8Array,
    options: Pick<
      InstallVerifiedPluginBundleOptions,
      "signal" | "onProgress"
    > & {
      expectedBundle?: RemoteFileReference;
    },
  ): Promise<VerifiedPluginBundlePayload> {
    throwIfAborted(options.signal);
    const verifierOptions = {
      bundle,
      trustedKeys: this.options.trustedKeys,
      expectedBundle: options.expectedBundle,
      signal: options.signal,
      onProgress: options.onProgress,
    };
    const mode = this.options.bundleVerification ?? "auto";
    if (
      mode !== "main-thread" &&
      (mode === "worker" || canUsePluginBundleWorker())
    ) {
      try {
        return await verifyPluginBundlePayloadInWorker(verifierOptions);
      } catch (error) {
        if (mode === "worker" || isAbortError(error)) {
          throw error;
        }
      }
    }
    return verifyPluginBundlePayload(verifierOptions);
  }

  private async installVerifiedBundlePayload(
    payload: VerifiedPluginBundlePayload,
    options: Omit<InstallVerifiedPluginBundleOptions, "bundle">,
  ): Promise<InstalledPluginRecord> {
    const { releaseEnvelope, releaseManifest, releaseManifestSha256, files } =
      payload;
    if (options.compatibility) {
      const compatibility = checkReleaseManifestCompatibility(
        releaseManifest,
        options.compatibility,
      );
      if (!compatibility.compatible) {
        throw new PluginDistributionError(
          "compatibility-failed",
          `Plugin ${releaseManifest.pluginId} is not compatible: ${compatibility.reasons.join(", ")}`,
          { details: { reasons: compatibility.reasons } },
        );
      }
    }

    const provenance = options.provenance ?? "official";
    assertPluginIdAllowedForProvenance(releaseManifest.pluginId, provenance);
    if (provenance === "official" && releaseManifest.channel !== "official") {
      throw new PluginDistributionError(
        "metadata-invalid",
        "Official plugin bundle channel does not match installer provenance.",
      );
    }

    throwIfAborted(options.signal);
    options.onProgress?.({
      phase: "verifying-files",
      message: "Validating plugin runtime metadata",
    });
    const pluginManifest = this.parsePluginManifest(
      files.get("manifest.json"),
      releaseManifest,
    );
    const runtimeValidation = validatePluginReleaseRuntime({
      releaseManifest,
      pluginManifest,
      files,
      provenance,
    });
    if (runtimeValidation.errors.length) {
      throw new PluginDistributionError(
        "metadata-invalid",
        `Plugin ${releaseManifest.pluginId} release runtime metadata is invalid: ${runtimeValidation.errors
          .map((item) => item.message)
          .join("; ")}`,
        { details: { diagnostics: runtimeValidation.errors } },
      );
    }

    const stagingPath = joinPath(
      this.pluginsPath,
      ".installing",
      `${releaseManifest.pluginId}-${Date.now()}`,
    );
    const finalPath = joinPath(this.pluginsPath, releaseManifest.pluginId);

    try {
      throwIfAborted(options.signal);
      options.onProgress?.({
        phase: "staging",
        message: "Staging plugin files",
        processedBytes: 0,
        totalBytes: totalFileBytes(files),
      });
      await this.writeStagingFiles(stagingPath, files, {
        signal: options.signal,
        onProgress: options.onProgress,
      });
      options.onProgress?.({
        phase: "installing",
        message: "Installing plugin files",
      });
      await this.swapIntoPlace(stagingPath, finalPath);
    } catch (error) {
      await this.removeIfExists(stagingPath);
      if (!(await this.options.adapter.exists(finalPath))) {
        await this.removeIfExists(finalPath);
      }
      throw error;
    }

    const now = this.now();
    const record: InstalledPluginRecord = {
      pluginId: releaseManifest.pluginId,
      installedVersion: releaseManifest.version,
      installedAt: now,
      updatedAt: now,
      provenance,
      registryId: options.registryId,
      registryUrl: options.registryUrl,
      releaseManifestSha256,
      files: releaseManifest.files.map((file) => ({
        path: file.path,
        sha256: file.sha256,
        size: file.size,
      })),
      ...(runtimeValidation.warnings.length
        ? { runtimeWarnings: runtimeValidation.warnings }
        : {}),
      signature: releaseEnvelope.signatures[0],
      restartRequired: Boolean(this.options.pluginManager),
    };

    await this.stateStore.upsert(record);

    if (this.options.pluginManager?.loadPlugin) {
      options.onProgress?.({
        phase: "loading",
        message: "Loading installed plugin",
      });
    }
    const loaded = await this.options.pluginManager?.loadPlugin?.(finalPath, {
      provenance,
    });
    const shouldEnable = options.enable ?? true;
    const diagnostics =
      this.options.pluginManager?.getCommunityPluginDiagnostics?.(
        releaseManifest.pluginId,
      ) ?? null;
    const cleanDormantExtension =
      diagnostics?.state === "dormant" &&
      (diagnostics.lastFailureMessage ?? null) === null;
    let enabled = false;
    if (
      shouldEnable &&
      (loaded || cleanDormantExtension) &&
      this.options.pluginManager?.enablePlugin
    ) {
      options.onProgress?.({
        phase: "enabling",
        message: "Enabling installed plugin",
      });
      enabled = await this.options.pluginManager.enablePlugin(
        releaseManifest.pluginId,
      );
    }

    record.restartRequired = Boolean(
      this.options.pluginManager && !loaded && !enabled,
    );
    await this.stateStore.upsert(record);
    return record;
  }

  private async readBundleResponseBytes(
    response: PluginBinaryResponse,
    options: Pick<InstallVerifiedPluginOptions, "signal" | "onProgress"> & {
      totalBytes?: number;
    },
  ): Promise<Uint8Array> {
    const progress = {
      downloadedBytes: 0,
      totalBytes: options.totalBytes,
    };
    if (response.body) {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let byteLength = 0;
      try {
        while (true) {
          throwIfAborted(options.signal);
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          chunks.push(value);
          byteLength += value.byteLength;
          progress.downloadedBytes += value.byteLength;
          this.emitBundleDownloadProgress(progress, options);
        }
      } finally {
        reader.releaseLock();
      }
      return concatChunks(chunks, byteLength);
    }

    throwIfAborted(options.signal);
    const bytes = new Uint8Array(await response.arrayBuffer());
    throwIfAborted(options.signal);
    progress.downloadedBytes += bytes.byteLength;
    this.emitBundleDownloadProgress(progress, options);
    return bytes;
  }

  private emitBundleDownloadProgress(
    progress: { downloadedBytes: number; totalBytes?: number },
    options: Pick<InstallVerifiedPluginOptions, "onProgress">,
  ): void {
    options.onProgress?.({
      phase: "downloading-bundle",
      message: "Downloading plugin bundle",
      downloadedBytes: progress.downloadedBytes,
      totalBytes: progress.totalBytes,
    });
  }

  private parsePluginManifest(
    data: Uint8Array | undefined,
    releaseManifest: PluginReleaseManifest,
  ): PluginManifest {
    if (!data) {
      throw new PluginDistributionError(
        "metadata-invalid",
        "Plugin release did not include manifest.json.",
      );
    }
    const manifest = JSON.parse(
      new TextDecoder().decode(data),
    ) as Partial<PluginManifest>;
    if (
      manifest.id !== releaseManifest.pluginId ||
      manifest.version !== releaseManifest.version
    ) {
      throw new PluginDistributionError(
        "metadata-invalid",
        "Plugin manifest id/version does not match the signed release manifest.",
        {
          details: {
            manifestId: manifest.id,
            manifestVersion: manifest.version,
            releasePluginId: releaseManifest.pluginId,
            releaseVersion: releaseManifest.version,
          },
        },
      );
    }
    return manifest as PluginManifest;
  }

  private async writeStagingFiles(
    stagingPath: string,
    files: Map<string, Uint8Array>,
    options: Pick<InstallVerifiedPluginOptions, "signal" | "onProgress">,
  ): Promise<void> {
    await ensureFolder(this.options.adapter, stagingPath);
    const entries = [...files.entries()];
    const fileCount = entries.length;
    const totalBytes = entries.reduce(
      (sum, [, bytes]) => sum + bytes.byteLength,
      0,
    );
    let processedBytes = 0;
    for (const [index, [path, bytes]] of entries.entries()) {
      throwIfAborted(options.signal);
      const target = joinPath(stagingPath, path);
      await ensureFolder(this.options.adapter, dirname(target));
      throwIfAborted(options.signal);
      await this.options.adapter.writeBinary(target, exactArrayBuffer(bytes));
      processedBytes += bytes.byteLength;
      options.onProgress?.({
        phase: "staging",
        message: `Staging ${path}`,
        filePath: path,
        fileIndex: index + 1,
        fileCount,
        processedBytes,
        totalBytes,
      });
    }
  }

  private async swapIntoPlace(
    stagingPath: string,
    finalPath: string,
  ): Promise<void> {
    await ensureFolder(this.options.adapter, this.pluginsPath);
    const backupPath = joinPath(
      this.pluginsPath,
      ".installing",
      `${basename(finalPath)}-backup-${Date.now()}`,
    );
    const hadExisting = await this.options.adapter.exists(finalPath);
    if (hadExisting) {
      await this.options.adapter.rename(finalPath, backupPath);
    }
    try {
      await this.options.adapter.rename(stagingPath, finalPath);
      if (hadExisting) await this.removeIfExists(backupPath);
    } catch (error) {
      if (hadExisting && !(await this.options.adapter.exists(finalPath))) {
        await this.options.adapter.rename(backupPath, finalPath);
      }
      throw error;
    }
  }

  private async removePluginCodeButKeepData(pluginPath: string): Promise<void> {
    if (!(await this.options.adapter.exists(pluginPath))) return;
    const listing = await this.options.adapter.list(pluginPath);
    for (const file of listing.files) {
      if (file !== "data.json") {
        await this.options.adapter.remove(joinPath(pluginPath, file));
      }
    }
    for (const folder of listing.folders) {
      await this.options.adapter.rmdir(joinPath(pluginPath, folder), true);
    }
  }

  private async removeCommunityPluginEnabledState(
    pluginId: string,
  ): Promise<void> {
    const enabledPath = ".obsidian/community-plugins.json";
    try {
      const enabled = JSON.parse(await this.options.adapter.read(enabledPath));
      if (!Array.isArray(enabled)) return;
      await this.options.adapter.write(
        enabledPath,
        JSON.stringify(
          enabled.filter((id) => id !== pluginId),
          null,
          2,
        ),
      );
    } catch {
      // Missing or malformed enabled-state files should not block uninstall.
    }
  }

  private async removeIfExists(path: string): Promise<void> {
    const stat = await this.options.adapter.stat(path);
    if (!stat) return;
    if (stat.type === "folder") {
      await this.options.adapter.rmdir(path, true);
    } else {
      await this.options.adapter.remove(path);
    }
  }

  private get pluginsPath(): string {
    return this.options.pluginsPath ?? ".obsidian/plugins";
  }

  private now(): string {
    return (this.options.now?.() ?? new Date()).toISOString();
  }
}

function concatChunks(chunks: Uint8Array[], byteLength: number): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function totalFileBytes(files: Map<string, Uint8Array>): number {
  let total = 0;
  for (const bytes of files.values()) {
    total += bytes.byteLength;
  }
  return total;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}
