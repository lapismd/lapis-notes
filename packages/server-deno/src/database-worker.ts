import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerResponse,
} from "@lapis-notes/deno-host-services/app-database-worker-protocol";
import { AppDatabaseWorkerRuntime } from "@lapis-notes/deno-host-services/app-database-worker-runtime";
import { openNativeTursoAppDatabase } from "@lapis-notes/deno-host-services/native-app-database";

const runtime = new AppDatabaseWorkerRuntime(
  ({ vaultId, path }) =>
    openNativeTursoAppDatabase({
      vaultId,
      path,
      providerId: "turso-native-server",
      transport: "http-rpc",
    }),
  (response: AppDatabaseWorkerResponse) => globalThis.postMessage(response),
);

let pending = Promise.resolve();
globalThis.onmessage = (event: MessageEvent<AppDatabaseWorkerRequest>) => {
  pending = pending.then(() => runtime.handle(event.data));
};
