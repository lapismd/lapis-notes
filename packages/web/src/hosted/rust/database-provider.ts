import {
  REMOTE_APP_DATABASE_METHODS,
  REMOTE_APP_DATABASE_MAX_MESSAGE_BYTES,
  parseRemoteAppDatabaseArgs,
  parseRemoteAppDatabaseResult,
  type AppDatabase,
  type AppDatabaseChangeListener,
  type AppDatabaseProvider,
  type RemoteAppDatabaseMethod,
} from "@lapis-notes/api/app-database";
import type {
  DatabaseCall,
  DatabaseValue,
} from "../../../../../crates/lapis-app-protocol/bindings/protocol";
import type { RustVaultClient } from "./vault-client";

export class RustDatabaseProvider implements AppDatabaseProvider {
  readonly id = "lapis-rust-http";
  constructor(readonly client: RustVaultClient) {}
  canOpen(context: {
    runtime: string;
    vaultId: string;
    role?: string;
  }): boolean {
    return (
      context.runtime === "rust-server" &&
      context.role === "direct" &&
      context.vaultId === this.client.descriptor.vault_id
    );
  }
  async open(
    context: Parameters<AppDatabaseProvider["open"]>[0],
  ): Promise<AppDatabase> {
    if (!this.canOpen(context))
      throw new Error("The hosted database requires its owning Rust admission");
    this.client.requireOpen();
    let closed = false;
    let queue = Promise.resolve();
    const listeners = new Set<AppDatabaseChangeListener>();
    let observer: ReturnType<typeof setTimeout> | undefined;
    let revision: number | undefined;
    let observation = 0;
    const invoke = (method: RemoteAppDatabaseMethod, args: unknown[]) => {
      if (closed)
        return Promise.reject(new Error("The hosted database is closed"));
      let call: DatabaseCall;
      try {
        const encoded = JSON.stringify({
          method,
          args: parseRemoteAppDatabaseArgs(method, args).map((value) =>
            value === undefined
              ? { kind: "undefined" }
              : { kind: "value", value },
          ),
        });
        if (
          new TextEncoder().encode(encoded).byteLength >
          REMOTE_APP_DATABASE_MAX_MESSAGE_BYTES
        )
          throw new Error("Hosted database request exceeds the message limit");
        call = JSON.parse(encoded);
      } catch (error) {
        return Promise.reject(error);
      }
      const result = queue.then(async () => {
        this.client.requireOpen();
        const reply = await this.client.host.json<DatabaseValue>(
          `${this.client.path}/database`,
          "POST",
          call,
        );
        if (
          !reply ||
          (reply.kind !== "value" && reply.kind !== "undefined") ||
          (reply.kind === "value" && !Object.hasOwn(reply, "value"))
        )
          throw new Error("Invalid hosted database response");
        return parseRemoteAppDatabaseResult(
          method,
          reply.kind === "value" ? reply.value : undefined,
        );
      });
      queue = result.then(
        () => {},
        () => {},
      );
      return result;
    };
    // View-only observation during staged HTTP adoption. Native services own
    // work and writers; R7 replaces this revision polling with its SSE stream.
    const observe = async (generation: number) => {
      try {
        const current = await invoke("getChangeRevision", []);
        if (typeof current !== "number")
          throw new Error("Invalid database revision");
        if (!closed && generation === observation && current !== revision) {
          revision = current;
          for (const listener of [...listeners]) {
            try {
              listener({
                revision: current,
                domains: [],
                paths: [],
                reset: true,
                committedAt: Date.now(),
              });
            } catch (error) {
              console.error("Hosted database listener failed", error);
            }
          }
        }
      } catch (error) {
        if (!closed && generation === observation)
          console.error("Hosted database observation failed", error);
      } finally {
        if (!closed && generation === observation && listeners.size)
          observer = setTimeout(() => void observe(generation), 1000);
      }
    };
    const database: Record<string, unknown> = {
      kind: "turso-native",
      vaultId: context.vaultId,
      descriptor: {
        providerId: this.id,
        engine: "turso",
        transport: "http-rpc",
        role: "direct",
        storageMode: "remote",
        capabilities: {
          nativeFullTextSearch: true,
          vectorSearch: true,
          approximateNearestNeighbors: false,
          localEmbeddings: true,
          crossTabCoordination: false,
          sync: true,
        },
      },
      async open() {
        if (closed) throw new Error("The hosted database is closed");
      },
      async close() {
        closed = true;
        observation++;
        clearTimeout(observer);
        listeners.clear();
        await queue;
      },
      subscribeToChanges(listener: AppDatabaseChangeListener) {
        if (closed) throw new Error("The hosted database is closed");
        listeners.add(listener);
        if (listeners.size === 1) void observe(++observation);
        return () => {
          listeners.delete(listener);
          if (!listeners.size) {
            observation++;
            clearTimeout(observer);
          }
        };
      },
    };
    for (const method of REMOTE_APP_DATABASE_METHODS)
      database[method] = (...args: unknown[]) => invoke(method, args);
    return database as unknown as AppDatabase;
  }
}
