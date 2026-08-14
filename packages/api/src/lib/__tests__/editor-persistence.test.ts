import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const modify = vi.fn(async () => undefined);

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as any).app = {
    vault: { modify },
    workspace: { dispatch: vi.fn() },
    configuration: {
      getConfiguration: () => ({ get: () => undefined }),
    },
  };
});

afterEach(() => {
  delete (globalThis as any).app;
});

describe("Editor persistence", () => {
  it("flushes host-owned changes without writing the identified file", async () => {
    const { Editor } = await import("../editor.svelte");
    const editor = new Editor("before");
    const changed = vi.fn();
    editor.file = { path: "Roles/atlas/role.md" } as any;
    editor.persistence = "external";
    editor.on("change", changed);

    editor.view.dispatch({
      changes: { from: 0, to: editor.view.state.doc.length, insert: "after" },
    });
    await editor.flushChanges();

    expect(editor.file.path).toBe("Roles/atlas/role.md");
    expect(modify).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalledWith("after");
    expect(editor.data).toBe("after");
    editor.destroy();
  });

  it("retains direct vault persistence as the default", async () => {
    const { Editor } = await import("../editor.svelte");
    const editor = new Editor("before");
    editor.file = { path: "Notes/example.md" } as any;

    editor.view.dispatch({
      changes: { from: 0, to: editor.view.state.doc.length, insert: "after" },
    });
    await editor.flushChanges();

    expect(modify).toHaveBeenCalledWith(editor.file, "after");
    editor.destroy();
  });
});
