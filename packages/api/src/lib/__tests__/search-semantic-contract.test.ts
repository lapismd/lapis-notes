import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
import input from "./fixtures/search-semantic-retrieval.json";

const project = (rows: AppDatabaseSearchResult[]) =>
  rows.map(({ document, ...result }) => ({
    ...result,
    document: document.path,
  }));
for (const native of [false, true])
  describe(
    native ? "Turso semantic reference" : "Memory semantic reference",
    () => {
      let db: AppDatabase;
      beforeAll(async () => {
        db = native
          ? new TursoAppDatabase("semantic-reference", {
              kind: "turso-native",
              transport: "native",
              connectionFactory: async () =>
                (await connect(":memory:", {
                  experimental: ["index_method"],
                })) as TursoConnection,
            })
          : new MemoryAppDatabase("semantic-reference");
        await db.open();
        await db.configureSearchEmbeddingProvider({
          kind: "token-hash",
          dimensions: 48,
        });
        for (const document of input.records)
          await db.upsertSearchDocument(document as SearchDocumentRecord);
      });
      afterAll(async () => {
        await db?.close();
      });
      it.each(input.cases)(
        "retains semantic result envelope: $name",
        async (entry) => {
          const options = entry.options as AppDatabaseSearchOptions;
          const expected = entry[native ? "turso" : "memory"];
          expect(
            project(await db.searchDocuments(entry.query, options)),
          ).toEqual(expected);
          expect(await db.searchDocumentPaths(entry.query, options)).toEqual(
            expected.map((row) => row.document),
          );
        },
      );
      if (native)
        it.each(input.enhancementCases)(
          "retains enhancement diagnostics: $name",
          async (entry) => {
            const base = input.cases[entry.caseIndex];
            const options = {
              ...base.options,
              ...("limit" in entry ? { limit: entry.limit } : {}),
              queryEnhancement: entry.request,
            } as AppDatabaseSearchOptions;
            const expected = base.turso
              .slice(0, options.limit ?? 100)
              .map((row) => ({
                ...row,
                diagnostics: {
                  ...row.diagnostics,
                  queryEnhancement: entry.expected,
                },
              }));
            expect(
              project(await db.searchDocuments(base.query, options)),
            ).toEqual(expected);
          },
        );
    },
  );
