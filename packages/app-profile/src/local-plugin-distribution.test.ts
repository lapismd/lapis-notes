import { afterEach, describe, expect, it, vi } from "vitest";
import { createConfiguredNotesLocalPluginDistribution } from "./local-plugin-distribution";

const keys = [
  {
    keyId: "fixture-registry",
    alg: "ed25519",
    publicKey: "a".repeat(43) + "=",
    trustTier: "official",
  },
];
const configured = {
  MODE: "registry-acceptance",
  VITE_LAPIS_LOCAL_REGISTRY_URL: "http://127.0.0.1:4330/v2/index.json",
  VITE_LAPIS_LOCAL_REGISTRY_ARTIFACT_ORIGIN: "https://registry.local.lapis.md",
  VITE_LAPIS_LOCAL_REGISTRY_TRUSTED_KEYS: JSON.stringify(keys),
};

afterEach(() => vi.unstubAllGlobals());

describe("local signed registry configuration", () => {
  it("ignores fixture trust in production and server builds", () => {
    for (const MODE of ["production", "server"]) {
      expect(
        createConfiguredNotesLocalPluginDistribution({ ...configured, MODE }),
      ).toBeUndefined();
    }
    expect(
      createConfiguredNotesLocalPluginDistribution({ DEV: true }),
    ).toBeUndefined();
  });

  it("keeps explicit host options authoritative", () => {
    const explicit = { trustedKeys: [] };
    expect(
      createConfiguredNotesLocalPluginDistribution(configured, explicit),
    ).toBe(explicit);
  });

  it("uses ordinary Fetch for the local signed catalog and only remaps the configured artifact origin", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("verified bytes"));
    vi.stubGlobal("fetch", fetch);
    const options = createConfiguredNotesLocalPluginDistribution(configured)!;
    expect(options.registries).toMatchObject([
      {
        id: "lapis-local",
        kind: "http",
        enabled: true,
        url: configured.VITE_LAPIS_LOCAL_REGISTRY_URL,
      },
    ]);
    expect(options.trustedKeys).toEqual(keys);
    const init = { signal: new AbortController().signal };
    await options.fetch!(
      "https://registry.local.lapis.md/v2/bundles/bases.lapis-plugin",
      init,
    );
    await options.fetch!(
      "https://another.example/v2/bundles/bases.lapis-plugin",
      init,
    );
    await options.fetch!(configured.VITE_LAPIS_LOCAL_REGISTRY_URL, init);
    expect(fetch.mock.calls).toEqual([
      ["http://127.0.0.1:4330/v2/bundles/bases.lapis-plugin", init],
      ["https://another.example/v2/bundles/bases.lapis-plugin", init],
      [configured.VITE_LAPIS_LOCAL_REGISTRY_URL, init],
    ]);
    expect(options.bundleVerification).toBeUndefined();
  });

  it("rejects non-loopback transports and incomplete configuration", () => {
    for (const url of [
      "https://registry.example/v2/index.json",
      "http://127.0.0.1.evil.test/index.json",
      "http://user:secret@localhost/index.json",
      "file:///tmp/index.json",
    ]) {
      expect(() =>
        createConfiguredNotesLocalPluginDistribution({
          ...configured,
          VITE_LAPIS_LOCAL_REGISTRY_URL: url,
        }),
      ).toThrow("loopback");
    }
    expect(() =>
      createConfiguredNotesLocalPluginDistribution({
        ...configured,
        VITE_LAPIS_LOCAL_REGISTRY_TRUSTED_KEYS: undefined,
      }),
    ).toThrow("configured together");
    expect(() =>
      createConfiguredNotesLocalPluginDistribution({
        ...configured,
        VITE_LAPIS_LOCAL_REGISTRY_ARTIFACT_ORIGIN:
          "https://registry.example/path",
      }),
    ).toThrow("HTTPS origin");
  });

  it("rejects private, malformed and duplicate key configuration", () => {
    for (const entries of [
      [],
      [{ ...keys[0], privateKey: "must-not-enter-a-renderer" }],
      [{ ...keys[0], publicKey: "bad" }],
      [keys[0], keys[0]],
    ]) {
      expect(() =>
        createConfiguredNotesLocalPluginDistribution({
          ...configured,
          VITE_LAPIS_LOCAL_REGISTRY_TRUSTED_KEYS: JSON.stringify(entries),
        }),
      ).toThrow("public signing keys");
    }
  });
});
