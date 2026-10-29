import { describe, expect, it } from "vitest";
import fixture from "./fixtures/projection-query.json";
import { database } from "./projection-query-support";
import {
  type IndexQuery,
  type IndexQueryResult,
} from "../storage/index-projection";

const ids = (result: IndexQueryResult) => result.rows.map((r) => r.id);
for (const native of [false, true]) {
  describe(
    native
      ? "Turso projection query conformance"
      : "Memory projection query conformance",
    () => {
      for (const scenario of fixture.cases)
        it(scenario.name, async () => {
          const db = await database(native);
          try {
            const revision = await db.getChangeRevision();
            const result = await db.queryProjection(
              fixture.projectionId,
              scenario.query as IndexQuery,
            );
            expect(ids(result)).toEqual(scenario.ids);
            expect(result).toMatchObject({
              complete: true,
              indexStatus: "ready",
            });
            expect(await db.getChangeRevision()).toBe(revision);
          } finally {
            await db.close();
          }
        });
      it("cursor continuation retains explicit null placement", async () => {
        const db = await database(native);
        try {
          const query: IndexQuery = {
            orderBy: [{ field: "rank", direction: "asc", nulls: "first" }],
            limit: 1,
          };
          const first = await db.queryProjection(fixture.projectionId, query);
          expect(ids(first)).toEqual(["d"]);
          expect(first.nextCursor).toBeTruthy();
          const next = await db.queryProjection(fixture.projectionId, {
            ...query,
            after: first.nextCursor,
          });
          expect(ids(next)).toEqual(["b"]);
        } finally {
          await db.close();
        }
      });
      it("cursor row-id ties use the same locale ordering as the rows", async () => {
        const db = await database(native);
        try {
          await db.replaceProjectionSource({
            projectionId: fixture.projectionId,
            sourcePath: "ties.md",
            sourceHash: "hash",
            rows: ["a", "B", "c"].map((id) => ({
              id: `tie-${id}`,
              kind: "tie",
              data: { id: `tie-${id}`, ties: true },
            })),
          });
          const query: IndexQuery = {
            where: {
              op: "compare",
              field: "ties",
              comparison: "eq",
              value: true,
            },
            limit: 1,
          };
          const first = await db.queryProjection(fixture.projectionId, query);
          expect(ids(first)).toEqual(["tie-a"]);
          expect(first.nextCursor).toBeTruthy();
          const next = await db.queryProjection(fixture.projectionId, {
            ...query,
            after: first.nextCursor,
          });
          expect(ids(next)).toEqual(["tie-B"]);
        } finally {
          await db.close();
        }
      });
      it("selection retains own properties without changing the result prototype", async () => {
        const db = await database(native);
        try {
          const data = JSON.parse(
            '{"id":"special","__proto__":{"custom":true},"constructor":"value"}',
          ) as Record<string, unknown>;
          await db.replaceProjectionSource({
            projectionId: fixture.projectionId,
            sourcePath: "special.md",
            sourceHash: "hash",
            rows: [{ id: "special", kind: "book", data }],
          });
          const result = await db.queryProjection(fixture.projectionId, {
            where: {
              op: "compare",
              field: "id",
              comparison: "eq",
              value: "special",
            },
            select: ["id", "__proto__", "constructor", "toString"],
          });
          const row = result.rows[0]!;
          expect(Object.hasOwn(row, "__proto__")).toBe(true);
          expect(row["__proto__"]).toEqual({ custom: true });
          expect(row.constructor).toBe("value");
          expect(row.toString).toBeUndefined();
          expect(Object.getPrototypeOf(row)).toBe(Object.prototype);
        } finally {
          await db.close();
        }
      });
      it("pages without losing the first cursor or sorting only a SQL-limited prefix", async () => {
        const db = await database(native);
        try {
          const query: IndexQuery = {
            orderBy: [{ field: "rank", direction: "asc", nulls: "last" }],
            select: ["id", "rank"],
            limit: 2,
          };
          const first = await db.queryProjection(fixture.projectionId, query);
          expect(first.rows).toEqual([
            { id: "b", rank: 1 },
            { id: "a", rank: 2 },
          ]);
          expect(first.nextCursor).toBeTruthy();
          const second = await db.queryProjection(fixture.projectionId, {
            ...query,
            after: first.nextCursor,
          });
          expect(second.rows).toEqual([
            { id: "c", rank: 3 },
            { id: "e", rank: 4 },
          ]);
          expect(second.nextCursor).toBeTruthy();
          const third = await db.queryProjection(fixture.projectionId, {
            ...query,
            after: second.nextCursor,
          });
          expect(third.rows).toEqual([{ id: "d", rank: null }]);
          expect(third.nextCursor).toBeUndefined();
        } finally {
          await db.close();
        }
      });
    },
  );
}
