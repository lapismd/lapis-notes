import { join } from "jsr:@std/path@1/join";
import { connect } from "@tursodatabase/database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../../api/src/lib/storage/turso-app-database.ts";
import type {
  AppDatabase,
  AppDatabaseDescriptor,
} from "../../api/src/lib/storage/app-database.ts";
import {
  isDesktopAppDatabaseMethod,
  type DesktopAppDatabaseMethod,
} from "../src/desktop-app-database-protocol.ts";

type RendererEventEmitter = (event: {
  channel: string;
  payload: unknown;
}) => Promise<void>;

type DesktopAppDatabaseSession = {
  database: AppDatabase;
  unsubscribe: () => void;
};

function stableVaultHash(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stringPayload(
  payload: Record<string, unknown>,
  field: string,
): string {
  const value = payload[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Desktop app database payload missing ${field}`);
  }
  return value;
}

async function databasePath(
  userDataDir: string,
  vaultId: string,
): Promise<string> {
  const directory = join(userDataDir, "databases");
  await Deno.mkdir(directory, { recursive: true });
  return join(directory, `lapis-app-${stableVaultHash(vaultId)}.turso`);
}

export class DenoAppDatabaseHost {
  private readonly sessions = new Map<string, DesktopAppDatabaseSession>();

  constructor(
    private readonly userDataDir: string,
    private readonly emitRendererEvent: RendererEventEmitter,
  ) {}

  async open(payload: Record<string, unknown>): Promise<AppDatabaseDescriptor> {
    const databaseId = stringPayload(payload, "databaseId");
    const vaultId = stringPayload(payload, "vaultId");
    const existing = this.sessions.get(databaseId);
    if (existing) return existing.database.descriptor;

    const path = await databasePath(this.userDataDir, vaultId);
    const database = new TursoAppDatabase(vaultId, {
      kind: "turso-native",
      providerId: "turso-native-desktop",
      transport: "native",
      role: "direct",
      connectionFactory: async () =>
        (await connect(path, {
          experimental: ["index_method"],
        })) as TursoConnection,
    });
    await database.open();
    const unsubscribe = database.subscribeToChanges((change) => {
      void this.emitRendererEvent({
        channel: "desktop_app_database_change",
        payload: { databaseId, vaultId, change },
      });
    });
    this.sessions.set(databaseId, { database, unsubscribe });
    return database.descriptor;
  }

  async close(payload: Record<string, unknown>): Promise<void> {
    const databaseId = stringPayload(payload, "databaseId");
    const session = this.sessions.get(databaseId);
    if (!session) return;
    this.sessions.delete(databaseId);
    session.unsubscribe();
    await session.database.close();
  }

  async invoke(payload: Record<string, unknown>): Promise<unknown> {
    const databaseId = stringPayload(payload, "databaseId");
    const method = payload.method;
    if (!isDesktopAppDatabaseMethod(method)) {
      throw new Error(`Unsupported desktop app database method: ${String(method)}`);
    }
    const args = payload.args;
    if (!Array.isArray(args) || args.length > 4) {
      throw new Error("Invalid desktop app database arguments");
    }
    const session = this.sessions.get(databaseId);
    if (!session) {
      throw new Error("Desktop app database is not open");
    }
    return await (
      session.database[method as DesktopAppDatabaseMethod] as (
        ...args: unknown[]
      ) => Promise<unknown>
    )(...args);
  }

  async closeAll(): Promise<void> {
    const ids = [...this.sessions.keys()];
    await Promise.all(ids.map((databaseId) => this.close({ databaseId })));
  }
}
