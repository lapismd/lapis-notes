import { afterEach, expect, it, vi } from "vitest";
import { Plugin } from "../plugin";
import { md5 } from "../utils";
import { MetadataCache } from "../cache.svelte";
import { EventDispatcher } from "../events";
import { IndexProjectionRegistry, MemoryAppDatabase } from "../storage";
import { TFile } from "../storage/fs";
import { NoopTelemetryService } from "../telemetry";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

const caches: MetadataCache[] = [];
afterEach(async () => {
  await Promise.all(caches.splice(0).map((cache) => cache.dispose()));
  vi.useRealTimers();
});
const status = {
  passes: 1,
  indexed: 1,
  deleted: 0,
  pending: 0,
  error: null,
  active: false,
  processed: 1,
  total: 1,
  phase: "idle",
};
async function fixture(native = true) {
  const adapter = new InMemoryDataAdapter();
  await adapter.write("Note.md", "# Source\n");
  const database = new MemoryAppDatabase("native-port-test");
  await database.open();
  let observe!: Parameters<typeof database.subscribeToChanges>[0];
  const subscribe = database.subscribeToChanges.bind(database);
  database.subscribeToChanges = (listener) => {
    observe = listener;
    return subscribe(listener);
  };
  const file = new TFile("Note.md", { ctime: 0, mtime: 1, size: 9 }, null);
  const vault = Object.assign(new EventDispatcher(), {
    adapter,
    getFileByPath: (path: string) => (path === file.path ? file : null),
    getFiles: () => [file],
    iterateFiles: function* () {
      yield file;
    },
    getMarkdownFiles: () => [file],
    read: (file: TFile) => adapter.read(file.path),
    cachedRead: (file: TFile) => adapter.read(file.path),
  });
  const call = vi.fn(async (_command: { kind: string }) => ({
    status,
    contribution: null,
  }));
  const progress = { report: vi.fn(), throwIfCancellationRequested() {} };
  const app = {
    ...(native ? { session: { backgroundIndexing: { call } } } : {}),
    plugins: { plugins: new Map() },
    appDatabase: database,
    indexProjections: new IndexProjectionRegistry(),
    telemetry: new NoopTelemetryService(),
    metadataTypeManager: { types: {}, determinePropertyType: () => undefined },
    notifications: {
      withProgress: async (
        _options: unknown,
        run: (p: typeof progress) => unknown,
      ) => run(progress),
      notify: vi.fn(),
    },
    vault,
  };
  const cache = new MetadataCache(app as any);
  Object.assign(app, { metadataCache: cache });
  caches.push(cache);
  const processor = {
    read: vi.fn(async () => ({ headings: [] })),
    write: () => "",
  };
  cache.addProcessor("md", processor);
  return {
    app,
    cache,
    call,
    database,
    processor,
    file,
    progress,
    reset: () =>
      observe({
        revision: 10,
        committedAt: Date.now(),
        domains: ["metadata"],
        paths: [],
        reset: true,
      }),
  };
}

it("selects native metadata without invoking the JavaScript writer", async () => {
  const f = await fixture();
  const write = vi.spyOn(f.database, "upsertIndexedFile");
  await f.cache.load();
  expect(f.call).toHaveBeenCalledWith({ kind: "select_metadata" });
  expect(f.call).toHaveBeenCalledWith({ kind: "refresh", rebuild: false });
  expect(f.processor.read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  expect(f.cache.initialized).toBe(true);
});

it("retains browser processing when the session has no native port", async () => {
  const f = await fixture(false);
  const write = vi.spyOn(f.database, "upsertIndexedFile");
  await f.cache.load();
  expect(f.call).not.toHaveBeenCalled();
  expect(f.processor.read).toHaveBeenCalledOnce();
  expect(write).toHaveBeenCalledOnce();
});

it("rebuild and vault events never activate renderer publication", async () => {
  const f = await fixture();
  const writes = [
    "upsertIndexedFile",
    "deleteIndexedFile",
    "renameIndexedFile",
    "saveMetadataSnapshot",
    "setMeta",
  ].map((name) => vi.spyOn(f.database as any, name));
  await f.cache.load();
  const deleted = vi.fn();
  f.cache.on("deleted", deleted);
  f.app.vault.emit("all", "modify", f.file);
  f.app.vault.emit("rename", f.file, "Previous.md");
  f.app.vault.emit("all", "delete", f.file);
  expect(deleted).toHaveBeenCalledWith(f.file, null);
  await f.cache.rebuild();
  await f.cache.flushSnapshotSave();
  await f.cache.dispose();
  expect(f.call).toHaveBeenCalledWith({ kind: "refresh", rebuild: true });
  for (const write of writes) expect(write).not.toHaveBeenCalled();
  expect(
    f.call.mock.calls.some(
      ([command]) => command.kind === "disable_projection",
    ),
  ).toBe(false);
});

it("native load failure rejects without calling a browser fallback", async () => {
  const f = await fixture();
  f.call.mockRejectedValueOnce(new Error("native unavailable"));
  const write = vi.spyOn(f.database, "upsertIndexedFile");
  await expect(f.cache.load()).rejects.toThrow("native unavailable");
  expect(f.processor.read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  expect(f.cache.initialized).toBe(false);
});

it("committed native metadata refreshes the cache and compatibility events", async () => {
  const f = await fixture();
  await f.cache.load();
  const changed = vi.fn();
  const indexed = vi.fn();
  f.cache.on("changed", changed);
  f.cache.on("index-changed", indexed);
  const metadata = { headings: [{ heading: "Source", level: 1 }] };
  const record = {
    file: {
      path: "Note.md",
      normalizedPath: "Note.md",
      indexed: true,
      extension: "md",
      mtime: 1,
      size: 9,
      hash: md5("# Source\n"),
      deleted: false,
    },
    metadata: {
      path: "Note.md",
      hash: md5("# Source\n"),
      parserVersion: "opaque-native-parser",
      metadata,
    },
    links: [],
    tags: [],
    properties: [],
  };
  await f.database.upsertIndexedFile(record);
  await vi.waitFor(() =>
    expect(changed).toHaveBeenCalledWith(f.file, "# Source\n", metadata),
  );
  expect(f.cache.getCache("Note.md")).toEqual(metadata);
  expect(indexed).toHaveBeenCalled();
  changed.mockClear();
  await f.database.upsertIndexedFile({
    ...record,
    file: { ...record.file, hash: md5("stale") },
    metadata: { ...record.metadata, hash: md5("stale") },
  });
  await vi.waitFor(() => expect(indexed.mock.calls.length).toBeGreaterThan(1));
  expect(changed).not.toHaveBeenCalled();
});

function pluginFor(f: Awaited<ReturnType<typeof fixture>>) {
  const project = vi.fn(() => ({ rows: [] }));
  class DocsPlugin extends Plugin {
    handle: any;
    onload() {
      this.handle = this.registerIndexProjection({
        id: "note",
        version: 1,
        fields: {},
        source: { pathPrefix: "docs" },
        project,
      });
    }
  }
  const plugin = new DocsPlugin(
    f.app as any,
    { id: "docs", name: "Docs", version: "1", author: "Lapis" } as any,
  );
  plugin.configureRuntime({ source: "core" });
  f.call.mockImplementation(
    async (command: any) =>
      ({
        status,
        contribution:
          command.kind === "register_projection"
            ? { projection_id: "docs/note", placement: "native", message: null }
            : null,
      }) as any,
  );
  return { plugin, project };
}

it("native projections retain query handles and explicit disable drains the service", async () => {
  const f = await fixture();
  const register = vi.spyOn(f.database, "registerProjectionDefinition");
  const unregister = vi.spyOn(f.database, "unregisterProjectionDefinition");
  const query = vi.spyOn(f.database, "queryProjection").mockResolvedValue({
    rows: [],
    revision: 1,
    complete: true,
    indexStatus: "ready",
  });
  const { plugin, project } = pluginFor(f);
  await plugin.enable();
  expect(f.call).toHaveBeenCalledWith({
    kind: "register_projection",
    contribution: {
      projection_id: "docs/note",
      owner_plugin_id: "docs",
      schema_version: 1,
      configuration_hash: "",
      path_prefix: "docs",
    },
  });
  await plugin.handle.query({});
  expect(query).toHaveBeenCalledWith("docs/note", {}, "docs");
  await plugin.disable();
  expect(f.call).toHaveBeenCalledWith({
    kind: "disable_projection",
    projection_id: "docs/note",
  });
  expect(project).not.toHaveBeenCalled();
  expect(register).not.toHaveBeenCalled();
  expect(unregister).not.toHaveBeenCalled();
});

it("App detach removes observers without disabling a native projection", async () => {
  const f = await fixture();
  const { plugin } = pluginFor(f);
  await plugin.enable();
  await f.cache.dispose();
  await plugin.disable();
  expect(
    f.call.mock.calls.some(
      ([command]) => command.kind === "disable_projection",
    ),
  ).toBe(false);
  expect(f.app.indexProjections.get("docs/note")).toBeUndefined();
});

it("unsupported processors are visible while their callbacks remain local pure reads", async () => {
  const f = await fixture();
  f.call.mockImplementation(
    async (command: any) =>
      ({
        status,
        contribution:
          command.kind === "register_processor"
            ? {
                projection_id: "processor:custom/md",
                placement: "client_dependent",
                message: "Requires a client",
              }
            : null,
      }) as any,
  );
  f.cache.addProcessor("md", f.processor, "custom");
  await f.cache.load();
  expect(f.cache.nativeContributionStatuses).toEqual([
    {
      projection_id: "processor:custom/md",
      placement: "client_dependent",
      message: "Requires a client",
    },
  ]);
  expect(f.app.notifications.notify).toHaveBeenCalledOnce();
  expect(f.processor.read).not.toHaveBeenCalled();
  await f.cache.read("# Source\n", f.file);
  expect(f.processor.read).toHaveBeenCalledOnce();
});

it("reports service-owned progress and clears only its observer on detach", async () => {
  vi.useFakeTimers();
  const f = await fixture();
  let finish!: (value: any) => void;
  const accepted = new Promise<any>((resolve) => {
    finish = resolve;
  });
  f.call.mockImplementation(async (command: any) =>
    command.kind === "refresh"
      ? accepted
      : ({
          status: {
            ...status,
            active: true,
            phase: "metadata",
            processed: 1,
            total: 20,
          },
          contribution: null,
        } as any),
  );
  const loaded = vi.fn();
  f.cache.on("loaded", loaded);
  const load = f.cache.load();
  await vi.waitFor(() =>
    expect(f.call).toHaveBeenCalledWith({ kind: "refresh", rebuild: false }),
  );
  await vi.advanceTimersByTimeAsync(100);
  expect(f.progress.report).toHaveBeenCalledWith({
    current: 1,
    total: 20,
    message: "Indexing metadata",
  });
  await f.cache.dispose();
  expect(vi.getTimerCount()).toBe(0);
  finish({ status, contribution: null });
  await load;
  expect(loaded).not.toHaveBeenCalled();
  expect(
    f.call.mock.calls.some(
      ([command]) => command.kind === "disable_projection",
    ),
  ).toBe(false);
});

it("native observer reset rebuilds an active compatibility snapshot lease", async () => {
  const f = await fixture();
  await f.cache.load();
  const metadata = { frontmatter: { title: "Source" } };
  await f.database.upsertIndexedFile({
    file: {
      path: "Note.md",
      normalizedPath: "Note.md",
      extension: "md",
      indexed: true,
      mtime: 1,
      size: 9,
      hash: md5("# Source\n"),
    },
    metadata: {
      path: "Note.md",
      hash: md5("# Source\n"),
      parserVersion: "opaque-native-parser",
      metadata,
    },
    links: [],
    tags: [],
    properties: [],
  });
  const lease = await f.cache.acquireMetadataSnapshotLease();
  f.reset();
  await vi.waitFor(() => expect(f.cache.getCache("Note.md")).toEqual(metadata));
  expect(f.cache.fileCache["Note.md"].hash).toBe(md5("# Source\n"));
  lease.release();
});

it("native contribution failure rolls back local plugin resources without replaying a writer", async () => {
  const f = await fixture();
  const { plugin, project } = pluginFor(f);
  f.call.mockImplementation(async (command: any) => {
    if (command.kind === "register_projection")
      throw new Error("native outcome unavailable");
    return { status, contribution: null };
  });
  await expect(plugin.enable()).rejects.toThrow("native outcome unavailable");
  expect(plugin.loaded).toBe(false);
  expect(plugin.state).toBe("failed");
  expect(f.app.indexProjections.get("docs/note")).toBeUndefined();
  expect(project).not.toHaveBeenCalled();
  expect(
    f.call.mock.calls.filter(
      ([command]) => command.kind === "register_projection",
    ),
  ).toHaveLength(1);
  expect(
    f.call.mock.calls.some(
      ([command]) => command.kind === "disable_projection",
    ),
  ).toBe(false);
});

it("retains committed index notifications when source bytes disappear during observation", async () => {
  const f = await fixture();
  await f.cache.load();
  vi.spyOn(f.app.vault, "read").mockRejectedValue(
    new Error("source disappeared"),
  );
  const indexed = vi.fn();
  const changed = vi.fn();
  f.cache.on("index-changed", indexed);
  f.cache.on("changed", changed);
  await f.database.upsertIndexedFile({
    file: {
      path: "Note.md",
      normalizedPath: "Note.md",
      extension: "md",
      indexed: true,
      mtime: 1,
      size: 9,
      hash: md5("# Source\n"),
    },
    metadata: {
      path: "Note.md",
      hash: md5("# Source\n"),
      parserVersion: "opaque-native-parser",
      metadata: {},
    },
    links: [],
    tags: [],
    properties: [],
  });
  await vi.waitFor(() => expect(indexed).toHaveBeenCalledOnce());
  expect(changed).not.toHaveBeenCalled();
});
