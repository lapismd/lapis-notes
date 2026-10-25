import type { HostedBackend } from "../backend";
import { RustHostError, RustHttpClient } from "./client";
import { RustDatabaseProvider } from "./database-provider";
import { RustVaultAdapter } from "./vault-adapter";
import type { ManagedVault } from "../../../../../crates/lapis-app-protocol/bindings/protocol";

export function createRustHostedBackend(
  host = new RustHttpClient(),
): HostedBackend {
  const capabilities = { manageVaults: false, transferVaults: false };
  const unavailable = () =>
    new RustHostError(
      "UNSUPPORTED",
      "This operation is unavailable on the selected server",
      501,
    );
  return {
    runtime: "rust-server",
    protocolMajor: host.protocolMajor,
    capabilities,
    async info() {
      const info = await host.info();
      capabilities.manageVaults = info.manage_vaults;
      capabilities.transferVaults = info.transfer_vaults;
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
        ...(vault.archived_at === undefined
          ? {}
          : { archivedAt: vault.archived_at }),
      }));
    },
    create: async (name) => {
      const vault = await host.json<ManagedVault>("/vaults", "POST", { name });
      return { vaultId: vault.vault_id };
    },
    rename: (id, name) =>
      host.json(`/vaults/${encodeURIComponent(id)}/name`, "POST", { name }),
    archive: (id) =>
      host.json(`/vaults/${encodeURIComponent(id)}/archive`, "POST"),
    restore: (id) =>
      host.json(`/vaults/${encodeURIComponent(id)}/restore`, "POST"),
    importArchive: async (name, archive) => {
      const response = await host.response(
        `/vaults/import?name=${encodeURIComponent(name)}`,
        {
          method: "POST",
          headers: { "content-type": "application/zip" },
          body: archive,
        },
      );
      await response.json();
    },
    exportUrl: (id) => host.url(`/vaults/${encodeURIComponent(id)}/export`),
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
