import { connect } from "@tursodatabase/database";
import {
  TursoAppDatabase,
  type AppDatabase,
  type AppDatabaseTransport,
  type TursoConnection,
} from "@lapis-notes/api/app-database";

export type NativeAppDatabaseOptions = {
  vaultId: string;
  path: string;
  providerId: string;
  transport?: AppDatabaseTransport;
};

export async function openNativeTursoAppDatabase({
  vaultId,
  path,
  providerId,
  transport = "native",
}: NativeAppDatabaseOptions): Promise<AppDatabase> {
  const database = new TursoAppDatabase(vaultId, {
    kind: "turso-native",
    providerId,
    transport,
    role: "direct",
    connectionFactory: async () =>
      (await connect(path, {
        experimental: ["index_method"],
      })) as TursoConnection,
  });
  await database.open();
  return database;
}
