import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE,
  PluginRegistryClient,
  type PluginRegistryFetch,
  type TrustedSigningKey,
} from "../plugin-distribution";

const registryRoot = join(process.cwd(), "test/fixtures/official-registry/v1");
const fixtureTrustedKeys: TrustedSigningKey[] = [
  {
    keyId: "lapis-registry-fixture-test",
    alg: "ed25519",
    publicKey: "RNLlvx0i2DbFCs426r9hzKaUJkppiJ44+inNLgwrw58=",
    trustTier: "official",
  },
];

describe("official registry generated fixture", () => {
  it("verifies generated metadata with the fixture signing key", async () => {
    const client = new PluginRegistryClient({
      trustedKeys: fixtureTrustedKeys,
      fetch: registryFileFetch,
    });

    const refreshed = await client.refresh(
      DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE,
    );

    expect(refreshed.index.plugins.map((plugin) => plugin.id)).toContain(
      "lapis-pdf",
    );
    const entry = refreshed.index.plugins.find(
      (plugin) => plugin.id === "lapis-pdf",
    );
    expect(entry).toBeDefined();

    const detail = await client.getDetail(entry!);
    expect(detail.detail).toMatchObject({
      id: "lapis-pdf",
      channel: "official",
      latestVersion: "2026.6.1",
      readmeUrl:
        "https://raw.githubusercontent.com/lapis-notes/lapis/main/packages/plugins/plugin-pdf/README.md",
    });
  });
});

const registryFileFetch: PluginRegistryFetch = async (url) => {
  const base = DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE.url;
  if (!url.startsWith(base.replace(/index\.json$/, ""))) {
    return notFound();
  }
  const relativePath = url
    .slice(base.replace(/index\.json$/, "").length)
    .replace(/^\/+/, "");
  try {
    const body = await readFile(join(registryRoot, relativePath), "utf8");
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => body,
    };
  } catch {
    return notFound();
  }
};

const notFound = () => ({
  ok: false,
  status: 404,
  statusText: "Not Found",
  text: async () => "",
});
