import { parentPort } from "node:worker_threads";
import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerResponse,
} from "@lapis-notes/host-services/app-database-worker-protocol";
import { AppDatabaseWorkerRuntime } from "@lapis-notes/host-services/app-database-worker-runtime";
import { openNativeTursoAppDatabase } from "@lapis-notes/host-services/native-app-database";

const port = parentPort;
if (!port) throw new Error("Database worker requires a parent port");

const runtime = new AppDatabaseWorkerRuntime(
  ({ vaultId, path }) =>
    openNativeTursoAppDatabase({
      vaultId,
      path,
      providerId: "turso-native-server",
      transport: "http-rpc",
    }),
  (response: AppDatabaseWorkerResponse) => port.postMessage(response),
);

let pending = Promise.resolve();
port.on("message", (request: AppDatabaseWorkerRequest) => {
  pending = pending.then(() => runtime.handle(request));
});
