import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { AiPluginSettings } from "../settings/ai-settings";
import type { CatalogGroup, CatalogToolRow } from "./types";
import AiCatalogPanel from "./ai-catalog-panel.svelte";
import { AiCatalogViewType } from "./ai-catalog-view-type";

export type AiCatalogViewHost = {
  loadAiCatalog(): Promise<CatalogGroup[]>;
  setCatalogToolEnabled(
    tool: CatalogToolRow,
    enabled: boolean,
  ): Promise<void>;
  openCatalogSkill(path: string): Promise<void>;
  subscribeSettings(
    listener: (patch: Partial<AiPluginSettings>) => void,
  ): () => void;
};

export class AiCatalogView extends View {
  private component: Record<string, unknown> | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly host: AiCatalogViewHost,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return AiCatalogViewType;
  }

  getDisplayText(): string {
    return "Catalog";
  }

  getIcon(): string {
    return "library";
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  load(): void {
    this.unload();
    this.containerEl.replaceChildren();
    this.containerEl.classList.add("ai-catalog-view");
    this.component = mount(AiCatalogPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        loadCatalog: () => this.host.loadAiCatalog(),
        onToggleTool: (tool: CatalogToolRow, enabled: boolean) =>
          this.host.setCatalogToolEnabled(tool, enabled),
        onOpenSkill: (path: string) => this.host.openCatalogSkill(path),
        subscribeSettings: (listener: () => void) =>
          this.host.subscribeSettings(() => listener()),
      },
    }) as Record<string, unknown>;
  }

  unload(): void {
    if (this.component) void unmount(this.component);
    this.component = null;
  }
}

export { AiCatalogViewType } from "./ai-catalog-view-type";
