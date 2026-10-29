import { afterEach, expect, it, vi } from "vitest";
import { Editor } from "../editor.svelte";
import { EventDispatcher } from "../events";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";

const editors: Editor[] = [];
afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
});
function conflict() {
  return Object.assign(new Error("File changed"), { code: "ECONFLICT" });
}
async function fixture() {
  const adapter = new MemoryVaultAdapter({
    "note.md": "original",
    "other.md": "other",
  });
  const conditional = vi.fn(
    async (path: string, data: string, expected: string | null) => {
      const actual = await adapter.read(path).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (actual !== expected) throw conflict();
      await adapter.write(path, data);
    },
  );
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    writeTextIfUnchanged: conditional,
  });
  const vault = new Vault(adapter);
  await vault.load();
  const app = {
    vault,
    fileEditingSessions: new FileEditingSessionRegistry(),
    workspace: Object.assign(new EventDispatcher(), { dispatch: vi.fn() }),
    telemetry: {
      measure: (_name: string, run: (span: unknown) => unknown) =>
        run({ setAttribute: vi.fn() }),
    },
  } as any;
  const editor = new Editor("original", [], app);
  editors.push(editor);
  const file = vault.getFileByPath("note.md")!;
  await editor.loadDocument(file, () => vault.read(file));
  return { adapter, conditional, vault, app, editor, file };
}
function edit(editor: Editor, content: string) {
  editor.view.dispatch({
    changes: { from: 0, to: editor.view.state.doc.length, insert: content },
  });
}

it("rejects an external overwrite even after unrelated vault reads advance the cache", async () => {
  const { adapter, vault, app, editor, file } = await fixture();
  edit(editor, "local draft");
  await adapter.write(file.path, "external");
  expect(await vault.read(file)).toBe("external");
  await expect(editor.flushChanges()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  expect(editor.getValue()).toBe("local draft");
  expect(await adapter.read(file.path)).toBe("external");
  expect(editor.hasUnsavedChanges).toBe(true);
  expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(1);
  expect(app.fileEditingSessions.textConflicts.entries[0]).toMatchObject({
    path: file.path,
    baseline: "original",
    local: "local draft",
    external: "external",
  });
});

it("advances the baseline after success and after an accepted clean refresh", async () => {
  const { adapter, conditional, app, editor, file } = await fixture();
  edit(editor, "first save");
  await editor.flushChanges();
  edit(editor, "second save");
  await editor.flushChanges();
  expect(conditional.mock.calls.map((args) => args[2])).toEqual([
    "original",
    "first save",
  ]);
  const stop = editor.trackChanges();
  try {
    await adapter.write(file.path, "external clean");
    app.workspace.trigger("file-change", file, "modify");
    await vi.waitFor(() => expect(editor.getValue()).toBe("external clean"));
    edit(editor, "third save");
    await editor.flushChanges();
    expect(conditional.mock.calls.at(-1)?.[2]).toBe("external clean");
  } finally {
    stop();
  }
});

it("keeps a dirty baseline when a file-change read sees an external version", async () => {
  const { adapter, app, editor, file } = await fixture();
  const stop = editor.trackChanges();
  try {
    edit(editor, "dirty local");
    await adapter.write(file.path, "changed outside");
    app.workspace.trigger("file-change", file, "modify");
    await vi.waitFor(() =>
      expect(app.vault.cache.get(file.path)).toBe("changed outside"),
    );
    await expect(editor.flushChanges()).rejects.toMatchObject({
      code: "ECONFLICT",
    });
    expect(editor.getValue()).toBe("dirty local");
    expect(await adapter.read(file.path)).toBe("changed outside");
  } finally {
    stop();
  }
});

it("requires a fresh decision when disk changes again before keeping local text", async () => {
  const { adapter, app, editor, file } = await fixture();
  edit(editor, "my version");
  await adapter.write(file.path, "external one");
  await expect(editor.flushChanges()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  const first = app.fileEditingSessions.textConflicts.entries[0];
  await adapter.write(file.path, "external two");
  await expect(first.resolve("keep-local")).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  expect(await adapter.read(file.path)).toBe("external two");
  const current = app.fileEditingSessions.textConflicts.entries[0];
  expect(current.external).toBe("external two");
  await expect(first.resolve("keep-local")).rejects.toThrow(/changed|stale/i);
  await current.resolve("keep-local");
  expect(await adapter.read(file.path)).toBe("my version");
  expect(editor.hasUnsavedChanges).toBe(false);
  expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0);
});

it("accepts a revalidated disk version without writing the discarded draft", async () => {
  const { adapter, conditional, app, editor, file } = await fixture();
  edit(editor, "discarded draft");
  await adapter.write(file.path, "disk version");
  await expect(editor.flushChanges()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  const writes = adapter.writeCount;
  await app.fileEditingSessions.textConflicts.entries[0].resolve(
    "use-external",
  );
  expect(adapter.writeCount).toBe(writes);
  expect(editor.getValue()).toBe("disk version");
  expect(editor.data).toBe("disk version");
  expect(editor.hasUnsavedChanges).toBe(false);
  edit(editor, "subsequent edit");
  await editor.flushChanges();
  expect(conditional.mock.calls.at(-1)?.[2]).toBe("disk version");
});

it("retains a destroyed writer under the original App and releases it after explicit recovery", async () => {
  const { adapter, app, editor, file } = await fixture();
  edit(editor, "closed draft");
  await adapter.write(file.path, "external");
  editor.destroy();
  await expect(
    app.fileEditingSessions.guard(undefined, async () => undefined),
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  expect(editor.getValue()).toBe("closed draft");
  await app.fileEditingSessions.textConflicts.entries[0].resolve("keep-local");
  expect(await adapter.read(file.path)).toBe("closed draft");
  await expect(app.fileEditingSessions.flush(file.path)).resolves.toMatchObject(
    { flushed: false },
  );
  expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0);
});

it("resolves an old document without replacing a newer document or its baseline", async () => {
  const { adapter, app, editor, vault, file } = await fixture();
  edit(editor, "old local");
  await adapter.write(file.path, "old external");
  await expect(editor.flushChanges()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  editor.file = vault.getFileByPath("other.md")!;
  editor.setValue("other");
  edit(editor, "new local");
  editor.save();
  await editor.save.flush();
  await app.fileEditingSessions.textConflicts.entries[0].resolve(
    "use-external",
  );
  expect(editor.getValue()).toBe("new local");
  expect(await adapter.read("other.md")).toBe("new local");
  expect(await adapter.read(file.path)).toBe("old external");
  await editor.flushChanges();
});

it("publishes the latest draft to subscribers and rejects an obsolete recovery action", async () => {
  const { adapter, app, editor, file } = await fixture();
  const snapshots: unknown[] = [];
  const stop = app.fileEditingSessions.textConflicts.subscribe(
    (entries: unknown) => snapshots.push(entries),
  );
  edit(editor, "first draft");
  await adapter.write(file.path, "external");
  await expect(editor.flushChanges()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  const previous = app.fileEditingSessions.textConflicts.entries[0];
  edit(editor, "latest draft");
  const current = app.fileEditingSessions.textConflicts.entries[0];
  expect(current.local).toBe("latest draft");
  await expect(previous.resolve("use-external")).rejects.toThrow(
    /changed|stale/i,
  );
  await current.resolve("keep-local");
  expect(await adapter.read(file.path)).toBe("latest draft");
  expect(snapshots.length).toBeGreaterThan(2);
  stop();
});

it("treats deletion as a conflict and recreates only after an explicit keep decision", async () => {
  const { adapter, conditional, app, editor, file } = await fixture();
  edit(editor, "recovered local");
  await adapter.remove(file.path);
  await expect(editor.flushChanges()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  expect(await adapter.exists(file.path)).toBe(false);
  expect(app.fileEditingSessions.textConflicts.entries[0].external).toBeNull();
  await app.fileEditingSessions.textConflicts.entries[0].resolve("keep-local");
  expect(conditional.mock.calls.at(-1)?.[2]).toBeNull();
  expect(await adapter.read(file.path)).toBe("recovered local");
});

it("retains an unavailable disk snapshot and requires a refresh before resolution", async () => {
  const { adapter, app, editor, vault, file } = await fixture();
  edit(editor, "local draft");
  await adapter.write(file.path, "external");
  vi.spyOn(vault, "read").mockRejectedValueOnce(new Error("read denied"));
  await expect(editor.flushChanges()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  const unavailable = app.fileEditingSessions.textConflicts.entries[0];
  expect(unavailable.external).toBeUndefined();
  expect(unavailable.readError).toBe("read denied");
  await expect(unavailable.resolve("keep-local")).rejects.toThrow(
    /Read the disk/,
  );
  expect(await adapter.read(file.path)).toBe("external");
  await unavailable.refresh();
  const refreshed = app.fileEditingSessions.textConflicts.entries[0];
  expect(refreshed.external).toBe("external");
  await refreshed.resolve("use-external");
  expect(editor.getValue()).toBe("external");
});

it("does not discard local text if disk changes again before accepting it", async () => {
  const { adapter, app, editor, file } = await fixture();
  edit(editor, "local draft");
  await adapter.write(file.path, "external one");
  await expect(editor.flushChanges()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  const first = app.fileEditingSessions.textConflicts.entries[0];
  await adapter.write(file.path, "external two");
  await expect(first.resolve("use-external")).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  expect(editor.getValue()).toBe("local draft");
  expect(app.fileEditingSessions.textConflicts.entries[0].external).toBe(
    "external two",
  );
  await app.fileEditingSessions.textConflicts.entries[0].resolve(
    "use-external",
  );
  expect(editor.getValue()).toBe("external two");
});

it("protects editing and rebinding for the entire asynchronous recovery", async () => {
  const { adapter, conditional, app, editor, file } = await fixture();
  edit(editor, "local draft");
  await adapter.write(file.path, "external");
  await expect(editor.flushChanges()).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const original = conditional.getMockImplementation()!;
  conditional.mockImplementationOnce(async (...args) => {
    await pending;
    await original(...args);
  });
  const recovering =
    app.fileEditingSessions.textConflicts.entries[0].resolve("keep-local");
  try {
    expect(editor.editingProtected).toBe(true);
    edit(editor, "must not replace local draft");
    expect(editor.getValue()).toBe("local draft");
    expect(() => editor.setValue("blocked reset")).toThrow(/protected/);
    finish();
    await recovering;
    expect(editor.editingProtected).toBe(false);
    expect(await adapter.read(file.path)).toBe("local draft");
  } finally {
    finish();
  }
});

it("retains ordinary IO failures for retry without inventing a conflict", async () => {
  const { conditional, app, editor, file, adapter } = await fixture();
  edit(editor, "retry draft");
  conditional.mockRejectedValueOnce(
    Object.assign(new Error("write denied"), { code: "EACCES" }),
  );
  await expect(editor.flushChanges()).rejects.toMatchObject({ code: "EACCES" });
  expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0);
  expect(editor.hasUnsavedChanges).toBe(true);
  await editor.flushChanges();
  expect(await adapter.read(file.path)).toBe("retry draft");
});

it("fails closed if a supporting adapter loses its capability after document admission", async () => {
  const { conditional, app, editor, file, adapter } = await fixture();
  edit(editor, "blocked draft");
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: false }),
  });
  await expect(editor.flushChanges()).rejects.toThrow(/unavailable/);
  expect(conditional).not.toHaveBeenCalled();
  expect(await adapter.read(file.path)).toBe("original");
  expect(editor.hasUnsavedChanges).toBe(true);
  expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0);
});

it("projects only successful conditional writes and never falls back on an unsupported vault", async () => {
  const { conditional, vault, file, adapter } = await fixture();
  const modified = vi.fn();
  vault.on("modify", modified);
  await expect(
    vault.modifyIfUnchanged(file, "unsafe", "stale"),
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  expect(vault.cache.get(file.path)).toBe("original");
  expect(modified).not.toHaveBeenCalled();
  await vault.modifyIfUnchanged(file, "safe", "original");
  expect(vault.cache.get(file.path)).toBe("safe");
  expect(modified).toHaveBeenCalledTimes(1);
  const count = conditional.mock.calls.length;
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: false }),
  });
  await expect(
    vault.modifyIfUnchanged(file, "unsupported", "safe"),
  ).rejects.toThrow(/unavailable/);
  expect(conditional).toHaveBeenCalledTimes(count);
  expect(await adapter.read(file.path)).toBe("safe");
});

it("uses the acknowledged first save as the baseline for a second edit queued in flight", async () => {
  const { conditional, editor, file, adapter } = await fixture();
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const original = conditional.getMockImplementation()!;
  conditional.mockImplementationOnce(async (...args) => {
    await pending;
    await original(...args);
  });
  edit(editor, "first in flight");
  const flushing = editor.flushChanges();
  try {
    await vi.waitFor(() => expect(conditional).toHaveBeenCalledTimes(1));
    edit(editor, "second queued");
    finish();
    await flushing;
    expect(conditional.mock.calls.map((args) => args[2])).toEqual([
      "original",
      "first in flight",
    ]);
    expect(await adapter.read(file.path)).toBe("second queued");
    expect(editor.data).toBe("second queued");
    expect(editor.hasUnsavedChanges).toBe(false);
  } finally {
    finish();
  }
});
