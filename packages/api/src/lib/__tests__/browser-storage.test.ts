import { describe, expect, it, vi } from "vitest";
import {
  BrowserHandleVaultAdapter,
  type ChangeEvent,
  DirectoryWatcher,
  exportAdapterToDirectoryHandle,
  FileSystemAccessAdapter,
  deleteBrowserLocalVault,
  deleteOrphanOpfsVault,
  clearVaultScopedState,
  generateBrowserVaultId,
  getBootstrapAppearanceMode,
  humanizeOpfsVaultId,
  listOrphanOpfsVaultIds,
  listOpfsVaultIds,
  type NativeWatchSubscription,
  type WatchErrorEvent,
  getCurrentVaultProfile,
  getVaultProfile,
  importDirectoryHandleToAdapter,
  listVaultProfiles,
  MemoryKeyValueStore,
  saveBootstrapAppearanceMode,
  saveVaultProfile,
  ScopedVaultStore,
  type BrowserFileSystemDirectoryHandle,
  type BrowserFileSystemCreateWritableOptions,
  type BrowserFileSystemFileHandle,
  type BrowserFileSystemHandle,
  type BrowserFileSystemWritableFileStream,
} from "../storage";
import {
  InMemoryDataAdapter,
  runDataAdapterConformance,
} from "./data-adapter-conformance";

function notFound(name: string) {
  return Object.assign(new Error(name), { name: "NotFoundError" });
}

function typeMismatch(name: string) {
  return Object.assign(new Error(name), { name: "TypeMismatchError" });
}

function noModificationAllowed(name: string) {
  return Object.assign(new Error(name), {
    name: "NoModificationAllowedError",
  });
}

function notReadable(name: string) {
  return Object.assign(new Error(name), { name: "NotReadableError" });
}

function invalidStateError(name: string) {
  return Object.assign(
    new Error(
      "An operation that depends on state cached in an interface object was made but the state had changed since it was read from disk.",
    ),
    { name: "InvalidStateError" },
  );
}

async function encodeWritableChunk(data: unknown): Promise<Uint8Array> {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  if (data instanceof Blob) {
    return new Uint8Array(await data.arrayBuffer());
  }
  if (ArrayBuffer.isView(data)) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(
      new Uint8Array(
        data.buffer as ArrayBuffer,
        data.byteOffset,
        data.byteLength,
      ),
    );
    return copy;
  }
  if (
    data instanceof ArrayBuffer ||
    Object.prototype.toString.call(data) === "[object ArrayBuffer]"
  ) {
    return new Uint8Array(data as ArrayBuffer);
  }
  throw new TypeError("Unsupported writable chunk");
}

class MockFileHandle implements BrowserFileSystemFileHandle {
  readonly kind = "file";
  private data: Uint8Array = new Uint8Array();
  private modified = Date.now();
  lastCreateWritableOptions: BrowserFileSystemCreateWritableOptions | undefined;
  lastSeekPosition: number | undefined;
  private getFileFailures: Error[] = [];

  constructor(readonly name: string) {}

  failNextGetFile(error: Error): void {
    this.getFileFailures.push(error);
  }

  async getFile(): Promise<Blob & { lastModified?: number; name?: string }> {
    const queuedFailure = this.getFileFailures.shift();
    if (queuedFailure) throw queuedFailure;
    const data = this.data.slice();
    const blob = new Blob([data]) as Blob & {
      lastModified?: number;
      name?: string;
      text(): Promise<string>;
      arrayBuffer(): Promise<ArrayBuffer>;
    };
    blob.lastModified = this.modified;
    blob.name = this.name;
    blob.text = async () => new TextDecoder().decode(data);
    blob.arrayBuffer = async () => data.slice().buffer;
    return blob;
  }

  async createWritable(
    options?: BrowserFileSystemCreateWritableOptions,
  ): Promise<BrowserFileSystemWritableFileStream> {
    this.lastCreateWritableOptions = options;
    let position = 0;
    if (options?.keepExistingData === false) {
      this.data = new Uint8Array();
    }
    return {
      seek: async (nextPosition) => {
        position = nextPosition;
        this.lastSeekPosition = nextPosition;
      },
      write: async (data) => {
        if (typeof data === "object" && data !== null && "type" in data) {
          const chunk = data as {
            type: "write" | "truncate";
            data?: unknown;
            position?: number;
            size?: number;
          };
          if (chunk.type === "truncate") {
            this.data = this.data.slice(0, chunk.size ?? 0);
            this.modified = Date.now();
            return;
          }
          const bytes = await encodeWritableChunk(chunk.data);
          const position = chunk.position ?? 0;
          const next = new Uint8Array(
            Math.max(this.data.byteLength, position + bytes.byteLength),
          );
          next.set(this.data);
          next.set(bytes, position);
          this.data = next;
          this.modified = Date.now();
          return;
        }

        const bytes = await encodeWritableChunk(data);
        if (options?.keepExistingData) {
          const next = new Uint8Array(
            Math.max(this.data.byteLength, position + bytes.byteLength),
          );
          next.set(this.data);
          next.set(bytes, position);
          this.data = next;
          position += bytes.byteLength;
        } else {
          this.data = bytes;
        }
        this.modified = Date.now();
      },
      close: async () => {},
    };
  }
}

class MockDirectoryHandle implements BrowserFileSystemDirectoryHandle {
  readonly kind = "directory";
  private children = new Map<string, BrowserFileSystemHandle>();
  private fileHandleFailures = new Map<string, Error[]>();
  private directoryHandleFailures = new Map<string, Error[]>();
  private removeEntryFailures = new Map<string, Error[]>();

  constructor(readonly name: string) {}

  failNextFileHandle(name: string, error: Error): void {
    const failures = this.fileHandleFailures.get(name) ?? [];
    failures.push(error);
    this.fileHandleFailures.set(name, failures);
  }

  failNextDirectoryHandle(name: string, error: Error): void {
    const failures = this.directoryHandleFailures.get(name) ?? [];
    failures.push(error);
    this.directoryHandleFailures.set(name, failures);
  }

  failNextRemoveEntry(name: string, error: Error): void {
    const failures = this.removeEntryFailures.get(name) ?? [];
    failures.push(error);
    this.removeEntryFailures.set(name, failures);
  }

  async getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<BrowserFileSystemFileHandle> {
    const queuedFailure = this.fileHandleFailures.get(name)?.shift();
    if (queuedFailure) throw queuedFailure;
    const existing = this.children.get(name);
    if (existing?.kind === "file")
      return existing as BrowserFileSystemFileHandle;
    if (existing?.kind === "directory") throw typeMismatch(name);
    if (!options?.create) throw notFound(name);
    const file = new MockFileHandle(name);
    this.children.set(name, file);
    return file;
  }

  async getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<BrowserFileSystemDirectoryHandle> {
    const queuedFailure = this.directoryHandleFailures.get(name)?.shift();
    if (queuedFailure) throw queuedFailure;
    const existing = this.children.get(name);
    if (existing?.kind === "directory") {
      return existing as BrowserFileSystemDirectoryHandle;
    }
    if (existing?.kind === "file") throw typeMismatch(name);
    if (!options?.create) throw notFound(name);
    const folder = new MockDirectoryHandle(name);
    this.children.set(name, folder);
    return folder;
  }

  async removeEntry(name: string, options?: { recursive?: boolean }) {
    const queuedFailure = this.removeEntryFailures.get(name)?.shift();
    if (queuedFailure) throw queuedFailure;
    const existing = this.children.get(name);
    if (!existing) throw notFound(name);
    if (
      existing.kind === "directory" &&
      !options?.recursive &&
      (existing as MockDirectoryHandle).children.size
    ) {
      throw Object.assign(new Error(name), { code: "ENOTEMPTY" });
    }
    this.children.delete(name);
  }

  async *entries(): AsyncIterableIterator<
    [string, BrowserFileSystemFileHandle | BrowserFileSystemDirectoryHandle]
  > {
    for (const [name, handle] of this.children) {
      yield [
        name,
        handle as
          | BrowserFileSystemFileHandle
          | BrowserFileSystemDirectoryHandle,
      ];
    }
  }
}

function createBrowserAdapter(root = new MockDirectoryHandle("mock")) {
  return new BrowserHandleVaultAdapter(root, "opfs", {
    vaultId: `test-${Math.random().toString(16).slice(2)}`,
    name: "Mock vault",
    stateStore: new MemoryKeyValueStore(),
  });
}

runDataAdapterConformance("InMemoryDataAdapter conformance", () => {
  return new InMemoryDataAdapter();
});

runDataAdapterConformance("BrowserHandleVaultAdapter conformance", () => {
  return createBrowserAdapter();
});

describe("BrowserHandleVaultAdapter", () => {
  it("normalizes relative paths for binary reads", async () => {
    const adapter = createBrowserAdapter();
    await adapter.mkdir("assets");
    await adapter.writeBinary(
      "assets/demo.csv",
      new Uint8Array([1, 2, 3]).buffer,
    );

    const bytes = new Uint8Array(await adapter.readBinary("./assets/demo.csv"));

    expect([...bytes]).toEqual([1, 2, 3]);
  });

  it("rejects traversal above the vault root", async () => {
    const adapter = createBrowserAdapter();

    await expect(adapter.write("../outside.md", "nope")).rejects.toThrow();
    await expect(adapter.mkdir("../../outside")).rejects.toThrow();
  });

  it("uses truncating browser writes", async () => {
    const root = new MockDirectoryHandle("mock");
    const adapter = createBrowserAdapter(root);

    await adapter.write("note.md", "longer content");
    await adapter.write("note.md", "short");

    const file = (await root.getFileHandle("note.md")) as MockFileHandle;
    expect(await adapter.read("note.md")).toBe("short");
    expect(file.lastCreateWritableOptions).toEqual({
      keepExistingData: false,
    });
  });

  it("appends through a kept-data writable positioned at the file end", async () => {
    const root = new MockDirectoryHandle("mock");
    const adapter = createBrowserAdapter(root);

    await adapter.write("transcript.jsonl", "one\n");
    await adapter.append("transcript.jsonl", "two\n");

    const file = (await root.getFileHandle(
      "transcript.jsonl",
    )) as MockFileHandle;
    expect(await adapter.read("transcript.jsonl")).toBe("one\ntwo\n");
    expect(file.lastCreateWritableOptions).toEqual({ keepExistingData: true });
    expect(file.lastSeekPosition).toBe(4);
  });

  it("retries transient stale file handles while writing", async () => {
    const root = new MockDirectoryHandle("mock");
    const adapter = createBrowserAdapter(root);
    const configFolder = (await root.getDirectoryHandle(".obsidian", {
      create: true,
    })) as MockDirectoryHandle;
    configFolder.failNextFileHandle(
      "app.json",
      noModificationAllowed("app.json"),
    );

    await adapter.write(".obsidian/app.json", '{"ok":true}');

    expect(await adapter.read(".obsidian/app.json")).toBe('{"ok":true}');
  });

  it("retries transient stale file handles while reading", async () => {
    const root = new MockDirectoryHandle("mock");
    const adapter = createBrowserAdapter(root);
    await adapter.write(".obsidian/app.json", '{"theme":"dark"}');
    const configFolder = (await root.getDirectoryHandle(
      ".obsidian",
    )) as MockDirectoryHandle;
    configFolder.failNextFileHandle("app.json", notReadable("app.json"));

    await expect(adapter.read(".obsidian/app.json")).resolves.toBe(
      '{"theme":"dark"}',
    );
  });

  it("retries InvalidStateError from stale getFile() while reading layout files", async () => {
    const root = new MockDirectoryHandle("mock");
    const adapter = createBrowserAdapter(root);
    await adapter.write(".obsidian/workspace.json", '{"layout":{}}');
    const file = (await (
      await root.getDirectoryHandle(".obsidian")
    ).getFileHandle("workspace.json")) as MockFileHandle;
    file.failNextGetFile(invalidStateError("workspace.json"));

    await expect(adapter.read(".obsidian/workspace.json")).resolves.toBe(
      '{"layout":{}}',
    );
  });

  it("retries InvalidStateError from stale getFile() while stat-ing files", async () => {
    const root = new MockDirectoryHandle("mock");
    const adapter = createBrowserAdapter(root);
    await adapter.write(".obsidian/workspace.json", '{"layout":{}}');
    const file = (await (
      await root.getDirectoryHandle(".obsidian")
    ).getFileHandle("workspace.json")) as MockFileHandle;
    file.failNextGetFile(invalidStateError("workspace.json"));

    await expect(
      adapter.stat(".obsidian/workspace.json"),
    ).resolves.toMatchObject({
      type: "file",
      size: 13,
    });
  });

  it("retries InvalidStateError while creating directories", async () => {
    const root = new MockDirectoryHandle("mock");
    const adapter = createBrowserAdapter(root);
    root.failNextDirectoryHandle(
      ".obsidian",
      invalidStateError("stale mkdir handle"),
    );

    await adapter.mkdir(".obsidian", { recursive: true });

    await expect(adapter.list(".obsidian")).resolves.toMatchObject({
      files: [],
      folders: [],
    });
  });

  it("retries transient stale directory handles while removing", async () => {
    const root = new MockDirectoryHandle("mock");
    const adapter = createBrowserAdapter(root);
    await adapter.write(".obsidian/search.json", "{}");
    const configFolder = (await root.getDirectoryHandle(
      ".obsidian",
    )) as MockDirectoryHandle;
    configFolder.failNextRemoveEntry("search.json", notReadable("search.json"));

    await adapter.remove(".obsidian/search.json");

    await expect(adapter.read(".obsidian/search.json")).rejects.toThrow();
  });

  it("preserves profile creation time when reopening a stored handle", async () => {
    const store = new MemoryKeyValueStore();
    const handle = new MockDirectoryHandle("picked");

    await saveVaultProfile(
      {
        id: "picked-vault",
        name: "Picked vault",
        kind: "file-system-access",
        createdAt: 123,
        updatedAt: 456,
        handle,
      },
      store,
    );

    await FileSystemAccessAdapter.fromHandle(handle, {
      vaultId: "picked-vault",
      stateStore: store,
    });

    expect(await getVaultProfile("picked-vault", store)).toMatchObject({
      createdAt: 123,
      kind: "file-system-access",
    });
  });

  it("imports a directory tree into an adapter and overwrites conflicting paths", async () => {
    const source = new MockDirectoryHandle("source");
    const notes = (await source.getDirectoryHandle("notes", {
      create: true,
    })) as MockDirectoryHandle;
    const nested = (await source.getDirectoryHandle("nested", {
      create: true,
    })) as MockDirectoryHandle;
    const nestedFolder = (await nested.getDirectoryHandle("folder", {
      create: true,
    })) as MockDirectoryHandle;
    const alpha = await notes.getFileHandle("alpha.md", { create: true });
    const binary = await source.getFileHandle("payload.bin", { create: true });
    const nestedFile = await nestedFolder.getFileHandle("beta.md", {
      create: true,
    });

    await (await alpha.createWritable()).write("alpha");
    await (await binary.createWritable()).write(new Uint8Array([1, 2, 3]));
    await (await nestedFile.createWritable()).write("beta");

    const target = new InMemoryDataAdapter();
    await target.write("notes", "conflicting file");
    await target.mkdir("payload.bin");
    await target.write("payload.bin/old.txt", "stale");

    const seen: Array<{
      totalFiles: number;
      importedFiles: number;
      currentPath: string | null;
    }> = [];
    const result = await importDirectoryHandleToAdapter(source, target, {
      onProgress: (progress) => {
        seen.push(progress);
      },
    });

    expect(await target.read("notes/alpha.md")).toBe("alpha");
    expect(await target.read("nested/folder/beta.md")).toBe("beta");
    expect([...new Uint8Array(await target.readBinary("payload.bin"))]).toEqual(
      [1, 2, 3],
    );
    expect(await target.exists("payload.bin/old.txt")).toBe(false);
    expect(result).toMatchObject({ totalFiles: 3, importedFiles: 3 });
    expect(seen[0]).toMatchObject({ totalFiles: 3, importedFiles: 0 });
    expect(seen.at(-1)).toMatchObject({
      totalFiles: 3,
      importedFiles: 3,
      currentPath: "payload.bin",
    });
  });

  it("exports an adapter tree into a directory handle and overwrites conflicting paths", async () => {
    const source = new InMemoryDataAdapter();
    await source.mkdir("notes");
    await source.mkdir("nested");
    await source.mkdir("nested/folder");
    await source.write("notes/alpha.md", "alpha");
    await source.writeBinary("payload.bin", new Uint8Array([1, 2, 3]).buffer);
    await source.write("nested/folder/beta.md", "beta");

    const target = new MockDirectoryHandle("target");
    const conflictingFolder = (await target.getDirectoryHandle("payload.bin", {
      create: true,
    })) as MockDirectoryHandle;
    await conflictingFolder.getFileHandle("old.txt", { create: true });
    const notesFile = await target.getFileHandle("notes", { create: true });
    await (await notesFile.createWritable()).write("stale");

    const seen: Array<{
      totalFiles: number;
      exportedFiles: number;
      currentPath: string | null;
    }> = [];
    const result = await exportAdapterToDirectoryHandle(source, target, {
      onProgress: (progress) => {
        seen.push(progress);
      },
    });

    const exportedNotes = (await target.getDirectoryHandle(
      "notes",
    )) as MockDirectoryHandle;
    const alpha = await exportedNotes.getFileHandle("alpha.md");
    const payload = await target.getFileHandle("payload.bin");
    const exportedNested = (await target.getDirectoryHandle(
      "nested",
    )) as MockDirectoryHandle;
    const exportedFolder = (await exportedNested.getDirectoryHandle(
      "folder",
    )) as MockDirectoryHandle;
    const beta = await exportedFolder.getFileHandle("beta.md");

    expect(await (await alpha.getFile()).text()).toBe("alpha");
    expect(await (await beta.getFile()).text()).toBe("beta");
    expect([
      ...new Uint8Array(await (await payload.getFile()).arrayBuffer()),
    ]).toEqual([1, 2, 3]);
    expect(result).toMatchObject({ totalFiles: 3, exportedFiles: 3 });
    expect(seen[0]).toMatchObject({ totalFiles: 3, exportedFiles: 0 });
    expect(seen.at(-1)).toMatchObject({
      totalFiles: 3,
      exportedFiles: 3,
      currentPath: "payload.bin",
    });
  });
});

describe("DirectoryWatcher", () => {
  it("emits the changed path through specific and all events", async () => {
    const adapter = new InMemoryDataAdapter();
    const watcher = new DirectoryWatcher(adapter, 5);
    await adapter.mkdir("notes");
    const seen: string[] = [];
    const all: string[] = [];

    watcher.on("create", (path) => seen.push(path));
    watcher.on("all", (event) => {
      if (event.type === "create") all.push(event.path);
    });
    watcher.watch("/", { recursive: true, interval: 5 });

    await new Promise((resolve) => setTimeout(resolve, 20));
    await adapter.write("notes/new.md", "new");
    await new Promise((resolve) => setTimeout(resolve, 30));
    watcher.close();

    expect(seen).toContain("notes/new.md");
    expect(all).toContain("notes/new.md");
  });

  it("prefers adapter-provided native watch events when available", async () => {
    class NativeWatchAdapterStub extends InMemoryDataAdapter {
      watchCalls: Array<{ path: string | string[]; recursive: boolean }> = [];
      listener: ((event: ChangeEvent | WatchErrorEvent) => void) | null = null;

      getCapabilities() {
        return {
          persistent: false,
          userVisibleFiles: false,
          requiresPermission: false,
          nativeWatch: true,
          resourceUrls: false,
          systemTrash: false,
        };
      }

      watch(
        path: string | string[],
        options: { recursive?: boolean },
        listener: (event: ChangeEvent | WatchErrorEvent) => void,
      ): NativeWatchSubscription {
        this.watchCalls.push({ path, recursive: options.recursive ?? false });
        this.listener = listener;
        return {
          close: () => {
            this.listener = null;
          },
        };
      }
    }

    const adapter = new NativeWatchAdapterStub();
    const watcher = new DirectoryWatcher(adapter, 5);
    const seen: string[] = [];
    const all: string[] = [];

    watcher.on("modify", (path) => seen.push(path));
    watcher.on("all", (event) => {
      if (event.type === "modify") {
        all.push(event.path);
      }
    });

    watcher.watch("/", { recursive: true, interval: 5 });
    adapter.listener?.({ type: "modify", path: "/notes/live.md" });
    watcher.close();

    expect(adapter.watchCalls).toEqual([{ path: "/", recursive: true }]);
    expect(seen).toEqual(["notes/live.md"]);
    expect(all).toEqual(["notes/live.md"]);
    expect(adapter.listener).toBeNull();
  });
});

describe("vault IndexedDB state helpers", () => {
  it("stores vault profiles in recency order and scopes generated state by vault id", async () => {
    const store = new MemoryKeyValueStore();
    await saveVaultProfile(
      {
        id: "vault-a",
        name: "Vault A",
        kind: "opfs",
        createdAt: 1,
        updatedAt: 2,
      },
      store,
    );
    await saveVaultProfile(
      {
        id: "vault-b",
        name: "Vault B",
        kind: "desktop-folder",
        createdAt: 3,
        updatedAt: 4,
      },
      store,
    );

    expect(await getCurrentVaultProfile(store)).toMatchObject({
      id: "vault-b",
      kind: "desktop-folder",
    });
    expect(
      (await listVaultProfiles(store)).map((profile) => profile.id),
    ).toEqual(["vault-b", "vault-a"]);

    const a = new ScopedVaultStore("vault-a", "metadata", store);
    const b = new ScopedVaultStore("vault-b", "metadata", store);
    await a.set("fileCache", "a");
    await b.set("fileCache", "b");

    expect(await a.get("fileCache")).toBe("a");
    expect(await b.get("fileCache")).toBe("b");
  });

  it("persists the bootstrap appearance mode alongside vault profiles", async () => {
    const store = new MemoryKeyValueStore();

    expect(await getBootstrapAppearanceMode(store)).toBe("system");

    await saveBootstrapAppearanceMode("dark", store);

    expect(await getBootstrapAppearanceMode(store)).toBe("dark");
  });

  it("generates unique browser vault ids from names", () => {
    const first = generateBrowserVaultId("opfs", "My Notes");
    const second = generateBrowserVaultId("opfs", "My Notes");

    expect(first).toMatch(/^opfs-my-notes-[a-z0-9]{4}$/);
    expect(second).toMatch(/^opfs-my-notes-[a-z0-9]{4}$/);
    expect(first).not.toBe(second);
  });

  it("lists OPFS vault directories and orphan ids missing from profiles", async () => {
    const originalNavigator = globalThis.navigator;
    const root = new MockDirectoryHandle("opfs-root");
    const vaults = await root.getDirectoryHandle("vaults", { create: true });
    await vaults.getDirectoryHandle("opfs-default", { create: true });
    await vaults.getDirectoryHandle("opfs-notes-ab12", { create: true });

    try {
      vi.stubGlobal("navigator", {
        ...originalNavigator,
        storage: {
          getDirectory: vi.fn(async () => root),
        },
      });

      expect(await listOpfsVaultIds()).toEqual([
        "opfs-default",
        "opfs-notes-ab12",
      ]);
      expect(humanizeOpfsVaultId("opfs-notes-ab12")).toBe("Notes");
      expect(humanizeOpfsVaultId("opfs-default")).toBe("Default");

      const store = new MemoryKeyValueStore();
      await saveVaultProfile(
        {
          id: "opfs-default",
          name: "Default",
          kind: "opfs",
          createdAt: 1,
          updatedAt: 2,
        },
        store,
      );

      expect(await listOrphanOpfsVaultIds(store)).toEqual(["opfs-notes-ab12"]);
    } finally {
      vi.stubGlobal("navigator", originalNavigator);
    }
  });
});

describe("delete browser-local vault data", () => {
  it("clears scoped vault state keys for a vault id", async () => {
    const store = new MemoryKeyValueStore();
    const scoped = new ScopedVaultStore("vault-delete", "app-database", store);
    await scoped.set("state", { files: [] });
    await saveVaultProfile(
      {
        id: "vault-delete",
        name: "Delete me",
        kind: "opfs",
        createdAt: 1,
        updatedAt: 2,
      },
      store,
    );

    await clearVaultScopedState("vault-delete", store);

    expect(await scoped.get("state")).toBeUndefined();
    expect(await getVaultProfile("vault-delete", store)).toMatchObject({
      id: "vault-delete",
    });
  });

  it("deletes OPFS vault directories, scoped state, and profiles", async () => {
    const originalNavigator = globalThis.navigator;
    const root = new MockDirectoryHandle("opfs-root");
    const vaults = await root.getDirectoryHandle("vaults", { create: true });
    await vaults.getDirectoryHandle("opfs-notes-ab12", { create: true });
    const store = new MemoryKeyValueStore();
    await saveVaultProfile(
      {
        id: "opfs-notes-ab12",
        name: "Notes",
        kind: "opfs",
        createdAt: 1,
        updatedAt: 2,
      },
      store,
    );
    const scoped = new ScopedVaultStore(
      "opfs-notes-ab12",
      "browser-stats",
      store,
    );
    await scoped.set("Welcome.md", { mtime: 1 });

    const deleteDatabase = vi.fn((_name: string) => {
      const request = {
        onsuccess: null as null | (() => void),
        onerror: null as null | (() => void),
        onblocked: null as null | (() => void),
      };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    });

    try {
      vi.stubGlobal("navigator", {
        ...originalNavigator,
        storage: {
          getDirectory: vi.fn(async () => root),
        },
      });
      vi.stubGlobal("indexedDB", { deleteDatabase });

      await deleteBrowserLocalVault(
        { id: "opfs-notes-ab12", kind: "opfs" },
        { stateStore: store },
      );

      expect(await listOpfsVaultIds()).toEqual([]);
      expect(await getVaultProfile("opfs-notes-ab12", store)).toBeUndefined();
      expect(await scoped.get("Welcome.md")).toBeUndefined();
    } finally {
      vi.stubGlobal("navigator", originalNavigator);
    }
  });

  it("deletes orphan OPFS vault directories without removing profiles", async () => {
    const originalNavigator = globalThis.navigator;
    const root = new MockDirectoryHandle("opfs-root");
    const vaults = await root.getDirectoryHandle("vaults", { create: true });
    await vaults.getDirectoryHandle("opfs-notes-ab12", { create: true });
    await vaults.getDirectoryHandle("opfs-default", { create: true });
    const store = new MemoryKeyValueStore();
    await saveVaultProfile(
      {
        id: "opfs-default",
        name: "Default",
        kind: "opfs",
        createdAt: 1,
        updatedAt: 2,
      },
      store,
    );

    try {
      vi.stubGlobal("navigator", {
        ...originalNavigator,
        storage: {
          getDirectory: vi.fn(async () => root),
        },
      });

      await deleteOrphanOpfsVault("opfs-notes-ab12", { stateStore: store });

      expect(await listOpfsVaultIds()).toEqual(["opfs-default"]);
      expect(await getVaultProfile("opfs-default", store)).toMatchObject({
        id: "opfs-default",
      });
    } finally {
      vi.stubGlobal("navigator", originalNavigator);
    }
  });

  it("rejects deleting unsupported browser-local vault kinds", async () => {
    const store = new MemoryKeyValueStore();

    await expect(
      deleteBrowserLocalVault(
        { id: "desktop-folder:/vault", kind: "desktop-folder" },
        { stateStore: store },
      ),
    ).rejects.toThrow("Cannot delete browser-local vault kind: desktop-folder");
  });
});
