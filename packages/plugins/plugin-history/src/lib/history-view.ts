import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import HistoryPanel from "./history-panel.svelte";
import { HistoryViewType } from "./history-view-type";

export class HistoryView extends View {
  private component: Record<string, unknown> | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return HistoryViewType;
  }

  getDisplayText(): string {
    return "History";
  }

  getIcon(): string {
    return "history";
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.component = mount(HistoryPanel, {
      target: this.containerEl,
      props: { app: this.app },
    }) as Record<string, unknown>;
  }

  onunload(): void {
    if (this.component) void unmount(this.component);
    this.component = null;
  }
}
