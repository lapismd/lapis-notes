import { connect } from "@tursodatabase/database";
import { describe, expect, it } from "vitest";
import {
  MemoryAppDatabase,
  type SearchDocumentRecord,
} from "../storage/app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";
import fixture from "./fixtures/search-preparation.json";

function database(native: boolean) {
  return native
    ? new TursoAppDatabase("search-preparation", {
        kind: "turso-native",
        transport: "native",
        connectionFactory: async () =>
          (await connect(":memory:", {
            experimental: ["index_method"],
          })) as TursoConnection,
      })
    : new MemoryAppDatabase("search-preparation");
}

for (const native of [false, true])
  describe(
    native ? "Turso Search preparation" : "Memory Search preparation",
    () => {
      it("keeps a surrogate pair together at a generated UTF-16 cutoff", async () => {
        const db = database(native);
        const input: SearchDocumentRecord = {
          path: "Emoji.md",
          name: "Emoji",
          extension: "md",
          checksum: "unicode",
          content: "AB📝CD",
          tags: [],
          tagParts: [],
          tagHierarchy: [],
          sourceMetadata: {
            rawTags: [],
            headings: [],
            sections: [],
            chunking: {
              targetChars: 3,
              breakpointWindowChars: 0,
              breakpointDecay: 0.7,
            },
          },
        };
        await db.open();
        try {
          await db.upsertSearchDocument(input);
          const record = await db.getSearchDocument(input.path);
          expect(record?.chunks?.map((chunk) => chunk.text)).toEqual([
            "AB📝",
            "CD",
          ]);
          expect(
            record?.chunks?.map((chunk) => [
              chunk.startOffset,
              chunk.endOffset,
            ]),
          ).toEqual([
            [0, 4],
            [4, 6],
          ]);
          expect(record?.chunks?.map((chunk) => chunk.id)).toEqual([
            "Emoji.md#chunk-0-4",
            "Emoji.md#chunk-4-6",
          ]);
          expect(input).not.toHaveProperty("chunks");
        } finally {
          await db.close();
        }
      });
      it.each(fixture.cases)(
        "retains preparation reference: $name",
        async (entry) => {
          const input = structuredClone(entry.input) as SearchDocumentRecord;
          const original = structuredClone(input);
          const db = database(native);
          await db.open();
          try {
            await db.upsertSearchDocument(input);
            const actual = await db.getSearchDocument(input.path);
            expect(actual).toEqual(entry.expected);
            expect(input).toEqual(original);
            if (input.sourceMetadata)
              for (const chunk of actual?.chunks ?? []) {
                expect(chunk.text).toBe(
                  input.content.slice(chunk.startOffset, chunk.endOffset),
                );
                expect(chunk.text.length).toBe(
                  chunk.endOffset - chunk.startOffset,
                );
                expect(() => encodeURIComponent(chunk.text)).not.toThrow();
              }
          } finally {
            await db.close();
          }
        },
      );
    },
  );
