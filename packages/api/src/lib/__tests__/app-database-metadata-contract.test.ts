import { connect } from "@tursodatabase/database";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppDatabase, AppDatabaseProvider } from "../storage";
import {
  MemoryAppDatabase,
  NativeDesktopTursoAppDatabase,
  TursoAppDatabase,
  type NativeDesktopBridge,
  type TursoConnection,
} from "../storage";
import { BrowserAppDatabaseCoordinator } from "../storage/browser-app-database-coordination";
import { BrowserCoordinatedAppDatabase } from "../storage/browser-coordinated-app-database";

class FakeBroadcastChannel {
  static channels = new Map<string, Set<FakeBroadcastChannel>>();
  private listeners = new Set<(event: MessageEvent) => void>();

  constructor(readonly name: string) {
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
    for (const peer of FakeBroadcastChannel.channels.get(this.name) ?? []) {
      if (peer === this) continue;
      for (const listener of peer.listeners) listener({ data } as MessageEvent);
    }
  }

  close() {
    FakeBroadcastChannel.channels.get(this.name)?.delete(this);
  }
}

interface DatabaseHarness {
  database: AppDatabase;
  cleanup?: () => Promise<void>;
}

async function memoryHarness(vaultId: string): Promise<DatabaseHarness> {
  return { database: new MemoryAppDatabase(vaultId) };
}

async function tursoHarness(
  vaultId: string,
  kind: "turso-native" | "turso-wasm",
): Promise<DatabaseHarness> {
  return {
    database: new TursoAppDatabase(vaultId, {
      kind,
      transport: kind === "turso-native" ? "native" : "wasm-worker",
      connectionFactory: async () =>
        (await connect(":memory:", {
          experimental: ["index_method"],
        })) as TursoConnection,
    }),
  };
}

async function desktopHarness(vaultId: string): Promise<DatabaseHarness> {
  const backend = new MemoryAppDatabase(`${vaultId}-backend`);
  await backend.open();
  const bridge: NativeDesktopBridge = {
    invoke: async <T>(channel: string, payload?: unknown): Promise<T> => {
      if (channel === "desktop_db_open") return backend.descriptor as T;
      if (channel === "desktop_db_close") return undefined as T;
      const call = payload as { method: keyof AppDatabase; args: unknown[] };
      return (backend[call.method] as (...args: unknown[]) => Promise<T>)(
        ...call.args,
      );
    },
    onAppDatabaseChange(listener) {
      return backend.subscribeToChanges((change) =>
        listener({ vaultId, change }),
      );
    },
  } as NativeDesktopBridge;
  return {
    database: new NativeDesktopTursoAppDatabase(vaultId, bridge),
    cleanup: () => backend.close(),
  };
}

async function browserHarness(
  vaultId: string,
  proxy: boolean,
): Promise<DatabaseHarness> {
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel as any);
  const backend = new MemoryAppDatabase(`${vaultId}-backend`);
  await backend.open();
  const provider: AppDatabaseProvider = {
    id: "memory-contract",
    canOpen: () => true,
    open: async () => backend,
  };
  const ownerCoordinator = new BrowserAppDatabaseCoordinator(vaultId);
  const owner = new BrowserCoordinatedAppDatabase(
    vaultId,
    ownerCoordinator,
    true,
    provider,
  );
  await owner.open();
  if (!proxy) {
    return { database: owner };
  }

  const proxyCoordinator = new BrowserAppDatabaseCoordinator(vaultId);
  (proxyCoordinator as any).lastOwnerId = ownerCoordinator.ownerId;
  const coordinatedProxy = new BrowserCoordinatedAppDatabase(
    vaultId,
    proxyCoordinator,
    false,
  ) as any;
  coordinatedProxy.ensureRpcChannel();
  coordinatedProxy.opened = true;
  return {
    database: coordinatedProxy,
    cleanup: () => owner.close(),
  };
}

const providers: Array<[
  string,
  (vaultId: string) => Promise<DatabaseHarness>,
]> = [
  ["Memory", memoryHarness],
  ["Turso native", (vaultId) => tursoHarness(vaultId, "turso-native")],
  ["Turso WASM SQL", (vaultId) => tursoHarness(vaultId, "turso-wasm")],
  ["Electron IPC", desktopHarness],
  ["browser owner", (vaultId) => browserHarness(vaultId, false)],
  ["browser proxy", (vaultId) => browserHarness(vaultId, true)],
];

afterEach(() => {
  FakeBroadcastChannel.channels.clear();
  vi.unstubAllGlobals();
});

describe.each(providers)("metadata query contract: %s", (_name, create) => {
  it("supports paging, nested facets, batched links, manifests, and revisions", async () => {
    const harness = await create(`contract-${_name}`);
    const { database } = harness;
    await database.open();
    const changes: number[] = [];
    const unsubscribe = database.subscribeToChanges((change) =>
      changes.push(change.revision),
    );
    const record = (path: string, priority: number) => ({
      file: {
        path,
        normalizedPath: path.toLowerCase(),
        extension: "md",
        mtime: priority,
        size: 10,
        hash: `hash-${priority}`,
        indexed: true,
      },
      metadata: {
        path,
        hash: `hash-${priority}`,
        parserVersion: "contract-1",
        metadata: { frontmatter: { project: { priority } } },
      },
      links: [{
        sourcePath: path,
        targetText: "Target",
        original: "[[Target]]",
        resolvedTargetPath: "Target.md",
        type: "link" as const,
        count: 1,
      }],
      tags: [{
        path,
        tag: "#work/database",
        parts: ["work", "database"],
        hierarchy: ["work", "work/database"],
      }],
      properties: [{
        path,
        name: "project",
        inferredType: "object",
        value: { priority, milestones: [{ done: false }] },
      }],
    });
    await database.upsertIndexedFile(record("A.md", 1));
    await database.upsertIndexedFile(record("B.md", 2));

    const firstPage = await database.queryIndexedMetadataPage({ limit: 1 });
    expect(firstPage.rows.map((row) => row.file.path)).toEqual(["A.md"]);
    await expect(
      database.queryIndexedMetadataPage({
        after: firstPage.nextCursor,
        limit: 1,
      }),
    ).resolves.toMatchObject({ rows: [{ file: { path: "B.md" } }] });
    await expect(
      database.queryMetadataFacets({ kind: "tag" }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "work/database", count: 2 }),
      ]),
    );
    await expect(
      database.queryMetadataFacets({ kind: "property-path" }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: "project.milestones[].done",
          count: 2,
        }),
      ]),
    );
    await expect(
      database.queryMetadataFacets({
        kind: "property-value",
        propertyName: "project.priority",
      }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 1, valueType: "number" }),
        expect.objectContaining({ value: 2, valueType: "number" }),
      ]),
    );
    await expect(
      database.queryMetadataLinks({
        direction: "outgoing",
        paths: ["A.md", "B.md"],
        resolution: "resolved",
      }),
    ).resolves.toHaveLength(2);

    await database.upsertSearchDocument({
      path: "A.md",
      sourceProviderId: "search:markdown",
      name: "A",
      extension: "md",
      checksum: "search-a",
      content: "body",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      sourceMetadata: {
        metadataHash: "hash-1",
        providerVersion: "1",
        projectionSignature: "projection-1",
        sourceMtime: 1,
        sourceSize: 10,
        rawTags: [],
        headings: [],
        sections: [],
        chunking: {
          targetChars: 1_200,
          breakpointWindowChars: 120,
          breakpointDecay: 0.8,
        },
      },
    });
    await expect(
      database.listSearchDocumentManifest({ limit: 1 }),
    ).resolves.toMatchObject({
      rows: [{
        path: "A.md",
        metadataHash: "hash-1",
        projectionSignature: "projection-1",
      }],
    });
    expect(changes.length).toBeGreaterThanOrEqual(3);
    expect(changes).toEqual([...changes].sort((left, right) => left - right));

    unsubscribe();
    await database.close();
    await harness.cleanup?.();
  });
});
