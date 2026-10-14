import { afterEach, expect, it, vi } from "vitest";
import {
  SyncHostService,
  type SyncHostServiceOptions,
  type SyncEndpointSecurityCapabilities,
} from "../sync-host";
import { MemoryAppDatabase, MemoryVaultAdapter, Vault } from "../storage";

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  await Promise.allSettled(cleanups.splice(0).map((close) => close()));
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function fixture(options: Partial<SyncHostServiceOptions> = {}) {
  const database = new MemoryAppDatabase("local-index");
  await database.open();
  const file = {
    path: "note.md",
    fileId: "file",
    hostFileId: "host",
    contentGeneration: 1,
    openRead: vi.fn(
      async () =>
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array([42]));
            controller.close();
          },
        }),
    ),
  };
  const local = {
    list: vi.fn(async () => [file]),
    repository: {
      readState: vi.fn(async () => null),
      compareAndSwap: vi.fn(async () => true),
      blobs: {
        has: vi.fn(async () => false),
        get: vi.fn(async () => new Uint8Array([5])),
        put: vi.fn(async () => ({ hash: "sealed", size: 1 })),
      },
    },
    apply: {
      receipt: vi.fn(async () => null),
      mutate: vi.fn(async () => ({ operation, result: null })),
    },
  };
  const provider = { forRuntime: vi.fn(() => local), revokeRuntime: vi.fn() };
  const select = vi.fn((plugin: string) =>
    plugin === "sync" ? provider : undefined,
  );
  const guard = vi.fn(
    async (_path: string | undefined, run: () => Promise<unknown>) => run(),
  );
  const keyProvider = {
    forRuntime: vi.fn(
      () =>
        ({
          crypto: { status: async () => ({ state: "locked" }) },
        }) as unknown as SyncEndpointSecurityCapabilities,
    ),
    revokeRuntime: vi.fn(),
  };
  const service = new SyncHostService(
    database,
    new Vault(new MemoryVaultAdapter()),
    Date.now,
    {
      localProvider: select,
      guardLocalApply: guard,
      securityProvider: () => keyProvider,
      ...options,
    } as SyncHostServiceOptions,
  );
  await service.ready();
  cleanups.push(async () => {
    await service.dispose();
    await database.close();
  });
  const host = service.forPlugin("sync", grants);
  return {
    database,
    service,
    host,
    file,
    local,
    provider,
    keyProvider,
    select,
    guard,
  };
}
const grants = [
  "metadata:identity",
  "vault:stream",
  "plugin:generated-state",
  "crypto:nostr-sync",
] as const;
const operation = {
  id: "op",
  kind: "remove" as const,
  path: "note.md",
  expected: { fileId: "file", contentGeneration: 1 },
  fileId: "file",
};

it("captures and forwards the original authority across asynchronous apply admission", async () => {
  const { host, local, guard } = await fixture();
  const admitted = deferred<void>();
  guard.mockImplementation(async (_path, run) => {
    await admitted.promise;
    return run();
  });
  const fence = {
    vaultId: "vault",
    devicePublicKey: "device",
    epoch: 1,
    membershipGeneration: 2,
  };
  const expected = structuredClone(fence);
  const mutation = host.local!.apply.mutate(operation, undefined, fence);
  fence.epoch = 99;
  fence.membershipGeneration = 99;
  admitted.resolve();
  await mutation;
  expect(local.apply.mutate).toHaveBeenCalledWith(
    operation,
    undefined,
    expected,
  );
  const receiptFence = { ...expected },
    recovery = host.local!.apply.receipt("op", receiptFence);
  receiptFence.vaultId = "substituted";
  await recovery;
  expect(local.apply.receipt).toHaveBeenCalledWith("op", expected);
});

it("captures sealed-state authority without upgrading it during provider selection", async () => {
  const { host, local } = await fixture();
  const fence = {
    vaultId: "vault",
    devicePublicKey: "device",
    epoch: 1,
    membershipGeneration: 2,
  };
  const pending = host.local!.repository.compareAndSwap(
    0,
    { version: 1, epoch: 1, ciphertext: new Uint8Array([5]) },
    fence,
  );
  fence.devicePublicKey = "other";
  fence.epoch = 2;
  await pending;
  expect(local.repository.compareAndSwap).toHaveBeenCalledOnce();
  const [version, state, forwarded] = local.repository.compareAndSwap.mock
    .calls[0]! as unknown as [
    number,
    { version: number; epoch: number; ciphertext: Uint8Array },
    typeof fence,
  ];
  expect(version).toBe(0);
  expect(state.version).toBe(1);
  expect(state.epoch).toBe(1);
  expect(Array.from(state.ciphertext)).toEqual([5]);
  expect(forwarded).toEqual({
    vaultId: "vault",
    devicePublicKey: "device",
    epoch: 1,
    membershipGeneration: 2,
  });
});

it("exposes local files and encrypted storage through one scoped host runtime", async () => {
  const { service, host, local, provider, select } = await fixture();
  expect(host.local).toBeDefined();
  expect(select).not.toHaveBeenCalled();
  const [file] = await host.local!.list();
  expect(await (await file!.openRead()).getReader().read()).toEqual({
    value: new Uint8Array([42]),
    done: false,
  });
  expect(await host.local!.repository.readState()).toBeNull();
  expect(await host.local!.repository.blobs.get("sealed")).toEqual(
    new Uint8Array([5]),
  );
  await host.local!.repository.compareAndSwap(0, {
    version: 1,
    epoch: 1,
    ciphertext: new Uint8Array([5]),
  });
  expect(local.repository.compareAndSwap).toHaveBeenCalledOnce();
  expect(provider.forRuntime).toHaveBeenCalledOnce();
  expect(select).toHaveBeenCalledExactlyOnceWith("sync");
  expect(service.options).not.toHaveProperty("localProvider");
  expect(host).not.toHaveProperty("localProvider");
});

it("checks grants before selecting local custody and keeps legacy hosts unsupported", async () => {
  const { service, select } = await fixture();
  const denied = service.forPlugin("sync", []);
  await expect(denied.local!.list()).rejects.toThrow(/not granted/);
  await expect(denied.local!.repository.readState()).rejects.toThrow(
    /not granted/,
  );
  expect(select).not.toHaveBeenCalled();
  const legacy = service.forPlugin("nostr-sync", grants);
  await expect(legacy.local!.repository.readState()).rejects.toThrow(
    /unavailable/i,
  );
});

it("rejects late local results and drains local cleanup before key custody", async () => {
  const { service, host, local, provider, keyProvider } = await fixture();
  await host.crypto.status();
  const flight = deferred<null>(),
    cleanup = deferred<void>();
  local.repository.readState.mockReturnValue(flight.promise);
  provider.revokeRuntime.mockReturnValue(cleanup.promise as never);
  const pending = host.local!.repository.readState();
  const rejected = expect(pending).rejects.toThrow(/revoked|active/);
  const closing = service.revokePlugin("sync");
  let done = false;
  void closing.then(() => {
    done = true;
  });
  flight.resolve(null);
  await rejected;
  await vi.waitFor(() => expect(provider.revokeRuntime).toHaveBeenCalledOnce());
  expect(done).toBe(false);
  expect(keyProvider.revokeRuntime).not.toHaveBeenCalled();
  cleanup.resolve();
  await closing;
  expect(keyProvider.revokeRuntime).toHaveBeenCalledOnce();
  await expect(host.local!.list()).rejects.toThrow(/revoked|active/);
});

it("cancels open guarded streams on revocation and rejects retained file handles", async () => {
  const { service, host, file } = await fixture();
  const cancel = vi.fn();
  file.openRead.mockImplementation(
    async () => new ReadableStream<Uint8Array>({ cancel }),
  );
  const [captured] = await host.local!.list();
  const reader = (await captured!.openRead()).getReader();
  const pending = expect(reader.read()).rejects.toThrow(/revoked|active/);
  await service.revokePlugin("sync");
  await pending;
  expect(cancel).toHaveBeenCalledOnce();
  await expect(captured!.openRead()).rejects.toThrow(/revoked|active/);
});

it("holds the host apply guard around mutations and receipt recovery", async () => {
  const { host, local, guard } = await fixture();
  const release = deferred<void>();
  guard.mockImplementation(async (_path, run) => {
    await release.promise;
    return run();
  });
  const pending = host.local!.apply.mutate(operation);
  expect(local.apply.mutate).not.toHaveBeenCalled();
  release.resolve();
  await pending;
  expect(guard).toHaveBeenCalledWith("note.md", expect.any(Function));
  await host.local!.apply.receipt("op");
  expect(guard).toHaveBeenLastCalledWith(undefined, expect.any(Function));
});

it("captures mutation guards from file handles before awaiting host admission", async () => {
  const { host, local, guard } = await fixture();
  const [file] = await host.local!.list();
  const held = deferred<void>();
  guard.mockImplementation(async (_path, run) => {
    await held.promise;
    return run();
  });
  const input = { ...operation, expected: file! };
  const pending = host.local!.apply.mutate(input);
  input.path = "changed.md";
  file!.contentGeneration = 999;
  held.resolve();
  await pending;
  expect(local.apply.mutate).toHaveBeenCalledWith(
    {
      ...operation,
      expected: { fileId: "file", contentGeneration: 1, hostFileId: "host" },
    },
    undefined,
  );
});

it("rejects writes and receipt recovery before provider selection when no apply guard exists", async () => {
  const { host, select } = await fixture({ guardLocalApply: undefined });
  await expect(host.local!.apply.mutate(operation)).rejects.toThrow(
    /apply guard.*unavailable/i,
  );
  await expect(host.local!.apply.receipt("op")).rejects.toThrow(
    /apply guard.*unavailable/i,
  );
  expect(select).not.toHaveBeenCalled();
});

it.each(["missing", "rejected"] as const)(
  "drains input cancellation before acknowledging %s apply admission",
  async (mode) => {
    const cancellation = deferred<void>();
    const cancel = vi.fn(() => cancellation.promise);
    const { host, select, local } = await fixture({
      guardLocalApply:
        mode === "missing"
          ? undefined
          : async () => {
              throw new Error("dirty editor rejects admission");
            },
    });
    let settled = false;
    const result = host
      .local!.apply.mutate(
        { ...operation, kind: "write" },
        new ReadableStream<Uint8Array>({ cancel }),
      )
      .then(
        () => {
          settled = true;
          return "unexpected success";
        },
        (error: Error) => {
          settled = true;
          return error.message;
        },
      );
    try {
      await vi.waitFor(() => expect(cancel).toHaveBeenCalledOnce());
      expect(settled).toBe(false);
      expect(local.apply.mutate).not.toHaveBeenCalled();
      if (mode === "missing") expect(select).not.toHaveBeenCalled();
    } finally {
      cancellation.resolve();
      await result;
    }
    expect(await result).toMatch(
      mode === "missing" ? /apply guard.*unavailable/i : /dirty editor/,
    );
  },
);

it("drains rejected admission sources before delegated key custody is revoked", async () => {
  const cancellation = deferred<void>();
  const cancel = vi.fn(() => cancellation.promise);
  const { host, service, keyProvider } = await fixture({
    guardLocalApply: undefined,
  });
  await host.crypto.status();
  const rejected = host
    .local!.apply.mutate(
      { ...operation, kind: "write" },
      new ReadableStream<Uint8Array>({ cancel }),
    )
    .catch((error: unknown) => error);
  try {
    await vi.waitFor(() => expect(cancel).toHaveBeenCalledOnce());
    const closing = service.revokePlugin("sync");
    await Promise.resolve();
    expect(keyProvider.revokeRuntime).not.toHaveBeenCalled();
    cancellation.resolve();
    await closing;
  } finally {
    cancellation.resolve();
    await rejected;
  }
});

it("prevents provider mutation after revocation during apply guard admission", async () => {
  const { service, host, local, guard } = await fixture();
  const release = deferred<void>();
  guard.mockImplementation(async (_path, run) => {
    await release.promise;
    return run();
  });
  const pending = expect(host.local!.apply.mutate(operation)).rejects.toThrow(
    /active|revoked/,
  );
  const closing = service.revokePlugin("sync");
  release.resolve();
  await Promise.all([pending, closing]);
  expect(local.apply.mutate).not.toHaveBeenCalled();
});

it("cancels an in-flight input stream before draining local cleanup", async () => {
  const { service, host, local, provider } = await fixture();
  const entered = deferred<void>();
  const cancelled = vi.fn();
  local.apply.mutate.mockImplementation(
    async (_operation?: unknown, source?: ReadableStream<Uint8Array>) => {
      const reader = source!.getReader();
      try {
        entered.resolve();
        await reader.read();
        return { operation, result: null };
      } finally {
        reader.releaseLock();
      }
    },
  );
  const pending = host.local!.apply.mutate(
    { ...operation, kind: "write" },
    new ReadableStream<Uint8Array>({ cancel: cancelled }),
  );
  const rejected = expect(pending).rejects.toThrow(/active|revoked/);
  await entered.promise;
  await service.revokePlugin("sync");
  await rejected;
  expect(cancelled).toHaveBeenCalledOnce();
  expect(provider.revokeRuntime).toHaveBeenCalledOnce();
});

it("cancels a retained input reader before a rejected mutation releases its host guard", async () => {
  const { host, local } = await fixture();
  const cancel = vi.fn();
  let retained!: ReadableStreamDefaultReader<Uint8Array>;
  local.apply.mutate.mockImplementation(
    async (_operation?: unknown, source?: ReadableStream<Uint8Array>) => {
      retained = source!.getReader();
      void retained.closed.catch(() => undefined);
      throw new Error("rejected before consuming source");
    },
  );
  await expect(
    host.local!.apply.mutate(
      { ...operation, kind: "write" },
      new ReadableStream<Uint8Array>({ cancel }),
    ),
  ).rejects.toThrow(/rejected before/);
  expect(cancel).toHaveBeenCalledOnce();
  await expect(retained.read()).rejects.toThrow(/completed|finished/i);
  retained.releaseLock();
});

it("joins concurrent disposal and releases keys even after local cleanup failure", async () => {
  const { service, host, provider, keyProvider } = await fixture();
  await Promise.all([host.local!.list(), host.crypto.status()]);
  provider.revokeRuntime.mockImplementation(() => {
    throw new Error("local close failed");
  });
  const revoking = service.revokePlugin("sync");
  const rejected = expect(revoking).rejects.toThrow("local close failed");
  const closing = service.dispose();
  expect(service.dispose()).toBe(closing);
  await expect(closing).rejects.toThrow("local close failed");
  await rejected;
  expect(keyProvider.revokeRuntime).toHaveBeenCalledOnce();
  expect(() => service.forPlugin("sync", grants)).toThrow(/disposed/i);
});

it("waits for cancellation of a stream returned after runtime revocation", async () => {
  const { service, host, file, provider } = await fixture();
  const output = deferred<ReadableStream<Uint8Array>>(),
    cancel = deferred<void>();
  file.openRead.mockReturnValue(output.promise);
  const [captured] = await host.local!.list();
  const pending = expect(captured!.openRead()).rejects.toThrow(
    /active|revoked/,
  );
  const closing = service.revokePlugin("sync");
  output.resolve(
    new ReadableStream<Uint8Array>({ cancel: () => cancel.promise }),
  );
  await Promise.resolve();
  await Promise.resolve();
  expect(provider.revokeRuntime).not.toHaveBeenCalled();
  cancel.resolve();
  await Promise.all([pending, closing]);
  expect(provider.revokeRuntime).toHaveBeenCalledOnce();
});

it.each([null, {}, Promise.resolve({})])(
  "rejects invalid local providers without fallback (%s)",
  async (invalid) => {
    const { service, host, local, select } = await fixture();
    select.mockReturnValue(invalid as never);
    await expect(host.local!.list()).rejects.toThrow(
      /local Sync.*(unavailable|provider)/i,
    );
    await expect(host.local!.repository.readState()).rejects.toThrow(
      /local Sync.*(unavailable|provider)/i,
    );
    expect(local.list).not.toHaveBeenCalled();
    expect(select).toHaveBeenCalledOnce();
    await service.dispose();
  },
);

it("leaves hosts without a configured local adapter unchanged", async () => {
  const { host, service, select } = await fixture({ localProvider: undefined });
  expect(host.local).toBeUndefined();
  await service.dispose();
  expect(select).not.toHaveBeenCalled();
});
