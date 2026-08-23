import type {
  AppDatabase,
  AppDatabaseKind,
} from "../src/lib/storage/app-database";
import type { TursoConnection } from "../src/lib/storage/turso-app-database";

export interface MetadataPerformanceBudgets {
  openReadyMs: number;
  fileLookupMs: number;
  indexedQueryMs: number;
}

export interface MetadataPerformanceResult {
  kind: Extract<AppDatabaseKind, "turso-native" | "turso-wasm">;
  noteCount: number;
  runs: number;
  measuredAt: string;
  samples: {
    openReadyMs: number[];
    fileLookupMs: number[];
    tagQueryMs: number[];
    propertyQueryMs: number[];
    backlinkQueryMs: number[];
    heapDeltaBytes: number[];
  };
  p95: {
    openReadyMs: number;
    fileLookupMs: number;
    tagQueryMs: number;
    propertyQueryMs: number;
    backlinkQueryMs: number;
    heapDeltaBytes: number;
  };
  invariants: {
    indexedFiles: number;
    metadataRows: number;
    searchDocuments: number;
    historyRevisions: number;
    markdownBodyReads: 0;
    metadataHotCacheLimit: 512;
    compatibilitySnapshotLoaded: false;
    boundedVaultReconciliationBatches: 500;
  };
  budgets: MetadataPerformanceBudgets;
  passed: boolean;
}

interface BenchmarkOptions {
  kind: Extract<AppDatabaseKind, "turso-native" | "turso-wasm">;
  noteCount: number;
  runs: number;
  budgets: MetadataPerformanceBudgets;
  createDatabase(): AppDatabase;
  heapUsed?(): number;
}

const fixturePath = (indexSql: string) =>
  `printf('Notes/%06d.md', ${indexSql})`;
const fixtureHash = (indexSql: string) => `printf('hash-%06d', ${indexSql})`;
const fixtureTag = (indexSql: string) =>
  `printf('topic/%03d', (${indexSql}) % 128)`;
const fixtureTargetPath = (indexSql: string, noteCount: number) =>
  fixturePath(`((${indexSql}) + 1) % ${noteCount}`);

function noteSequence(noteCount: number): string {
  const statements = [
    "CREATE TEMP TABLE notes (i INTEGER PRIMARY KEY)",
    "INSERT INTO notes (i) VALUES (0)",
  ];
  for (let offset = 1; offset < noteCount; offset *= 2) {
    statements.push(
      `INSERT INTO notes (i) SELECT i + ${offset} FROM notes WHERE i + ${offset} < ${noteCount}`,
    );
  }
  return `${statements.join(";\n")};`;
}

export async function seedMetadataPerformanceFixture(
  connection: TursoConnection,
  noteCount: number,
): Promise<MetadataPerformanceResult["invariants"]> {
  if (
    !Number.isSafeInteger(noteCount) ||
    noteCount < 1 ||
    noteCount > 200_000
  ) {
    throw new Error(
      "Metadata performance note count must be between 1 and 200000",
    );
  }
  const sequence = noteSequence(noteCount);
  const path = fixturePath("i");
  const hash = fixtureHash("i");
  const tag = fixtureTag("i");
  const target = fixtureTargetPath("i", noteCount);

  await connection.exec(`
    PRAGMA cache_size = -65536;
    PRAGMA cache_spill = OFF;
    BEGIN IMMEDIATE;
    DELETE FROM metadata_property_values;
    DELETE FROM metadata_properties;
    DELETE FROM metadata_tag_ancestors;
    DELETE FROM metadata_tags;
    DELETE FROM metadata_links;
    DELETE FROM properties;
    DELETE FROM tags;
    DELETE FROM links;
    DELETE FROM metadata;
    DELETE FROM files;
    DELETE FROM search_chunks;
    DELETE FROM search_docs;
    DELETE FROM history_revisions;
    DELETE FROM history_file_paths;
    DELETE FROM history_files;
    DELETE FROM app_state;

    ${sequence}
    INSERT INTO files
      (path, normalized_path, extension, mtime, size, hash, indexed, deleted)
    SELECT ${path}, lower(${path}), 'md', 1700000000000 + i, 256,
           ${hash}, 1, 0
    FROM notes;

    INSERT INTO metadata (path, hash, parser_version, data_json)
    SELECT ${path}, ${hash}, 'metadata-cache-v2:md:1',
           json_object(
             'frontmatter', json_object(
               'priority', i % 5,
               'project', printf('Project %03d', i % 128)
             ),
             'tags', json_array(),
             'links', json_array()
           )
    FROM notes;
    COMMIT;
    BEGIN IMMEDIATE;

    INSERT INTO tags (path, ordinal, data_json)
    SELECT ${path}, 0,
           json_object(
             'path', ${path},
             'tag', '#' || ${tag},
             'parts', json_array('topic', printf('%03d', i % 128)),
             'hierarchy', json_array('topic', ${tag})
           )
    FROM notes;

    INSERT INTO metadata_tags
      (path, ordinal, tag, normalized_tag, data_json)
    SELECT ${path}, 0, '#' || ${tag}, ${tag},
           json_object(
             'path', ${path},
             'tag', '#' || ${tag},
             'parts', json_array('topic', printf('%03d', i % 128)),
             'hierarchy', json_array('topic', ${tag})
           )
    FROM notes;

    INSERT INTO metadata_tag_ancestors (path, tag_ordinal, ancestor, depth)
    SELECT ${path}, 0, 'topic', 0 FROM notes
    UNION ALL
    SELECT ${path}, 0, ${tag}, 1 FROM notes;
    COMMIT;
    BEGIN IMMEDIATE;

    INSERT INTO properties (path, ordinal, data_json)
    SELECT ${path}, 0,
           json_object(
             'path', ${path},
             'name', 'priority',
             'inferredType', 'number',
             'value', i % 5
           )
    FROM notes;

    INSERT INTO metadata_properties
      (path, ordinal, name, normalized_name, inferred_type, declared_type, data_json)
    SELECT ${path}, 0, 'priority', 'priority', 'number', NULL,
           json_object(
             'path', ${path},
             'name', 'priority',
             'inferredType', 'number',
             'value', i % 5
           )
    FROM notes;

    INSERT INTO metadata_property_values
      (path, property_ordinal, value_ordinal, property_name, property_path,
       normalized_property_path, value_type, text_value, number_value,
       boolean_value, date_value, data_json)
    SELECT ${path}, 0, 0, 'priority', 'priority', 'priority', 'number', NULL,
           i % 5, NULL, NULL, json(i % 5)
    FROM notes;
    COMMIT;
    BEGIN IMMEDIATE;

    INSERT INTO links (source_path, ordinal, data_json)
    SELECT ${path}, 0,
           json_object(
             'sourcePath', ${path},
             'targetText', ${target},
             'original', '[[' || ${target} || ']]',
             'resolvedTargetPath', ${target},
             'type', 'link',
             'count', 1,
             'ordinal', 0
           )
    FROM notes;

    INSERT INTO metadata_links
      (source_path, ordinal, normalized_target, resolved_target_path,
       resolution_state, link_type, link_kind, data_json)
    SELECT ${path}, 0, lower(${target}), ${target}, 'resolved', 'link',
           'reference',
           json_object(
             'sourcePath', ${path},
             'targetText', ${target},
             'original', '[[' || ${target} || ']]',
             'resolvedTargetPath', ${target},
             'type', 'link',
             'count', 1,
             'ordinal', 0,
             'kind', 'reference'
           )
    FROM notes;
    COMMIT;
    BEGIN IMMEDIATE;

    INSERT INTO search_docs
      (path, source_provider_id, metadata_hash, provider_version,
       projection_signature, source_mtime, source_size, name, extension,
       checksum, content, tags, metadata_text, data_json)
    SELECT ${path}, 'markdown', ${hash}, '1', 'markdown:1',
           1700000000000 + i, 256, printf('Note %06d', i), 'md', ${hash},
           printf('Warm search payload for note %06d ', i) || hex(zeroblob(64)),
           ${tag}, printf('priority %d', i % 5),
           json_object(
             'path', ${path},
             'sourceProviderId', 'markdown',
             'name', printf('Note %06d', i),
             'extension', 'md',
             'checksum', ${hash},
             'content', printf('Warm search payload for note %06d', i),
             'tags', json_array(${tag}),
             'tagParts', json_array('topic', printf('%03d', i % 128)),
             'tagHierarchy', json_array('topic', ${tag}),
             'sourceMetadata', json_object(
               'metadataHash', ${hash},
               'providerVersion', '1',
               'projectionSignature', 'markdown:1',
               'sourceMtime', 1700000000000 + i,
               'sourceSize', 256
             )
           )
    FROM notes;
    COMMIT;
    BEGIN IMMEDIATE;

    INSERT INTO history_files (file_id, data_json)
    SELECT printf('history-%06d', i),
           json_object(
             'fileId', printf('history-%06d', i),
             'currentPath', ${path},
             'deleted', json('false')
           )
    FROM notes WHERE i % 10 = 0;

    INSERT INTO history_file_paths (path, file_id)
    SELECT ${path}, printf('history-%06d', i)
    FROM notes WHERE i % 10 = 0;

    INSERT INTO history_revisions (file_id, ordinal, data_json)
    SELECT printf('history-%06d', i), 0,
           json_object(
             'revisionId', printf('revision-%06d', i),
             'fileId', printf('history-%06d', i),
             'currentPath', ${path},
             'capturedPath', ${path},
             'eventType', 'modify',
             'createdAt', 1700000000000 + i,
             'sourceMtime', 1700000000000 + i,
             'sourceSize', 256,
             'contentHash', ${hash},
             'content', printf('Durable history payload %06d ', i) || hex(zeroblob(64))
           )
    FROM notes WHERE i % 10 = 0;

    INSERT INTO app_state (id, state_json)
    VALUES (
      1,
      json_object(
        'migrationBackup', 'frozen',
        'payload', hex(zeroblob(524288))
      )
    );
    DROP TABLE notes;
    COMMIT;
    PRAGMA cache_spill = ON;
  `);

  const row = await connection.get<{
    indexed_files: number;
    metadata_rows: number;
    search_documents: number;
    history_revisions: number;
  }>(`SELECT
      (SELECT count(*) FROM files WHERE indexed = 1 AND deleted = 0) AS indexed_files,
      (SELECT count(*) FROM metadata) AS metadata_rows,
      (SELECT count(*) FROM search_docs) AS search_documents,
      (SELECT count(*) FROM history_revisions) AS history_revisions`);
  const invariants = {
    indexedFiles: Number(row?.indexed_files ?? 0),
    metadataRows: Number(row?.metadata_rows ?? 0),
    searchDocuments: Number(row?.search_documents ?? 0),
    historyRevisions: Number(row?.history_revisions ?? 0),
    markdownBodyReads: 0 as const,
    metadataHotCacheLimit: 512 as const,
    compatibilitySnapshotLoaded: false as const,
    boundedVaultReconciliationBatches: 500 as const,
  };
  if (
    invariants.indexedFiles !== noteCount ||
    invariants.metadataRows !== noteCount ||
    invariants.searchDocuments !== noteCount ||
    invariants.historyRevisions !== Math.ceil(noteCount / 10)
  ) {
    throw new Error(
      `Metadata performance fixture row-count mismatch: ${JSON.stringify(invariants)}`,
    );
  }
  return invariants;
}

function p95(samples: number[]): number {
  if (!samples.length) return 0;
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

async function timed<T>(task: () => Promise<T>): Promise<[T, number]> {
  const startedAt = performance.now();
  const value = await task();
  return [value, performance.now() - startedAt];
}

export async function runMetadataPerformanceBenchmark(
  options: BenchmarkOptions,
  invariants: MetadataPerformanceResult["invariants"],
): Promise<MetadataPerformanceResult> {
  const samples: MetadataPerformanceResult["samples"] = {
    openReadyMs: [],
    fileLookupMs: [],
    tagQueryMs: [],
    propertyQueryMs: [],
    backlinkQueryMs: [],
    heapDeltaBytes: [],
  };
  const lookupIndexes = Array.from({ length: 25 }, (_, index) =>
    Math.floor((index * Math.max(1, options.noteCount - 1)) / 24),
  );

  for (let run = 0; run < options.runs; run += 1) {
    const beforeHeap = options.heapUsed?.() ?? 0;
    const database = options.createDatabase();
    const [, openReadyMs] = await timed(async () => {
      await database.open();
      const manifest = await database.listIndexedFileManifest({ limit: 1 });
      if (manifest.rows.length !== 1)
        throw new Error("Warm metadata manifest is not queryable");
    });
    samples.openReadyMs.push(openReadyMs);
    const afterHeap = options.heapUsed?.() ?? beforeHeap;
    samples.heapDeltaBytes.push(Math.max(0, afterHeap - beforeHeap));

    for (const index of lookupIndexes) {
      const path = `Notes/${String(index).padStart(6, "0")}.md`;
      const [row, duration] = await timed(() => database.getIndexedFile(path));
      if (row?.file.path !== path)
        throw new Error(`Missing fixture metadata for ${path}`);
      samples.fileLookupMs.push(duration);
    }

    const [tags, tagQueryMs] = await timed(() =>
      database.queryMetadataFacets({ kind: "tag", limit: 256 }),
    );
    if (!tags.some((row) => row.value === "topic"))
      throw new Error("Tag facet fixture mismatch");
    samples.tagQueryMs.push(tagQueryMs);

    const [properties, propertyQueryMs] = await timed(() =>
      database.queryMetadataFacets({
        kind: "property-value",
        propertyName: "priority",
        limit: 10,
      }),
    );
    if (properties.length !== 5)
      throw new Error("Property facet fixture mismatch");
    samples.propertyQueryMs.push(propertyQueryMs);

    const [backlinks, backlinkQueryMs] = await timed(() =>
      database.queryMetadataLinks({
        direction: "incoming",
        path: "Notes/000000.md",
        resolution: "resolved",
        limit: 10,
      }),
    );
    if (backlinks.length !== 1) throw new Error("Backlink fixture mismatch");
    samples.backlinkQueryMs.push(backlinkQueryMs);
    await database.close();
  }

  const percentiles = {
    openReadyMs: p95(samples.openReadyMs),
    fileLookupMs: p95(samples.fileLookupMs),
    tagQueryMs: p95(samples.tagQueryMs),
    propertyQueryMs: p95(samples.propertyQueryMs),
    backlinkQueryMs: p95(samples.backlinkQueryMs),
    heapDeltaBytes: p95(samples.heapDeltaBytes),
  };
  return {
    kind: options.kind,
    noteCount: options.noteCount,
    runs: options.runs,
    measuredAt: new Date().toISOString(),
    samples,
    p95: percentiles,
    invariants,
    budgets: options.budgets,
    passed:
      percentiles.openReadyMs <= options.budgets.openReadyMs &&
      percentiles.fileLookupMs <= options.budgets.fileLookupMs &&
      percentiles.tagQueryMs <= options.budgets.indexedQueryMs &&
      percentiles.propertyQueryMs <= options.budgets.indexedQueryMs &&
      percentiles.backlinkQueryMs <= options.budgets.indexedQueryMs,
  };
}
