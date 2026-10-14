import { describe, expect, it, vi } from "vitest";
import { Editor } from "../editor.svelte";
import { EventDispatcher } from "../events";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { TextFileView } from "../view.svelte";

function owner(
  modify: (...args: any[]) => Promise<void> = vi.fn(async () => undefined),
) {
  return {
    vault: { modify },
    fileEditingSessions: new FileEditingSessionRegistry(),
    workspace: Object.assign(new EventDispatcher(), { dispatch: vi.fn() }),
    telemetry: {
      measure: (_name: string, run: (span: unknown) => unknown) =>
        run({ setAttribute: vi.fn() }),
    },
  } as any;
}
function edit(editor: Editor, content: string) {
  editor.view.dispatch({
    changes: { from: 0, to: editor.view.state.doc.length, insert: content },
  });
}

class TestTextView extends TextFileView {
  getViewType() {
    return "test-text";
  }
  getDisplayText() {
    return "Test text";
  }
  getViewData() {
    return this.editor.getValue();
  }
  setViewData(data: string) {
    this.editor.setValue(data);
  }
  clear() {
    this.data = "";
    this.editor.setValue("");
  }
  canAcceptExtension() {
    return true;
  }
}

describe("Editor document lifetime", () => {
  it("preserves and retries an old document failure after saving another document", async () => {
    const writes = vi
      .fn(async () => undefined)
      .mockRejectedValueOnce(new Error("first file failed"));
    const app = owner(writes),
      editor = new Editor("first", [], app);
    const first = { path: "first.md" } as any,
      second = { path: "second.md" } as any;
    editor.file = first;
    try {
      edit(editor, "first draft");
      await expect(editor.flushChanges()).rejects.toThrow("first file failed");
      editor.file = second;
      editor.setValue("second");
      edit(editor, "second draft");
      editor.save();
      await editor.save.flush();
      await editor.flushChanges();
      expect(writes.mock.calls).toEqual([
        [first, "first draft"],
        [second, "second draft"],
        [first, "first draft"],
      ]);
      expect(editor.getValue()).toBe("second draft");
      expect(editor.data).toBe("second draft");
    } finally {
      editor.destroy();
    }
  });

  it("persists queued changes when the editor is destroyed before debounce", async () => {
    const writes = vi.fn(async () => undefined),
      app = owner(writes);
    const editor = new Editor("original", [], app),
      file = { path: "closed.md" } as any;
    editor.file = file;
    edit(editor, "closing draft");
    editor.destroy();
    await editor.flushChanges();
    expect(writes).toHaveBeenCalledExactlyOnceWith(file, "closing draft");
  });

  it("keeps two queued documents when rebinding before either debounce finishes", async () => {
    const writes = vi.fn(async () => undefined),
      app = owner(writes);
    const editor = new Editor("first", [], app);
    const first = { path: "first.md" } as any,
      second = { path: "second.md" } as any;
    editor.file = first;
    try {
      edit(editor, "first draft");
      editor.file = second;
      editor.setValue("second");
      edit(editor, "second draft");
      await editor.flushChanges();
      expect(writes.mock.calls).toEqual([
        [first, "first draft"],
        [second, "second draft"],
      ]);
    } finally {
      editor.destroy();
    }
  });
});

it("registers each original file and retains failed saves after destruction", async () => {
  const writes = vi
    .fn(async () => undefined)
    .mockRejectedValueOnce(new Error("disk failed"));
  const app = owner(writes),
    editor = new Editor("original", [], app);
  const file = { path: "closed.md" } as any;
  editor.file = file;
  edit(editor, "retained draft");
  await expect(editor.flushChanges()).rejects.toThrow("disk failed");
  // Destruction drains pending snapshots, but must not silently retry a failure.
  editor.destroy();
  expect(editor.getValue()).toBe("retained draft");
  expect(editor.editingProtected).toBe(true);
  await expect(app.fileEditingSessions.flush(file.path)).resolves.toEqual({
    flushed: true,
    path: file.path,
  });
  expect(writes).toHaveBeenCalledTimes(2);
  await expect(app.fileEditingSessions.flush(file.path)).resolves.toEqual({
    flushed: false,
    path: file.path,
  });
});

it("blocks document transactions and rebinding until every protection lease releases", async () => {
  const app = owner(),
    other = owner(),
    editor = new Editor("original", [], app);
  editor.file = { path: "note.md" } as any;
  try {
    edit(editor, "draft");
    const first = await editor.protect(),
      second = await editor.protect();
    edit(editor, "blocked");
    expect(editor.getValue()).toBe("draft");
    expect(() => editor.setValue("blocked reset")).toThrow(/protected/);
    expect(() => editor.replaceContent("blocked refresh")).toThrow(/protected/);
    expect(() => editor.save()).toThrow(/protected/);
    expect(() => editor.queueChange("blocked queued")).toThrow(/protected/);
    expect(() => editor.bindApplication(other)).toThrow(/protected/);
    expect(() => {
      editor.file = { path: "other.md" } as any;
    }).toThrow(/protected/);
    editor.updateExtensions([]);
    edit(editor, "blocked reconfiguration");
    expect(editor.getValue()).toBe("draft");
    first();
    first();
    expect(editor.editingProtected).toBe(true);
    second();
    expect(editor.editingProtected).toBe(false);
    edit(editor, "resumed");
    await editor.flushChanges();
    expect(editor.data).toBe("resumed");
  } finally {
    editor.destroy();
  }
});

it("refuses new editor registration during an apply without changing its old binding", async () => {
  const app = owner(),
    editor = new Editor("first", [], app);
  const first = { path: "first.md" } as any,
    target = { path: "target.md" } as any;
  editor.file = first;
  try {
    await app.fileEditingSessions.guard(target.path, async () => {
      expect(() => {
        editor.file = target;
      }).toThrow(/protected/);
      expect(editor.file).toBe(first);
      expect(editor.getValue()).toBe("first");
      edit(editor, "still first");
    });
    await editor.flushChanges();
    expect(app.vault.modify).toHaveBeenCalledExactlyOnceWith(
      first,
      "still first",
    );
  } finally {
    editor.destroy();
  }
});

it("joins captured asynchronous external persistence and fails closed without an owner", async () => {
  const app = owner(),
    editor = new Editor("original", [], app);
  const file = { path: "external.md" } as any;
  editor.file = file;
  editor.persistence = "external";
  await expect(editor.protect()).rejects.toThrow(/explicit writer/);
  let complete!: () => void;
  const saving = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const writer = vi.fn(async () => {
    await saving;
  });
  editor.setExternalPersistenceWriter(writer);
  try {
    edit(editor, "external draft");
    let protectedEditor = false;
    const protect = editor.protect().then((release) => {
      protectedEditor = true;
      return release;
    });
    await vi.waitFor(() => expect(writer).toHaveBeenCalledTimes(1));
    expect(protectedEditor).toBe(false);
    expect(editor.data).toBe("original");
    expect(editor.editingProtected).toBe(true);
    complete();
    const release = await protect;
    expect(writer).toHaveBeenCalledExactlyOnceWith({
      application: app,
      file,
      content: "external draft",
    });
    expect(app.vault.modify).not.toHaveBeenCalled();
    expect(editor.data).toBe("external draft");
    release();
  } finally {
    complete();
    editor.destroy();
  }
});

it("keeps the original external writer and owner after rebinding", async () => {
  const app = owner(),
    other = owner(),
    editor = new Editor("first", [], app);
  const first = { path: "first.md" } as any,
    second = { path: "second.md" } as any;
  const original = vi.fn(async () => undefined),
    replacement = vi.fn(async () => undefined);
  editor.file = first;
  editor.persistence = "external";
  editor.setExternalPersistenceWriter(original);
  try {
    edit(editor, "first draft");
    editor.setExternalPersistenceWriter(replacement);
    editor.bindApplication(other);
    editor.file = second;
    editor.setValue("second");
    await editor.flushChanges();
    expect(original).toHaveBeenCalledExactlyOnceWith({
      application: app,
      file: first,
      content: "first draft",
    });
    expect(replacement).not.toHaveBeenCalled();
    expect(editor.data).toBe("second");
    expect(editor.getValue()).toBe("second");
  } finally {
    editor.destroy();
  }
});

it("does not return a flush while a newly rebound document is still saving", async () => {
  let finishFirst!: () => void;
  const firstSaving = new Promise<void>((resolve) => {
    finishFirst = resolve;
  });
  const writes = vi.fn(async (_file: unknown, value: string) => {
    if (value === "first draft") await firstSaving;
  });
  const app = owner(writes),
    editor = new Editor("first", [], app);
  editor.file = { path: "first.md" } as any;
  try {
    edit(editor, "first draft");
    const flushing = editor.flushChanges();
    await vi.waitFor(() => expect(writes).toHaveBeenCalledTimes(1));
    editor.file = { path: "second.md" } as any;
    editor.setValue("second");
    edit(editor, "second draft");
    finishFirst();
    await flushing;
    expect(writes.mock.calls.map(([, value]) => value)).toEqual([
      "first draft",
      "second draft",
    ]);
    expect(editor.data).toBe("second draft");
  } finally {
    finishFirst();
    editor.destroy();
  }
});

it("releases protection after a failed external save and retries without acknowledging the failed data", async () => {
  const app = owner(),
    editor = new Editor("original", [], app);
  const writer = vi
    .fn(async () => undefined)
    .mockRejectedValueOnce(new Error("external failed"));
  editor.file = { path: "external.md" } as any;
  editor.persistence = "external";
  editor.setExternalPersistenceWriter(writer);
  try {
    edit(editor, "draft");
    await expect(editor.protect()).rejects.toThrow("external failed");
    expect(editor.editingProtected).toBe(false);
    expect(editor.hasUnsavedChanges).toBe(true);
    expect(editor.data).toBe("original");
    const release = await editor.protect();
    expect(writer).toHaveBeenCalledTimes(2);
    expect(editor.data).toBe("draft");
    expect(editor.hasUnsavedChanges).toBe(false);
    release();
  } finally {
    editor.destroy();
  }
});

it("keeps notification-only external saves unverified after retirement", async () => {
  const app = owner(),
    editor = new Editor("original", [], app);
  editor.file = { path: "external.md" } as any;
  editor.persistence = "external";
  edit(editor, "legacy external draft");
  await editor.flushChanges();
  editor.destroy();
  await expect(
    app.fileEditingSessions.guard("external.md", async () => undefined),
  ).rejects.toThrow(/explicit writer/);
});

it("exposes awaitable disposal and rejects later editing without losing its captured buffer", async () => {
  const writes = vi.fn(async () => undefined),
    app = owner(writes),
    editor = new Editor("original", [], app);
  const file = { path: "closing.md" } as any;
  editor.file = file;
  edit(editor, "draft");
  await editor.dispose();
  expect(writes).toHaveBeenCalledExactlyOnceWith(file, "draft");
  expect(editor.hasUnsavedChanges).toBe(false);
  expect(() => editor.queueChange("late draft")).toThrow(/destroyed/);
  edit(editor, "late transaction");
  expect(editor.getValue()).toBe("draft");
  await expect(app.fileEditingSessions.flush(file.path)).resolves.toEqual({
    flushed: false,
    path: file.path,
  });
});

it("does not let a retired file failure prevent clean refresh in the current document", async () => {
  const writes = vi
    .fn(async () => undefined)
    .mockRejectedValueOnce(new Error("old failure"));
  const app = owner(writes),
    editor = new Editor("first", [], app);
  const first = { path: "first.md" } as any,
    second = { path: "second.md" } as any;
  app.vault.read = vi.fn(async () => "updated second");
  editor.file = first;
  const stop = editor.trackChanges();
  try {
    edit(editor, "failed first draft");
    await expect(editor.flushChanges()).rejects.toThrow("old failure");
    editor.file = second;
    editor.setValue("second");
    app.workspace.trigger("file-change", second, "modify");
    await vi.waitFor(() => expect(editor.getValue()).toBe("updated second"));
    expect(editor.hasUnsavedChanges).toBe(true);
    await editor.flushChanges();
    expect(editor.hasUnsavedChanges).toBe(false);
  } finally {
    stop();
    editor.destroy();
  }
});

it("routes TextFileView saves through the current editor buffer and its protection", async () => {
  const writes = vi.fn(async () => undefined),
    app = owner(writes);
  const view = new TestTextView({ app, application: app } as any);
  const file = { path: "view.txt" } as any;
  view.file = file;
  view.editor.file = file;
  view.data = "original";
  view.setViewData("original");
  try {
    edit(view.editor, "current draft");
    await view.save();
    expect(
      writes.mock.calls.every((args: unknown[]) => args[1] === "current draft"),
    ).toBe(true);
    const release = await view.editor.protect();
    try {
      await expect(view.save()).rejects.toThrow(/protected/);
    } finally {
      release();
    }
  } finally {
    view.editor.destroy();
  }
});
