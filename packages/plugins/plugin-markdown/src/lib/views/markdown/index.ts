import {
  Menu,
  MarkdownView as RootMarkdownView,
  type MarkdownViewReturnTarget,
  type MarkdownViewState,
  type ViewStateResult,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import MarkdownEditingSurface from "./markdown-editing-surface.svelte";
import MiraPreview from "./mira-preview.svelte";
import { MIRA_EDITOR_SETTING_KEYS } from "../../mira/config";
import { readMarkdownMiraEditorSettings } from "../../mira/extensions";

export const MarkdownViewType = "markdown";

export type MarkdownViewModeType = "source" | "preview" | "live-preview";

type LegacyMarkdownViewState = MarkdownViewState & { source?: boolean };

export function markdownViewReturnTarget(
  state: Record<string, unknown>,
): MarkdownViewReturnTarget | null {
  const candidate = state["returnTarget"];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  const target = candidate as Record<string, unknown>;
  if (
    typeof target["type"] !== "string" ||
    target["type"].trim().length === 0 ||
    typeof target["label"] !== "string" ||
    target["label"].trim().length === 0
  ) {
    return null;
  }
  const icon =
    typeof target["icon"] === "string" && target["icon"].trim().length > 0
      ? target["icon"]
      : undefined;
  const targetState =
    target["state"] &&
    typeof target["state"] === "object" &&
    !Array.isArray(target["state"])
      ? { ...(target["state"] as Record<string, unknown>) }
      : undefined;
  return {
    type: target["type"].trim(),
    label: target["label"].trim(),
    ...(icon ? { icon } : {}),
    ...(targetState ? { state: targetState } : {}),
  };
}

export class MarkdownView extends RootMarkdownView {
  private component: unknown = null;
  private pendingEditorExtensionRefresh = false;
  editMode!: MarkdownView;

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
    this.editMode = this;
    const defaults = this.resolveDefaultMode();
    this.state["mode"] ||= defaults;
  }

  private resolveDefaultMode(): MarkdownViewModeType {
    const config = this.app?.configuration?.getConfiguration?.();
    const viewForNew = String(
      config?.get?.("editor.defaultViewForNewTabs", "editing") ?? "editing",
    );
    if (viewForNew === "reading") {
      return "preview";
    }
    const editingMode = String(
      config?.get?.("editor.defaultEditingMode", "source") ?? "source",
    );
    return editingMode === "live-preview" ? "live-preview" : "source";
  }

  canAcceptExtension(extension: string): boolean {
    const normalized = extension.toLowerCase();
    return normalized === "md" || normalized === "markdown";
  }

  getMode(): MarkdownViewModeType {
    return (this.getState()["mode"] as MarkdownViewModeType) || "source";
  }

  setState(
    state: Record<string, unknown>,
    result?: ViewStateResult,
  ): Promise<void> {
    const previous = { ...this.getState() } as LegacyMarkdownViewState;
    const nextMode =
      (state["mode"] as MarkdownViewModeType | undefined) ?? previous.mode;
    if (nextMode !== previous.mode) {
      this.pendingEditorExtensionRefresh = true;
    }
    return super.setState(state, result).then(() => {
      if (nextMode !== previous.mode) {
        this.load();
      }
    });
  }

  async onLoadFile(
    file: Parameters<RootMarkdownView["onLoadFile"]>[0],
  ): Promise<void> {
    this.pendingEditorExtensionRefresh = false;
    await super.onLoadFile(file);
  }

  getViewData(): string {
    return this.editor.getValue();
  }

  setViewData(data: string, _clear: boolean): void {
    this.editor.setValue(data);
  }

  clear(): void {
    this.editor.setValue("");
  }

  showEditor() {
    if (this.state.mode !== "live-preview") {
      this.pendingEditorExtensionRefresh = true;
    }
    this.state.mode = "live-preview";
    this.load();
  }

  private switchModeFromAction(
    targetMode: MarkdownViewModeType,
    event: MouseEvent,
  ): void {
    if (event.metaKey || event.ctrlKey) {
      const leaf = this.app.workspace.getLeaf("split", "horizontal");
      void leaf
        .setViewState({
          ...this.leaf.state,
          state: {
            ...(this.leaf.state.state ?? {}),
            mode: targetMode,
          },
        })
        .then(() => this.app.workspace.requestSaveLayout());
      return;
    }

    void this.setState({ ...this.getState(), mode: targetMode }).then(() =>
      this.app.workspace.requestSaveLayout(),
    );
  }

  private switchToReturnTarget(
    target: MarkdownViewReturnTarget,
    event: MouseEvent,
  ): void {
    const leaf =
      event.metaKey || event.ctrlKey
        ? this.app.workspace.getLeaf("split", "horizontal")
        : this.leaf;
    const file = this.file?.path;
    void leaf
      .setViewState(
        {
          type: target.type,
          active: true,
          state: {
            ...(target.state ?? {}),
            ...(file ? { file } : {}),
          },
        },
        { history: true },
      )
      .then(() => this.app.workspace.requestSaveLayout());
  }

  load(): void {
    if (!this.containerEl) return;
    this.containerEl.classList.add("markdown-view");
    const mode = this.getMode();
    const returnTarget = markdownViewReturnTarget(this.getState());
    this.unload();
    this.containerEl.empty();
    this.actions = [];

    if (mode === "preview") {
      this.addAction(
        "pencil",
        "Current view: preview\nClick to edit\n⌘+Click to open to the right",
        (event) => this.switchModeFromAction("live-preview", event),
      );
      this.component = mount(MiraPreview, {
        target: this.containerEl,
        props: {
          app: this.app,
          value: this.editor.getValue(),
          sourcePath: this.file?.path ?? "",
          onChange: (next: string) => {
            this.editor.setValue(next);
          },
        },
      });
      return;
    }

    if (
      this.pendingEditorExtensionRefresh ||
      this.editor.extensions.length === 0
    ) {
      this.editor.updateExtensions([], this.getState());
      this.pendingEditorExtensionRefresh = false;
    }

    if (returnTarget) {
      this.addAction(
        returnTarget.icon ?? "book-open",
        `Current view: editing\nClick to open ${returnTarget.label}\n⌘+Click to open to the right`,
        (event) => this.switchToReturnTarget(returnTarget, event),
      );
    } else {
      this.addAction(
        "book-open",
        "Current view: editing\nClick to read\n⌘+Click to open to the right",
        (event) => this.switchModeFromAction("preview", event),
      );
    }

    this.component = mount(MarkdownEditingSurface, {
      target: this.containerEl,
      props: {
        app: this.app,
        leaf: this.leaf,
        editor: this.editor,
        mode,
        onModeChange: (nextMode) => {
          void this.setState({ ...this.getState(), mode: nextMode }).then(() =>
            this.app.workspace.requestSaveLayout(),
          );
        },
      },
    });
  }

  unload(): void {
    if (this.component) {
      unmount(this.component as Parameters<typeof unmount>[0]);
      this.component = null;
    }
  }

  protected onClose(): Promise<void> {
    this.unload();
    return Promise.resolve();
  }

  getViewType(): string {
    return MarkdownViewType;
  }

  getDisplayText(): string {
    return this.file?.baseName ?? "";
  }

  showSearch(_replace?: boolean): void {}

  onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string): void {
    const view = this;
    const mode = this.getMode();
    const editorSettings = readMarkdownMiraEditorSettings(this.app);
    if (!this.file) {
      return;
    }

    menu.addItem((item) => {
      item
        .setSection("view")
        .setTitle("Reading view")
        .setChecked(mode === "preview")
        .onClick(() => {
          const newMode = mode === "preview" ? "live-preview" : "preview";
          void view
            .setState({ ...view.getState(), mode: newMode })
            .then(() => this.app.workspace.requestSaveLayout());
        });
    });

    if (mode !== "preview") {
      menu.addItem((item) => {
        item
          .setSection("view")
          .setTitle("Source mode")
          .setChecked(mode === "source")
          .onClick(() => {
            const newMode = mode === "source" ? "live-preview" : "source";
            void view
              .setState({ ...view.getState(), mode: newMode })
              .then(() => this.app.workspace.requestSaveLayout());
          });
      });
      menu.addItem((item) => {
        item
          .setSection("view")
          .setTitle("Show editor toolbar")
          .setChecked(editorSettings.toolbar)
          .onClick(() => {
            void this.app.configuration.updateConfigurationOption(
              MIRA_EDITOR_SETTING_KEYS.toolbar,
              !editorSettings.toolbar,
            );
          });
      });
    }

    for (const provider of this.app.markdownViewMenuItems) {
      provider({
        menu,
        source,
        leaf: this.leaf,
        file: this.file,
      });
    }
  }
}
