import {
  type AppPluginDistributionOptions,
} from "@lapis-notes/api";
import {
  createNostrPluginRegistryAdapter,
  DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE,
  type PluginRegistrySource,
} from "@lapis-notes/api/plugin-distribution-host";
import { createWebSocketCommunityRelayFactory } from "@lapismd/lapis-community/nostr";
import { verifyNostrReleaseProof } from "@lapismd/lapis-community/protocol";
import { createNip29RegistryCatalogDataSource } from "@lapismd/lapis-community/registry/nip29";

export interface NotesNostrPluginRegistryConfiguration {
  relays: readonly string[];
  curatorPubkeys: readonly string[];
  blossomUrl?: string;
  installQuorum?: number;
}

export interface NotesNostrPluginDistributionBinding {
  options: AppPluginDistributionOptions;
  dispose(): void;
}

export function nostrPluginRegistryConfigurationFromEnvironment(
  environment: Record<string, string | boolean | undefined>,
): NotesNostrPluginRegistryConfiguration | undefined {
  const relays = commaSeparated(environment.VITE_LAPIS_NOSTR_REGISTRY_RELAYS);
  const curatorPubkeys = commaSeparated(
    environment.VITE_LAPIS_NOSTR_CURATOR_PUBKEYS,
  );
  if (relays.length === 0 && curatorPubkeys.length === 0) return undefined;
  if (relays.length === 0 || curatorPubkeys.length === 0) {
    throw new Error(
      "VITE_LAPIS_NOSTR_REGISTRY_RELAYS and VITE_LAPIS_NOSTR_CURATOR_PUBKEYS must be configured together.",
    );
  }
  if (new Set(relays).size !== relays.length) {
    throw new Error("Nostr registry relay URLs must be unique.");
  }
  for (const relay of relays) {
    validatePublicUrl(relay, ["ws:", "wss:"], "relay");
  }
  for (const pubkey of curatorPubkeys) {
    if (!/^[0-9a-f]{64}$/u.test(pubkey)) {
      throw new Error("Nostr curator public keys must be 64 lowercase hex characters.");
    }
  }
  const quorumValue = stringValue(environment.VITE_LAPIS_NOSTR_INSTALL_QUORUM);
  const installQuorum = quorumValue === undefined ? relays.length : Number(quorumValue);
  if (
    !Number.isSafeInteger(installQuorum) ||
    installQuorum < 1 ||
    installQuorum > relays.length
  ) {
    throw new Error("VITE_LAPIS_NOSTR_INSTALL_QUORUM must fit the relay count.");
  }
  const blossomUrl = stringValue(environment.VITE_LAPIS_NOSTR_BLOSSOM_URL);
  if (blossomUrl) {
    validatePublicUrl(blossomUrl, ["http:", "https:"], "Blossom");
  }
  return {
    relays,
    curatorPubkeys,
    installQuorum,
    ...(blossomUrl ? { blossomUrl } : {}),
  };
}

export function createNotesNostrPluginDistribution(
  configuration: NotesNostrPluginRegistryConfiguration,
  base: AppPluginDistributionOptions = {},
): NotesNostrPluginDistributionBinding {
  const relays = [...configuration.relays];
  const curatorPubkeys = [...configuration.curatorPubkeys];
  const installQuorum = configuration.installQuorum ?? relays.length;
  const catalogSource = createNip29RegistryCatalogDataSource({
    relays,
    authorities: {
      curatorPubkeys: new Set(curatorPubkeys),
      publisherPubkeysByPlugin: new Map(),
    },
    relayFactory: createWebSocketCommunityRelayFactory(),
    installQuorum,
    ...(configuration.blossomUrl
      ? { blossomUrl: configuration.blossomUrl }
      : {}),
  });
  const source: PluginRegistrySource = {
    id: "lapis-nostr",
    name: "Lapis Nostr Plugins",
    kind: "nostr",
    url: "nostr://lapis-plugins",
    relays,
    curatorPubkeys,
    installQuorum,
    trustTier: "official",
    enabled: true,
    builtin: true,
  };
  const registries = [
    ...(base.registries ?? [DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE]),
  ].filter((candidate) => candidate.id !== source.id);
  registries.push(source);

  return {
    options: {
      ...base,
      registries,
      registryAdapters: {
        ...base.registryAdapters,
        nostr: createNostrPluginRegistryAdapter({
          catalogSource,
          verifyReleaseProof: verifyNostrReleaseProof,
          ...(base.fetch ? { fetch: base.fetch } : {}),
        }),
      },
    },
    dispose: () => catalogSource.dispose(),
  };
}

export function createConfiguredNotesNostrPluginDistribution(
  environment: Record<string, string | boolean | undefined>,
  base: AppPluginDistributionOptions = {},
): NotesNostrPluginDistributionBinding | undefined {
  const configuration =
    nostrPluginRegistryConfigurationFromEnvironment(environment);
  return configuration
    ? createNotesNostrPluginDistribution(configuration, base)
    : undefined;
}

function commaSeparated(value: string | boolean | undefined): string[] {
  return (stringValue(value) ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function stringValue(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function validatePublicUrl(
  value: string,
  protocols: readonly string[],
  label: string,
): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Nostr ${label} URL is invalid.`);
  }
  if (
    !protocols.includes(url.protocol) ||
    url.username !== "" ||
    url.password !== "" ||
    url.hash !== ""
  ) {
    throw new Error(`Nostr ${label} URL is invalid.`);
  }
}
