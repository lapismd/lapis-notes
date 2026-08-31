import {
  REMOTE_APP_DATABASE_CONTRACT,
  isRemoteAppDatabaseMethod,
  parseRemoteAppDatabaseArgs,
  parseRemoteAppDatabaseResult,
  type RemoteAppDatabaseMethod,
} from "@lapis-notes/api/app-database";
import { ServerHostError } from "@lapis-notes/api/server-host";

import { ServerDatabaseWorkerClient } from "./database-worker-client.ts";
import { VaultEventHub } from "./events.ts";
import { managedVaultPaths } from "./managed-vaults.ts";

type VaultRuntime = {
  lastUsedAt: number;
};

export class VaultRuntimeManager {
  readonly #runtimes = new Map<string, VaultRuntime>();
  readonly #opening = new Map<string, Promise<VaultRuntime>>();
  readonly #worker: ServerDatabaseWorkerClient;

  constructor(
    private readonly dataRoot: string,
    private readonly events: VaultEventHub,
    private readonly idleMs = 10 * 60 * 1_000,
  ) {
    this.#worker = new ServerDatabaseWorkerClient((vaultId, change) => {
      this.events.publish(vaultId, "database", change);
    });
  }

  async invoke(
    vaultId: string,
    methodValue: string,
    argsValue: unknown,
  ): Promise<unknown> {
    if (!isRemoteAppDatabaseMethod(methodValue)) {
      throw new ServerHostError("NOT_FOUND", "Unsupported AppDatabase method");
    }
    const method = methodValue as RemoteAppDatabaseMethod;
    const args = parseRemoteAppDatabaseArgs(method, argsValue);
    const runtime = await this.#open(vaultId);
    runtime.lastUsedAt = Date.now();
    const value = await this.#worker.invoke(vaultId, method, args as unknown[]);
    return parseRemoteAppDatabaseResult(method, value);
  }

  domain(method: RemoteAppDatabaseMethod): string {
    return REMOTE_APP_DATABASE_CONTRACT[method].domain;
  }

  async closeIdle(now = Date.now()): Promise<void> {
    for (const [vaultId, runtime] of this.#runtimes) {
      if (runtime.lastUsedAt + this.idleMs <= now) await this.close(vaultId);
    }
  }

  async close(vaultId: string): Promise<void> {
    await this.#opening.get(vaultId)?.catch(() => undefined);
    if (!this.#runtimes.delete(vaultId)) return;
    await this.#worker.close(vaultId);
  }

  async closeAll(): Promise<void> {
    this.#runtimes.clear();
    await this.#worker.closeAll();
  }

  async #open(vaultId: string): Promise<VaultRuntime> {
    const existing = this.#runtimes.get(vaultId);
    if (existing) return existing;
    const pending = this.#opening.get(vaultId);
    if (pending) return pending;
    const opening = this.#create(vaultId);
    this.#opening.set(vaultId, opening);
    try {
      const runtime = await opening;
      this.#runtimes.set(vaultId, runtime);
      return runtime;
    } finally {
      this.#opening.delete(vaultId);
    }
  }

  async #create(vaultId: string): Promise<VaultRuntime> {
    const paths = managedVaultPaths(this.dataRoot, vaultId);
    await this.#worker.open(vaultId, vaultId, paths.database);
    return { lastUsedAt: Date.now() };
  }
}
