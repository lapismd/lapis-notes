import { openSearchPanel } from "@codemirror/search";
import { NoteEditor } from "$lib/components/editor";
import {
  mountComponent,
  type MountComponent,
} from "$lib/hooks/mountComponent.svelte";
import { TextFileView } from "$lib/view.svelte";
import type { WorkspaceLeaf } from "$lib/workspace.svelte";

/**
 * Source-only text editor view backed by the API NoteEditor.
 *
 * Language behavior is supplied through the workspace editor-extension
 * registry; this view intentionally adds no Markdown rendering policy.
 *
 * @public
 */
export class SourceTextFileView extends TextFileView {
  readonly #viewType: string;
  readonly #acceptedExtensions: ReadonlySet<string>;
  #component: MountComponent<any> | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    viewType: string,
    acceptedExtensions: string | readonly string[],
  ) {
    super(leaf);
    this.#viewType = viewType;
    this.#acceptedExtensions = new Set(
      (typeof acceptedExtensions === "string"
        ? [acceptedExtensions]
        : acceptedExtensions
      ).map(normalizeExtension),
    );
  }

  getViewType(): string {
    return this.#viewType;
  }

  getViewData(): string {
    return this.editor.getValue();
  }

  setViewData(data: string, clear: boolean = false): void {
    void clear;
    this.data = data;
    this.editor.setValue(data);
  }

  clear(): void {
    this.data = "";
    this.editor.setValue("");
  }

  load(): void {
    if (!this.containerEl) return;
    this.unload();
    this.containerEl.replaceChildren();
    this.containerEl.classList.add("text-view", "source-text-file-view");
    this.actions = [];
    this.#component = mountComponent(NoteEditor, {
      target: this.containerEl,
      props: {
        leaf: this.leaf,
        editor: this.editor,
      },
    });
  }

  unload(): void {
    this.#component?.destroy();
    this.#component = null;
  }

  canAcceptExtension(extension: string): boolean {
    return this.#acceptedExtensions.has(normalizeExtension(extension));
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  getDisplayText(): string {
    return this.file?.baseName ?? "";
  }

  showSearch(replace?: boolean): void {
    void replace;
    openSearchPanel(this.editor.view);
  }
}

function normalizeExtension(extension: string): string {
  return extension.trim().replace(/^\./, "").toLowerCase();
}
