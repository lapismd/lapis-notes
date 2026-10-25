import type { HostedBackend } from "../backend";
import { RustHostError, RustHttpClient } from "./client";
import { RustDatabaseProvider } from "./database-provider";
import { RustVaultAdapter } from "./vault-adapter";

export function createRustHostedBackend(
  host = new RustHttpClient(),
): HostedBackend {
  const unavailable = () =>
    new RustHostError(
      "UNSUPPORTED",
      "This operation is unavailable on the selected server",
      501,
    );
  return {
    runtime: "rust-server",
    protocolMajor: host.protocolMajor,
    capabilities: { manageVaults: false, transferVaults: false },
    async info() {
      const info = await host.info();
      return { buildId: info.build_id, protocolMajor: info.protocol_major };
    },
    current: () => host.current(),
    login: (username, password) => host.login(username, password),
    logout: () => host.logout(),
    async vaults() {
      return (await host.vaults()).map((vault) => ({
        id: vault.vault_id,
        name: vault.name,
        role: "owner" as const,
      }));
    },
    create: async () => {
      throw unavailable();
    },
    rename: async () => {
      throw unavailable();
    },
    archive: async () => {
      throw unavailable();
    },
    restore: async () => {
      throw unavailable();
    },
    importArchive: async () => {
      throw unavailable();
    },
    exportUrl: () => {
      throw unavailable();
    },
    async prepare(profile) {
      const client = await host.attach(profile.id);
      return {
        adapter: new RustVaultAdapter(client, profile.name),
        database: new RustDatabaseProvider(client),
        pluginDistributionOptions: {
          fetch: async () => {
            throw unavailable();
          },
        },
        release: () => client.close(),
      };
    },
  };
}
