import { expect, it, vi } from "vitest";
import { VaultChangeService } from "../vault-changes";
import { Vault } from "../storage/vault.svelte";
import { type ChangeEvent, type WatchErrorEvent, TFile } from "../storage/fs";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { EventDispatcher } from "../events";
import { FileView } from "../view.svelte";
import { Editor } from "../editor.svelte";
import { FileManager } from "../file-manager";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

class WatchedAdapter extends InMemoryDataAdapter {
  ready: Promise<void> | undefined;
  close = vi.fn(async () => {});
  callbacks: Array<(event: ChangeEvent | WatchErrorEvent) => void> = [];
  getCapabilities() {
    return { nativeWatch: true, conditionalTextWrite: true };
  }
  async writeTextIfUnchanged(
    path: string,
    data: string,
    expected: string | null,
  ) {
    const current = await this.read(path).catch(() => null);
    if (current !== expected)
      throw Object.assign(new Error("external change"), { code: "ECONFLICT" });
    await this.write(path, data);
  }
  watch(
    _path: string | string[],
    _options: unknown,
    callback: (event: ChangeEvent | WatchErrorEvent) => void,
  ) {
    this.callbacks.push(callback);
    return { ready: this.ready, close: this.close };
  }
  emit(event: ChangeEvent | WatchErrorEvent) {
    this.callbacks.at(-1)?.(event);
  }
}
async function fixture() {
  const adapter = new WatchedAdapter();
  await adapter.write("note.md", "before");
  const operations = new FileEditingSessionRegistry();
  const vault = new Vault(adapter, operations);
  await vault.load();
  const workspace = Object.assign(new EventDispatcher(), {
    iterateAllLeaves: vi.fn(),
    requestSaveLayout: vi.fn(),
    reconcileFileReference: vi.fn(),
  });
  const app = {
    vault,
    workspace,
    fileEditingSessions: operations,
    notifications: { notify: vi.fn() },
  } as any;
  const changes = new VaultChangeService(app);
  return { adapter, app, vault, workspace, changes, operations };
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it("registers before initial reconciliation and waits for actual native readiness", async () => {
  const { adapter, vault, changes } = await fixture();
  const gate = deferred();
  adapter.ready = gate.promise;
  const reconcile = vi.spyOn(vault, "reconcile");
  const starting = changes.start();
  await vi.waitFor(() => expect(adapter.callbacks).toHaveLength(1));
  expect(reconcile).not.toHaveBeenCalled();
  await adapter.write("arrived.md", "during registration");
  gate.resolve();
  await starting;
  expect(vault.getFileByPath("arrived.md")).not.toBeNull();
  await changes.stop();
});

it("ingests external create/modify/delete into the existing tree and workspace event", async () => {
  const { adapter, vault, workspace, changes } = await fixture();
  await changes.start();
  const changed = vi.fn();
  workspace.on("file-change", changed);
  await adapter.write("new.md", "new");
  adapter.emit({ type: "create", path: "new.md" });
  await changes.settle();
  expect(vault.getFileByPath("new.md")).not.toBeNull();
  await adapter.write("note.md", "external");
  adapter.emit({ type: "modify", path: "note.md" });
  await changes.settle();
  expect(
    changed.mock.calls.some(
      ([file, event]) => file.path === "note.md" && event === "modify",
    ),
  ).toBe(true);
  await adapter.remove("new.md");
  adapter.emit({ type: "delete", path: "new.md" });
  await changes.settle();
  expect(vault.getFileByPath("new.md")).toBeNull();
  await changes.stop();
});

it("coalesces consecutive physical renames without losing the original identity", async () => {
  const { adapter, vault, changes } = await fixture();
  await changes.start();
  const file = vault.getFiles()[0];
  await adapter.rename("note.md", "middle.md");
  adapter.emit({ type: "create", path: "middle.md", previousPath: "note.md" });
  await adapter.rename("middle.md", "final.md");
  adapter.emit({ type: "create", path: "final.md", previousPath: "middle.md" });
  await changes.settle();
  expect(vault.getFiles()).toEqual([file]);
  expect(file?.path).toBe("final.md");
  await changes.stop();
});

it("keeps the complete tree and reports uncertainty before a successful retry", async () => {
  const { adapter, vault, app, changes } = await fixture();
  await changes.start();
  const file = vault.getFiles()[0];
  vi.spyOn(adapter, "list").mockRejectedValueOnce(
    new Error("unreadable directory"),
  );
  adapter.emit({ type: "error", path: "/", error: new Error("overflow") });
  await expect(changes.settle()).rejects.toThrow("unreadable directory");
  expect(vault.getFiles()).toEqual([file]);
  expect(app.notifications.notify).toHaveBeenCalled();
  await changes.settle();
  await changes.stop();
});

it("retires queued callbacks, drains an active scan and re-registers after a failed leave", async () => {
  const { adapter, vault, changes } = await fixture();
  await changes.start();
  const oldCallback = adapter.callbacks[0]!;
  const gate = deferred();
  const stat = adapter.stat.bind(adapter);
  let scanning = false;
  vi.spyOn(adapter, "stat").mockImplementationOnce(async (path) => {
    scanning = true;
    await gate.promise;
    return stat(path);
  });
  await adapter.write("new.md", "external");
  adapter.emit({ type: "create", path: "new.md" });
  const working = changes.settle();
  await vi.waitFor(() => expect(scanning).toBe(true));
  let stopped = false;
  const stopping = changes.stop().then(() => {
    stopped = true;
  });
  oldCallback({ type: "create", path: "retired.md" });
  await Promise.resolve();
  expect(stopped).toBe(false);
  gate.resolve();
  await working;
  await stopping;
  expect(vault.getFileByPath("new.md")).toBeNull();
  await changes.start();
  expect(vault.getFileByPath("new.md")).toBeInstanceOf(TFile);
  oldCallback({ type: "delete", path: "note.md" });
  await changes.settle();
  expect(vault.getFileByPath("note.md")).not.toBeNull();
  await changes.stop();
});

function openView(app: any) {
  class TestView extends FileView {
    onLoadFile() {
      return Promise.resolve();
    }
    onUnloadFile() {
      return Promise.resolve();
    }
    onRename() {
      return Promise.resolve();
    }
    canAcceptExtension() {
      return true;
    }
    getViewType() {
      return "test-file";
    }
    getDisplayText() {
      return "Test file";
    }
    protected onOpen() {
      return Promise.resolve();
    }
    protected onClose() {
      return Promise.resolve();
    }
  }
  const view = new TestView({ application: app } as any);
  view.file = app.vault.getFileByPath("note.md");
  view.onRename = vi.fn(async (file) => {
    view.file = file.copy();
  });
  const leaf = { view, setViewState: vi.fn(async () => {}) };
  app.workspace.iterateAllLeaves.mockImplementation((callback: any) => {
    callback(leaf);
  });
  return { view, leaf };
}

it("uses existing file-view rename and empty-view lifecycle for clean external changes", async () => {
  const { app, adapter, changes } = await fixture();
  const { view, leaf } = openView(app);
  await changes.start();
  await adapter.rename("note.md", "renamed.md");
  adapter.emit({ type: "create", path: "renamed.md", previousPath: "note.md" });
  await changes.settle();
  expect(view.onRename).toHaveBeenCalledWith(
    expect.objectContaining({ path: "renamed.md" }),
  );
  expect(app.workspace.requestSaveLayout).toHaveBeenCalled();
  await adapter.remove("renamed.md");
  adapter.emit({ type: "delete", path: "renamed.md" });
  await changes.settle();
  expect(leaf.setViewState).toHaveBeenCalledWith({ type: "empty", state: {} });
  await changes.stop();
});

it("retains views and reports external rename/delete when dirty writers remain", async () => {
  const { app, adapter, changes, operations } = await fixture();
  const { view, leaf } = openView(app);
  const writer = {
    dirty: true,
    flush: vi.fn(async () => {}),
    protect: vi.fn(async () => () => {}),
  };
  const retire = operations.register("note.md", writer);
  retire();
  await changes.start();
  await adapter.rename("note.md", "moved.md");
  adapter.emit({ type: "create", path: "moved.md", previousPath: "note.md" });
  await changes.settle();
  expect(view.onRename).not.toHaveBeenCalled();
  expect(leaf.setViewState).not.toHaveBeenCalled();
  expect(view.file?.path).toBe("note.md");
  expect(app.notifications.notify).toHaveBeenCalledWith(
    expect.objectContaining({ message: expect.stringContaining("note.md") }),
  );
  expect(writer.flush).not.toHaveBeenCalled();
  writer.dirty = false;
  await changes.stop();
});

it("cancels a start that is still waiting for previous cleanup", async () => {
  const { adapter, changes } = await fixture();
  const starting = changes.start();
  const stopping = changes.stop();
  await starting;
  await stopping;
  expect(adapter.callbacks).toHaveLength(0);
});

it("retains failed native cleanup and retries it before registering again", async () => {
  const { adapter, changes } = await fixture();
  await changes.start();
  adapter.close.mockRejectedValueOnce(new Error("native cleanup failed"));
  await expect(changes.stop()).rejects.toThrow("cleanup failed");
  await changes.start();
  expect(adapter.close).toHaveBeenCalledTimes(2);
  expect(adapter.callbacks).toHaveLength(2);
  await changes.stop();
});

it("bounds accumulated hints and requests a complete snapshot after overflow", async () => {
  const { adapter, vault, changes } = await fixture();
  await changes.start();
  const reconcile = vi.spyOn(vault, "reconcile");
  await adapter.write("overflow.md", "real");
  for (let index = 0; index < 2100; index++)
    adapter.emit({ type: "create", path: `hint-${index}.md` });
  await changes.settle();
  expect(reconcile.mock.calls[0]?.[0]).toEqual([]);
  expect(
    vault
      .getFiles()
      .map((file) => file.path)
      .sort(),
  ).toEqual(["note.md", "overflow.md"]);
  await changes.stop();
});

it("limits automatic scan retries while preserving explicit recovery", async () => {
  const { adapter, vault, changes } = await fixture();
  await changes.start();
  vi.useFakeTimers();
  try {
    const list = vi
      .spyOn(adapter, "list")
      .mockRejectedValue(new Error("temporarily unreadable"));
    adapter.emit({
      type: "error",
      path: "/",
      error: new Error("reconcile needed"),
    });
    await vi.advanceTimersByTimeAsync(10000);
    expect(list).toHaveBeenCalledTimes(5);
    expect(vi.getTimerCount()).toBe(0);
    list.mockRestore();
    await adapter.write("recovered.md", "ok");
    await changes.settle();
    expect(vault.getFileByPath("recovered.md")).not.toBeNull();
    await changes.stop();
  } finally {
    vi.useRealTimers();
  }
});

it("refreshes a real clean editor while retaining and recovering a dirty draft", async () => {
  const { app, adapter, changes, vault, operations } = await fixture();
  app.telemetry = {
    measure: (_name: string, run: any) => run({ setAttribute() {} }),
  };
  const editor = new Editor("before", [], app);
  editor.file = vault.getFileByPath("note.md");
  const stop = editor.trackChanges();
  try {
    await changes.start();
    await adapter.write("note.md", "clean external update");
    adapter.emit({ type: "modify", path: "note.md" });
    await changes.settle();
    await vi.waitFor(() =>
      expect(editor.getValue()).toBe("clean external update"),
    );
    editor.view.dispatch({
      changes: {
        from: 0,
        to: editor.view.state.doc.length,
        insert: "local draft",
      },
    });
    await adapter.write("note.md", "new disk version");
    adapter.emit({ type: "modify", path: "note.md" });
    await changes.settle();
    expect(editor.getValue()).toBe("local draft");
    await expect(editor.flushChanges()).rejects.toThrow();
    expect(await adapter.read("note.md")).toBe("new disk version");
    const conflict = operations.textConflicts.entries[0];
    expect(conflict?.local).toBe("local draft");
    await conflict?.resolve("use-external");
    expect(editor.getValue()).toBe("new disk version");
  } finally {
    stop();
    await changes.stop();
    await editor.dispose();
  }
});

it("treats a retained writer with a failing dirty getter as protected", () => {
  const registry = new FileEditingSessionRegistry();
  let fail = false;
  const writer = {
    get dirty() {
      if (fail) throw new Error("writer unavailable");
      return true;
    },
    flush: vi.fn(async () => {}),
    protect: vi.fn(async () => () => {}),
  };
  const retire = registry.register("note.md", writer);
  retire();
  fail = true;
  expect(registry.hasDirty("note.md")).toBe(true);
  expect(registry.hasDirty("unrelated.md")).toBe(false);
  expect(writer.flush).not.toHaveBeenCalled();
});

it("retains a dirty view after external deletion without attempting persistence", async () => {
  const { app, adapter, changes, operations } = await fixture();
  const { view, leaf } = openView(app);
  operations.register("note.md", {
    dirty: true,
    flush: vi.fn(async () => {}),
    protect: vi.fn(async () => () => {}),
  });
  await changes.start();
  await adapter.remove("note.md");
  adapter.emit({ type: "delete", path: "note.md" });
  await changes.settle();
  expect(view.file?.path).toBe("note.md");
  expect(leaf.setViewState).not.toHaveBeenCalled();
  expect(app.notifications.notify).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining("removed on disk"),
    }),
  );
  await changes.stop();
});

for (const destination of ["renamed.md", "Archive/note.md"]) {
  it(`rebinds a real editor after guarded internal rename to ${destination}`, async () => {
    const { app, adapter, changes, vault } = await fixture();
    app.telemetry = {
      measure: (_name: string, run: any) => run({ setAttribute() {} }),
    };
    app.metadataCache = { queryLinks: vi.fn(async () => []) };
    await adapter.mkdir("Archive");
    await vault.load();
    const editor = new Editor("before", [], app);
    editor.file = vault.getFileByPath("note.md");
    const { view } = openView(app);
    view.onRename = vi.fn(async (file) => {
      editor.file = file.copy();
      view.file = file.copy();
    });
    const stop = editor.trackChanges();
    try {
      await changes.start();
      await new FileManager(app).renameFile(
        vault.getFileByPath("note.md")!,
        destination,
      );
      await changes.settle();
      expect(app.notifications.notify).not.toHaveBeenCalled();
      expect(editor.file?.path).toBe(destination);
      editor.view.dispatch({
        changes: {
          from: 0,
          to: editor.view.state.doc.length,
          insert: "after internal move",
        },
      });
      await editor.flushChanges();
      expect(await adapter.read(destination)).toBe("after internal move");
      expect(await adapter.exists("note.md")).toBe(false);
    } finally {
      stop();
      await changes.stop();
      await editor.dispose();
    }
  });
}

it("orders view rebinding before a follow-on mutation admitted by a rename event", async () => {
  const { app, changes, vault } = await fixture();
  app.telemetry = {
    measure: (_name: string, run: any) => run({ setAttribute() {} }),
  };
  app.metadataCache = { queryLinks: vi.fn(async () => []) };
  const editor = new Editor("before", [], app);
  editor.file = vault.getFileByPath("note.md");
  const { view } = openView(app);
  view.onRename = vi.fn(async (file) => {
    editor.file = file.copy();
    view.file = file.copy();
  });
  const manager = new FileManager(app);
  let second: Promise<void> | undefined;
  try {
    await changes.start();
    const event = vault.on("rename", (file) => {
      if (file.path === "first.md")
        second = manager.renameFile(
          vault.getFileByPath("first.md")!,
          "second.md",
        );
    });
    await manager.renameFile(vault.getFileByPath("note.md")!, "first.md");
    await second;
    vault.offref(event);
    await changes.settle();
    expect(app.notifications.notify).not.toHaveBeenCalled();
    expect(editor.file?.path).toBe("second.md");
    expect(
      vi.mocked(view.onRename).mock.calls.map(([file]) => file.path),
    ).toEqual(["first.md", "second.md"]);
  } finally {
    await changes.stop();
    await editor.dispose();
  }
});
