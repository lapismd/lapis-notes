import {
  createBrowserSyncUnlockHandler,
  type SyncHostService,
  type VaultSession,
} from "@lapis-notes/api";
import type { NotesWorkspaceHost } from "@lapis-notes/app-profile/workspace-session";
import {
  webPluginRestrictionsFor,
  removeObsoleteServiceSecrets,
} from "./desktop-plugin-policy";
import { registerWebVaultTransferSettings } from "./vault-transfer-settings";
import { setPwaRuntimeApplication } from "./pwa-runtime-application";

export function createWebSessionHost(
  session: VaultSession,
  nativeChat: boolean,
  pwa: boolean,
): NotesWorkspaceHost {
  let hostSync!: SyncHostService;
  const requestCryptoUnlock = createBrowserSyncUnlockHandler({
    database: session.appDatabase!,
    getSyncHost: () => hostSync,
    rpName: "Lapis Notes",
    interaction: {
      confirmPasskeyEnrollment: async () =>
        globalThis.confirm(
          "Protect this vault's sync keys with a passkey on this device?",
        ),
      requestPassphrase: async (_pluginId, mode) => {
        const passphrase = globalThis.prompt(
          mode === "enroll"
            ? "Create a sync passphrase (at least 10 characters). Keep it somewhere safe; Lapis cannot recover it."
            : "Enter the sync passphrase for this vault.",
        );
        if (passphrase == null || mode === "unlock") return passphrase;
        const confirmation = globalThis.prompt(
          "Enter the new sync passphrase again to confirm it.",
        );
        if (confirmation !== passphrase) {
          throw new Error("Sync passphrase confirmation did not match");
        }
        return passphrase;
      },
    },
  });
  return {
    syncHost: {
      requestCryptoUnlock,
      requestRecoveryPassphrase: async (_pluginId, mode) => {
        const passphrase = globalThis.prompt(
          mode === "export"
            ? "Create a recovery-bundle passphrase (at least 10 characters)."
            : "Enter the recovery-bundle passphrase.",
        );
        if (passphrase == null || mode === "import") return passphrase;
        const confirmation = globalThis.prompt(
          "Enter the recovery-bundle passphrase again to confirm it.",
        );
        if (confirmation !== passphrase) {
          throw new Error("Recovery passphrase confirmation did not match");
        }
        return passphrase;
      },
      requestNetworkOriginGrant: async ({
        pluginId,
        origin,
        allowPrivateNetwork,
      }) =>
        globalThis.confirm(
          `${pluginId} wants to connect to ${origin}.${
            allowPrivateNetwork
              ? " This grants access to a private or loopback network address."
              : ""
          } Allow this exact origin?`,
        ),
    },
    unavailablePlugins: webPluginRestrictionsFor(nativeChat),
    attach(app, syncHost) {
      hostSync = syncHost;
      return pwa ? setPwaRuntimeApplication(app) : () => {};
    },
    async configure(app) {
      await removeObsoleteServiceSecrets(app);
      return pwa ? registerWebVaultTransferSettings(app) : undefined;
    },
  };
}
