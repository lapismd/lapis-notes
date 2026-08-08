import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  createMarkdownConfigurationSchema,
  MIRA_FEATURE_KEYS,
  miraFeatureConfigKey,
} from "../mira/config";

export function registerMarkdownSettings(plugin: Plugin): void {
  const schema = createMarkdownConfigurationSchema();
  plugin.app.configuration.schema.register(schema);
  plugin.register(() => {
    plugin.app.configuration.schema.unregister(schema);
  });

  const binding = getWorkspaceHostBinding(plugin.app.workspace);
  if (!binding) return;

  const fields = [
    {
      id: "editor.defaultViewForNewTabs",
      type: "enum" as const,
      title: "Default view for new tabs",
      options: [
        { value: "editing", label: "Editing" },
        { value: "reading", label: "Reading" },
      ],
      default: "editing",
    },
    {
      id: "editor.defaultEditingMode",
      type: "enum" as const,
      title: "Default editing mode",
      options: [
        { value: "source", label: "Source" },
        { value: "live-preview", label: "Live Preview" },
      ],
      default: "source",
    },
    {
      id: "markdown.mira.plugins.mermaid.enabled",
      type: "boolean" as const,
      title: "Mermaid plugin",
      default: true,
    },
    {
      id: "markdown.mira.plugins.ai.enabled",
      type: "boolean" as const,
      title: "AI plugin",
      default: false,
    },
    {
      id: "markdown.mira.plugins.ai.slashCommand",
      type: "boolean" as const,
      title: "AI slash command",
      default: true,
    },
    {
      id: "markdown.mira.plugins.ai.blockAction",
      type: "boolean" as const,
      title: "AI block action",
      default: true,
    },
    ...MIRA_FEATURE_KEYS.map((feature) => ({
      id: miraFeatureConfigKey(feature),
      type: "boolean" as const,
      title: `Feature: ${feature}`,
      default: true,
    })),
  ];

  plugin.register(
    binding.controller.registerSettingsSection({
      id: "lapis-markdown",
      title: "Markdown",
      description: "Markdown modes and Mira feature / plugin options.",
      icon: "file-text",
      order: 25,
      navigationGroupId: "core-plugins",
      sourcePluginId: plugin.id,
      fields,
    }),
  );

  void plugin.app.configuration.materializeSchemaDefaults();
}
