import { join } from "node:path";
import type { AppDatabaseDescriptor } from "../../api/src/lib/storage/app-database.ts";
import { isDesktopAppDatabaseMethod } from "../src/desktop-app-database-protocol.ts";
import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerRequestInput,
  AppDatabaseWorkerResponse,
} from "./app-database-worker-protocol.ts";
import {
  deserializeAppDatabaseWorkerError,
  nativeDatabaseDescriptor,
} from "./app-database-worker-protocol.ts";

type RendererEventEmitter = (event: {
  channel: string;
  payload: unknown;
}) => Promise<void>;

type AppDatabaseWorkerLike = {
  onmessage: ((event: MessageEvent<AppDatabaseWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: AppDatabaseWorkerRequest): void;
  terminate(): void;
};

type PendingWorkerRequest = {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

type DenoAppDatabaseHostOptions = {
  createWorker?: () => AppDatabaseWorkerLike;
  workerReadyTimeoutMs?: number;
  resolveDatabasePath?: (
    userDataDir: string,
    vaultId: string,
  ) => Promise<string>;
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
  readonly #pending = new Map<number, PendingWorkerRequest>();
  #worker: AppDatabaseWorkerLike | null = null;
  #requestId = 0;
  #workerReady = false;
  #readyTimer: ReturnType<typeof setTimeout> | undefined;
  readonly #queued = new Map<number, AppDatabaseWorkerRequest>();

  constructor(
    private readonly userDataDir: string,
    private readonly emitRendererEvent: RendererEventEmitter,
    private readonly options: DenoAppDatabaseHostOptions = {},
  ) {}

  async open(payload: Record<string, unknown>): Promise<AppDatabaseDescriptor> {
    const databaseId = stringPayload(payload, "databaseId");
    const vaultId = stringPayload(payload, "vaultId");
    const path = await (this.options.resolveDatabasePath ?? databasePath)(
      this.userDataDir,
      vaultId,
    );
    return nativeDatabaseDescriptor(
      await this.#request({ type: "open", databaseId, vaultId, path }),
    );
  }

  async close(payload: Record<string, unknown>): Promise<void> {
    const databaseId = stringPayload(payload, "databaseId");
    await this.#request({ type: "close", databaseId });
  }

  async invoke(payload: Record<string, unknown>): Promise<unknown> {
    const databaseId = stringPayload(payload, "databaseId");
    const method = payload.method;
    if (!isDesktopAppDatabaseMethod(method)) {
      throw new Error(
        `Unsupported desktop app database method: ${String(method)}`,
      );
    }
    const args = payload.args;
    if (!Array.isArray(args) || args.length > 4) {
      throw new Error("Invalid desktop app database arguments");
    }
    return this.#request({
      type: "invoke",
      databaseId,
      method,
      args,
    });
  }

  async closeAll(): Promise<void> {
    const worker = this.#worker;
    if (!worker) return;
    try {
      if (this.#workerReady) await this.#request({ type: "close-all" });
    } finally {
      this.#stopWorker(worker, new Error("Desktop app database worker closed"));
    }
  }

  #request(request: AppDatabaseWorkerRequestInput): Promise<unknown> {
    const worker = this.#ensureWorker();
    const id = ++this.#requestId;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      const message = { ...request, id } as AppDatabaseWorkerRequest;
      if (this.#workerReady) this.#send(worker, message);
      else this.#queued.set(id, message);
    });
  }

  #ensureWorker(): AppDatabaseWorkerLike {
    if (this.#worker) return this.#worker;
    const worker =
      this.options.createWorker?.() ??
      new Worker(new URL("./app-database-worker.ts", import.meta.url).href, {
        type: "module",
        name: "lapis-app-database",
      });
    this.#worker = worker;
    this.#workerReady = false;
    worker.onmessage = (event) => {
      if (this.#worker === worker) this.#handleWorkerMessage(event.data);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      this.#stopWorker(
        worker,
        new Error(event.message || "Desktop app database worker failed"),
      );
    };
    worker.onmessageerror = () => {
      this.#stopWorker(
        worker,
        new Error("Desktop app database worker returned an invalid message"),
      );
    };
    this.#readyTimer = setTimeout(() => {
      this.#stopWorker(
        worker,
        new Error("Desktop app database worker did not become ready"),
      );
    }, this.options.workerReadyTimeoutMs ?? 30_000);
    return worker;
  }

  #send(
    worker: AppDatabaseWorkerLike,
    request: AppDatabaseWorkerRequest,
  ): void {
    try {
      worker.postMessage(request);
    } catch (error) {
      const pending = this.#pending.get(request.id);
      this.#pending.delete(request.id);
      pending?.reject(error);
    }
  }

  #stopWorker(worker: AppDatabaseWorkerLike, error: Error): void {
    if (this.#worker !== worker) return;
    clearTimeout(this.#readyTimer);
    this.#readyTimer = undefined;
    this.#workerReady = false;
    this.#worker = null;
    this.#queued.clear();
    worker.terminate();
    this.#rejectPending(error);
  }

  #handleWorkerMessage(response: AppDatabaseWorkerResponse): void {
    if (response.type === "ready") {
      if (this.#workerReady || !this.#worker) return;
      clearTimeout(this.#readyTimer);
      this.#readyTimer = undefined;
      this.#workerReady = true;
      for (const request of this.#queued.values())
        this.#send(this.#worker, request);
      this.#queued.clear();
      return;
    }
    if (response.type === "change") {
      void this.emitRendererEvent({
        channel: "desktop_app_database_change",
        payload: {
          databaseId: response.databaseId,
          vaultId: response.vaultId,
          change: response.change,
        },
      });
      return;
    }
    const pending = this.#pending.get(response.id);
    if (!pending) return;
    this.#pending.delete(response.id);
    if (response.ok) pending.resolve(response.value);
    else pending.reject(deserializeAppDatabaseWorkerError(response.error));
  }

  #rejectPending(error: Error): void {
    for (const pending of this.#pending.values()) pending.reject(error);
    this.#pending.clear();
  }
}
