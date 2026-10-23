import { describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { TextFileView } from "../view.svelte";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { EventDispatcher } from "../events";

class TestView extends TextFileView {
  getViewType() {
    return "loading-test";
  }
  getDisplayText() {
    return this.file?.path ?? "";
  }
  canAcceptExtension() {
    return true;
  }
  getViewData() {
    return this.editor.getValue();
  }
  setViewData(value: string) {
    this.editor.setValue(value);
  }
  clear() {
    this.data = "";
    this.editor.setValue("");
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function fixture() {
  const vault = new Vault(
    new MemoryVaultAdapter({ "first.txt": "first", "second.txt": "second" }),
  );
  await vault.load();
  const measure = (_name: string, run: (span: any) => any) =>
    run({ setAttribute: vi.fn() });
  const app = {
    vault,
    fileEditingSessions: new FileEditingSessionRegistry(),
    workspace: Object.assign(new EventDispatcher(), { dispatch: vi.fn() }),
    telemetry: { measure, measureAsync: measure },
    editorExtensions: () => [],
  } as any;
  const view = new TestView({ application: app, app } as any);
  const first = vault.getFileByPath("first.txt")!,
    second = vault.getFileByPath("second.txt")!;
  return { app, view, first, second };
}
function edit(view: TestView, value: string) {
  view.editor.view.dispatch({
    changes: { from: 0, to: view.editor.view.state.doc.length, insert: value },
  });
}

describe("Text editor document loading", () => {
  it("does not let an older read replace a newer loaded document", async () => {
    const { app, view, first, second } = await fixture(),
      read = deferred<string>();
    const originalRead = app.vault.read.bind(app.vault);
    vi.spyOn(app.vault, "read").mockImplementation((file: any) =>
      file.path === first.path ? read.promise : originalRead(file),
    );
    try {
      const old = view.onLoadFile(first);
      await view.onLoadFile(second);
      read.resolve("stale first");
      await old;
      expect(view.file?.path).toBe(second.path);
      expect(view.editor.file?.path).toBe(second.path);
      expect(view.editor.getValue()).toBe("second");
    } finally {
      read.resolve("cleanup");
      await view.editor.dispose();
    }
  });

  it("blocks typing while loading instead of routing it through the previous file", async () => {
    const { app, view, first, second } = await fixture(),
      read = deferred<string>();
    await view.onLoadFile(first);
    vi.spyOn(app.vault, "read").mockImplementation(() => read.promise);
    try {
      const loading = view.onLoadFile(second);
      edit(view, "typed while loading");
      expect(view.editor.editingProtected).toBe(true);
      expect(view.editor.getValue()).toBe("first");
      read.resolve("second");
      await loading;
      expect(view.editor.getValue()).toBe("second");
      expect(await app.vault.adapter.read(first.path)).toBe("first");
    } finally {
      read.resolve("cleanup");
      await view.editor.dispose();
    }
  });

  it("makes target-file apply wait for a pending document read and publication", async () => {
    const { app, view, first, second } = await fixture(),
      read = deferred<string>();
    await view.onLoadFile(first);
    vi.spyOn(app.vault, "read").mockImplementation(() => read.promise);
    const loading = view.onLoadFile(second);
    const mutate = vi.fn(async () => undefined);
    try {
      const applying = app.fileEditingSessions.guard(second.path, mutate);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mutate).not.toHaveBeenCalled();
      read.resolve("second");
      await loading;
      await applying;
      expect(view.editor.file?.path).toBe(second.path);
      expect(mutate).toHaveBeenCalledTimes(1);
    } finally {
      read.resolve("cleanup");
      await loading.catch(() => undefined);
      await view.editor.dispose();
    }
  });

  it("preserves the previous binding when its draft cannot be saved before switching", async () => {
    const { app, view, first, second } = await fixture();
    await view.onLoadFile(first);
    edit(view, "first draft");
    vi.spyOn(app.vault, "modifyIfUnchanged").mockRejectedValueOnce(
      new Error("save failed"),
    );
    try {
      await expect(view.onLoadFile(second)).rejects.toThrow("save failed");
      expect(view.editor.file?.path).toBe(first.path);
      expect(view.file?.path).toBe(first.path);
      expect(view.editor.getValue()).toBe("first draft");
      expect(view.editor.editingProtected).toBe(false);
      await view.editor.flushChanges();
    } finally {
      await view.editor.dispose();
    }
  });
});

it("releases a superseded read immediately and observes its later rejection", async () => {
  const { app, view, first, second } = await fixture(),
    oldRead = deferred<string>();
  const original = app.vault.read.bind(app.vault);
  const reader = vi
    .spyOn(app.vault, "read")
    .mockImplementation((file: any) =>
      file.path === first.path ? oldRead.promise : original(file),
    );
  const oldLoad = view.onLoadFile(first);
  try {
    await vi.waitFor(() => expect(reader).toHaveBeenCalledTimes(1));
    await view.onLoadFile(second);
    await oldLoad;
    expect(view.editor.editingProtected).toBe(false);
    oldRead.reject(new Error("late old failure"));
    await Promise.resolve();
    expect(view.editor.getValue()).toBe("second");
    expect(view.file?.path).toBe(second.path);
  } finally {
    oldRead.resolve("cleanup");
    await view.editor.dispose();
  }
});

it("cancels publication on unload and leaves the previous document editable", async () => {
  const { app, view, first, second } = await fixture(),
    read = deferred<string>();
  await view.onLoadFile(first);
  vi.spyOn(app.vault, "read").mockImplementation(() => read.promise);
  const loading = view.onLoadFile(second);
  try {
    await view.onUnloadFile(first);
    await loading;
    expect(view.editor.editingProtected).toBe(false);
    read.resolve("late second");
    await Promise.resolve();
    expect(view.editor.file?.path).toBe(first.path);
    expect(view.editor.getValue()).toBe("first");
    expect(await app.fileEditingSessions.flush(second.path)).toEqual({
      flushed: false,
      path: second.path,
    });
  } finally {
    read.resolve("cleanup");
    await view.editor.dispose();
  }
});

it("cancels reads on destruction without publishing or retaining an empty target", async () => {
  const { app, view, first } = await fixture(),
    read = deferred<string>();
  const reader = vi
    .spyOn(app.vault, "read")
    .mockImplementation(() => read.promise);
  const loading = view.onLoadFile(first);
  await vi.waitFor(() => expect(reader).toHaveBeenCalledTimes(1));
  view.editor.destroy();
  await loading;
  read.reject(new Error("late disposed failure"));
  await Promise.resolve();
  expect(view.editor.file).toBeNull();
  expect(await app.fileEditingSessions.flush(first.path)).toEqual({
    flushed: false,
    path: first.path,
  });
});

it("rolls back file, buffer and view data when publication fails", async () => {
  const { app, view, first, second } = await fixture();
  await view.onLoadFile(first);
  const dataSetter = vi
    .spyOn(view, "setViewData")
    .mockImplementationOnce(() => {
      throw new Error("publication failed");
    });
  try {
    await expect(view.onLoadFile(second)).rejects.toThrow("publication failed");
    expect(view.file?.path).toBe(first.path);
    expect(view.editor.file?.path).toBe(first.path);
    expect(view.editor.getValue()).toBe("first");
    expect(view.data).toBe("first");
    expect(view.editor.editingProtected).toBe(false);
    expect(await app.fileEditingSessions.flush(second.path)).toEqual({
      flushed: false,
      path: second.path,
    });
  } finally {
    dataSetter.mockRestore();
    await view.editor.dispose();
  }
});

it("rejects a changed target path before publishing the read", async () => {
  const { app, view, first, second } = await fixture(),
    read = deferred<string>();
  await view.onLoadFile(first);
  vi.spyOn(app.vault, "read").mockImplementation(() => read.promise);
  const loading = view.onLoadFile(second);
  try {
    second.path = "changed.txt";
    read.resolve("second");
    await expect(loading).rejects.toThrow(/authority changed/);
    expect(view.editor.file?.path).toBe(first.path);
    expect(view.editor.getValue()).toBe("first");
  } finally {
    read.resolve("cleanup");
    await view.editor.dispose();
  }
});

it("refuses document loading during an independent protection lease", async () => {
  const { app, view, first, second } = await fixture();
  await view.onLoadFile(first);
  const release = await view.editor.protect();
  const read = vi.spyOn(app.vault, "read");
  try {
    await expect(view.onLoadFile(second)).rejects.toThrow(/protected/);
    expect(read).not.toHaveBeenCalled();
    expect(view.editor.file?.path).toBe(first.path);
  } finally {
    release();
    await view.editor.dispose();
  }
});

it("rejects publication if the view's owning App changes during its read", async () => {
  const { app, view, first, second } = await fixture(),
    read = deferred<string>();
  await view.onLoadFile(first);
  const reader = vi
    .spyOn(app.vault, "read")
    .mockImplementation(() => read.promise);
  const loading = view.onLoadFile(second);
  try {
    await vi.waitFor(() => expect(reader).toHaveBeenCalledTimes(1));
    (view.leaf as any).app = { ...app };
    read.resolve("second");
    await expect(loading).rejects.toThrow(/authority changed/);
    expect(view.editor.file).toBe(first);
    expect(view.file?.path).toBe(first.path);
    expect(view.editor.getValue()).toBe("first");
    expect(view.editor.editingProtected).toBe(false);
  } finally {
    read.resolve("cleanup");
    await view.editor.dispose();
  }
});

it("rolls back a publication canceled by its synchronous publisher", async () => {
  const { view, first, second } = await fixture();
  await view.onLoadFile(first);
  try {
    await expect(
      view.editor.loadDocument(
        second,
        async () => "second",
        () => {
          view.editor.cancelDocumentLoad();
        },
      ),
    ).rejects.toThrow(/canceled/);
    expect(view.editor.file).toBe(first);
    expect(view.editor.getValue()).toBe("first");
    expect(view.editor.editingProtected).toBe(false);
  } finally {
    await view.editor.dispose();
  }
});

it("lets target admission finish after cancellation without retaining an empty session", async () => {
  const { app, view, first, second } = await fixture(),
    read = deferred<string>();
  await view.onLoadFile(first);
  vi.spyOn(app.vault, "read").mockImplementation(() => read.promise);
  const loading = view.onLoadFile(second),
    mutate = vi.fn(async () => undefined);
  try {
    const applying = app.fileEditingSessions.guard(second.path, mutate);
    await vi.waitFor(() =>
      expect(view.editor.view.state.facet(EditorState.readOnly)).toBe(true),
    );
    view.editor.cancelDocumentLoad();
    await loading;
    await applying;
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(view.editor.file).toBe(first);
    expect(view.editor.editingProtected).toBe(false);
    expect(await app.fileEditingSessions.flush(second.path)).toEqual({
      flushed: false,
      path: second.path,
    });
  } finally {
    read.resolve("cleanup");
    await view.editor.dispose();
  }
});

it("preserves the existing pending load when a protected replacement cannot register", async () => {
  const { app, view, first, second } = await fixture(),
    read = deferred<string>();
  vi.spyOn(app.vault, "read").mockImplementation(() => read.promise);
  const loading = view.onLoadFile(first);
  try {
    await app.fileEditingSessions.guard(second.path, async () => {
      await expect(view.onLoadFile(second)).rejects.toThrow(/protected/);
      expect(view.editor.editingProtected).toBe(true);
    });
    read.resolve("first");
    await loading;
    expect(view.editor.file).toBe(first);
    expect(view.editor.getValue()).toBe("first");
    expect(view.editor.editingProtected).toBe(false);
  } finally {
    read.resolve("cleanup");
    await view.editor.dispose();
  }
});

it("preserves the original document and drains target protection after a failed read", async () => {
  const { app, view, first, second } = await fixture(),
    read = deferred<string>();
  await view.onLoadFile(first);
  const reader = vi
    .spyOn(app.vault, "read")
    .mockImplementation(() => read.promise);
  const loading = view.onLoadFile(second);
  const failed = expect(loading).rejects.toThrow("read failed");
  let guarded: Promise<void> | undefined;
  try {
    await vi.waitFor(() => expect(reader).toHaveBeenCalledTimes(1));
    const mutate = vi.fn(async () => {
      expect(view.editor.file).toBe(first);
      expect(view.editor.getValue()).toBe("first");
    });
    guarded = app.fileEditingSessions.guard(second.path, mutate);
    expect(mutate).not.toHaveBeenCalled();
    read.reject(new Error("read failed"));
    await failed;
    await guarded;
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(view.file?.path).toBe(first.path);
    expect(view.editor.editingProtected).toBe(false);
    expect(await app.fileEditingSessions.flush(second.path)).toEqual({
      flushed: false,
      path: second.path,
    });
  } finally {
    read.resolve("cleanup");
    await Promise.allSettled([loading, ...(guarded ? [guarded] : [])]);
    await view.editor.dispose();
  }
});
