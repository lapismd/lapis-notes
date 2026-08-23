import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { connect } from "@tursodatabase/database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../src/lib/storage/turso-app-database";
import {
  runMetadataPerformanceBenchmark,
  seedMetadataPerformanceFixture,
} from "./metadata-performance-fixture";

function integerArgument(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function stringArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

const noteCount = integerArgument("--notes", 50_000);
const runs = integerArgument("--runs", noteCount >= 100_000 ? 1 : 5);
const enforce = !process.argv.includes("--no-enforce");
const seedOnly = process.argv.includes("--seed-only");
const requestedDatabasePath = stringArgument("--database-path");
const directory = requestedDatabasePath
  ? undefined
  : await mkdtemp(join(tmpdir(), "lapis-metadata-performance-"));
const databasePath =
  requestedDatabasePath ?? join(directory!, "metadata.turso");
await mkdir(dirname(databasePath), { recursive: true });
const createConnection = async () =>
  (await connect(databasePath, {
    experimental: ["index_method"],
  })) as TursoConnection;

try {
  const initial = new TursoAppDatabase("metadata-performance-native", {
    kind: "turso-native",
    transport: "native",
    connectionFactory: createConnection,
  });
  await initial.open();
  await initial.close();

  const seedConnection = await createConnection();
  const invariants = await seedMetadataPerformanceFixture(
    seedConnection,
    noteCount,
  );
  if (seedOnly) {
    // Native Turso's FTS index module is intentionally unavailable in the
    // WASM build. The portable fixture retains Search rows but lets the WASM
    // database probe and report its own capabilities when it opens.
    await seedConnection.run("DROP INDEX IF EXISTS search_docs_fts");
  }
  await seedConnection.run("PRAGMA wal_checkpoint(TRUNCATE)");
  await seedConnection.close();

  if (seedOnly) {
    process.stdout.write(`${JSON.stringify(invariants)}\n`);
    process.exitCode = 0;
  } else {
    const result = await runMetadataPerformanceBenchmark(
      {
        kind: "turso-native",
        noteCount,
        runs,
        budgets: {
          openReadyMs: 1_000,
          fileLookupMs: 25,
          indexedQueryMs: 200,
        },
        createDatabase: () =>
          new TursoAppDatabase("metadata-performance-native", {
            kind: "turso-native",
            transport: "native",
            connectionFactory: createConnection,
          }),
        heapUsed: () => process.memoryUsage().heapUsed,
      },
      invariants,
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (enforce && !result.passed) process.exitCode = 1;
  }
} finally {
  if (directory) await rm(directory, { recursive: true, force: true });
}
