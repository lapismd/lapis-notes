import { expect, it, vi } from "vitest";
import { flushWorkspaceEditors } from "../sync-editor-flush";
import type { Workspace } from "../workspace.svelte";

function fixture(paths: string[]) {
  const editors = paths.map((path) => ({
    file: { path },
    flushChanges: vi.fn(async () => {}),
  }));
  const leaves = editors.map((editor) => ({
    view: { editor, file: editor.file },
  }));
  const workspace = {
    iterateAllLeaves: (visit: (leaf: unknown) => void) => {
      for (const leaf of leaves) visit(leaf);
    },
  } as unknown as Workspace;
  return { workspace, editors, leaves };
}

it("flushes all owned panes even when the active editor is another file", async () => {
  const { workspace, editors } = fixture([
    "active.md",
    "inactive.md",
    "sidebar.md",
    "floating.md",
  ]);
  await expect(flushWorkspaceEditors(workspace)).resolves.toEqual({
    flushed: true,
  });
  for (const editor of editors)
    expect(editor.flushChanges).toHaveBeenCalledOnce();
});

it("matches a requested file across inactive and duplicate editor leaves", async () => {
  const { workspace, editors, leaves } = fixture(["active.md", "requested.md"]);
  leaves.push(leaves[1]!);
  await expect(
    flushWorkspaceEditors(workspace, "requested.md"),
  ).resolves.toEqual({ flushed: true, path: "requested.md" });
  expect(editors[0]!.flushChanges).not.toHaveBeenCalled();
  expect(editors[1]!.flushChanges).toHaveBeenCalledOnce();
});

it("rejects a changed document and retains persistence failures", async () => {
  const { workspace, editors } = fixture(["note.md"]);
  editors[0]!.flushChanges.mockImplementation(async () => {
    editors[0]!.file.path = "other.md";
  });
  await expect(flushWorkspaceEditors(workspace)).rejects.toThrow(
    "document changed",
  );
  editors[0]!.flushChanges.mockRejectedValueOnce(new Error("unsaved buffer"));
  await expect(flushWorkspaceEditors(workspace)).rejects.toThrow(
    "unsaved buffer",
  );
});

it("does not claim a flush when no matching editor exists", async () => {
  const { workspace } = fixture(["other.md"]);
  await expect(flushWorkspaceEditors(workspace, "missing.md")).resolves.toEqual(
    { flushed: false, path: "missing.md" },
  );
});

it("drains every captured editor before returning a persistence failure", async () => {
  const { workspace, editors } = fixture(["failed.md", "saving.md"]);
  const failure = new Error("save failed");
  let release!: () => void;
  const saving = new Promise<void>((resolve) => {
    release = resolve;
  });
  editors[0]!.flushChanges.mockRejectedValueOnce(failure);
  editors[1]!.flushChanges.mockImplementationOnce(() => saving);
  let settled = false;
  const pending = flushWorkspaceEditors(workspace).then(
    () => {
      settled = true;
    },
    (error: unknown) => {
      settled = true;
      return error;
    },
  );
  try {
    for (let index = 0; index < 8; index++) await Promise.resolve();
    expect(editors[1]!.flushChanges).toHaveBeenCalledOnce();
    expect(settled).toBe(false);
    release();
    expect(await pending).toBe(failure);
  } finally {
    release();
    await pending;
  }
});
