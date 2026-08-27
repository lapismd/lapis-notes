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
      await this.#request({ type: "close-all" });
    } finally {
      worker.terminate();
      this.#worker = null;
      this.#rejectPending(new Error("Desktop app database worker closed"));
    }
  }

  #request(request: AppDatabaseWorkerRequestInput): Promise<unknown> {
    const worker = this.#ensureWorker();
    const id = ++this.#requestId;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      try {
        worker.postMessage({ ...request, id } as AppDatabaseWorkerRequest);
      } catch (error) {
        this.#pending.delete(id);
        reject(error);
      }
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
    worker.onmessage = (event) => this.#handleWorkerMessage(event.data);
    worker.onerror = (event) => {
      worker.terminate();
      this.#worker = null;
      this.#rejectPending(
        new Error(event.message || "Desktop app database worker failed"),
      );
    };
    worker.onmessageerror = () => {
      worker.terminate();
      this.#worker = null;
      this.#rejectPending(
        new Error("Desktop app database worker returned an invalid message"),
      );
    };
    this.#worker = worker;
    return worker;
  }

  #handleWorkerMessage(response: AppDatabaseWorkerResponse): void {
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
