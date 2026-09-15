import { describe, expect, it } from "vitest";

import {
  createNotesNostrPluginDistribution,
  nostrPluginRegistryConfigurationFromEnvironment,
} from "./nostr-plugin-distribution";

describe("Notes Nostr plugin distribution", () => {
  it("requires relay and pinned curator configuration together", () => {
    expect(nostrPluginRegistryConfigurationFromEnvironment({})).toBeUndefined();
    expect(() =>
      nostrPluginRegistryConfigurationFromEnvironment({
        VITE_LAPIS_NOSTR_REGISTRY_RELAYS: "wss://relay.example",
      }),
    ).toThrow("must be configured together");
    expect(() =>
      nostrPluginRegistryConfigurationFromEnvironment({
        VITE_LAPIS_NOSTR_REGISTRY_RELAYS: "wss://relay.example",
        VITE_LAPIS_NOSTR_CURATOR_PUBKEYS: "not-a-pubkey",
      }),
    ).toThrow("64 lowercase hex characters");
    expect(() =>
      nostrPluginRegistryConfigurationFromEnvironment({
        VITE_LAPIS_NOSTR_REGISTRY_RELAYS: "wss://relay.example",
        VITE_LAPIS_NOSTR_CURATOR_PUBKEYS: "a".repeat(64),
        VITE_LAPIS_NOSTR_INSTALL_QUORUM: "2",
      }),
    ).toThrow("must fit the relay count");
    expect(() =>
      nostrPluginRegistryConfigurationFromEnvironment({
        VITE_LAPIS_NOSTR_REGISTRY_RELAYS: "https://relay.example",
        VITE_LAPIS_NOSTR_CURATOR_PUBKEYS: "a".repeat(64),
      }),
    ).toThrow("relay URL is invalid");
  });

  it("adds a built-in Nostr source without replacing HTTPS", () => {
    const configuration = nostrPluginRegistryConfigurationFromEnvironment({
      VITE_LAPIS_NOSTR_REGISTRY_RELAYS:
        "wss://one.example,wss://two.example",
      VITE_LAPIS_NOSTR_CURATOR_PUBKEYS: "a".repeat(64),
      VITE_LAPIS_NOSTR_INSTALL_QUORUM: "2",
      VITE_LAPIS_NOSTR_BLOSSOM_URL: "https://blossom.example",
    });
    expect(configuration).toBeDefined();

    const binding = createNotesNostrPluginDistribution(configuration!);
    expect(binding.options.registries).toMatchObject([
      { id: "lapis-official", enabled: true },
      {
        id: "lapis-nostr",
        kind: "nostr",
        enabled: true,
        relays: ["wss://one.example", "wss://two.example"],
        curatorPubkeys: ["a".repeat(64)],
        installQuorum: 2,
      },
    ]);
    expect(binding.options.registryAdapters?.nostr).toBeDefined();
    binding.dispose();
  });
});
