import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AppDatabase } from "../storage/app-database";
import { database, fixture } from "./search-retrieval-support";

for (const native of [false, true])
  describe(
    native ? "Turso retrieval reference" : "Memory retrieval reference",
    () => {
      let db: AppDatabase;
      beforeAll(async () => {
        db = await database(native);
      });
      afterAll(async () => {
        await db?.close();
      });
      it.each(fixture.cases)(
        "retains complete results: $name",
        async (entry) => {
          const expected = entry[native ? "turso" : "memory"];
          expect(await db.searchDocuments(entry.query, entry.options)).toEqual(
            expected,
          );
          expect(
            await db.searchDocumentPaths(entry.query, entry.options),
          ).toEqual(expected.map((r) => r.document.path));
        },
      );
    },
  );
