import { describe, expect, it, vi } from "vitest";
import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerResponse,
} from "./app-database-worker-protocol";
import { DenoAppDatabaseHost } from "./app-database";
import { mkdtemp, mkdir, realpath, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

it("binds admitted profiles to their physical root and rejects rebinding during repeated open", async () => {
  const directory = await realpath(
    await mkdtemp(join(tmpdir(), "lapis-profile-root-")),
  );
  const rootPath = join(directory, "vault"),
    other = join(directory, "other");
  await mkdir(rootPath);
  await mkdir(other);
  const host = new DenoAppDatabaseHost(directory, vi.fn(), {
    createWorker: () => new FakeAppDatabaseWorker(),
    resolveDatabasePath: async () => join(directory, "index.sqlite"),
  });
  try {
    const payload = { databaseId: "db", vaultId: "profile", rootPath };
    await host.open(payload);
    const bound = host.getProfileRoot("profile");
    expect(bound).toMatchObject({ rootPath });
    expect(bound?.rootBinding).toMatch(/^[a-f0-9]{64}$/u);
    await expect(host.open({ ...payload, rootPath: other })).rejects.toThrow(
      /root|bound/i,
    );
    expect(host.getProfileRoot("profile")).toEqual(bound);
    await host.close({ databaseId: "db" });
    expect(host.getProfileRoot("profile")).toBeUndefined();
  } finally {
    await host.closeAll();
    await rm(directory, { recursive: true, force: true });
  }
});

it("preserves ordinary database startup while withholding Sync files for a symlink root", async () => {
  const directory = await realpath(
    await mkdtemp(join(tmpdir(), "lapis-profile-legacy-")),
  );
  const physical = join(directory, "physical"),
    rootPath = join(directory, "link");
  await mkdir(physical);
  await symlink(physical, rootPath, "dir");
  const host = new DenoAppDatabaseHost(directory, vi.fn(), {
    createWorker: () => new FakeAppDatabaseWorker(),
    resolveDatabasePath: async () => join(directory, "index.sqlite"),
  });
  try {
    const payload = { databaseId: "db", vaultId: "profile", rootPath };
    await expect(host.open(payload)).resolves.toEqual(descriptor);
    expect(host.getProfileLease("profile")).toBeDefined();
    expect(host.getProfileRoot("profile")).toBeUndefined();
    await expect(host.open({ ...payload, rootPath: physical })).rejects.toThrow(
      /bound|root/i,
    );
    await host.close({ databaseId: "db" });
    await host.open({ ...payload, rootPath: physical });
    expect(host.getProfileRoot("profile")?.rootPath).toBe(physical);
  } finally {
    await host.closeAll();
    await rm(directory, { recursive: true, force: true });
  }
});

it("admits Sync only after native open and invalidates its lease before close", async () => {
  const worker = new FakeAppDatabaseWorker(false);
  const invalidated = vi.fn();
  const host = new DenoAppDatabaseHost("/user-data", vi.fn(), {
    createWorker: () => worker,
    resolveDatabasePath: async () => "/test.turso",
    onProfilesInvalidated: invalidated,
  });
  const opening = host.open({ databaseId: "db", vaultId: "profile" });
  await Promise.resolve();
  expect(host.getProfileLease("profile")).toBeUndefined();
  worker.ready();
  await opening;
  const lease = host.getProfileLease("profile");
  expect(lease).toBeDefined();
  const closing = host.close({ databaseId: "db" });
  expect(host.getProfileLease("profile")).toBeUndefined();
  expect(invalidated).toHaveBeenCalledOnce();
  await closing;
  await host.open({ databaseId: "db", vaultId: "profile" });
  expect(host.getProfileLease("profile")).not.toBe(lease);
  await host.closeAll();
});

it("invalidates native profile admission when its database worker fails", async () => {
  const worker = new FakeAppDatabaseWorker();
  const invalidated = vi.fn();
  const host = new DenoAppDatabaseHost("/user-data", vi.fn(), {
    createWorker: () => worker,
    resolveDatabasePath: async () => "/test.turso",
    onProfilesInvalidated: invalidated,
  });
  await host.open({ databaseId: "db", vaultId: "profile" });
  expect(host.getProfileLease("profile")).toBeDefined();
  worker.onerror?.({
    message: "worker failed",
    preventDefault: vi.fn(),
  } as unknown as ErrorEvent);
  expect(host.getProfileLease("profile")).toBeUndefined();
  expect(invalidated).toHaveBeenCalledOnce();
  await host.closeAll();
});

it("retains one profile lease across concurrent and repeated opens", async () => {
  const worker = new FakeAppDatabaseWorker(false);
  const host = new DenoAppDatabaseHost("/user-data", vi.fn(), {
    createWorker: () => worker,
    resolveDatabasePath: async () => "/test.turso",
  });
  try {
    const payload = { databaseId: "db", vaultId: "profile" };
    const opening = Promise.all([host.open(payload), host.open(payload)]).then(
      (value) => value,
      (error: unknown) => error,
    );
    await Promise.resolve();
    worker.ready();
    expect(await opening).toEqual([descriptor, descriptor]);
    const lease = host.getProfileLease("profile");
    expect(await host.open(payload)).toEqual(descriptor);
    expect(host.getProfileLease("profile")).toBe(lease);
    await expect(
      host.open({ ...payload, vaultId: "other-profile" }),
    ).rejects.toThrow("another vault");
    expect(
      worker.requests.filter((request) => request.type === "open"),
    ).toHaveLength(1);
  } finally {
    await host.closeAll();
  }
});

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
