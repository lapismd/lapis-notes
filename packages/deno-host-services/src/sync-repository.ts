import { connect } from "@tursodatabase/database";
import type {
  SealedSyncState,
  SealedSyncRecord,
  SyncIndexedRepository,
} from "@lapis-notes/api/sync-repository";

type Row = Record<string, unknown>;
interface Connection {
  exec(sql: string): Promise<void>;
  run(sql: string, ...args: unknown[]): Promise<unknown>;
  get<T extends Row>(sql: string, ...args: unknown[]): Promise<T | undefined>;
  close(): Promise<void>;
}

const SCHEMA = `
PRAGMA synchronous = FULL;
PRAGMA busy_timeout = 1000;
CREATE TABLE IF NOT EXISTS sync_repository_objects (
  namespace TEXT NOT NULL,
  hash TEXT NOT NULL,
  ciphertext BLOB NOT NULL,
  PRIMARY KEY(namespace, hash)
);
CREATE TABLE IF NOT EXISTS sync_repository_state (
  namespace TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  epoch INTEGER NOT NULL,
  ciphertext BLOB NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_repository_records (
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  epoch INTEGER NOT NULL,
  ciphertext BLOB NOT NULL,
  PRIMARY KEY(namespace, key)
);
`;
const MAX_BYTES = 64 * 1024 * 1024;

function checkedHash(hash: string): string {
  if (!/^[0-9a-f]{64}$/u.test(hash))
    throw new Error("Invalid sync ciphertext hash");
  return hash;
}

async function ciphertextHash(bytes: Uint8Array): Promise<string> {
  if (bytes.byteLength > MAX_BYTES)
    throw new Error("Sync object exceeds storage limit");
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", bytes.slice()),
  );
  return Array.from(digest, (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

function rowBytes(value: unknown): Uint8Array {
  if (!(value instanceof Uint8Array))
    throw new Error("Invalid stored sync ciphertext");
  return Uint8Array.from(value);
}

/** Shared desktop/server kernel. Callers supply a dedicated sync database path. */
export class NativeSyncRepository implements SyncIndexedRepository {
  private closed = false;
  private constructor(
    private readonly connection: Connection,
    private readonly namespace: string,
  ) {}

  static async open(
    path: string,
    namespace: string,
  ): Promise<NativeSyncRepository> {
    if (!namespace || namespace.length > 512)
      throw new Error("Invalid sync repository namespace");
    const connection = (await connect(path)) as Connection;
    try {
      await connection.exec(SCHEMA);
      return new NativeSyncRepository(connection, namespace);
    } catch (error) {
      await connection.close();
      throw error;
    }
  }

  readonly blobs = {
    has: async (hash: string): Promise<boolean> => {
      this.assertOpen();
      const row = await this.connection.get<Row>(
        "SELECT 1 AS present FROM sync_repository_objects WHERE namespace = ? AND hash = ?",
        this.namespace,
        checkedHash(hash),
      );
      return row !== undefined;
    },
    put: async (input: Uint8Array): Promise<{ hash: string; size: number }> => {
      this.assertOpen();
      const bytes = Uint8Array.from(input),
        hash = await ciphertextHash(bytes);
      await this.connection.run(
        "INSERT INTO sync_repository_objects(namespace, hash, ciphertext) VALUES (?, ?, ?) ON CONFLICT(namespace, hash) DO NOTHING",
        this.namespace,
        hash,
        bytes,
      );
      const stored = await this.blobs.get(hash);
      if (stored.byteLength !== bytes.byteLength)
        throw new Error("Stored ciphertext integrity mismatch");
      return { hash, size: bytes.byteLength };
    },
    get: async (hash: string): Promise<Uint8Array> => {
      this.assertOpen();
      const row = await this.connection.get<Row>(
        "SELECT ciphertext FROM sync_repository_objects WHERE namespace = ? AND hash = ?",
        this.namespace,
        checkedHash(hash),
      );
      if (!row) throw new Error("Missing sync object");
      const bytes = rowBytes(row.ciphertext);
      if ((await ciphertextHash(bytes)) !== hash)
        throw new Error("Corrupt sync object ciphertext hash");
      return bytes;
    },
  };

  readonly records = {
    get: async (key: string): Promise<SealedSyncRecord | null> => {
      this.assertOpen();
      const row = await this.connection.get<Row>(
        "SELECT epoch, ciphertext FROM sync_repository_records WHERE namespace = ? AND key = ?",
        this.namespace,
        checkedHash(key),
      );
      if (!row) return null;
      const record = {
        epoch: Number(row.epoch),
        ciphertext: rowBytes(row.ciphertext),
      };
      this.assertRecord(record);
      return record;
    },
    putIfAbsent: async (
      key: string,
      record: SealedSyncRecord,
    ): Promise<boolean> => {
      this.assertOpen();
      checkedHash(key);
      this.assertRecord(record);
      const epoch = record.epoch,
        bytes = Uint8Array.from(record.ciphertext);
      const row = await this.connection.get<Row>(
        "INSERT INTO sync_repository_records(namespace, key, epoch, ciphertext) VALUES (?, ?, ?, ?) ON CONFLICT(namespace, key) DO NOTHING RETURNING key",
        this.namespace,
        key,
        epoch,
        bytes,
      );
      return row !== undefined;
    },
  };

  private assertRecord(record: SealedSyncRecord): void {
    if (
      !record ||
      !Number.isSafeInteger(record.epoch) ||
      record.epoch < 1 ||
      !(record.ciphertext instanceof Uint8Array) ||
      record.ciphertext.byteLength > MAX_BYTES
    )
      throw new Error("Invalid sealed sync record");
  }

  async readState(): Promise<SealedSyncState | null> {
    this.assertOpen();
    const row = await this.connection.get<Row>(
      "SELECT version, epoch, ciphertext FROM sync_repository_state WHERE namespace = ?",
      this.namespace,
    );
    if (!row) return null;
    return {
      version: Number(row.version),
      epoch: Number(row.epoch),
      ciphertext: rowBytes(row.ciphertext),
    };
  }

  async compareAndSwap(
    expectedVersion: number,
    next: SealedSyncState,
  ): Promise<boolean> {
    this.assertOpen();
    if (
      !Number.isSafeInteger(expectedVersion) ||
      expectedVersion < 0 ||
      !Number.isSafeInteger(next.version) ||
      next.version !== expectedVersion + 1 ||
      !Number.isSafeInteger(next.epoch) ||
      next.epoch < 1 ||
      next.ciphertext.byteLength > MAX_BYTES
    )
      throw new Error("Invalid sealed sync state update");
    const bytes = Uint8Array.from(next.ciphertext);
    const row =
      expectedVersion === 0
        ? await this.connection.get<Row>(
            "INSERT INTO sync_repository_state(namespace, version, epoch, ciphertext) VALUES (?, ?, ?, ?) ON CONFLICT(namespace) DO NOTHING RETURNING version",
            this.namespace,
            next.version,
            next.epoch,
            bytes,
          )
        : await this.connection.get<Row>(
            "UPDATE sync_repository_state SET version = ?, epoch = ?, ciphertext = ? WHERE namespace = ? AND version = ? RETURNING version",
            next.version,
            next.epoch,
            bytes,
            this.namespace,
            expectedVersion,
          );
    return row !== undefined;
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.connection.close();
  }
  private assertOpen() {
    if (this.closed) throw new Error("Sync repository is closed");
  }
}
