import { describe, expect, it } from "vitest";
import { MetadataCache, type CachedMetadata } from "../cache.svelte";
import type { App } from "../context.svelte";
import { TFile } from "../storage/fs";
import { inferMetadataPropertyType } from "../metadata-value";
import type { AppDatabaseIndexedFile } from "../storage/app-database";
import records from "../../../../../crates/lapis-app-core/tests/fixtures/native-indexed-metadata.json";
import types from "../../../../../crates/lapis-app-core/tests/fixtures/native-metadata-types.json";

describe("native indexing retained application reference", () => {
  for (const fixture of types) {
    it(`retains inferred type: ${fixture.name} ${JSON.stringify(fixture.value)}`, () => {
      expect(inferMetadataPropertyType(fixture.name, fixture.value)).toBe(
        fixture.expected,
      );
    });
  }
  for (const fixture of records) {
    it(`retains normalized record: ${fixture.name}`, () => {
      const files = new Map(
        fixture.files.map((path) => [
          path,
          new TFile(
            path,
            { ctime: 0, mtime: fixture.mtime, size: fixture.size },
            null,
          ),
        ]),
      );
      const app = {
        appDatabase: {},
        vault: {
          on() {},
          getFileByPath: (path: string) => files.get(path) ?? null,
          getFiles: () => [...files.values()],
          getMarkdownFiles: () =>
            [...files.values()].filter((file) =>
              /\.(md|markdown)$/i.test(file.path),
            ),
        },
        metadataTypeManager: {
          determinePropertyType: inferMetadataPropertyType,
          types: Object.fromEntries(
            Object.entries(fixture.declared).map(([name, type]) => [
              name,
              { name, type },
            ]),
          ),
        },
      } as unknown as App;
      const cache = new MetadataCache(app);
      // This is a source-owned reference test of the retained private builder;
      // no consumer or production code gains a second publication API.
      const reference = cache as unknown as {
        toDatabaseRecord(
          file: TFile,
          hash: string,
          cache: CachedMetadata,
        ): AppDatabaseIndexedFile;
      };
      expect(
        reference.toDatabaseRecord(
          files.get(fixture.path)!,
          fixture.hash,
          fixture.cache as CachedMetadata,
        ),
      ).toEqual(fixture.expected);
    });
  }
});
