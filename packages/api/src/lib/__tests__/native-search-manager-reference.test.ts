import { describe, expect, it } from "vitest";
import { SearchManager } from "@lapis-notes/search";
import type { App } from "../context.svelte";
import type { CachedMetadata } from "../cache.svelte";
import { TFile } from "../storage/fs";
import type { SearchDocumentRecord } from "../storage/app-database";
import fixtures from "../../../../../crates/lapis-app-core/tests/fixtures/native-search-manager.json";

describe("native Search retained SearchManager envelopes", () => {
  for (const fixture of fixtures) {
    it(fixture.name, async () => {
      const records: SearchDocumentRecord[] = [];
      const provider = {
        id: "search:markdown",
        version: "1",
        extract: async ({ content }: { content: string }) => ({ content }),
      };
      const app = {
        searchDocumentProviders: {
          getAll: () => [provider],
          resolve: () => provider,
        },
        appDatabase: {
          upsertSearchDocument: async (record: SearchDocumentRecord) => {
            records.push(record);
          },
        },
      } as unknown as App;
      const file = new TFile(
        fixture.path,
        { ctime: 0, mtime: fixture.mtime, size: fixture.size },
        null,
      );
      await new SearchManager(app).processChange(
        file,
        fixture.text,
        fixture.cache as CachedMetadata,
      );
      expect(records).toEqual([fixture.expected]);
    });
  }
});
