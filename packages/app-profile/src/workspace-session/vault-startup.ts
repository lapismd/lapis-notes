import type { App, SyncHostService } from "@lapis-notes/api";
import { DEFAULT_APP_STATE_DIRECTORY } from "@lapis-notes/api/path";

export type VaultStartupOperation =
  | "vault-discovery"
  | "sync-readiness"
  | "state-directory"
  | "complete";

/** Keep the existing startup order while identifying a pending operation. */
export async function openSessionVault(
  vault: Pick<App["vault"], "load" | "mkpath">,
  sync: Pick<SyncHostService, "ready">,
  report: (operation: VaultStartupOperation) => void,
): Promise<void> {
  report("vault-discovery");
  await vault.load();
  report("sync-readiness");
  await sync.ready();
  report("state-directory");
  await vault.mkpath(DEFAULT_APP_STATE_DIRECTORY);
  report("complete");
}
