import { PluginDistributionError } from "./errors";
import type { PluginBinaryFetch } from "./installer";
import type {
  PluginRegistryAdapter,
  PluginRegistryAdapterRefreshResult,
} from "./manager";
import {
  type NostrReleaseProofVerifier,
  verifyNostrPluginPayload,
} from "./plugin-bundle-verifier";
import {
  parsePluginDistributionMetadata,
  pluginCatalogDetailSchema,
  pluginCatalogIndexSchema,
} from "./schemas";
import type {
  InstalledPluginRecord,
  PluginCatalogDetail,
  PluginCatalogEntry,
  PluginRegistrySource,
} from "./types";

export interface NostrRegistryCatalogSource {
  loadIndex(options?: { signal?: AbortSignal }): Promise<unknown>;
  loadPluginDetail(
    entry: PluginCatalogEntry,
    options?: { signal?: AbortSignal },
  ): Promise<unknown>;
  loadReleaseProof(
    pluginId: string,
    version: string,
    options?: { signal?: AbortSignal },
  ): Promise<unknown>;
  getStatus(): {
    installReady: boolean;
    fresh: boolean;
    message?: string;
  };
  refresh?(options?: { signal?: AbortSignal }): Promise<void>;
}

export interface CreateNostrPluginRegistryAdapterOptions {
  catalogSource: NostrRegistryCatalogSource;
  verifyReleaseProof: NostrReleaseProofVerifier;
  fetch?: PluginBinaryFetch;
}

export function createNostrPluginRegistryAdapter(
  options: CreateNostrPluginRegistryAdapterOptions,
): PluginRegistryAdapter {
  const fetchImpl =
    options.fetch ??
    ((url, init) => globalThis.fetch(url, init) as Promise<Response>);

  return {
    async refresh(source, refreshOptions) {
      if (refreshOptions?.force) {
        await options.catalogSource.refresh?.();
      }
      const index = parsePluginDistributionMetadata(
        pluginCatalogIndexSchema,
        await options.catalogSource.loadIndex(),
      );
      const status = options.catalogSource.getStatus();
      return {
        index,
        installReady: status.installReady,
        stale: !status.fresh,
        ...(status.message ? { message: status.message } : {}),
      } satisfies PluginRegistryAdapterRefreshResult;
    },
    async getDetail(_source, entry) {
      return parsePluginDistributionMetadata(
        pluginCatalogDetailSchema,
        await options.catalogSource.loadPluginDetail(entry),
      );
    },
    async getVerifiedBundle(source, entry, detail, version, installOptions) {
      const curatorPubkeys = source.curatorPubkeys ?? [];
      if (curatorPubkeys.length === 0) {
        throw new PluginDistributionError(
          "metadata-invalid",
          `Nostr registry ${source.name} has no pinned curator keys.`,
        );
      }
      const release = requireRelease(detail, version);
      const artifactUrl = resolveArtifactUrl(source, release.bundle);
      const response = await fetchImpl(artifactUrl, {
        signal: installOptions?.signal,
      });
      if (!response.ok) {
        throw new PluginDistributionError(
          "metadata-invalid",
          `Plugin payload fetch failed for ${artifactUrl}: ${response.status} ${response.statusText}`,
        );
      }
      const [artifact, proof] = await Promise.all([
        response.arrayBuffer().then((value) => new Uint8Array(value)),
        options.catalogSource.loadReleaseProof(entry.id, version, {
          signal: installOptions?.signal,
        }),
      ]);
      return verifyNostrPluginPayload({
        artifact,
        proof,
        trustedCuratorPubkeys: new Set(curatorPubkeys),
        verifyReleaseProof: options.verifyReleaseProof,
        signal: installOptions?.signal,
        relayFresh: true,
      });
    },
    async verifyOfflineBundle(source, bundle, installOptions) {
      const curatorPubkeys = source.curatorPubkeys ?? [];
      if (curatorPubkeys.length === 0) {
        throw new PluginDistributionError(
          "metadata-invalid",
          `Nostr registry ${source.name} has no pinned curator keys.`,
        );
      }
      return verifyNostrPluginPayload({
        artifact: bundle.payload,
        proof: bundle.proof,
        trustedCuratorPubkeys: new Set(curatorPubkeys),
        verifyReleaseProof: options.verifyReleaseProof,
        signal: installOptions?.signal,
        relayFresh: false,
      });
    },
    async revalidateInstalledProof(source, record, installOptions) {
      const stored = requireStoredProof(record);
      const curatorPubkeys = source.curatorPubkeys ?? [];
      if (curatorPubkeys.length === 0) {
        throw new PluginDistributionError(
          "metadata-invalid",
          `Nostr registry ${source.name} has no pinned curator keys.`,
        );
      }
      const status = options.catalogSource.getStatus();
      if (!status.installReady || !status.fresh) {
        throw new PluginDistributionError(
          "metadata-invalid",
          `Nostr registry ${source.name} has not reached install quorum.`,
        );
      }
      const proof = await options.catalogSource.loadReleaseProof(
        record.pluginId,
        record.installedVersion,
        { signal: installOptions?.signal },
      );
      const verified = await options.verifyReleaseProof(proof, {
        artifact: {
          sha256: stored.artifactSha256,
          size: stored.artifactSize,
        },
        trustedCuratorPubkeys: new Set(curatorPubkeys),
      });
      if (verified.releaseEventId !== stored.releaseEventId) {
        throw new PluginDistributionError(
          "metadata-invalid",
          "Live Nostr proof names a different immutable release event.",
        );
      }
      return {
        authorizationEventId: verified.authorizationEventId,
        releaseEventId: verified.releaseEventId,
        decisionEventId: verified.decisionEventId,
        manifestSha256: verified.manifestSha256,
        artifactSha256: verified.artifactSha256,
        artifactSize: verified.artifactSize,
        requiresRelayRefresh: false,
      };
    },
  };
}

function requireStoredProof(
  record: InstalledPluginRecord,
): NonNullable<InstalledPluginRecord["nostrProof"]> {
  if (!record.nostrProof) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Installed plugin has no stored Nostr proof.",
    );
  }
  return record.nostrProof;
}

function requireRelease(
  detail: PluginCatalogDetail,
  version: string,
): PluginCatalogDetail["versions"][string] {
  const release = detail.versions[version];
  if (!release) {
    throw new PluginDistributionError(
      "metadata-invalid",
      `${detail.id} has no Nostr release ${version}.`,
    );
  }
  return release;
}

function resolveArtifactUrl(
  source: PluginRegistrySource,
  bundle: PluginCatalogDetail["versions"][string]["bundle"],
): string {
  const location = bundle.downloadUrl ?? bundle.url;
  try {
    return new URL(location).toString();
  } catch {
    return new URL(location, source.url).toString();
  }
}
