import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerRequestInput,
  AppDatabaseWorkerResponse,
} from "@lapis-notes/deno-host-services/app-database-worker-protocol";
import { deserializeAppDatabaseWorkerError } from "@lapis-notes/deno-host-services/app-database-worker-protocol";

type WorkerLike = {
  onmessage: ((event: MessageEvent<AppDatabaseWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: AppDatabaseWorkerRequest): void;
  terminate(): void;
};

type Pending = {
  resolve(value: unknown): void;
  reject(error: unknown): void;
};

export class ServerDatabaseWorkerClient {
  readonly #pending = new Map<number, Pending>();
  #worker: WorkerLike | undefined;
  #requestId = 0;

  constructor(
    private readonly onChange: (
      vaultId: string,
      change: Extract<AppDatabaseWorkerResponse, { type: "change" }>["change"],
    ) => void,
    private readonly createWorker: () => WorkerLike = () =>
      new Worker(new URL("./database-worker.ts", import.meta.url).href, {
        type: "module",
        name: "lapis-server-app-database",
      }),
  ) {}

  open(databaseId: string, vaultId: string, path: string): Promise<unknown> {
    return this.#request({ type: "open", databaseId, vaultId, path });
  }

  invoke(
    databaseId: string,
    method: string,
    args: unknown[],
  ): Promise<unknown> {
    return this.#request({
      type: "invoke",
      databaseId,
      method: method as never,
      args,
    });
  }

  async close(databaseId: string): Promise<void> {
    await this.#request({ type: "close", databaseId });
  }

  async closeAll(): Promise<void> {
    const worker = this.#worker;
    if (!worker) return;
    try {
      await this.#request({ type: "close-all" });
    } finally {
      worker.terminate();
      this.#worker = undefined;
      this.#rejectPending(new Error("Server database worker closed"));
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

  #ensureWorker(): WorkerLike {
    if (this.#worker) return this.#worker;
    const worker = this.createWorker();
    worker.onmessage = (event) => this.#message(event.data);
    worker.onerror = (event) => {
      worker.terminate();
      this.#worker = undefined;
      this.#rejectPending(
        new Error(event.message || "Server database worker failed"),
      );
    };
    worker.onmessageerror = () => {
      worker.terminate();
      this.#worker = undefined;
      this.#rejectPending(
        new Error("Server database worker returned an invalid message"),
      );
    };
    this.#worker = worker;
    return worker;
  }

  #message(response: AppDatabaseWorkerResponse): void {
    if (response.type === "change") {
      this.onChange(response.vaultId, response.change);
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
