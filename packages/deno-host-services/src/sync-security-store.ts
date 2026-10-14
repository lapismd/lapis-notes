import { connect } from "@tursodatabase/database";
import type {
  HostMetadataStore,
  AppDatabaseMetaTransaction,
  AppDatabaseMetaTransactionResult,
} from "@lapis-notes/api/metadata-store";

type Row = Record<string, unknown>;
interface Connection {
  exec(sql: string): Promise<void>;
  run(sql: string, ...args: unknown[]): Promise<unknown>;
  get<T extends Row>(sql: string, ...args: unknown[]): Promise<T | undefined>;
  all<T extends Row>(sql: string, ...args: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}
const PREFIX = "sync-host:v1:security:";
const MAX_BYTES = 4 * 1024 * 1024;

function checkedKey(key: string): string {
  if (
    typeof key !== "string" ||
    !key.startsWith(PREFIX) ||
    key.length <= PREFIX.length ||
    key.length > 1024 ||
    /[\u0000-\u001f]/u.test(key)
  )
    throw new Error("Invalid Sync security key");
  return key;
}

function encode(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error("Sync security value must be JSON");
  if (new TextEncoder().encode(json).byteLength > MAX_BYTES)
    throw new Error("Sync security value exceeds size limit");
  return json;
}

async function initialize(connection: Connection): Promise<void> {
  await connection.exec(
    "PRAGMA synchronous = FULL; PRAGMA busy_timeout = 1000; BEGIN IMMEDIATE",
  );
  try {
    const version = Number(
      (await connection.get<Row>("PRAGMA user_version"))?.user_version,
    );
    const objects = await connection.all<Row>(
      "SELECT type,name FROM sqlite_master WHERE name NOT GLOB 'sqlite_*'",
    );
    if (version === 0 && objects.length === 0) {
      await connection.exec(`CREATE TABLE sync_security_meta (
        namespace TEXT NOT NULL,
        key TEXT NOT NULL,
        value_json TEXT NOT NULL,
        PRIMARY KEY(namespace, key)
      ); PRAGMA user_version = 1`);
    } else if (
      version !== 1 ||
      objects.length !== 1 ||
      objects[0].type !== "table" ||
      objects[0].name !== "sync_security_meta"
    ) {
      throw new Error(
        "Sync security requires a dedicated supported database schema",
      );
    }
    const columns = await connection.all<Row>(
      "PRAGMA table_info(sync_security_meta)",
    );
    const signature = columns.map((c) => [
      c.name,
      c.type,
      Number(c.notnull),
      Number(c.pk) > 0 ? 1 : 0,
    ]);
    if (
      JSON.stringify(signature) !==
      JSON.stringify([
        ["namespace", "TEXT", 1, 1],
        ["key", "TEXT", 1, 1],
        ["value_json", "TEXT", 1, 0],
      ])
    )
      throw new Error("Unsupported Sync security database schema");
    await connection.exec("COMMIT");
  } catch (error) {
    await connection.exec("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

/** Host-owned metadata; SyncHostSecurityService wraps private key material before writes. */
export class NativeSyncSecurityStore implements HostMetadataStore {
  #tail: Promise<void> = Promise.resolve();
  #close: Promise<void> | undefined;
  private constructor(
    private readonly connection: Connection,
    private readonly namespace: string,
  ) {}

  static async open(
    path: string,
    namespace: string,
  ): Promise<NativeSyncSecurityStore> {
    if (
      typeof namespace !== "string" ||
      !namespace ||
      namespace.length > 512 ||
      /[\u0000-\u001f]/u.test(namespace)
    )
      throw new Error("Invalid Sync security namespace");
    const connection = (await connect(path)) as Connection;
    try {
      await initialize(connection);
      return new NativeSyncSecurityStore(connection, namespace);
    } catch (error) {
      await connection.close();
      throw error;
    }
  }

  #enqueue<T>(action: () => Promise<T>): Promise<T> {
    if (this.#close)
      return Promise.reject(new Error("Sync security store is closed"));
    const result = this.#tail.then(action);
    this.#tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async #read(key: string): Promise<{ exists: boolean; value?: unknown }> {
    const row = await this.connection.get<Row>(
      "SELECT CASE WHEN length(CAST(value_json AS BLOB)) <= ? THEN value_json END AS value_json FROM sync_security_meta WHERE namespace = ? AND key = ?",
      MAX_BYTES,
      this.namespace,
      key,
    );
    if (!row) return { exists: false };
    if (typeof row.value_json !== "string")
      throw new Error("Corrupt or oversized Sync security record");
    try {
      return { exists: true, value: JSON.parse(row.value_json) };
    } catch {
      throw new Error("Corrupt Sync security JSON record");
    }
  }

  async getMeta<T = unknown>(key: string): Promise<T | undefined> {
    checkedKey(key);
    return this.#enqueue(
      async () => (await this.#read(key)).value as T | undefined,
    );
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    await this.transactMeta({ mutations: [{ key, value }] });
  }

  async transactMeta(
    transaction: AppDatabaseMetaTransaction,
  ): Promise<AppDatabaseMetaTransactionResult> {
    const checks = (transaction.checks ?? []).map((check) => ({
      key: checkedKey(check.key),
      exists: check.exists,
      hasValue: "value" in check,
      value: check.value === undefined ? undefined : encode(check.value),
    }));
    const mutations = transaction.mutations.map((mutation) => ({
      key: checkedKey(mutation.key),
      value:
        mutation.delete || mutation.value === undefined
          ? undefined
          : encode(mutation.value),
    }));
    return this.#enqueue(async () => {
      await this.connection.exec("BEGIN IMMEDIATE");
      try {
        for (const check of checks) {
          const current = await this.#read(check.key);
          if (
            (check.exists !== undefined && current.exists !== check.exists) ||
            (check.hasValue && JSON.stringify(current.value) !== check.value)
          ) {
            await this.connection.exec("ROLLBACK");
            return { applied: false };
          }
        }
        for (const mutation of mutations) {
          if (mutation.value === undefined) {
            await this.connection.run(
              "DELETE FROM sync_security_meta WHERE namespace = ? AND key = ?",
              this.namespace,
              mutation.key,
            );
          } else {
            await this.connection.run(
              "INSERT INTO sync_security_meta(namespace,key,value_json) VALUES(?,?,?) ON CONFLICT(namespace,key) DO UPDATE SET value_json = excluded.value_json",
              this.namespace,
              mutation.key,
              mutation.value,
            );
          }
        }
        await this.connection.exec("COMMIT");
        return { applied: true };
      } catch (error) {
        await this.connection.exec("ROLLBACK").catch(() => undefined);
        throw error;
      }
    });
  }

  close(): Promise<void> {
    this.#close ??= this.#tail.then(() => this.connection.close());
    return this.#close;
  }
}
