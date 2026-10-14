import { expect, it, vi } from "vitest";
import { Editor } from "../editor.svelte";
import { FileManager } from "../file-manager";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";
import { EventDispatcher } from "../events";

async function fixture(seed: Record<string, string> = {}) {
  const vault = new Vault(
    new MemoryVaultAdapter({
      "original.txt": "original",
      "other.txt": "other",
      ...seed,
    }),
  );
  await vault.load();
  const app = {
    vault,
    fileEditingSessions: new FileEditingSessionRegistry(),
    workspace: Object.assign(new EventDispatcher(), { dispatch: vi.fn() }),
    telemetry: {
      measure: (_name: string, run: any) => run({ setAttribute: vi.fn() }),
    },
    metadataCache: { queryLinks: vi.fn(async () => []) },
    configuration: {
      getConfiguration: () => ({
        get: (_key: string, fallback: unknown) => fallback,
      }),
    },
  } as any;
  const file = vault.getFileByPath("original.txt")!,
    editor = new Editor("original", [], app);
  editor.file = file;
  return { app, file, editor, manager: new FileManager(app) };
}
function edit(editor: Editor, value: string) {
  editor.view.dispatch({
    changes: { from: 0, to: editor.view.state.doc.length, insert: value },
  });
}

it("flushes a pending editor before rename without recreating the old filename", async () => {
  const { app, file, editor, manager } = await fixture();
  try {
    edit(editor, "latest draft");
    await manager.renameFile(file, "renamed.txt");
    editor.file = app.vault.getFileByPath("renamed.txt");
    await editor.flushChanges();
    expect(app.vault.getFileByPath(file.path)).toBeNull();
    expect(await app.vault.read(app.vault.getFileByPath("renamed.txt"))).toBe(
      "latest draft",
    );
  } finally {
    await editor.dispose();
  }
});

it("flushes descendant drafts before moving their folder", async () => {
  const { app, editor, manager } = await fixture({
    "folder/note.txt": "original",
  });
  const child = app.vault.getFileByPath("folder/note.txt")!;
  editor.file = child;
  try {
    edit(editor, "folder draft");
    await manager.renameFile(app.vault.getFolderByPath("folder")!, "moved");
    editor.file = app.vault.getFileByPath("moved/note.txt");
    await editor.flushChanges();
    expect(app.vault.getFolderByPath("folder")).toBeNull();
    expect(await app.vault.read(editor.file)).toBe("folder draft");
  } finally {
    await editor.dispose();
  }
});

it("keeps every editor protected while collecting and applying link replacements", async () => {
  const { app, file, editor, manager } = await fixture();
  const source = app.vault.getFileByPath("other.txt")!,
    sourceEditor = new Editor("other", [], app);
  sourceEditor.file = source;
  edit(sourceEditor, "See [[original.txt]]");
  app.metadataCache.queryLinks.mockImplementation(async () => {
    expect(editor.editingProtected).toBe(true);
    expect(sourceEditor.editingProtected).toBe(true);
    expect(await app.vault.read(source)).toBe("See [[original.txt]]");
    edit(sourceEditor, "blocked collection write");
    expect(sourceEditor.getValue()).toBe("See [[original.txt]]");
    return [
      {
        sourcePath: source.path,
        targetText: "original.txt",
        original: "[[original.txt]]",
        position: { start: { offset: 4 }, end: { offset: 20 } },
      },
    ];
  });
  const process = app.vault.process.bind(app.vault);
  vi.spyOn(app.vault, "process").mockImplementation(
    async (target: any, update: any) => {
      expect(editor.editingProtected).toBe(true);
      expect(sourceEditor.editingProtected).toBe(true);
      return process(target, update);
    },
  );
  try {
    await manager.renameFile(file, "renamed.txt");
    expect(await app.vault.read(source)).toBe("See [[renamed.txt]]");
    expect(editor.editingProtected).toBe(false);
    expect(sourceEditor.editingProtected).toBe(false);
  } finally {
    await Promise.all([editor.dispose(), sourceEditor.dispose()]);
  }
});

it("refuses a changed source after editor admission without moving either path", async () => {
  const { app, file, editor, manager } = await fixture();
  const rename = vi.spyOn(app.vault, "rename");
  const unregister = app.fileEditingSessions.register("other.txt", {
    dirty: false,
    flush: async () => undefined,
    protect: async () => {
      file.path = "other.txt";
      return () => undefined;
    },
  });
  try {
    await expect(manager.renameFile(file, "renamed.txt")).rejects.toThrow(
      /target changed/,
    );
    expect(rename).not.toHaveBeenCalled();
    expect(app.vault.getFileByPath("renamed.txt")).toBeNull();
    expect(editor.editingProtected).toBe(false);
  } finally {
    file.path = "original.txt";
    unregister();
    await editor.dispose();
  }
});

it("releases editor protection when filesystem rename fails", async () => {
  const { app, file, editor, manager } = await fixture();
  vi.spyOn(app.vault, "rename").mockRejectedValueOnce(new Error("move failed"));
  try {
    edit(editor, "saved before failure");
    await expect(manager.renameFile(file, "renamed.txt")).rejects.toThrow(
      "move failed",
    );
    expect(editor.editingProtected).toBe(false);
    expect(await app.vault.read(file)).toBe("saved before failure");
    expect(app.vault.getFileByPath("renamed.txt")).toBeNull();
  } finally {
    await editor.dispose();
  }
});

it("does not rename when a registered draft fails to persist", async () => {
  const { app, file, editor, manager } = await fixture();
  try {
    edit(editor, "draft");
    vi.spyOn(app.vault, "modify").mockRejectedValueOnce(
      new Error("save failed"),
    );
    await expect(manager.renameFile(file, "renamed.txt")).rejects.toThrow(
      "save failed",
    );
    expect(app.vault.getFileByPath("original.txt")).not.toBeNull();
    expect(app.vault.getFileByPath("renamed.txt")).toBeNull();
    expect(editor.editingProtected).toBe(false);
    await editor.flushChanges();
  } finally {
    await editor.dispose();
  }
});
