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
  onmessage: ((event: MessageEvent<AppDatabaseWorkerResponse>) => void) | null =
    null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null;
  readonly requests: AppDatabaseWorkerRequest[] = [];
  readonly terminate = vi.fn();

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
