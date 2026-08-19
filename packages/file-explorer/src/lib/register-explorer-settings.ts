import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  EXPLORER_SETTING_IDS,
  EXPLORER_SETTINGS_SECTION_ID,
} from "./explorer-settings";

export function createExplorerSettingsSection() {
  return {
    id: EXPLORER_SETTINGS_SECTION_ID,
    title: "Explorer",
    description: "File tree reveal and hidden-file visibility.",
    icon: "folder-closed" as const,
    order: 22,
    navigationGroupId: "core-plugins",
    sourcePluginId: "lapis-file-explorer",
    fields: [
      {
        id: EXPLORER_SETTING_IDS.autoRevealCurrentFile,
        type: "boolean" as const,
        title: "Auto-reveal current file",
        description: "Reveal the active file in Explorer.",
        default: true,
      },
      {
        id: EXPLORER_SETTING_IDS.showHiddenFiles,
        type: "boolean" as const,
        title: "Show hidden files",
        description:
          "Show dotted names, including .obsidian, .trash, and .lapis.",
        default: false,
      },
    ],
  };
}

export function registerExplorerSettings(plugin: Plugin): void {
  if (!plugin.app.workspace) return;
  const binding = getWorkspaceHostBinding(plugin.app.workspace);
  if (!binding) return;
  plugin.register(
    binding.controller.registerSettingsSection(createExplorerSettingsSection()),
  );
}
