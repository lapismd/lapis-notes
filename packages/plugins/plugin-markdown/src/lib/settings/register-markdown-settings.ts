import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  createMarkdownConfigurationSchema,
  createMarkdownSettingsFields,
} from "../mira/config";

export function registerMarkdownSettings(plugin: Plugin): void {
  const schema = createMarkdownConfigurationSchema();
  plugin.app.configuration.schema.register(schema);
  plugin.register(() => {
    plugin.app.configuration.schema.unregister(schema);
  });

  const binding = getWorkspaceHostBinding(plugin.app.workspace);
  if (!binding) return;

  const fields = createMarkdownSettingsFields();

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
