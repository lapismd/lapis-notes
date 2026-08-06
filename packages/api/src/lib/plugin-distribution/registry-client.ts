import { PluginDistributionError } from "./errors";
import { assertPluginIdAllowedForProvenance } from "./reserved-ids";
import {
  pluginCatalogDetailSchema,
  pluginCatalogIndexSchema,
  pluginRevocationIndexSchema,
  parsePluginDistributionMetadata,
} from "./schemas";
import { verifySignedEnvelope } from "./signing";
import type {
  PluginCatalogDetail,
  PluginCatalogEntry,
  PluginCatalogIndex,
  PluginRegistrySource,
  PluginRevocationIndex,
  RegistryTrustTier,
  SignatureRecord,
  SignedEnvelope,
  TrustedSigningKey,
} from "./types";
import { PluginRegistryCache } from "./registry-cache";

export type PluginRegistryFetch = (
  url: string,
  init?: RequestInit,
) => Promise<Pick<Response, "ok" | "status" | "statusText" | "text">>;

export interface PluginRegistryRefreshResult {
  index: PluginCatalogIndex;
  revocations: PluginRevocationIndex;
  stale: boolean;
  source: PluginRegistrySource;
}

export interface PluginRegistryDetailResult {
  detail: PluginCatalogDetail;
  stale: boolean;
}

export class PluginRegistryClient {
  private currentIndex: PluginCatalogIndex | null = null;
  private readonly fetchImpl: PluginRegistryFetch;
  private readonly cache: PluginRegistryCache;

  constructor(
    private readonly options: {
      trustedKeys: TrustedSigningKey[];
      fetch?: PluginRegistryFetch;
      cache?: PluginRegistryCache;
    },
  ) {
    this.fetchImpl =
      options.fetch ??
      ((url, init) =>
        globalThis.fetch(url, init) as Promise<
          Pick<Response, "ok" | "status" | "statusText" | "text">
        >);
    this.cache = options.cache ?? new PluginRegistryCache();
  }

  async refresh(
    source: PluginRegistrySource,
  ): Promise<PluginRegistryRefreshResult> {
    try {
      const metadata = await this.fetchJson(source.url);
      const index = await this.verifyIndex(metadata, source);
      const revocations = await this.fetchRevocations(source);
      this.currentIndex = index;
      await this.cache.write(source.url, index, {}, revocations);
      return { index, revocations, stale: false, source };
    } catch (error) {
      const cached = await this.cache.read();
      if (cached && cached.sourceUrl === source.url) {
        this.currentIndex = cached.index;
        return {
          index: cached.index,
          revocations: cached.revocations ?? emptyRevocationIndex(),
          stale: true,
          source,
        };
      }
      throw error;
    }
  }

  async getDetail(
    entry: PluginCatalogEntry,
  ): Promise<PluginRegistryDetailResult> {
    try {
      const metadata = await this.fetchJson(entry.detail);
      const detail = await this.verifyDetail(metadata, entry);
      await this.cache.putDetail(entry.id, detail);
      return { detail, stale: false };
    } catch (error) {
      const cached = await this.cache.read();
      const detail = cached?.details[entry.id];
      if (detail) return { detail, stale: true };
      throw error;
    }
  }

  getCachedIndex(): PluginCatalogIndex | null {
    return this.currentIndex ?? this.cache.getMemory()?.index ?? null;
  }

  private async fetchJson(url: string): Promise<unknown> {
    const response = await this.fetchImpl(url);
    if (!response.ok) {
      throw new PluginDistributionError(
        "metadata-invalid",
        `Registry fetch failed for ${url}: ${response.status} ${response.statusText}`,
        { details: { url, status: response.status } },
      );
    }
    return JSON.parse(await response.text());
  }

  private async verifyIndex(
    metadata: unknown,
    source: PluginRegistrySource,
  ): Promise<PluginCatalogIndex> {
    const index = parsePluginDistributionMetadata(
      pluginCatalogIndexSchema,
      metadata,
    );
    const verified = (await verifyInlineSignedMetadata(
      index,
      index.signatures,
      this.trustedKeysFor(source.trustTier),
    )) as unknown as PluginCatalogIndex;
    return {
      ...verified,
      plugins: verified.plugins.map((entry) =>
        this.normalizeEntry(entry, source),
      ),
    };
  }

  private async fetchRevocations(
    source: PluginRegistrySource,
  ): Promise<PluginRevocationIndex> {
    const url = new URL("revoked.json", source.url).toString();
    const metadata = await this.fetchJson(url);
    const revocations = parsePluginDistributionMetadata(
      pluginRevocationIndexSchema,
      metadata,
    );
    const verified = await verifyInlineSignedMetadata(
      revocations,
      revocations.signatures,
      this.trustedKeysFor(source.trustTier),
    );
    return verified;
  }

  private async verifyDetail(
    metadata: unknown,
    entry: PluginCatalogEntry,
  ): Promise<PluginCatalogDetail> {
    const detail = parsePluginDistributionMetadata(
      pluginCatalogDetailSchema,
      metadata,
    );
    const verified = (await verifyInlineSignedMetadata(
      detail,
      detail.signatures,
      this.options.trustedKeys,
    )) as unknown as PluginCatalogDetail;

    if (verified.id !== entry.id) {
      throw new PluginDistributionError(
        "metadata-invalid",
        `Plugin detail id ${verified.id} does not match catalog entry ${entry.id}.`,
        { details: { entryId: entry.id, detailId: verified.id } },
      );
    }

    return verified;
  }

  private normalizeEntry(
    entry: PluginCatalogEntry,
    source: PluginRegistrySource,
  ): PluginCatalogEntry {
    const provenance =
      source.trustTier === "official" ? "official" : "community";
    assertPluginIdAllowedForProvenance(entry.id, provenance);

    if (entry.channel === "official" && source.trustTier !== "official") {
      throw new PluginDistributionError(
        "metadata-invalid",
        `Non-official registry source ${source.id} cannot publish official entry ${entry.id}.`,
        { details: { sourceId: source.id, pluginId: entry.id } },
      );
    }

    return {
      ...entry,
      detail: new URL(entry.detail, source.url).toString(),
    };
  }

  private trustedKeysFor(trustTier: RegistryTrustTier): TrustedSigningKey[] {
    return this.options.trustedKeys.filter(
      (key) => key.trustTier === trustTier || key.trustTier === "official",
    );
  }
}

export const verifyInlineSignedMetadata = async <
  T extends { signatures?: SignatureRecord[] },
>(
  metadata: T,
  signatures: SignatureRecord[] | undefined,
  trustedKeys: TrustedSigningKey[],
): Promise<Omit<T, "signatures">> => {
  if (!signatures?.length) {
    throw new PluginDistributionError(
      "signature-invalid",
      "Signed registry metadata did not include any signatures.",
    );
  }

  const { signatures: _signatures, ...signed } = metadata;
  return verifySignedEnvelope(
    { signed, signatures } as SignedEnvelope<Omit<T, "signatures">>,
    trustedKeys,
  );
};

const emptyRevocationIndex = (): PluginRevocationIndex => ({
  schemaVersion: 1,
  generatedAt: new Date(0).toISOString(),
  revoked: [],
});
