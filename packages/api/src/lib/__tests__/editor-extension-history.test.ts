import { describe, expect, it, vi } from "vitest";
import {
  history,
  redo,
  redoDepth,
  undo,
  undoDepth,
} from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { flushSync, mount, unmount } from "svelte";
import { Editor } from "../editor.svelte";
import { EventDispatcher } from "../events";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import EmbeddedEditorEffects from "../../../test/fixtures/EmbeddedEditorEffects.svelte";

function owner() {
  return {
    vault: { modify: vi.fn(async () => undefined) },
    fileEditingSessions: new FileEditingSessionRegistry(),
    workspace: Object.assign(new EventDispatcher(), { dispatch: vi.fn() }),
    editorExtensions: vi.fn(() => [history()]),
    telemetry: {
      measure: (_name: string, run: (span: unknown) => unknown) =>
        run({ setAttribute: vi.fn() }),
    },
  } as any;
}

function edit(editor: Editor, text: string) {
  editor.view.dispatch({
    changes: { from: 0, to: editor.view.state.doc.length, insert: text },
    selection: { anchor: 2 },
    userEvent: "input.type",
  });
}

describe("editor extension history", () => {
  it("retains history, selection, protection and pending writes across refresh", async () => {
    const app = owner(),
      editor = new Editor("original", [history()], app);
    editor.file = { path: "note.md" } as any;
    try {
      edit(editor, "draft");
      expect(undoDepth(editor.view.state)).toBe(1);
      const release = await editor.protect();
      editor.updateExtensions([history(), EditorState.tabSize.of(8)]);
      expect(editor.getValue()).toBe("draft");
      expect(editor.view.state.selection.main.anchor).toBe(2);
      expect(editor.editingProtected).toBe(true);
      expect(undoDepth(editor.view.state)).toBe(1);
      editor.view.dispatch({ changes: { from: 0, insert: "blocked" } });
      expect(editor.getValue()).toBe("draft");
      release();
      expect(undo(editor.view)).toBe(true);
      expect(editor.getValue()).toBe("original");
      expect(redoDepth(editor.view.state)).toBe(1);
      editor.updateExtensions([history(), EditorState.tabSize.of(4)]);
      expect(redo(editor.view)).toBe(true);
      expect(editor.getValue()).toBe("draft");
      await editor.flushChanges();
      expect(app.vault.modify).toHaveBeenLastCalledWith(editor.file, "draft");
    } finally {
      editor.destroy();
    }
  });

  it("keeps explicit document replacement separate from extension refresh", () => {
    const editor = new Editor("first", [history()], owner());
    try {
      edit(editor, "first draft");
      expect(undoDepth(editor.view.state)).toBe(1);
      editor.setValue("second");
      expect(undoDepth(editor.view.state)).toBe(0);
      editor.updateExtensions([history()]);
      edit(editor, "second draft");
      expect(undo(editor.view)).toBe(true);
      expect(editor.getValue()).toBe("second");
    } finally {
      editor.destroy();
    }
  });

  it("tracks explicit surface changes without subscribing to protection state", async () => {
    const app = owner(),
      editor = new Editor("original", [history()], app);
    editor.file = { path: "note.md" } as any;
    const target = document.createElement("div");
    document.body.append(target);
    const surface = mount(EmbeddedEditorEffects, {
      target,
      props: { app, editor },
    });
    try {
      flushSync();
      expect(app.editorExtensions).toHaveBeenCalledTimes(1);
      edit(editor, "draft");
      const release = await editor.protect();
      flushSync();
      expect(app.editorExtensions).toHaveBeenCalledTimes(1);
      release();
      flushSync();
      expect(app.editorExtensions).toHaveBeenCalledTimes(1);
      surface.changeMode("live-preview");
      flushSync();
      expect(app.editorExtensions).toHaveBeenCalledTimes(2);
      expect(app.editorExtensions).toHaveBeenLastCalledWith("markdown", {
        mode: "live-preview",
      });
      expect(undoDepth(editor.view.state)).toBe(1);
    } finally {
      await unmount(surface);
      editor.destroy();
      target.remove();
    }
  });
});
