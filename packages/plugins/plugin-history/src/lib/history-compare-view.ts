import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import HistoryComparePanel from "./history-compare-panel.svelte";
import type {
  HistoryCompareViewState,
  HistoryPlugin,
} from "./history-plugin";
import { HistoryCompareViewType } from "./history-view-type";

function readCompareState(
  state: Record<string, unknown>,
): HistoryCompareViewState | null {
  if (typeof state["filePath"] !== "string") return null;
  if (typeof state["revisionId"] !== "string") return null;
  const compareMode = state["compareMode"];
  if (
    compareMode !== "current" &&
    compareMode !== "previous" &&
    compareMode !== "selected"
  ) {
    return null;
  }
  return {
    filePath: state["filePath"],
    revisionId: state["revisionId"],
    compareMode,
    otherRevisionId:
      typeof state["otherRevisionId"] === "string"
        ? state["otherRevisionId"]
        : undefined,
    sourceLeafId:
      typeof state["sourceLeafId"] === "string"
        ? state["sourceLeafId"]
        : undefined,
  };
}

export class HistoryCompareView extends View {
  private component: Record<string, unknown> | null = null;
  private compareState: HistoryCompareViewState | null = null;

  constructor(
    private readonly historyPlugin: HistoryPlugin,
    leaf: WorkspaceLeaf,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return HistoryCompareViewType;
  }

  getDisplayText(): string {
    return this.compareState
      ? `History: ${this.compareState.filePath}`
      : "History compare";
  }

  getIcon(): string {
    return "git-compare";
  }

  getBreadcrumbFilePath(): string | null {
    return this.compareState?.filePath ?? null;
  }

  getBreadcrumbs() {
    return [
      {
        id: "history",
        label: "History",
        onSelect: () => {
          void this.historyPlugin.openHistoryView(this.compareState?.filePath);
        },
      },
    ];
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.compareState = readCompareState(this.getState());
    this.mountPanel();
  }

  async setState(state: Record<string, unknown>): Promise<void> {
    await super.setState(state);
    this.compareState = readCompareState(state);
    if (this.loaded) this.mountPanel();
  }

  onunload(): void {
    this.unmountPanel();
  }

  private mountPanel(): void {
    this.unmountPanel();
    if (!this.compareState) return;
    this.component = mount(HistoryComparePanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        compareState: this.compareState,
      },
    }) as Record<string, unknown>;
  }

  private unmountPanel(): void {
    if (this.component) void unmount(this.component);
    this.component = null;
  }
}
