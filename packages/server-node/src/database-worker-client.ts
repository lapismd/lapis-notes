import { Worker } from "node:worker_threads";
import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerRequestInput,
  AppDatabaseWorkerResponse,
} from "@lapis-notes/host-services/app-database-worker-protocol";
import { deserializeAppDatabaseWorkerError } from "@lapis-notes/host-services/app-database-worker-protocol";

type WorkerLike = {
  on(
    event: "message",
    listener: (message: AppDatabaseWorkerResponse) => void,
  ): unknown;
  on(event: "error", listener: (error: Error) => void): unknown;
  on(event: "messageerror", listener: () => void): unknown;
  on(event: "exit", listener: (code: number) => void): unknown;
  postMessage(request: AppDatabaseWorkerRequest): void;
  terminate(): Promise<number>;
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
      new Worker(new URL("./database-worker.js", import.meta.url), {
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
      this.#worker = undefined;
      await worker.terminate();
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
    const fail = (error: Error) => {
      if (this.#worker !== worker) return;
      this.#worker = undefined;
      this.#rejectPending(error);
      void worker.terminate().catch(() => undefined);
    };
    worker.on("message", (response: AppDatabaseWorkerResponse) => {
      if (this.#worker === worker) this.#message(response);
    });
    worker.on("error", (error: Error) => fail(error));
    worker.on("messageerror", () =>
      fail(new Error("Server database worker returned an invalid message")),
    );
    worker.on("exit", (code: number) =>
      fail(new Error(`Server database worker exited (${code})`)),
    );
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
