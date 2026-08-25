import { NoopTelemetryService } from "@lapis-notes/api/telemetry";
import { describe, expect, test, vi } from "vitest";
import {
  GRAPH_CANONICAL_SNAPSHOT_KEY,
  GraphDataCoordinator,
  type GraphCoordinatorState,
} from "../graph-data-coordinator";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createGraph() {
  return {
    nodes: [
      {
        id: "note:Notes/A.md",
        label: "A",
        path: "Notes/A.md",
        type: "note" as const,
        exists: true,
        refCount: 0,
        outgoingCount: 0,
        tags: [],
        groupIds: [],
        ctime: 1,
        mtime: 2,
        extension: "md",
      },
    ],
    links: [],
    centerNodeId: null,
  };
}

function createApp(options: {
  fingerprint?: string;
  snapshot?: unknown;
  queryPage?: () => Promise<{
    rows: ReturnType<typeof createRow>[];
    nextCursor?: string;
  }>;
} = {}) {
  let fingerprint = options.fingerprint ?? "fingerprint-1";
  const meta = new Map<string, unknown>();
  if (options.snapshot !== undefined) {
    meta.set(GRAPH_CANONICAL_SNAPSHOT_KEY, options.snapshot);
  }
  const queryMetadataPage = vi.fn(
    options.queryPage ?? (async () => ({ rows: [createRow()] })),
  );
  const file = {
    path: "Notes/A.md",
    extension: "md",
    stat: { ctime: 1, mtime: 2, size: 3 },
  };
  return {
    app: {
      appDatabase: {
        open: vi.fn(async () => undefined),
        getMeta: vi.fn(async (key: string) => meta.get(key)),
        setMeta: vi.fn(async (key: string, value: unknown) => {
          meta.set(key, value);
        }),
      },
      metadataCache: {
        load: vi.fn(async () => undefined),
        getReconciliationFingerprint: () => fingerprint,
        queryMetadataPage,
      },
      telemetry: new NoopTelemetryService(),
      vault: {
        *iterateFiles() {
          yield file;
        },
        getFileByPath(path: string) {
          return path === file.path ? file : null;
        },
      },
      workspace: { getActiveFile: () => file },
    } as any,
    meta,
    queryMetadataPage,
    setFingerprint(value: string) {
      fingerprint = value;
    },
  };
}

function createRow() {
  return {
    file: {
      path: "Notes/A.md",
      normalizedPath: "notes/a.md",
      extension: "md",
      mtime: 2,
      size: 3,
      hash: "a",
      indexed: true,
    },
    metadata: null,
    properties: [],
    tags: [],
    links: [],
  };
}

function persistedSnapshot(fingerprint = "fingerprint-1") {
  return {
    version: 1,
    completedAt: 10,
    metadataFingerprint: fingerprint,
    graph: createGraph(),
  };
}

function waitForState(
  coordinator: GraphDataCoordinator,
  predicate: (state: GraphCoordinatorState) => boolean,
): Promise<GraphCoordinatorState> {
  return new Promise((resolve) => {
    const unsubscribe = coordinator.subscribe((state) => {
      if (!predicate(state)) return;
      unsubscribe();
      resolve(state);
    });
  });
}

describe("GraphDataCoordinator", () => {
  test("renders a matching snapshot without scanning metadata", async () => {
    const { app, queryMetadataPage } = createApp({
      snapshot: persistedSnapshot(),
    });
    const coordinator = new GraphDataCoordinator(app);

    await coordinator.start();

    expect(coordinator.getState()).toMatchObject({
      status: "ready",
      snapshotOutcome: "hit",
      graph: { nodes: [{ id: "note:Notes/A.md" }] },
    });
    expect(queryMetadataPage).not.toHaveBeenCalled();
    coordinator.dispose();
  });

  test("keeps a stale snapshot visible while rebuilding and persists success", async () => {
    const page = deferred<{ rows: ReturnType<typeof createRow>[] }>();
    const { app, meta } = createApp({
      fingerprint: "fingerprint-2",
      snapshot: persistedSnapshot("fingerprint-1"),
      queryPage: () => page.promise,
    });
    const coordinator = new GraphDataCoordinator(app);
    const updating = waitForState(
      coordinator,
      (state) => state.status === "updating" && state.graph !== null,
    );

    await coordinator.start();
    await updating;
    page.resolve({ rows: [createRow()] });
    const ready = await waitForState(
      coordinator,
      (state) => state.status === "ready" && state.completedAt !== 10,
    );

    expect(ready.graph?.nodes).toHaveLength(1);
    expect(meta.get(GRAPH_CANONICAL_SNAPSHOT_KEY)).toMatchObject({
      version: 1,
      metadataFingerprint: "fingerprint-2",
    });
    coordinator.dispose();
  });

  test("coalesces refresh pressure into one pending follow-up", async () => {
    const firstPage = deferred<{ rows: ReturnType<typeof createRow>[] }>();
    const firstStarted = deferred<void>();
    let calls = 0;
    let active = 0;
    let maxActive = 0;
    const { app } = createApp({
      snapshot: persistedSnapshot(),
      queryPage: async () => {
        calls += 1;
        if (calls === 1) firstStarted.resolve();
        active += 1;
        maxActive = Math.max(maxActive, active);
        try {
          if (calls === 1) return await firstPage.promise;
          return { rows: [createRow()] };
        } finally {
          active -= 1;
        }
      },
    });
    const coordinator = new GraphDataCoordinator(app);
    await coordinator.start();

    const initial = coordinator.requestRefresh("manual", true);
    await firstStarted.promise;
    const refreshes = Array.from({ length: 20 }, () =>
      coordinator.requestRefresh("metadata", true),
    );
    firstPage.resolve({ rows: [createRow()] });
    await Promise.all([initial, ...refreshes]);

    expect(calls).toBe(2);
    expect(maxActive).toBe(1);
    coordinator.dispose();
  });

  test("retains cached data when a refresh fails", async () => {
    const { app } = createApp({
      snapshot: persistedSnapshot(),
      queryPage: async () => {
        throw new Error("saturated");
      },
    });
    const coordinator = new GraphDataCoordinator(app);
    await coordinator.start();

    await coordinator.requestRefresh("manual", true);

    expect(coordinator.getState()).toMatchObject({
      status: "error",
      graph: { nodes: [{ id: "note:Notes/A.md" }] },
    });
    coordinator.dispose();
  });

  test("cancels between metadata pages during disposal", async () => {
    let calls = 0;
    let coordinator!: GraphDataCoordinator;
    const { app } = createApp({
      queryPage: async () => {
        calls += 1;
        if (calls === 1) {
          queueMicrotask(() => coordinator.dispose());
          return { rows: [createRow()], nextCursor: "Notes/A.md" };
        }
        return { rows: [] };
      },
    });
    coordinator = new GraphDataCoordinator(app);

    await coordinator.start();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(calls).toBe(1);
  });

  test("rejects a corrupt snapshot and builds from indexed rows", async () => {
    const { app, queryMetadataPage } = createApp({ snapshot: { version: 1 } });
    const coordinator = new GraphDataCoordinator(app);
    const ready = waitForState(
      coordinator,
      (state) => state.status === "ready" && state.graph !== null,
    );

    await coordinator.start();
    await ready;

    expect(queryMetadataPage).toHaveBeenCalledTimes(1);
    expect(coordinator.getState().snapshotOutcome).toBe("corrupt");
    coordinator.dispose();
  });
});
