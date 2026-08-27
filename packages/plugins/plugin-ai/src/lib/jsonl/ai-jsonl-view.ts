import {
  TextFileView,
  mountComponent,
  type App,
  type MountComponent,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import AiJsonlViewSurface from "./ai-jsonl-view.svelte";
import { AiJsonlViewType } from "./ai-jsonl-view-type";

type AiJsonlViewProps = {
  app: App;
  data: string;
  filePath: string;
};

export { AiJsonlViewType } from "./ai-jsonl-view-type";

export class AiJsonlView extends TextFileView {
  #component: MountComponent<AiJsonlViewProps> | null = null;

  getViewType(): string {
    return AiJsonlViewType;
  }

  getViewData(): string {
    return this.data;
  }

  setViewData(data: string, clear = false): void {
    void clear;
    this.data = data;
    if (this.#component) this.#component.props.data = data;
  }

  clear(): void {
    this.setViewData("", true);
  }

  load(): void {
    if (!this.containerEl) return;
    this.unload();
    this.containerEl.replaceChildren();
    this.containerEl.classList.add("text-view", "ai-jsonl-file-view");
    this.actions = [];
    this.#component = mountComponent(AiJsonlViewSurface, {
      target: this.containerEl,
      props: {
        app: this.app,
        data: this.data,
        filePath: this.file?.path ?? "",
      },
    });
  }

  unload(): void {
    this.#component?.destroy();
    this.#component = null;
  }

  canAcceptExtension(extension: string): boolean {
    return extension.trim().replace(/^\./u, "").toLowerCase() === "jsonl";
  }

  getDisplayText(): string {
    return this.file?.name ?? "JSONL preview";
  }

  getIcon(): string {
    return "messages-square";
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }
}
