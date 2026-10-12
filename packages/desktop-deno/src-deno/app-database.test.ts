import { describe, expect, it, vi } from "vitest";
import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerResponse,
} from "./app-database-worker-protocol";
import { DenoAppDatabaseHost } from "./app-database";

const descriptor = {
  providerId: "turso-native-desktop",
  engine: "turso" as const,
  transport: "native" as const,
  role: "direct" as const,
  storageMode: "local" as const,
  capabilities: {
    nativeFullTextSearch: true,
    vectorSearch: false,
    approximateNearestNeighbors: false,
    localEmbeddings: true,
    crossTabCoordination: false,
    sync: false,
  },
};

class FakeAppDatabaseWorker {
  #onmessage:
    | ((event: MessageEvent<AppDatabaseWorkerResponse>) => void)
    | null = null;
  get onmessage() {
    return this.#onmessage;
  }
  set onmessage(
    handler: ((event: MessageEvent<AppDatabaseWorkerResponse>) => void) | null,
  ) {
    this.#onmessage = handler;
    if (handler && this.autoReady) queueMicrotask(() => this.ready());
  }
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null;
  readonly requests: AppDatabaseWorkerRequest[] = [];
  readonly terminate = vi.fn();

  constructor(private readonly autoReady = true) {}

  ready(): void {
    this.onmessage?.(new MessageEvent("message", { data: { type: "ready" } }));
  }

  postMessage(request: AppDatabaseWorkerRequest): void {
    this.requests.push(request);
    queueMicrotask(() => {
      const value =
        request.type === "open"
          ? descriptor
          : request.type === "invoke"
            ? { method: request.method, args: request.args }
            : undefined;
      this.onmessage?.(
        new MessageEvent("message", {
          data: { type: "result", id: request.id, ok: true, value },
        }),
      );
    });
  }

  emit(response: AppDatabaseWorkerResponse): void {
    this.onmessage?.(new MessageEvent("message", { data: response }));
  }
}

describe("DenoAppDatabaseHost worker boundary", () => {
  it("waits for worker readiness before sending the first request", async () => {
    const worker = new FakeAppDatabaseWorker(false);
    const host = new DenoAppDatabaseHost("/user-data", vi.fn(), {
      createWorker: () => worker,
      resolveDatabasePath: async () => "/test.turso",
    });
    const opening = host.open({ databaseId: "database-1", vaultId: "vault-1" });
    await Promise.resolve();
    expect(worker.requests).toEqual([]);
    worker.ready();
    await expect(opening).resolves.toEqual(descriptor);
    expect(worker.requests.map(({ type }) => type)).toEqual(["open"]);
    worker.ready();
    expect(worker.requests).toHaveLength(1);
    await host.closeAll();
  });

  it("cancels requests and ignores late readiness when closed during startup", async () => {
    const worker = new FakeAppDatabaseWorker(false);
    const host = new DenoAppDatabaseHost("/user-data", vi.fn(), {
      createWorker: () => worker,
      resolveDatabasePath: async () => "/test.turso",
    });
    const opening = host.open({ databaseId: "database-1", vaultId: "vault-1" });
    const rejected = expect(opening).rejects.toThrow("worker closed");
    await Promise.resolve();
    await host.closeAll();
    await rejected;
    worker.ready();
    expect(worker.requests).toEqual([]);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("rejects startup errors and can start a fresh worker", async () => {
    const starting = new FakeAppDatabaseWorker(false);
    const replacement = new FakeAppDatabaseWorker();
    let next = starting;
    const host = new DenoAppDatabaseHost("/user-data", vi.fn(), {
      createWorker: () => next,
      resolveDatabasePath: async () => "/test.turso",
    });
    const opening = host.open({ databaseId: "database-1", vaultId: "vault-1" });
    const rejected = expect(opening).rejects.toThrow("import failed");
    await Promise.resolve();
    starting.onerror?.({
      message: "import failed",
      preventDefault: vi.fn(),
    } as unknown as ErrorEvent);
    await rejected;
    next = replacement;
    const retry = host.open({ databaseId: "database-1", vaultId: "vault-1" });
    await Promise.resolve();
    starting.ready();
    await expect(retry).resolves.toEqual(descriptor);
    expect(starting.requests).toEqual([]);
    await host.closeAll();
  });

  it("bounds startup when the worker never becomes ready", async () => {
    vi.useFakeTimers();
    try {
      const worker = new FakeAppDatabaseWorker(false);
      const host = new DenoAppDatabaseHost("/user-data", vi.fn(), {
        createWorker: () => worker,
        resolveDatabasePath: async () => "/test.turso",
        workerReadyTimeoutMs: 100,
      });
      const opening = host.open({
        databaseId: "database-1",
        vaultId: "vault-1",
      });
      const rejected = expect(opening).rejects.toThrow("did not become ready");
      await vi.advanceTimersByTimeAsync(100);
      await rejected;
      worker.ready();
      expect(worker.requests).toEqual([]);
      expect(worker.terminate).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("routes database lifecycle, methods, and changes through the worker", async () => {
    const worker = new FakeAppDatabaseWorker();
    const emit = vi.fn(async () => undefined);
    const host = new DenoAppDatabaseHost("/user-data", emit, {
      createWorker: () => worker,
      resolveDatabasePath: async () => "/user-data/databases/test.turso",
    });

    await expect(
      host.open({ databaseId: "database-1", vaultId: "vault-1" }),
    ).resolves.toEqual(descriptor);
    await expect(
      host.invoke({
        databaseId: "database-1",
        method: "getMeta",
        args: ["key"],
      }),
    ).resolves.toEqual({ method: "getMeta", args: ["key"] });
    worker.emit({
      type: "change",
      databaseId: "database-1",
      vaultId: "vault-1",
      change: {
        revision: 1,
        domains: ["search"],
        paths: ["note.md"],
        committedAt: 1,
      },
    });
    await vi.waitFor(() => expect(emit).toHaveBeenCalledOnce());
    await host.close({ databaseId: "database-1" });
    await host.closeAll();

    expect(worker.requests.map((request) => request.type)).toEqual([
      "open",
      "invoke",
      "close",
      "close-all",
    ]);
    expect(emit).toHaveBeenCalledWith({
      channel: "desktop_app_database_change",
      payload: expect.objectContaining({
        databaseId: "database-1",
        vaultId: "vault-1",
      }),
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("restores worker errors to the invoking caller", async () => {
    const worker = new FakeAppDatabaseWorker();
    worker.postMessage = (request) => {
      queueMicrotask(() =>
        worker.emit({
          type: "result",
          id: request.id,
          ok: false,
          error: { name: "DatabaseError", message: "write failed" },
        }),
      );
    };
    const host = new DenoAppDatabaseHost("/user-data", vi.fn(), {
      createWorker: () => worker,
      resolveDatabasePath: async () => "/test.turso",
    });

    await expect(
      host.open({ databaseId: "database-1", vaultId: "vault-1" }),
    ).rejects.toMatchObject({ name: "DatabaseError", message: "write failed" });
  });
});
