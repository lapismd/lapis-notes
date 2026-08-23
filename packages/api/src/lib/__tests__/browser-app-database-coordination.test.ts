import { afterEach, describe, expect, it, vi } from "vitest";

import { BrowserCoordinatedAppDatabase } from "../storage/browser-coordinated-app-database";
import { BrowserAppDatabaseCoordinator } from "../storage/browser-app-database-coordination";

class FakeBroadcastChannel {
  static channels = new Map<string, Set<FakeBroadcastChannel>>();

  readonly name: string;
  private listeners = new Set<(event: MessageEvent) => void>();

  constructor(name: string) {
    this.name = name;
    const channels = FakeBroadcastChannel.channels.get(name) ?? new Set();
    channels.add(this);
    FakeBroadcastChannel.channels.set(name, channels);
  }

  addEventListener(_type: "message", listener: (event: MessageEvent) => void) {
    this.listeners.add(listener);
  }

  removeEventListener(
    _type: "message",
    listener: (event: MessageEvent) => void,
  ) {
    this.listeners.delete(listener);
  }

  postMessage(data: unknown) {
    const peers = FakeBroadcastChannel.channels.get(this.name) ?? new Set();
    for (const peer of peers) {
      if (peer === this) {
        continue;
      }
      for (const listener of peer.listeners) {
        listener({ data } as MessageEvent);
      }
    }
  }

  close() {
    FakeBroadcastChannel.channels.get(this.name)?.delete(this);
  }

  static reset() {
    FakeBroadcastChannel.channels.clear();
  }
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  FakeBroadcastChannel.reset();
});

describe("BrowserAppDatabaseCoordinator", () => {
  it("relays committed changes and resets after a proxy revision gap", async () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);

    const ownerCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");
    const proxyCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");
    (proxyCoordinator as any).lastOwnerId = ownerCoordinator.ownerId;
    let publishChange: ((change: any) => void) | undefined;
    const localDatabase = {
      descriptor: {
        providerId: "turso-wasm",
        engine: "turso",
        transport: "wasm-worker",
        role: "owner",
        storageMode: "local",
        capabilities: {},
      },
      subscribeToChanges(listener: (change: any) => void) {
        publishChange = listener;
        return () => undefined;
      },
      getChangeRevision: vi.fn(async () => 0),
      close: vi.fn(async () => undefined),
    };
    const provider = { open: vi.fn(async () => localDatabase) };
    const ownerDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      ownerCoordinator,
      true,
      provider as any,
    );
    const proxyDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      proxyCoordinator,
      false,
    ) as any;
    proxyDatabase.ensureRpcChannel();
    proxyDatabase.opened = true;
    const changes: any[] = [];
    proxyDatabase.subscribeToChanges((change: any) => changes.push(change));

    await ownerDatabase.open();
    publishChange?.({
      revision: 1,
      domains: ["metadata"],
      paths: ["one.md"],
      committedAt: 1,
    });
    publishChange?.({
      revision: 3,
      domains: ["metadata"],
      paths: ["three.md"],
      committedAt: 3,
    });

    expect(changes).toMatchObject([
      { revision: 1, paths: ["one.md"] },
      { revision: 3, reset: true, paths: [] },
    ]);
    await ownerDatabase.close();
  });

  it("publishes a reset after a proxy is promoted to owner", async () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);
    const coordinator = new BrowserAppDatabaseCoordinator("vault-under-test");
    const localDatabase = {
      descriptor: {
        providerId: "turso-wasm",
        engine: "turso",
        transport: "wasm-worker",
        role: "owner",
        storageMode: "local",
        capabilities: {},
      },
      subscribeToChanges: vi.fn(() => () => undefined),
      getChangeRevision: vi.fn(async () => 12),
    };
    const database = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      coordinator,
      false,
      { open: vi.fn(async () => localDatabase) } as any,
    ) as any;
    database.ensureRpcChannel();
    database.opened = true;
    database.lastSeenRevision = 5;
    const changes: any[] = [];
    database.subscribeToChanges((change: any) => changes.push(change));

    await database.promoteToOwner();

    expect(changes).toMatchObject([
      { revision: 12, reset: true, paths: [], domains: expect.arrayContaining(["metadata", "search"]) },
    ]);
  });

  it("delegates app-database requests to the owner tab", async () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);

    const ownerCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");
    const proxyCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");

    const ownerDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      ownerCoordinator,
      true,
    ) as any;
    ownerDatabase.ensureRpcChannel();
    ownerDatabase.localDatabase = {
      searchDocuments: vi.fn(async () => [
        {
          document: {
            path: "note.md",
            name: "note",
            extension: "md",
            checksum: "abc",
            content: "hello turso",
            tags: [],
            tagParts: [],
            tagHierarchy: [],
          },
          score: 1,
          snippets: [],
        },
      ]),
    };
    ownerDatabase.servingRequests = true;

    const proxyDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      proxyCoordinator,
      false,
    ) as any;
    proxyDatabase.ensureRpcChannel();
    proxyDatabase.opened = true;

    await expect(
      proxyDatabase.searchDocuments("turso", {
        sourceProviderIds: ["ai-conversations"],
        pathPrefix: "Projects/Alpha",
      }),
    ).resolves.toMatchObject([
      {
        document: {
          path: "note.md",
        },
      },
    ]);
    expect(ownerDatabase.localDatabase.searchDocuments).toHaveBeenCalledWith(
      "turso",
      {
        sourceProviderIds: ["ai-conversations"],
        pathPrefix: "Projects/Alpha",
      },
    );
  });

  it("delegates file history requests to the owner tab", async () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);

    const ownerCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");
    const proxyCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");

    const ownerDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      ownerCoordinator,
      true,
    ) as any;
    ownerDatabase.ensureRpcChannel();
    ownerDatabase.localDatabase = {
      getFileHistory: vi.fn(async () => ({
        file: {
          fileId: "history-file-1",
          currentPath: "note.md",
          deleted: false,
        },
        revisions: [
          {
            revisionId: "history-revision-1",
            fileId: "history-file-1",
            currentPath: "note.md",
            capturedPath: "note.md",
            eventType: "baseline",
            createdAt: 1,
            contentHash: "hash-a",
            content: "alpha",
          },
        ],
      })),
    };
    ownerDatabase.servingRequests = true;

    const proxyDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      proxyCoordinator,
      false,
    ) as any;
    proxyDatabase.ensureRpcChannel();
    proxyDatabase.opened = true;

    await expect(
      proxyDatabase.getFileHistory("note.md"),
    ).resolves.toMatchObject({
      file: {
        currentPath: "note.md",
      },
      revisions: [{ eventType: "baseline" }],
    });
    expect(ownerDatabase.localDatabase.getFileHistory).toHaveBeenCalledWith(
      "note.md",
    );
  });

  it("replays an in-flight proxied request locally after takeover", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);

    const proxyCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");
    const proxyDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      proxyCoordinator,
      false,
    ) as any;

    proxyDatabase.ensureRpcChannel();
    proxyDatabase.opened = true;

    const searchDocuments = vi.fn(async () => [
      {
        document: {
          path: "note.md",
          name: "note",
          extension: "md",
          checksum: "abc",
          content: "hello after takeover",
          tags: [],
          tagParts: [],
          tagHierarchy: [],
        },
        score: 1,
        snippets: [],
      },
    ]);

    const pendingSearch = proxyDatabase.searchDocuments("turso");

    setTimeout(() => {
      proxyDatabase.localDatabase = {
        searchDocuments,
      };
      proxyDatabase.servingRequests = true;
      proxyDatabase.startsOwned = true;
    }, 200);

    await vi.advanceTimersByTimeAsync(300);

    await expect(pendingSearch).resolves.toMatchObject([
      {
        document: {
          path: "note.md",
        },
      },
    ]);
    expect(searchDocuments).toHaveBeenCalledWith("turso", undefined);
  });

  it("reports the owning Turso database capabilities through the proxy", async () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);

    const ownerCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");
    const proxyCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");
    const ownerDescriptor = {
      providerId: "turso-wasm",
      engine: "turso",
      transport: "wasm-opfs-worker",
      role: "owner",
      storageMode: "local",
      capabilities: {
        nativeFullTextSearch: false,
        vectorSearch: true,
        approximateNearestNeighbors: false,
        localEmbeddings: true,
        crossTabCoordination: true,
        sync: false,
      },
    };

    const ownerDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      ownerCoordinator,
      true,
    ) as any;
    ownerDatabase.ensureRpcChannel();
    ownerDatabase.localDatabase = { descriptor: ownerDescriptor };
    ownerDatabase.servingRequests = true;

    const proxyDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      proxyCoordinator,
      false,
    ) as any;
    proxyDatabase.ensureRpcChannel();
    proxyDatabase.opened = true;
    proxyDatabase.remoteDescriptor = await proxyDatabase.invokeRemote(
      "describe",
      [],
    );

    expect(proxyDatabase.descriptor).toMatchObject({
      providerId: "turso-wasm",
      engine: "turso",
      transport: "broadcast-proxy",
      role: "proxy",
      capabilities: {
        nativeFullTextSearch: false,
        vectorSearch: true,
        crossTabCoordination: true,
      },
    });
  });

  it("ignores cross-tab requests outside the fixed database allowlist", async () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);

    const ownerCoordinator = new BrowserAppDatabaseCoordinator("vault-under-test");
    const ownerDatabase = new BrowserCoordinatedAppDatabase(
      "vault-under-test",
      ownerCoordinator,
      true,
    ) as any;
    const close = vi.fn();
    ownerDatabase.ensureRpcChannel();
    ownerDatabase.localDatabase = { close };
    ownerDatabase.servingRequests = true;

    const attacker = new FakeBroadcastChannel(ownerCoordinator.rpcChannelName);
    attacker.postMessage({
      type: "db-request",
      vaultId: "vault-under-test",
      requesterId: "untrusted-tab",
      requestId: "request-1",
      method: "close",
      args: [],
    });
    await Promise.resolve();

    expect(close).not.toHaveBeenCalled();
    attacker.close();
  });

  it("observes owner heartbeats over BroadcastChannel", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);

    const heldLocks = new Set<string>();
    const request = vi.fn(async (_name, _options, callback) => {
      if (heldLocks.has(_name)) {
        return callback(null);
      }

      heldLocks.add(_name);
      void Promise.resolve(callback({ name: _name })).finally(() => {
        heldLocks.delete(_name);
      });
      return undefined;
    });

    vi.stubGlobal("navigator", {
      locks: {
        request,
      },
    });

    const primary = new BrowserAppDatabaseCoordinator("vault-under-test");
    expect(await primary.tryAcquireOwnership()).toBe(true);
    primary.startHeartbeat();

    const secondary = new BrowserAppDatabaseCoordinator("vault-under-test");
    const abortController = new AbortController();
    const waitForOwnership = secondary.waitForOwnership({
      signal: abortController.signal,
    });
    await vi.advanceTimersByTimeAsync(1_200);

    expect(secondary.observedOwnerId).toBe(primary.ownerId);
    expect(secondary.observedHeartbeatAt).not.toBeNull();

    abortController.abort();
    await expect(waitForOwnership).resolves.toBe(false);
    primary.close();
  });

  it("retries lock acquisition after the owner closes", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const heldLocks = new Set<string>();
    const request = vi.fn(async (_name, _options, callback) => {
      if (heldLocks.has(_name)) {
        return callback(null);
      }

      heldLocks.add(_name);
      void Promise.resolve(callback({ name: _name })).finally(() => {
        heldLocks.delete(_name);
      });
      return undefined;
    });

    vi.stubGlobal("navigator", {
      locks: {
        request,
      },
    });

    const primary = new BrowserAppDatabaseCoordinator("vault-under-test");
    expect(await primary.tryAcquireOwnership()).toBe(true);

    const secondary = new BrowserAppDatabaseCoordinator("vault-under-test");
    const waitForTakeover = secondary.waitForOwnership();

    setTimeout(() => {
      primary.close();
    }, 200);

    await expect(waitForTakeover).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith(
      "lapis-notes-app-database-owner:vault-under-test",
      { mode: "exclusive", ifAvailable: true },
      expect.any(Function),
    );
  }, 2_000);
});
