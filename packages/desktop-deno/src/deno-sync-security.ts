import type {
  SyncEndpointSecurityCapabilities,
  SyncHostSecurityProvider,
} from "@lapis-notes/api";
import {
  encodeSyncValue,
  SYNC_SECURITY_METHODS,
} from "./sync-security-protocol";
import {
  createDesktopSyncSessionClient,
  type DesktopSyncProviderOptions,
} from "./deno-sync-session";
import { createDesktopSyncLocalProvider } from "./deno-sync-local";

/** Host-owned security and local data adapters share one native profile/runtime session. */
export function createDesktopSyncHostProviders(
  options: DesktopSyncProviderOptions,
) {
  const client = createDesktopSyncSessionClient(options);
  const security: SyncHostSecurityProvider = {
    forRuntime(runtimeId) {
      const runtime = client.acquire(runtimeId, "security");
      const capabilities: Record<
        string,
        Record<string, (...args: unknown[]) => Promise<unknown>>
      > = {};
      for (const [group, methods] of Object.entries(SYNC_SECURITY_METHODS)) {
        const scoped: Record<string, (...args: unknown[]) => Promise<unknown>> =
          {};
        capabilities[group] = scoped;
        for (const method of methods)
          scoped[method] = async (...args) => {
            client.assert(runtime);
            const passphrase =
              group === "recovery"
                ? await options.requestRecoveryPassphrase(
                    method === "exportBundle" ? "export" : "import",
                  )
                : undefined;
            client.assert(runtime);
            if (passphrase === null)
              throw new Error("Sync recovery interaction was cancelled");
            return client.security(runtimeId, runtime, {
              group,
              method,
              args: encodeSyncValue(args),
              ...(passphrase !== undefined ? { passphrase } : {}),
            });
          };
      }
      return capabilities as unknown as SyncEndpointSecurityCapabilities;
    },
    revokeRuntime: (runtimeId) => client.close(runtimeId),
  };
  return { security, local: createDesktopSyncLocalProvider(client) };
}

/** Compatibility entrypoint for hosts selecting only native key custody. */
export function createDesktopSyncSecurityProvider(
  options: DesktopSyncProviderOptions,
): SyncHostSecurityProvider {
  return createDesktopSyncHostProviders(options).security;
}
