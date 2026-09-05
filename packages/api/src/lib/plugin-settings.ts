import {
  DeclarativeSettingsSection,
  WorkspaceSettingsController,
  type WorkspaceActionResult,
  type WorkspaceActionSetting,
  type WorkspaceCustomFieldAdapter,
  type WorkspaceCustomSetting,
  type WorkspaceCustomSettingProps,
  type WorkspaceObjectCollectionSetting,
  type WorkspaceObjectProperty,
  type WorkspaceObjectRowAction,
  type WorkspaceOutputSetting,
  type WorkspaceSettingField,
  type WorkspaceSettingsDefinition,
  type WorkspaceSettingsSection,
  type WorkspaceSettingsSource,
} from "@lapismd/design-core/workspace/settings";
import { mount, unmount, type Component as SvelteComponent } from "svelte";
import type { App } from "./context.svelte";
import type { Plugin } from "./plugin";
import { PluginSettingTab } from "./settings.svelte";

export type PluginSettingsDefinition = WorkspaceSettingsDefinition;

export interface PluginSettingsRegistration {
  readonly definition: PluginSettingsDefinition;
  open(fieldId?: string): boolean;
  dispose(): void;
}

export type {
  WorkspaceActionResult,
  WorkspaceActionSetting,
  WorkspaceCustomFieldAdapter,
  WorkspaceCustomSetting,
  WorkspaceCustomSettingProps,
  WorkspaceObjectCollectionSetting,
  WorkspaceObjectProperty,
  WorkspaceObjectRowAction,
  WorkspaceOutputSetting,
  WorkspaceSettingField,
  WorkspaceSettingsSection,
  WorkspaceSettingsSource,
};

/**
 * Compatibility settings tab backed by the same controlled definition as the
 * Workspace Settings surface.
 */
export class DeclarativePluginSettingTab extends PluginSettingTab {
  readonly #definition: PluginSettingsDefinition;
  #component: object | null = null;
  #controller: WorkspaceSettingsController | null = null;

  constructor(
    app: App,
    plugin: Plugin,
    definition: PluginSettingsDefinition,
  ) {
    super(app, plugin);
    this.#definition = definition;
  }

  display(): void {
    this.#disposeRenderer();
    this.containerEl.empty();
    const controller = new WorkspaceSettingsController();
    controller.registerDefinition(this.#definition);
    this.#controller = controller;
    this.#component = mount(
      DeclarativeSettingsSection as SvelteComponent,
      {
        target: this.containerEl,
        props: {
          controller,
          section: this.#definition.section,
          class: "ui-workspace-settings--legacy-tab",
        },
      },
    );
  }

  override hide(): void {
    this.#disposeRenderer();
  }

  #disposeRenderer(): void {
    if (this.#component) void unmount(this.#component);
    this.#component = null;
    this.#controller?.destroy();
    this.#controller = null;
  }
}
