export * from "@lapis-notes/deno-host-services/app-database-worker-protocol";

import type { AppDatabaseWorkerResponse as HostServiceWorkerResponse } from "@lapis-notes/deno-host-services/app-database-worker-protocol";

export type AppDatabaseWorkerResponse =
  | HostServiceWorkerResponse
  | { type: "ready" };
