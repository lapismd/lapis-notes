import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  getValue: vi.fn(() => "current source"),
  mountComponent: vi.fn(),
  openSearchPanel: vi.fn(),
  setValue: vi.fn(),
}));

vi.mock("@codemirror/search", () => ({
  openSearchPanel: mocks.openSearchPanel,
}));

vi.mock("$lib/components/editor", () => ({
  NoteEditor: { name: "NoteEditor" },
}));

vi.mock("$lib/hooks/mountComponent.svelte", () => ({
  mountComponent: mocks.mountComponent,
}));

vi.mock("$lib/view.svelte", () => ({
  TextFileView: class TextFileView {
    actions: unknown[] = [];
    containerEl: HTMLElement;
    data = "";
    editor = {
      getValue: mocks.getValue,
      setValue: mocks.setValue,
      view: { id: "editor-view" },
    };
    file: { baseName: string } | null = null;
    leaf: unknown;

    constructor(leaf: { containerEl: HTMLElement }) {
      this.leaf = leaf;
      this.containerEl = leaf.containerEl;
    }
  },
}));

import { NoteEditor } from "$lib/components/editor";
import { SourceTextFileView } from "../source-text-file-view";

function createContainer() {
  return {
    classList: { add: vi.fn() },
    replaceChildren: vi.fn(),
  } as unknown as HTMLElement;
}

describe("SourceTextFileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mountComponent.mockReturnValue({ destroy: mocks.destroy });
    mocks.getValue.mockReturnValue("current source");
  });

  it("accepts configured extensions and exposes source data", () => {
    const view = new SourceTextFileView(
      { containerEl: createContainer() } as any,
      "markdown",
      [".md", "MARKDOWN"],
    );
    (view as any).file = { baseName: "README.md" };

    expect(view.getViewType()).toBe("markdown");
    expect(view.canAcceptExtension("md")).toBe(true);
    expect(view.canAcceptExtension(".markdown")).toBe(true);
    expect(view.canAcceptExtension("txt")).toBe(false);
    expect(view.getViewData()).toBe("current source");
    expect(view.getDisplayText()).toBe("README.md");
  });

  it("mounts NoteEditor, clears source, and opens editor search", () => {
    const containerEl = createContainer();
    const view = new SourceTextFileView({ containerEl } as any, "text", "txt");

    view.setViewData("loaded source", true);
    expect(mocks.setValue).toHaveBeenLastCalledWith("loaded source");
    expect(view.data).toBe("loaded source");

    view.load();
    expect(containerEl.replaceChildren).toHaveBeenCalledOnce();
    expect(containerEl.classList.add).toHaveBeenCalledWith(
      "text-view",
      "source-text-file-view",
    );
    expect(mocks.mountComponent).toHaveBeenCalledWith(NoteEditor, {
      target: containerEl,
      props: {
        leaf: view.leaf,
        editor: view.editor,
      },
    });

    view.showSearch();
    expect(mocks.openSearchPanel).toHaveBeenCalledWith(view.editor.view);

    view.clear();
    expect(view.data).toBe("");
    expect(mocks.setValue).toHaveBeenLastCalledWith("");

    view.unload();
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });
});
