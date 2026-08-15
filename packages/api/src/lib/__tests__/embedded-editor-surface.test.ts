import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  markupEditor: vi.fn(() => ({ fallback: true })),
}));

vi.mock("$lib/components/editor/editor", () => ({
  markupEditor: mocks.markupEditor,
}));

import {
  applyEmbeddedEditorExtensions,
  embeddedEditorContext,
  resolveEmbeddedEditorExtensions,
} from "$lib/components/editor/embedded-editor-surface";

describe("embedded editor surface extensions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves the registered view extension with mode and source context", () => {
    const registered = [{ rich: true }];
    const app = {
      editorExtensions: vi.fn(() => registered),
    } as any;

    const options = {
      viewType: "markdown",
      mode: "live-preview",
      sourcePath: "Roles/atlas/role.md",
      fallbackLanguage: "markdown",
    };

    expect(embeddedEditorContext(options)).toEqual({
      mode: "live-preview",
      file: "Roles/atlas/role.md",
    });
    expect(resolveEmbeddedEditorExtensions(app, options)).toBe(registered);
    expect(app.editorExtensions).toHaveBeenCalledWith("markdown", {
      mode: "live-preview",
      file: "Roles/atlas/role.md",
    });
    expect(mocks.markupEditor).not.toHaveBeenCalled();
  });

  it("uses the API source shell when no rich provider is active", () => {
    const app = { editorExtensions: vi.fn(() => []) } as any;
    const editor = { updateExtensions: vi.fn() } as any;
    const options = {
      viewType: "markdown",
      mode: "source",
      fallbackLanguage: "markdown",
    };

    applyEmbeddedEditorExtensions(app, editor, options);

    expect(mocks.markupEditor).toHaveBeenCalledWith({
      language: "markdown",
      app,
    });
    expect(editor.updateExtensions).toHaveBeenCalledWith([{ fallback: true }]);
  });
});
