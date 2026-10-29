import { connect } from "@tursodatabase/database";
import fixture from "./fixtures/projection-query.json";
import { MemoryAppDatabase, type AppDatabase } from "../storage/app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";
import type { IndexProjectionEdgeInput } from "../storage/index-projection";

export async function database(
  native: boolean,
  edges: IndexProjectionEdgeInput[] = [],
): Promise<AppDatabase> {
  const db: AppDatabase = native
    ? new TursoAppDatabase("projection-query-contract", {
        kind: "turso-native",
        transport: "native",
        connectionFactory: async () =>
          (await connect(":memory:", {
            experimental: ["index_method"],
          })) as TursoConnection,
      })
    : new MemoryAppDatabase("projection-query-contract");
  await db.open();
  await db.registerProjectionDefinition({
    projectionId: fixture.projectionId,
    ownerPluginId: "books",
    schemaVersion: 1,
    configHash: "fixture-1",
    visibility: "public",
    fields: {
      title: { type: "string", sortable: true },
      rank: { type: "number", sortable: true },
      optional: { type: "string", indexed: true },
      "literal.key": { type: "string", indexed: true },
    },
    active: true,
    updatedAt: 1,
  });
  for (const row of fixture.rows)
    await db.replaceProjectionSource({
      projectionId: fixture.projectionId,
      sourcePath: `${row.id}.md`,
      sourceHash: "fixture-hash",
      rows: [{ id: row.id, kind: "book", data: row }],
      edges: edges.filter((edge) => edge.sourceRowId === row.id),
    });
  return db;
}
