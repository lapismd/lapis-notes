import { describe, expect, it } from "vitest";
import { database } from "./projection-query-support";
import fixture from "./fixtures/projection-query.json";
import type { AppDatabase } from "../storage/app-database";

const edges = [
  { sourceRowId: "a", relation: "child", targetRowId: "b", ordinal: 0 },
  { sourceRowId: "a", relation: "child", targetRowId: "c", ordinal: 1 },
  { sourceRowId: "a", relation: "path", targetPath: "b.md", ordinal: 0 },
];
async function privateTarget(db: AppDatabase) {
  await db.registerProjectionDefinition({
    projectionId: "secret/row",
    ownerPluginId: "secret",
    schemaVersion: 1,
    configHash: "fixture-1",
    visibility: "private",
    fields: {},
    active: true,
    updatedAt: 1,
  });
  await db.replaceProjectionSource({
    projectionId: "secret/row",
    sourcePath: "secret.md",
    sourceHash: "secret",
    rows: [{ id: "secret", kind: "secret", data: { id: "secret" } }],
  });
  await db.replaceProjectionSource({
    projectionId: fixture.projectionId,
    sourcePath: "a.md",
    sourceHash: "fixture-hash",
    rows: [{ id: "a", kind: "book", data: fixture.rows[0]! }],
    edges: [
      {
        sourceRowId: "a",
        relation: "private",
        targetProjectionId: "secret/row",
        targetRowId: "secret",
        ordinal: 0,
      },
    ],
  });
}
for (const native of [false, true])
  describe(
    native
      ? "Turso related projection conformance"
      : "Memory related projection conformance",
    () => {
      it("filters related rows before applying a requested limit", async () => {
        const db = await database(native, edges);
        try {
          const revision = await db.getChangeRevision();
          const result = await db.queryRelated({
            projectionId: fixture.projectionId,
            rowId: "a",
            relation: "child",
            targetWhere: {
              op: "compare",
              field: "rank",
              comparison: "gte",
              value: 3,
            },
            limit: 1,
          });
          expect(result.rows.map((r) => r.id)).toEqual(["c"]);
          expect(await db.getChangeRevision()).toBe(revision);
        } finally {
          await db.close();
        }
      });
      it("resolves incoming path-only edges", async () => {
        const db = await database(native, edges);
        try {
          const result = await db.queryRelated({
            projectionId: fixture.projectionId,
            rowId: "b",
            relation: "path",
            direction: "in",
          });
          expect(result.rows.map((r) => r.id)).toEqual(["a"]);
        } finally {
          await db.close();
        }
      });
      it("does not return stale target rows", async () => {
        const db = await database(native, edges);
        try {
          await db.upsertIndexedFile({
            file: {
              path: "b.md",
              normalizedPath: "b.md",
              extension: "md",
              mtime: 1,
              size: 1,
              hash: "changed",
              indexed: true,
            },
            metadata: {
              path: "b.md",
              hash: "changed",
              parserVersion: "fixture-1",
              metadata: {},
            },
            tags: [],
            properties: [],
            links: [],
          });
          const result = await db.queryRelated({
            projectionId: fixture.projectionId,
            rowId: "a",
            relation: "path",
          });
          expect(result.rows).toEqual([]);
        } finally {
          await db.close();
        }
      });
      it("requires the explicit private target owner even from a public projection", async () => {
        const db = await database(native);
        try {
          await privateTarget(db);
          const query = {
            projectionId: fixture.projectionId,
            rowId: "a",
            relation: "private",
          };
          await expect(db.queryRelated(query)).rejects.toThrow(/private/i);
          await expect(db.queryRelated(query, "books")).rejects.toThrow(
            /private/i,
          );
          expect((await db.queryRelated(query, "secret")).rows).toEqual([
            { id: "secret" },
          ]);
        } finally {
          await db.close();
        }
      });
      it("rejects unregistered target projections", async () => {
        const db = await database(native);
        try {
          await db.replaceProjectionSource({
            projectionId: fixture.projectionId,
            sourcePath: "a.md",
            sourceHash: "fixture-hash",
            rows: [{ id: "a", kind: "book", data: fixture.rows[0]! }],
            edges: [
              {
                sourceRowId: "a",
                relation: "missing",
                targetProjectionId: "missing/row",
                targetRowId: "missing",
                ordinal: 0,
              },
            ],
          });
          await expect(
            db.queryRelated({
              projectionId: fixture.projectionId,
              rowId: "a",
              relation: "missing",
            }),
          ).rejects.toThrow(/registered/i);
        } finally {
          await db.close();
        }
      });
    },
  );
