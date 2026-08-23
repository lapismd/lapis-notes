import {
  createTursoWasmConnection,
  tursoWasmDatabasePath,
  TursoAppDatabase,
} from "../src/lib/storage/turso-app-database";
import {
  runMetadataPerformanceBenchmark,
  type MetadataPerformanceResult,
} from "../scripts/metadata-performance-fixture";

declare global {
  interface Window {
    runMetadataPerformance(input: {
      noteCount: number;
      runs: number;
      fixtureUrl: string;
    }): Promise<MetadataPerformanceResult>;
  }

  interface Performance {
    memory?: { usedJSHeapSize: number };
  }
}

window.runMetadataPerformance = async ({ noteCount, runs, fixtureUrl }) => {
  const vaultId = `metadata-performance-${noteCount}-${crypto.randomUUID()}`;
  const databasePath = tursoWasmDatabasePath(vaultId);
  const response = await fetch(fixtureUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Unable to load metadata fixture: ${response.status}`);
  }
  const opfsRoot = await navigator.storage.getDirectory();
  const fileHandle = await opfsRoot.getFileHandle(databasePath, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await response.body.pipeTo(writable);

  const createConnection = () => createTursoWasmConnection(databasePath);
  const verification = await createConnection();
  const counts = await verification.get<{
    indexed_files: number;
    metadata_rows: number;
    search_documents: number;
    history_revisions: number;
  }>(`SELECT
      (SELECT count(*) FROM files WHERE indexed = 1 AND deleted = 0) AS indexed_files,
      (SELECT count(*) FROM metadata) AS metadata_rows,
      (SELECT count(*) FROM search_docs) AS search_documents,
      (SELECT count(*) FROM history_revisions) AS history_revisions`);
  await verification.close();
  const invariants = {
    indexedFiles: Number(counts?.indexed_files ?? 0),
    metadataRows: Number(counts?.metadata_rows ?? 0),
    searchDocuments: Number(counts?.search_documents ?? 0),
    historyRevisions: Number(counts?.history_revisions ?? 0),
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
      `WASM fixture row-count mismatch: ${JSON.stringify(invariants)}`,
    );
  }

  return runMetadataPerformanceBenchmark(
    {
      kind: "turso-wasm",
      noteCount,
      runs,
      budgets: {
        openReadyMs: 2_500,
        fileLookupMs: 75,
        indexedQueryMs: 500,
      },
      createDatabase: () =>
        new TursoAppDatabase(vaultId, {
          kind: "turso-wasm",
          transport: "wasm-worker",
          connectionFactory: createConnection,
        }),
      heapUsed: () => performance.memory?.usedJSHeapSize ?? 0,
    },
    invariants,
  );
};

document.querySelector("main")!.textContent =
  "Turso WASM performance runner ready";
