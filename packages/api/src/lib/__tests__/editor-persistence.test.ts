import { describe, expect, it, vi } from "vitest";
import { installApplicationCompatibility } from "../application-compatibility";
import { Editor } from "../editor.svelte";

function application(modify = vi.fn(async () => undefined)) {
  return {
    app: {
      vault: { modify },
      workspace: { dispatch: vi.fn() },
    } as any,
    modify,
  };
}

describe("Editor persistence", () => {
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
