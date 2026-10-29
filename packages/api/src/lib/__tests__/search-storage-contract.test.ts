import { connect } from "@tursodatabase/database";
import { describe, expect, it } from "vitest";
import {
  MemoryAppDatabase,
  type AppDatabase,
  type SearchDocumentRecord,
} from "../storage/app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";
import fixture from "./fixtures/search-storage.json";

for (const native of [false, true])
  describe(
    native
      ? "Turso Search storage reference"
      : "Memory Search storage reference",
    () => {
      async function database(): Promise<AppDatabase> {
        const db = native
          ? new TursoAppDatabase("search-storage", {
              kind: "turso-native",
              transport: "native",
              connectionFactory: async () =>
                (await connect(":memory:", {
                  experimental: ["index_method"],
                })) as TursoConnection,
            })
          : new MemoryAppDatabase("search-storage");
        await db.open();
        for (const record of fixture.records)
          await db.upsertSearchDocument(record.input as SearchDocumentRecord);
        return db;
      }
      it("retains complete prepared JSON, embedding states and explicit null frontmatter", async () => {
        const db = await database();
        try {
          for (const record of fixture.records)
            expect(await db.getSearchDocument(record.stored.path)).toEqual(
              record.stored,
            );
          expect(await db.listSearchDocuments()).toEqual(
            fixture.records.map((r) => r.stored),
          );
          expect(await db.getSearchDocument("missing")).toBeUndefined();
          expect(await db.getSearchIndexStats()).toEqual(fixture.stats);
          const transient: SearchDocumentRecord = {
            path: "Transient.md",
            name: "Transient",
            extension: "md",
            checksum: "transient",
            content: "error",
            tags: [],
            tagParts: [],
            tagHierarchy: [],
            chunks: [
              {
                id: "Transient.md#error",
                text: "error",
                startOffset: 0,
                endOffset: 5,
                embedding: {
                  status: "error",
                  modelId: "fixture/vector",
                  error: "temporary",
                },
              },
            ],
          };
          await db.upsertSearchDocument(transient);
          await db.deleteSearchDocument(transient.path);
          expect(await db.getSearchIndexStats()).toEqual(fixture.stats);
        } finally {
          await db.close();
        }
      });
      it("returns body-free manifest pages and stable path cursors", async () => {
        const db = await database();
        try {
          const collected = [];
          let after: string | undefined;
          do {
            const page = await db.listSearchDocumentManifest({
              limit: 1,
              after,
            });
            expect(page.rows).toHaveLength(1);
            expect(page.rows[0]).not.toHaveProperty("content");
            expect(page.rows[0]).not.toHaveProperty("chunks");
            collected.push(...page.rows);
            after = page.nextCursor;
          } while (after);
          expect(collected).toEqual(fixture.manifest);
          expect(
            await db.listSearchDocumentManifest({ after: "Z.md" }),
          ).toEqual({ rows: [], nextCursor: undefined });
        } finally {
          await db.close();
        }
      });
      it("removes prior chunk rows and optional manifest columns on replacement and delete", async () => {
        const db = await database();
        try {
          await db.upsertSearchDocument(fixture.replacement);
          expect(await db.getSearchDocument("B.md")).toEqual(
            fixture.replacement,
          );
          const b = (await db.listSearchDocumentManifest()).rows.find(
            (r) => r.path === "B.md",
          );
          expect(b).toEqual({ path: "B.md", checksum: "replaced" });
          await db.deleteSearchDocument("A.md");
          expect(await db.getSearchDocument("A.md")).toBeUndefined();
          expect(await db.getSearchIndexStats()).toEqual({
            documentCount: 3,
            chunkCount: 0,
            readyChunkCount: 0,
            pendingChunkCount: 0,
            errorChunkCount: 0,
            lastError: null,
          });
        } finally {
          await db.close();
        }
      });
    },
  );
