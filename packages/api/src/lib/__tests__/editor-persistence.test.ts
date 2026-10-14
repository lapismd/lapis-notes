import { describe, expect, it, vi } from "vitest";
import { installApplicationCompatibility } from "../application-compatibility";
import { Editor } from "../editor.svelte";
import { EventDispatcher } from "../events";
import { FileEditingSessionRegistry } from "../file-editing-sessions";

function application(modify = vi.fn(async () => undefined)) {
  return {
    app: {
      vault: { modify },
      fileEditingSessions: new FileEditingSessionRegistry(),
      workspace: Object.assign(new EventDispatcher(), { dispatch: vi.fn() }),
      telemetry: {
        measure: (_name: string, run: (span: unknown) => unknown) =>
          run({ setAttribute: vi.fn() }),
      },
    } as any,
    modify,
  };
}

describe("Editor persistence", () => {
  it("ignores old-owner file events after rebinding and removes the original subscription", async () => {
    const owner = application(),
      next = application();
    const file = { path: "note.md" } as any;
    owner.app.vault.read = vi.fn(async () => "old owner");
    next.app.vault.read = vi.fn(async () => "new owner");
    const editor = new Editor("current", [], owner.app);
    editor.file = file;
    const originalOff = vi.spyOn(owner.app.workspace, "offref");
    const stop = editor.trackChanges();
    try {
      editor.bindApplication(next.app);
      owner.app.workspace.trigger("file-change", file, "modify");
      await Promise.resolve();
      await Promise.resolve();
      expect(owner.app.vault.read).not.toHaveBeenCalled();
      expect(next.app.vault.read).not.toHaveBeenCalled();
      expect(editor.getValue()).toBe("current");
      stop();
      expect(originalOff).toHaveBeenCalledTimes(2);
    } finally {
      stop();
      editor.destroy();
    }
  });
  it("keeps clean buffers refreshable and exposes a failed read until recovery", async () => {
    const owner = application(),
      editor = new Editor("before", [], owner.app);
    const file = { path: "note.md" } as any,
      failure = new Error("read unavailable");
    editor.file = file;
    owner.app.vault.read = vi
      .fn(async () => "recovered")
      .mockRejectedValueOnce(failure);
    const stop = editor.trackChanges();
    try {
      owner.app.workspace.trigger("file-change", file, "modify");
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      expect(editor.getValue()).toBe("before");
      expect(editor.refreshError).toBe(failure);
      owner.app.workspace.trigger("file-change", file, "modify");
      await Promise.resolve();
      await Promise.resolve();
      expect(editor.getValue()).toBe("recovered");
      expect(editor.refreshError).toBeUndefined();
    } finally {
      stop();
      editor.destroy();
    }
  });

  it("does not replace a buffer after its tracking subscription is disposed", async () => {
    const owner = application(),
      editor = new Editor("before", [], owner.app);
    let release!: (value: string) => void;
    owner.app.vault.read = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );
    const file = { path: "note.md" } as any;
    editor.file = file;
    const stop = editor.trackChanges();
    try {
      owner.app.workspace.trigger("file-change", file, "modify");
      stop();
      release("late");
      await Promise.resolve();
      await Promise.resolve();
      expect(editor.getValue()).toBe("before");
    } finally {
      editor.destroy();
    }
  });
  it("preserves unsaved text when an external file-change notification arrives", async () => {
    const owner = application(),
      editor = new Editor("before", [], owner.app);
    const file = { path: "note.md" } as any;
    owner.app.vault.read = vi.fn(async () => "remote content");
    editor.file = file;
    const stop = editor.trackChanges();
    try {
      editor.view.dispatch({
        changes: {
          from: 0,
          to: editor.view.state.doc.length,
          insert: "local unsaved",
        },
      });
      owner.app.workspace.trigger("file-change", file, "modify");
      await Promise.resolve();
      await Promise.resolve();
      expect(editor.getValue()).toBe("local unsaved");
      expect(editor.hasUnsavedChanges).toBe(true);
    } finally {
      stop();
      editor.destroy();
    }
  });

  it("rejects a late file read after switching the editor to another document", async () => {
    const owner = application(),
      editor = new Editor("first", [], owner.app);
    let release!: (value: string) => void;
    const read = new Promise<string>((resolve) => {
      release = resolve;
    });
    owner.app.vault.read = vi.fn(() => read);
    const file = { path: "first.md" } as any;
    editor.file = file;
    const stop = editor.trackChanges();
    try {
      owner.app.workspace.trigger("file-change", file, "modify");
      editor.file = { path: "second.md" } as any;
      editor.setValue("second");
      release("late first");
      await read;
      await Promise.resolve();
      expect(editor.getValue()).toBe("second");
      expect(editor.data).toBe("second");
    } finally {
      release("late first");
      stop();
      editor.destroy();
    }
  });

  it("does not regress a clean buffer when external reads finish out of order", async () => {
    const owner = application(),
      editor = new Editor("before", [], owner.app);
    const releases: ((value: string) => void)[] = [];
    owner.app.vault.read = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          releases.push(resolve);
        }),
    );
    const file = { path: "note.md" } as any;
    editor.file = file;
    const stop = editor.trackChanges();
    try {
      owner.app.workspace.trigger("file-change", file, "modify");
      owner.app.workspace.trigger("file-change", file, "modify");
      releases[1]!("newer");
      await Promise.resolve();
      await Promise.resolve();
      releases[0]!("older");
      await Promise.resolve();
      await Promise.resolve();
      expect(editor.getValue()).toBe("newer");
      expect(editor.data).toBe("newer");
    } finally {
      for (const release of releases) release("cleanup");
      stop();
      editor.destroy();
    }
  });
  it("retains a failed save as dirty and retries the same buffer on the next flush", async () => {
    const modify = vi
      .fn(async () => undefined)
      .mockRejectedValueOnce(new Error("disk unavailable"));
    const owner = application(modify),
      editor = new Editor("before", [], owner.app);
    editor.file = { path: "note.md" } as any;
    try {
      editor.view.dispatch({
        changes: {
          from: 0,
          to: editor.view.state.doc.length,
          insert: "unsaved",
        },
      });
      await expect(editor.flushChanges()).rejects.toThrow("disk unavailable");
      expect(editor.getValue()).toBe("unsaved");
      expect(editor.data).toBe("before");
      expect(editor.hasUnsavedChanges).toBe(true);
      await editor.flushChanges();
      expect(modify).toHaveBeenCalledTimes(2);
      expect(editor.data).toBe("unsaved");
      expect(editor.hasUnsavedChanges).toBe(false);
    } finally {
      editor.destroy();
    }
  });

  it("keeps the queue-time file and suppresses notifications into a different document", async () => {
    const owner = application(),
      editor = new Editor("first before", [], owner.app);
    const first = { path: "first.md" } as any,
      second = { path: "second.md" } as any;
    const changed = vi.fn();
    editor.on("change", changed);
    editor.file = first;
    try {
      editor.view.dispatch({
        changes: {
          from: 0,
          to: editor.view.state.doc.length,
          insert: "first after",
        },
      });
      editor.file = second;
      editor.setValue("second contents");
      await editor.flushChanges();
      expect(owner.modify).toHaveBeenCalledExactlyOnceWith(
        first,
        "first after",
      );
      expect(changed).not.toHaveBeenCalled();
      expect(editor.getValue()).toBe("second contents");
      expect(editor.data).toBe("second contents");
    } finally {
      editor.destroy();
    }
  });

  it("retains the queue-time external persistence mode and explicit application", async () => {
    const owner = application(),
      next = application(),
      editor = new Editor("before", [], owner.app);
    editor.file = { path: "external.md" } as any;
    editor.persistence = "external";
    try {
      editor.view.dispatch({
        changes: { from: 0, to: editor.view.state.doc.length, insert: "after" },
      });
      editor.persistence = "vault";
      editor.bindApplication(next.app);
      await editor.flushChanges();
      expect(owner.modify).not.toHaveBeenCalled();
      expect(next.modify).not.toHaveBeenCalled();
      expect(editor.data).toBe("before");
    } finally {
      editor.destroy();
    }
  });

  it("persists pending text when extensions are reconfigured before debounce completes", async () => {
    const owner = application(),
      editor = new Editor("before", [], owner.app);
    editor.file = { path: "note.md" } as any;
    try {
      editor.view.dispatch({
        changes: { from: 0, to: editor.view.state.doc.length, insert: "after" },
      });
      editor.updateExtensions([]);
      await editor.flushChanges();
      expect(owner.modify).toHaveBeenCalledExactlyOnceWith(
        editor.file,
        "after",
      );
    } finally {
      editor.destroy();
    }
  });

  it("captures an explicit save before the editor is rebound to another file", async () => {
    const owner = application(),
      editor = new Editor("first", [], owner.app),
      file = { path: "first.md" } as any;
    editor.file = file;
    try {
      editor.save();
      editor.file = { path: "second.md" } as any;
      editor.setValue("second");
      await editor.flushChanges();
      expect(owner.modify).toHaveBeenCalledExactlyOnceWith(file, "first");
      expect(editor.data).toBe("second");
    } finally {
      editor.destroy();
    }
  });

  it("does not notify an older completion while a newer change is waiting", async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const saved = new Promise<void>((resolve) => {
      release = resolve;
    });
    const owner = application(
      vi.fn(async (_file?: unknown, value?: string) => {
        if (value === "first") await saved;
      }),
    );
    const editor = new Editor("before", [], owner.app),
      changed = vi.fn();
    editor.file = { path: "note.md" } as any;
    editor.on("change", changed);
    try {
      const edit = (value: string) =>
        editor.view.dispatch({
          changes: { from: 0, to: editor.view.state.doc.length, insert: value },
        });
      edit("first");
      await vi.advanceTimersByTimeAsync(500);
      edit("second");
      release();
      await Promise.resolve();
      await Promise.resolve();
      expect(changed).not.toHaveBeenCalled();
      await editor.flushChanges();
      expect(changed).toHaveBeenCalledExactlyOnceWith("second");
    } finally {
      release();
      editor.destroy();
      vi.useRealTimers();
    }
  });
  it("waits for an already-started save when flushing before external apply", async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const saved = new Promise<void>((resolve) => {
      release = resolve;
    });
    const owner = application(vi.fn(() => saved));
    const editor = new Editor("before", [], owner.app);
    editor.file = { path: "inactive.md" } as any;
    try {
      editor.view.dispatch({
        changes: {
          from: 0,
          to: editor.view.state.doc.length,
          insert: "latest",
        },
      });
      await vi.advanceTimersByTimeAsync(500);
      expect(owner.modify).toHaveBeenCalledOnce();
      let flushed = false;
      const pending = editor.flushChanges().then(() => {
        flushed = true;
      });
      await Promise.resolve();
      await Promise.resolve();
      expect(flushed).toBe(false);
      release();
      await pending;
      expect(editor.data).toBe("latest");
    } finally {
      release();
      editor.destroy();
      vi.useRealTimers();
    }
  });

  it("serializes overlapping saves so an older completion cannot replace newer editor content", async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const saved = new Promise<void>((resolve) => {
      release = resolve;
    });
    const values: string[] = [];
    const owner = application(
      vi.fn(async (_file?: unknown, value?: string) => {
        values.push(value!);
        if (value === "first") await saved;
      }),
    );
    const editor = new Editor("before", [], owner.app);
    editor.file = { path: "note.md" } as any;
    try {
      const edit = (value: string) =>
        editor.view.dispatch({
          changes: { from: 0, to: editor.view.state.doc.length, insert: value },
        });
      edit("first");
      await vi.advanceTimersByTimeAsync(500);
      edit("second");
      await vi.advanceTimersByTimeAsync(500);
      expect(values).toEqual(["first"]);
      release();
      await editor.flushChanges();
      expect(values).toEqual(["first", "second"]);
      expect(editor.data).toBe("second");
    } finally {
      release();
      editor.destroy();
      vi.useRealTimers();
    }
  });
  it("flushes host-owned changes without writing the identified file", async () => {
    const owner = application();
    const editor = new Editor("before", [], owner.app);
    const changed = vi.fn();
    editor.file = { path: "Roles/atlas/role.md" } as any;
    editor.persistence = "external";
    editor.on("change", changed);

    editor.view.dispatch({
      changes: { from: 0, to: editor.view.state.doc.length, insert: "after" },
    });
    await editor.flushChanges();

    expect(editor.file.path).toBe("Roles/atlas/role.md");
    expect(owner.modify).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalledWith("after");
    expect(editor.data).toBe("after");
    editor.destroy();
  });

  it("retains direct vault persistence as the default", async () => {
    const owner = application();
    const editor = new Editor("before", [], owner.app);
    editor.file = { path: "Notes/example.md" } as any;

    editor.view.dispatch({
      changes: { from: 0, to: editor.view.state.doc.length, insert: "after" },
    });
    await editor.flushChanges();

    expect(owner.modify).toHaveBeenCalledWith(editor.file, "after");
    editor.destroy();
  });

  it("uses its explicit owner instead of a conflicting compatibility alias", async () => {
    const owner = application();
    const fallback = application();
    const disposeCompatibility = installApplicationCompatibility(fallback.app);
    const editor = new Editor("before", [], owner.app);
    editor.file = { path: "Notes/owned.md" } as any;

    editor.view.dispatch({
      changes: { from: 0, to: editor.view.state.doc.length, insert: "after" },
    });
    await editor.flushChanges();

    expect(owner.modify).toHaveBeenCalledWith(editor.file, "after");
    expect(fallback.modify).not.toHaveBeenCalled();
    editor.destroy();
    disposeCompatibility();
  });
});
