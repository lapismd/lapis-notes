import { LAPIS_SERVER_PROTOCOL_MAJOR } from "@lapis-notes/api/server-host";
import {
  createServerClientSession,
  ServerAppDatabaseProvider,
  ServerVaultAdapter,
  ServerVaultEventStream,
  createServerPluginAssetServer,
  createServerPluginDistributionFetch,
} from "@lapis-notes/server-node/browser";
import type { HostedBackend } from "./backend";

/** Retained Node profile, selected explicitly while Rust adoption is staged. */
export function createNodeHostedBackend(): HostedBackend {
  const session = createServerClientSession();
  const client = session.client;
  return {
    runtime: "node-server",
    protocolMajor: LAPIS_SERVER_PROTOCOL_MAJOR,
    capabilities: { manageVaults: true, transferVaults: true },
    info: () => client.system.info.query(),
    async current() {
      const value = await client.auth.current.query();
      session.setCsrfToken(value.csrfToken);
      return value;
    },
    async login(username, password) {
      const value = await client.auth.login.mutate({ username, password });
      session.setCsrfToken(value.csrfToken);
    },
    async logout() {
      await client.auth.logout.mutate();
      session.setCsrfToken();
    },
    vaults: () => client.vault.list.query({ includeArchived: true }),
    create: (name) => client.vault.create.mutate({ name }),
    rename: (vaultId, name) => client.vault.rename.mutate({ vaultId, name }),
    archive: (vaultId) => client.vault.archive.mutate({ vaultId }),
    restore: (vaultId) => client.vault.restore.mutate({ vaultId }),
    async importArchive(name, archive) {
      const response = await fetch(
        `/api/vaults/import?name=${encodeURIComponent(name)}`,
        {
          method: "POST",
          body: archive,
          credentials: "same-origin",
          headers: {
            "content-type": "application/zip",
            "x-lapis-csrf": session.csrfToken() ?? "",
          },
        },
      );
      if (!response.ok) throw new Error(`Import failed (${response.status})`);
    },
    exportUrl: (vaultId) => `/api/vaults/${encodeURIComponent(vaultId)}/export`,
    async prepare(profile) {
      await client.vault.open.query({ vaultId: profile.id });
      const events = new ServerVaultEventStream(client, profile.id);
      const adapter = new ServerVaultAdapter({
        client,
        profile,
        csrfToken: session.csrfToken,
        events,
      });
      return {
        adapter,
        database: new ServerAppDatabaseProvider(client, events),
        pluginAssetServer: createServerPluginAssetServer(adapter),
        pluginDistributionOptions: {
          fetch: createServerPluginDistributionFetch({ vaultId: profile.id }),
        },
        async release() {
          events.close();
        },
      };
    },
  };
}
