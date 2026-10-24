import { connect } from "@tursodatabase/database";
import {
  MemoryAppDatabase,
  type AppDatabase,
  type AppDatabaseSearchOptions,
  type AppDatabaseSearchResult,
  type SearchDocumentRecord,
} from "../storage/app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";
import input from "./fixtures/search-retrieval.json";

export const fixture = input as unknown as {
  records: Array<{
    document: SearchDocumentRecord;
    properties: Record<string, unknown>;
  }>;
  cases: Array<{
    name: string;
    query: string;
    options: AppDatabaseSearchOptions;
    memory: AppDatabaseSearchResult[];
    turso: AppDatabaseSearchResult[];
  }>;
};
export async function database(native: boolean): Promise<AppDatabase> {
  const db = native
    ? new TursoAppDatabase("retrieval", {
        kind: "turso-native",
        transport: "native",
        connectionFactory: async () =>
          (await connect(":memory:", {
            experimental: ["index_method"],
          })) as TursoConnection,
      })
    : new MemoryAppDatabase("retrieval");
  await db.open();
  for (const { document, properties } of fixture.records) {
    const file = {
      path: document.path,
      normalizedPath: document.path,
      extension: "md",
      mtime: 1,
      size: 1,
      hash: "reference",
      indexed: true,
    };
    await db.upsertIndexedFile({
      file,
      metadata: {
        path: file.path,
        hash: file.hash,
        parserVersion: "fixture",
        metadata: {},
      },
      links: [],
      tags: [],
      properties: Object.entries(properties).map(([name, value]) => ({
        path: file.path,
        name,
        value,
        inferredType: typeof value,
      })),
    });
    await db.upsertSearchDocument(document);
  }
  return db;
}
