import type { App } from "@lapis-notes/api";
import type { WorkspaceSettingsController } from "@lapismd/design-core/workspace/settings";

export class PluginManagementRevealState {
  sectionId = $state("");
  entryId = $state("");
  revision = $state(0);

  request(sectionId: string, entryId: string): void {
    this.sectionId = sectionId;
    this.entryId = entryId;
    this.revision += 1;
  }
}

export interface PluginManagementContext {
  app: App;
  reveal: PluginManagementRevealState;
}

const contexts = new WeakMap<
  WorkspaceSettingsController,
  PluginManagementContext
>();

export function setPluginManagementContext(
  controller: WorkspaceSettingsController,
  context: PluginManagementContext,
): void {
  contexts.set(controller, context);
}

export function clearPluginManagementContext(
  controller: WorkspaceSettingsController,
): void {
  contexts.delete(controller);
}

export function getPluginManagementContext(
  controller: WorkspaceSettingsController,
): PluginManagementContext {
  const context = contexts.get(controller);
  if (!context) {
    throw new Error("Plugin management settings are not bound to this app.");
  }
  return context;
}
