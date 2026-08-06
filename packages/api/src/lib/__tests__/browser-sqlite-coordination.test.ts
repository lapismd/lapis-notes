import { afterEach, describe, expect, it, vi } from "vitest";

import { BrowserCoordinatedAppDatabase } from "../storage/browser-coordinated-app-database";
import { BrowserSqliteCoordinator } from "../storage/browser-sqlite-coordination";

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

describe("BrowserSqliteCoordinator", () => {
  it("delegates app-database requests to the owner tab", async () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);

    const ownerCoordinator = new BrowserSqliteCoordinator("vault-under-test");
    const proxyCoordinator = new BrowserSqliteCoordinator("vault-under-test");

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
            content: "hello sqlite",
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
      proxyDatabase.searchDocuments("sqlite"),
    ).resolves.toMatchObject([
      {
        document: {
          path: "note.md",
        },
      },
    ]);
    expect(ownerDatabase.localDatabase.searchDocuments).toHaveBeenCalledWith(
      "sqlite",
      undefined,
    );
  });

  it("delegates file history requests to the owner tab", async () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);

    const ownerCoordinator = new BrowserSqliteCoordinator("vault-under-test");
    const proxyCoordinator = new BrowserSqliteCoordinator("vault-under-test");

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

    const proxyCoordinator = new BrowserSqliteCoordinator("vault-under-test");
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

    const pendingSearch = proxyDatabase.searchDocuments("sqlite");

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
    expect(searchDocuments).toHaveBeenCalledWith("sqlite", undefined);
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

    const primary = new BrowserSqliteCoordinator("vault-under-test");
    expect(await primary.tryAcquireOwnership()).toBe(true);
    primary.startHeartbeat();

    const secondary = new BrowserSqliteCoordinator("vault-under-test");
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

    const primary = new BrowserSqliteCoordinator("vault-under-test");
    expect(await primary.tryAcquireOwnership()).toBe(true);

    const secondary = new BrowserSqliteCoordinator("vault-under-test");
    const waitForTakeover = secondary.waitForOwnership();

    setTimeout(() => {
      primary.close();
    }, 200);

    await expect(waitForTakeover).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith(
      "lapis-notes-sqlite-opfs-owner:vault-under-test",
      { mode: "exclusive", ifAvailable: true },
      expect.any(Function),
    );
  }, 2_000);
});
