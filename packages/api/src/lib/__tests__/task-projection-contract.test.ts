import { connect } from "@tursodatabase/database";
import { describe, expect, it } from "vitest";
import { MemoryAppDatabase, type AppDatabase } from "../storage/app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";
import {
  TASK_PROJECTION_FIELDS,
  type AppDatabaseTaskQuery,
  type AppDatabaseTaskRecord,
} from "../storage/task-projection";
import fixture from "./fixtures/task-projection.json";

for (const native of [false, true])
  describe(
    native ? "Turso task facade reference" : "Memory task facade reference",
    () => {
      async function database(): Promise<AppDatabase> {
        const db: AppDatabase = native
          ? new TursoAppDatabase("tasks", {
              kind: "turso-native",
              transport: "native",
              connectionFactory: async () =>
                (await connect(":memory:", {
                  experimental: ["index_method"],
                })) as TursoConnection,
            })
          : new MemoryAppDatabase("tasks");
        await db.open();
        for (const row of fixture.records)
          await db.upsertTaskProjection(row as AppDatabaseTaskRecord);
        return db;
      }
      for (const scenario of fixture.cases)
        it(`retains ${JSON.stringify(scenario.query)} membership`, async () => {
          const db = await database();
          try {
            const revision = await db.getChangeRevision();
            expect(
              (await db.queryTasks(scenario.query as AppDatabaseTaskQuery)).map(
                (r) => r.documentId,
              ),
            ).toEqual(scenario.ids);
            expect(await db.getChangeRevision()).toBe(revision);
          } finally {
            await db.close();
          }
        });
      it("retains complete v4 records and distinct missing/null fields through ID and path lookup", async () => {
        const db = await database();
        try {
          const full = fixture.records[0]!;
          expect(TASK_PROJECTION_FIELDS).toEqual(fixture.fields);
          expect(await db.getTaskRow({ id: full.documentId })).toEqual(full);
          expect(await db.getTaskRow({ path: full.documentPath })).toEqual(
            full,
          );
          expect(
            Object.hasOwn((await db.getTaskRow({ id: "inbox" }))!, "planDate"),
          ).toBe(false);
          await db.deleteTaskProjection(full.documentPath);
          expect(await db.getTaskRow({ id: full.documentId })).toBeUndefined();
          expect(
            await db.getTaskRow({ path: full.documentPath }),
          ).toBeUndefined();
        } finally {
          await db.close();
        }
      });
    },
  );
