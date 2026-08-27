import { connect } from "@tursodatabase/database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../../api/src/lib/storage/turso-app-database.ts";
import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerResponse,
} from "./app-database-worker-protocol.ts";
import { AppDatabaseWorkerRuntime } from "./app-database-worker-runtime.ts";

const runtime = new AppDatabaseWorkerRuntime(
  async ({ vaultId, path }) => {
    const database = new TursoAppDatabase(vaultId, {
      kind: "turso-native",
      providerId: "turso-native-desktop",
      transport: "native",
      role: "direct",
      connectionFactory: async () =>
        (await connect(path, {
          experimental: ["index_method"],
        })) as TursoConnection,
    });
    await database.open();
    return database;
  },
  (response: AppDatabaseWorkerResponse) => globalThis.postMessage(response),
);

let pending = Promise.resolve();
globalThis.onmessage = (event: MessageEvent<AppDatabaseWorkerRequest>) => {
  pending = pending.then(() => runtime.handle(event.data));
};
