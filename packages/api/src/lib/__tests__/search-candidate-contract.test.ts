import { connect } from "@tursodatabase/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  MemoryAppDatabase,
  type AppDatabase,
  type AppDatabaseSearchOptions,
  type SearchDocumentRecord,
} from "../storage/app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";

const cases: Array<{
  name: string;
  query: string;
  options?: AppDatabaseSearchOptions;
}> = [
  {
    name: "case-sensitive ranking",
    query: "needle",
    options: { caseSensitive: true },
  },
  { name: "field evaluation", query: "file:needle" },
  { name: "property evaluation", query: "[status]:ready" },
  { name: "property existence", query: "[status]" },
  { name: "negative evaluation", query: "-filler" },
  {
    name: "provider ranking",
    query: "needle",
    options: { sourceProviderIds: ["markdown"] },
  },
  {
    name: "path ranking",
    query: "needle",
    options: { pathPrefix: "Projects" },
  },
];

for (const kind of ["memory", "turso-fts", "turso-table"] as const)
  describe(`${kind} complete Search candidates`, () => {
    let db: AppDatabase;
    const winner = "Projects/Z-winner.md";
    beforeAll(async () => {
      db =
        kind === "memory"
          ? new MemoryAppDatabase("search-candidates")
          : new TursoAppDatabase("search-candidates", {
              kind: "turso-native",
              transport: "native",
              connectionFactory: async () =>
                (await connect(":memory:", {
                  experimental: kind === "turso-fts" ? ["index_method"] : [],
                })) as TursoConnection,
            });
      await db.open();
      expect(db.descriptor.capabilities.nativeFullTextSearch).toBe(
        kind === "turso-fts",
      );
      const base: SearchDocumentRecord = {
        path: "",
        sourceProviderId: "markdown",
        name: "filler",
        extension: "md",
        checksum: "filler",
        content: "needle filler",
        tags: [],
        tagParts: [],
        tagHierarchy: [],
      };
      for (let index = 0; index < 110; index += 1)
        await db.upsertSearchDocument({
          ...base,
          path: `Projects/${String(index).padStart(3, "0")}.md`,
        });
      await db.upsertSearchDocument({
        ...base,
        path: winner,
        name: "needle",
        content: "A winning note",
        metadataText: JSON.stringify({ status: "ready" }),
      });
    }, 30_000);
    afterAll(async () => db?.close());
    it.each(cases)(
      "evaluates all candidates before $name and the final limit",
      async (entry) => {
        const options: AppDatabaseSearchOptions = {
          mode: "lexical",
          limit: 1,
          ...entry.options,
        };
        expect(
          (await db.searchDocuments(entry.query, options)).map(
            (r) => r.document.path,
          ),
        ).toEqual([winner]);
        expect(await db.searchDocumentPaths(entry.query, options)).toEqual([
          winner,
        ]);
      },
    );
    if (kind === "turso-table")
      it("ranks the complete degraded lexical set before limiting", async () => {
        expect(
          await db.searchDocumentPaths("needle", { mode: "lexical", limit: 1 }),
        ).toEqual([winner]);
      });
  });
