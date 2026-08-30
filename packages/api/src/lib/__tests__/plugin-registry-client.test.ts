import { describe, expect, it } from "vitest";
import {
  bytesToBase64,
  canonicalJson,
  pluginDownloadCounts,
  PluginRegistryCache,
  PluginRegistryClient,
  type PluginCatalogDetail,
  type PluginCatalogIndex,
  type PluginDownloadStatsSummary,
  type PluginRegistryFetch,
  type PluginRegistrySource,
  type SignatureRecord,
  type TrustedSigningKey,
} from "../plugin-distribution";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

describe("PluginRegistryClient", () => {
  it("refreshes a locked official source and fetches signed detail metadata", async () => {
    const fixture = await createRegistryFixture();
    const fetch = fakeFetch({
      "https://registry.example.test/v1/index.json": fixture.indexJson,
      "https://registry.example.test/v1/revoked.json": fixture.revokedJson,
      "https://registry.example.test/v1/plugins/lapis-docs.json":
        fixture.detailJson,
    });
    const client = new PluginRegistryClient({
      trustedKeys: [fixture.trustedKey],
      fetch,
    });

    const refreshed = await client.refresh(officialSource);
    expect(refreshed.stale).toBe(false);
    expect(refreshed.index.plugins[0]?.detail).toBe(
      "https://registry.example.test/v1/plugins/lapis-docs.json",
    );

    const detail = await client.getDetail(refreshed.index.plugins[0]!);
    expect(detail.stale).toBe(false);
    expect(detail.detail.id).toBe("lapis-docs");
    expect(detail.detail.readmeUrl).toBe(
      "https://raw.githubusercontent.com/lapis-notes/lapis/main/packages/plugins/plugin-docs/README.md",
    );
  });

  it("rejects non-HTTPS README URLs", async () => {
    const fixture = await createRegistryFixture({
      readmeUrl: "http://example.test/README.md",
    });
    const client = new PluginRegistryClient({
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch({
        "https://registry.example.test/v1/index.json": fixture.indexJson,
      }),
    });

    await expect(client.refresh(officialSource)).rejects.toMatchObject({
      code: "metadata-invalid",
    });
  });

  it("rejects invalid index and detail signatures", async () => {
    const fixture = await createRegistryFixture();
    const tamperedIndex = {
      ...JSON.parse(fixture.indexJson),
      generatedAt: "2026-06-01T00:00:00.000Z",
    };
    const client = new PluginRegistryClient({
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch({
        "https://registry.example.test/v1/index.json":
          JSON.stringify(tamperedIndex),
      }),
    });

    await expect(client.refresh(officialSource)).rejects.toMatchObject({
      code: "signature-invalid",
    });

    const detailClient = new PluginRegistryClient({
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch({
        "https://registry.example.test/v1/index.json": fixture.indexJson,
        "https://registry.example.test/v1/revoked.json": fixture.revokedJson,
        "https://registry.example.test/v1/plugins/lapis-docs.json":
          JSON.stringify({
            ...JSON.parse(fixture.detailJson),
            latestVersion: "0.2.0",
          }),
      }),
    });
    const refreshed = await detailClient.refresh(officialSource);
    await expect(
      detailClient.getDetail(refreshed.index.plugins[0]!),
    ).rejects.toMatchObject({ code: "signature-invalid" });
  });

  it("rejects reserved ids from non-official sources", async () => {
    const fixture = await createRegistryFixture({ channel: "community" });
    const client = new PluginRegistryClient({
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch({
        "https://registry.example.test/v1/index.json": fixture.indexJson,
        "https://registry.example.test/v1/revoked.json": fixture.revokedJson,
      }),
    });

    await expect(
      client.refresh({ ...officialSource, trustTier: "community" }),
    ).rejects.toMatchObject({ code: "reserved-id" });
  });

  it("reads stale cached catalog data when network refresh fails", async () => {
    const fixture = await createRegistryFixture();
    const adapter = new InMemoryDataAdapter();
    const cache = new PluginRegistryCache({ adapter });
    const client = new PluginRegistryClient({
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch({
        "https://registry.example.test/v1/index.json": fixture.indexJson,
        "https://registry.example.test/v1/revoked.json": fixture.revokedJson,
      }),
      cache,
    });

    await expect(client.refresh(officialSource)).resolves.toMatchObject({
      stale: false,
    });

    const offlineClient = new PluginRegistryClient({
      trustedKeys: [fixture.trustedKey],
      fetch: async () => {
        throw new Error("offline");
      },
      cache: new PluginRegistryCache({ adapter }),
    });

    await expect(offlineClient.refresh(officialSource)).resolves.toMatchObject({
      stale: true,
      index: {
        plugins: [expect.objectContaining({ id: "lapis-docs" })],
      },
    });
  });

  it("loads current optional download statistics without changing signed catalog metadata", async () => {
    const summary = createDownloadStatsSummary();
    const client = new PluginRegistryClient({
      trustedKeys: [],
      fetch: fakeFetch({
        "https://registry.example.test/stats/summary.json":
          JSON.stringify(summary),
      }),
    });

    const result = await client.getDownloadStats(officialSource, {
      now: new Date("2026-08-29T12:00:00.000Z"),
    });

    expect(result).toEqual(summary);
    expect(pluginDownloadCounts(result!, "lapis-docs")).toEqual({
      lifetime: 140,
      recent: 80,
    });
    expect(pluginDownloadCounts(result!, "missing-plugin")).toEqual({
      lifetime: 0,
      recent: 0,
    });
  });

  it("hides missing, malformed, future, and stale optional statistics", async () => {
    const fixture = await createRegistryFixture();
    const missingClient = new PluginRegistryClient({
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch({
        "https://registry.example.test/v1/index.json": fixture.indexJson,
        "https://registry.example.test/v1/revoked.json": fixture.revokedJson,
      }),
    });
    const refreshed = await missingClient.refresh(officialSource);
    expect(refreshed.index.plugins).toHaveLength(1);
    await expect(
      missingClient.getDownloadStats(officialSource, {
        now: new Date("2026-08-29T12:00:00.000Z"),
      }),
    ).resolves.toBeNull();

    for (const summary of [
      { ...createDownloadStatsSummary(), metric: "unique_users" },
      createDownloadStatsSummary("2026-09-01"),
      createDownloadStatsSummary("2026-08-20"),
    ]) {
      const client = new PluginRegistryClient({
        trustedKeys: [],
        fetch: fakeFetch({
          "https://registry.example.test/stats/summary.json":
            JSON.stringify(summary),
        }),
      });
      await expect(
        client.getDownloadStats(officialSource, {
          now: new Date("2026-08-29T12:00:00.000Z"),
        }),
      ).resolves.toBeNull();
    }
  });
});

const officialSource: PluginRegistrySource = {
  id: "lapis-official",
  name: "Lapis Official Plugins",
  url: "https://registry.example.test/v1/index.json",
  downloadStatsUrl: "https://registry.example.test/stats/summary.json",
  trustTier: "official",
  enabled: true,
  builtin: true,
};

const createDownloadStatsSummary = (
  through = "2026-08-28",
): PluginDownloadStatsSummary => {
  const period = (
    total: number,
    pluginTotal: number,
  ): PluginDownloadStatsSummary["periods"]["lifetime"] => ({
    from: "2026-08-01",
    through,
    total,
    plugins: {
      "lapis-docs": { total: pluginTotal, versions: { "0.1.0": pluginTotal } },
    },
    versions: { "lapis-docs@0.1.0": pluginTotal },
    actions: { install: pluginTotal },
    platforms: { desktop: pluginTotal },
    os: { macos: pluginTotal },
  });
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-29T04:17:00.000Z",
    dataset: "lapis_plugin_downloads_v1",
    metric: "approximate_redirect_requests",
    trackedSince: "2026-08-01",
    through,
    periods: {
      lifetime: period(140, 140),
      "7d": period(32, 32),
      "30d": period(80, 80),
    },
  };
};

const fakeFetch =
  (responses: Record<string, string>): PluginRegistryFetch =>
  async (url) => {
    const body = responses[url];
    if (body === undefined) {
      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "",
      };
    }
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => body,
    };
  };

const createRegistryFixture = async (
  options: { channel?: "official" | "community"; readmeUrl?: string } = {},
): Promise<{
  trustedKey: TrustedSigningKey;
  indexJson: string;
  detailJson: string;
  revokedJson: string;
}> => {
  const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey),
  );
  const trustedKey: TrustedSigningKey = {
    keyId: "lapis-registry-test",
    alg: "ed25519",
    publicKey: bytesToBase64(publicKey),
    trustTier: "official",
  };

  const detail = await signInline<PluginCatalogDetail>(
    {
      schemaVersion: 1,
      id: "lapis-docs",
      name: "Docs",
      description: "Document editing",
      readmeUrl:
        options.readmeUrl ??
        "https://raw.githubusercontent.com/lapis-notes/lapis/main/packages/plugins/plugin-docs/README.md",
      channel: options.channel ?? "official",
      owner: { name: "Lapis Notes", verified: true },
      latestVersion: "0.1.0",
      versions: {
        "0.1.0": {
          version: "0.1.0",
          minAppVersion: "0.20.0",
          releasedAt: "2026-05-31T00:00:00.000Z",
          platforms: ["web", "desktop"],
          bundle: {
            url: "releases/lapis-docs-0.1.0.lapis-plugin",
            sha256:
              "0000000000000000000000000000000000000000000000000000000000000000",
            size: 0,
          },
        },
      },
    },
    keyPair.privateKey,
  );

  const index = await signInline<PluginCatalogIndex>(
    {
      schemaVersion: 1,
      generatedAt: "2026-05-31T00:00:00.000Z",
      plugins: [
        {
          id: "lapis-docs",
          name: "Docs",
          description: "Document editing",
          readmeUrl:
            options.readmeUrl ??
            "https://raw.githubusercontent.com/lapis-notes/lapis/main/packages/plugins/plugin-docs/README.md",
          author: "Lapis Notes",
          channel: options.channel ?? "official",
          latestVersion: "0.1.0",
          minAppVersion: "0.20.0",
          platforms: ["web", "desktop"],
          categories: ["documents"],
          badges:
            options.channel === "community"
              ? ["community"]
              : ["official", "verified"],
          detail: "plugins/lapis-docs.json",
        },
      ],
    },
    keyPair.privateKey,
  );

  const revoked = await signInline(
    {
      schemaVersion: 1 as const,
      generatedAt: "2026-05-31T00:00:00.000Z",
      revoked: [],
    },
    keyPair.privateKey,
  );

  return {
    trustedKey,
    indexJson: JSON.stringify(index),
    detailJson: JSON.stringify(detail),
    revokedJson: JSON.stringify(revoked),
  };
};

const signInline = async <T extends object>(
  signed: T,
  privateKey: CryptoKey,
): Promise<T & { signatures: SignatureRecord[] }> => {
  const payload = new TextEncoder().encode(canonicalJson(signed));
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "Ed25519" }, privateKey, payload),
  );
  return {
    ...signed,
    signatures: [
      {
        keyId: "lapis-registry-test",
        alg: "ed25519",
        sig: bytesToBase64(signature),
      },
    ],
  };
};
