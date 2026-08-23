import {
  type App,
  FileView,
  MarkdownView,
  TFile,
  useLocale,
  View,
  WorkspaceLeaf,
  type CachedMetadata,
  type MetadataType,
  type ViewStateResult,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { Column, RowData } from "@tanstack/table-core";
import { type BasesDocument } from "./models";
import NoteEditor from "@lapis-notes/api/editor";
import * as yaml from "js-yaml";
import type { BasesViewRegistration } from "./bases.svelte";
import { TableView } from "./table-view/index.svelte";
import { UnknownView } from "./unknown-view";
import { CardView } from "./card-view";
import { ListView } from "./list-view";
import { MapView } from "./map-view";
import { normalizeBasesDocument } from "./document-core";
import { SerializedWriteQueue } from "../serialized-write-queue";
import {
  BUILT_IN_BASES_VIEW_ITEMS,
  type BuiltInBasesViewId,
} from "./view-registration-inventory";

export * from "./models";

export const BasesViewType = "bases";

const { t } = useLocale("bases");

export const vaultKey = Symbol("vaultKey");

export type VaultRecord = {
  id: string;
  checksum?: string;
  file: TFile;
  cache: CachedMetadata | null;
  backlinks?: string[];
};

declare module "@lapis-notes/api" {
  interface IMetadataType {
    file: "file";
  }
}

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData extends RowData, TValue> {
    displayName: string;
    icon: string;
    type: MetadataType;
    frontmatter?: boolean;
  }
}

export function normalizeName(name: string) {
  return name.replaceAll(/[^a-zA-Z0-9 ]/g, " ").trim();
}

export function columnName(column: Column<any> | undefined) {
  if (!column) return "";
  return column.columnDef.meta?.displayName ?? normalizeName(column.id);
}

export type BasesViewModeType = "source" | "preview";

export function serializeBasesDocument(content: BasesDocument): string {
  const data = yaml
    .dump(content, {
      noCompatMode: true,
      schema: yaml.JSON_SCHEMA,
    })
    .trim();
  return data;
}

/** @deprecated Use serializeBasesDocument. */
export const dumpDocument = serializeBasesDocument;

export function registerBuiltInBasesViews(
  views: Map<string, BasesViewRegistration>,
): void {
  const implementations: Record<
    BuiltInBasesViewId,
    Pick<BasesViewRegistration, "factory" | "options">
  > = {
    table: {
      factory: (controller, containerEl) =>
        new TableView(controller, containerEl),
      options: TableView.getViewOptions,
    },
    unknown: {
      factory: (controller, containerEl) =>
        new UnknownView(controller, containerEl),
      options: UnknownView.getViewOptions,
    },
    cards: {
      factory: (controller, containerEl) =>
        new CardView(controller, containerEl),
      options: CardView.getViewOptions,
    },
    list: {
      factory: (controller, containerEl) =>
        new ListView(controller, containerEl),
      options: ListView.getViewOptions,
    },
    map: {
      factory: (controller, containerEl) =>
        new MapView(controller, containerEl),
      options: MapView.getViewOptions,
    },
  };

  for (const item of BUILT_IN_BASES_VIEW_ITEMS) {
    views.set(item.id, { ...item, ...implementations[item.id] });
  }
}

export function createBasesViewRegistrations(
  app: App,
  registrations?: ReadonlyMap<string, BasesViewRegistration>,
): Map<string, BasesViewRegistration> {
  const views = new Map<string, BasesViewRegistration>();
  registerBuiltInBasesViews(views);

  for (const [
    viewId,
    registration,
  ] of app.plugins.getBasesViewRegistrations()) {
    views.set(viewId, registration);
  }

  for (const [viewId, registration] of registrations ?? []) {
    views.set(viewId, registration);
  }

  return views;
}

export function parseBasesDocument(content: string): BasesDocument {
  return normalizeBasesDocument(yaml.load(content));
}

export class BasesView extends MarkdownView {
  readonly views: Map<string, BasesViewRegistration>;
  private readonly writeQueue: SerializedWriteQueue<{
    file: TFile;
    content: string;
  }>;

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
    this.state["mode"] ||= "preview";
    this.views = createBasesViewRegistrations(this.app);
    this.writeQueue = new SerializedWriteQueue(({ file, content }) =>
      this.app.vault.modify(file, content),
    );
  }

  /**
   * Register a Base view handler that can be used to render data from property
   * queries.
   *
   * @since 1.10.0
   * @returns False if bases are not enabled in this vault.
   * @public
   */
  registerBasesView(
    viewId: string,
    registration: BasesViewRegistration,
  ): boolean {
    this.views.set(viewId, registration);
    return true;
  }

  getMode(): BasesViewModeType {
    return (this.getState()["mode"] as BasesViewModeType) || "preview";
  }

  setState(
    state: Record<string, unknown>,
    result?: ViewStateResult,
  ): Promise<void> {
    const previous = { ...this.getState() };
    return super.setState(state, result).then(() => {
      if (state.mode !== previous.mode) {
        this.load();
      }
    });
  }

  getViewData(): string {
    return this.editor.getValue();
  }

  setViewData(data: string, clear?: boolean): void {
    this.editor.setValue(data);
  }

  clear(): void {
    this.editor.setValue("");
  }

  canAcceptExtension(extension: string): boolean {
    return ["bases", "base"].includes(extension);
  }

  private component!: any;
  private previewLoadVersion = 0;

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected async onClose(): Promise<void> {
    await this.writeQueue.flush();
  }

  load(): Promise<void> | void {
    if (this.containerEl) {
      const loadVersion = ++this.previewLoadVersion;
      this.unload();
      this.containerEl.empty();
      this.actions = [];
      const mode = this.getMode();

      if (mode === "preview") {
        this.containerEl.addClass("mod-loader");
        this.addAction(
          "pencil",
          `${t("Current view: preview")}\n${t("Click to edit")}\n${t("⌘+Click to open to the right")}`,
          (evt) => {
            if (evt.metaKey || evt.ctrlKey) {
              const leaf = this.app.workspace.getLeaf("split", "horizontal");
              const state = { ...this.leaf.state };
              state.state ||= {};
              state.state["mode"] = "source";
              leaf.setViewState(state);
            } else {
              this.setState({ ...this.getState(), mode: "source" });
            }
            this.app.workspace.requestSaveLayout();
          },
        );

        const doc = parseBasesDocument(this.editor.getValue());
        void import("./view.svelte").then(({ default: BasesComponent }) => {
          if (
            loadVersion !== this.previewLoadVersion ||
            this.getMode() !== "preview" ||
            !this.containerEl
          ) {
            return;
          }

          this.component = mount(BasesComponent, {
            target: this.containerEl,
            props: {
              app: this.app,
              host: this,
              registrations: this.views,
              onChange: (doc) => {
                const content = serializeBasesDocument(doc);
                this.editor.setValue(content);
                if (this.file) {
                  this.writeQueue.enqueue({
                    file: this.file,
                    content,
                  });
                }
              },
              readOnly: false,
              showHeader: true,
              document: doc,
            },
          });
        });
      } else {
        this.containerEl.removeClass("mod-loader");
        this.editor.updateExtensions(
          this.app.editorExtensions(BasesViewType, {
            file: this.file?.path,
            mode: "source",
          }),
        );
        this.addAction(
          "book-open",
          `${t("Current view: editing")}\n${t("Click to read")}\n${t("⌘+Click to open to the right")}`,
          (evt) => {
            if (evt.metaKey || evt.ctrlKey) {
              const leaf = this.app.workspace.getLeaf("split", "horizontal");
              const state = { ...this.leaf.state };
              state.state ||= {};
              state.state["mode"] = "preview";
              leaf.setViewState(state);
            } else {
              this.setState({ ...this.getState(), mode: "preview" });
            }
            this.app.workspace.requestSaveLayout();
          },
        );
        this.component = mount(NoteEditor, {
          target: this.containerEl,
          props: {
            app: this.app,
            leaf: this.leaf,
            editor: this.editor,
          },
        });
      }
    }
  }

  refresh(): void {
    this.load();
  }

  onunload(): void {
    void this.writeQueue.flush();
    if (this.component) {
      unmount(this.component);
      this.component = null;
    }
  }

  getViewType(): string {
    return BasesViewType;
  }

  getIcon(): string {
    return "lucide-database";
  }

  getDisplayText(): string {
    return this.file?.baseName ?? t("Bases");
  }
}
