import { connect } from "@tursodatabase/database";
import { describe, expect, it, vi } from "vitest";
import {
  MemoryAppDatabase,
  type SearchDocumentRecord,
} from "../storage/app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";

const initial = {
  kind: "token-hash" as const,
  modelId: "original",
  dimensions: 12,
};
const next = { ...initial, modelId: "replacement", dimensions: 24 };
for (const native of [false, true])
  describe(
    native ? "Turso provider configuration" : "Memory provider configuration",
    () => {
      it("invalidates old model vectors before configuration returns", async () => {
        const db = native
          ? new TursoAppDatabase("provider-invalidation", {
              kind: "turso-native",
              transport: "native",
              connectionFactory: async () =>
                (await connect(":memory:", {
                  experimental: ["index_method"],
                })) as TursoConnection,
            })
          : new MemoryAppDatabase("provider-invalidation");
        await db.open();
        try {
          await db.configureSearchEmbeddingProvider(initial);
          await db.upsertSearchDocument({
            path: "Note.md",
            name: "Note",
            extension: "md",
            checksum: "one",
            content: "A cat on a window.",
            tags: [],
            tagParts: [],
            tagHierarchy: [],
            chunks: [
              {
                id: "Note.md#0",
                text: "A cat on a window.",
                startOffset: 0,
                endOffset: 18,
              },
            ],
          } satisfies SearchDocumentRecord);
          expect(
            (await db.getSearchDocument("Note.md"))?.chunks?.[0]?.embedding
              ?.status,
          ).toBe("ready");
          await db.configureSearchEmbeddingProvider(next);
          expect(
            (await db.getSearchDocument("Note.md"))?.chunks?.[0]?.embedding,
          ).toEqual({
            status: "pending",
            modelId: "replacement",
            modelVersion: "0",
            dimensions: 24,
            dirty: true,
          });
          expect(await db.getSearchIndexStats()).toMatchObject({
            readyChunkCount: 0,
            pendingChunkCount: 1,
            errorChunkCount: 0,
          });
          const revision = await db.getChangeRevision();
          await db.configureSearchEmbeddingProvider(next);
          expect(await db.getChangeRevision()).toBe(revision);
          expect(await db.getSearchEmbeddingProvider()).toEqual(next);
        } finally {
          await db.close();
        }
      });
    },
  );

it("retains the previous Turso provider and vectors after a failed configuration commit", async () => {
  const connection = (await connect(":memory:", {
    experimental: ["index_method"],
  })) as TursoConnection;
  const db = new TursoAppDatabase("configuration-rollback", {
    kind: "turso-native",
    transport: "native",
    connectionFactory: async () => connection,
  });
  await db.open();
  try {
    await db.configureSearchEmbeddingProvider(initial);
    const revision = await db.getChangeRevision();
    const batch = vi.spyOn(connection, "batch");
    batch.mockRejectedValueOnce(new Error("configuration publication failed"));
    await expect(db.configureSearchEmbeddingProvider(next)).rejects.toThrow(
      "configuration publication failed",
    );
    expect(await db.getSearchEmbeddingProvider()).toEqual(initial);
    expect(await db.getMeta("search.embeddingProvider")).toEqual(initial);
    expect(await db.getChangeRevision()).toBe(revision);
    batch.mockRestore();
  } finally {
    await db.close();
  }
});
