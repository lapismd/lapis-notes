import { openNativeTursoAppDatabase } from "@lapis-notes/deno-host-services/native-app-database";
import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerResponse,
} from "./app-database-worker-protocol.ts";
import { AppDatabaseWorkerRuntime } from "./app-database-worker-runtime.ts";

const runtime = new AppDatabaseWorkerRuntime(
  ({ vaultId, path }) =>
    openNativeTursoAppDatabase({
      vaultId,
      path,
      providerId: "turso-native-desktop",
    }),
  (response: AppDatabaseWorkerResponse) => globalThis.postMessage(response),
);

let pending = Promise.resolve();
globalThis.onmessage = (event: MessageEvent<AppDatabaseWorkerRequest>) => {
  pending = pending.then(() => runtime.handle(event.data));
};
