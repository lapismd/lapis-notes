import type { ControlDatabase, ControlSession } from "./control-database.ts";
import type { VaultEventHub } from "./events.ts";
import type { ManagedVaultStore } from "./managed-vaults.ts";
import type { ServerConfig } from "./config.ts";
import type { VaultRuntimeManager } from "./vault-runtimes.ts";

export type ServerServices = {
  config: ServerConfig;
  control: ControlDatabase;
  events: VaultEventHub;
  store: ManagedVaultStore;
  runtimes: VaultRuntimeManager;
};

export type ServerContext = ServerServices & {
  request: Request;
  responseHeaders: Headers;
  session?: ControlSession;
};
