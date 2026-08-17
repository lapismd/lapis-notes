import type { App } from "@lapis-notes/api";
import type { AppToolEffect } from "@lapis-notes/api/agent-tools";
import {
  appToolSettingId,
  isAppToolEnabled,
  type AiPluginSettings,
  type AppToolEnablementOwner,
  type AppToolEnablementRef,
} from "./ai-settings";

export type AppToolSettingRow = {
  name: string;
  fieldId: string;
  pluginId: string;
  pluginLabel: string;
  effect: AppToolEffect;
  description: string;
  owner: AppToolEnablementOwner;
  enabled: boolean;
};

export function registeredAppToolRefs(
  app: App,
): AppToolEnablementRef[] {
  return app.agentTools.list().map((registered) => ({
    name: registered.tool.name,
    owner: registered.owner,
  }));
}

export function contributingPluginLabel(app: App, pluginId: string): string {
  const name = app.plugins.plugins.get(pluginId)?.manifest.name?.trim();
  return name || pluginId;
}

export function listAppToolSettingRows(
  app: App,
  settings: AiPluginSettings,
): AppToolSettingRow[] {
  return app.agentTools
    .list()
    .slice()
    .sort((left, right) => left.tool.name.localeCompare(right.tool.name))
    .map((registered) => {
      const pluginLabel = contributingPluginLabel(
        app,
        registered.owner.pluginId,
      );
      return {
        name: registered.tool.name,
        fieldId: appToolSettingId(registered.tool.name),
        pluginId: registered.owner.pluginId,
        pluginLabel,
        effect: registered.tool.effect,
        description: `${pluginLabel} · ${registered.tool.effect}`,
        owner: registered.owner,
        enabled: isAppToolEnabled(
          { name: registered.tool.name, owner: registered.owner },
          settings,
        ),
      };
    });
}
