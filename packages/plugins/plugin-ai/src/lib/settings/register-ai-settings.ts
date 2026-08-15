import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { AiPlugin } from "../ai-plugin";
import { DEFAULT_AI_SETTINGS, type AiPluginSettings } from "./ai-settings";

const FIELD_IDS = {
  defaultRuntime: "ai.defaultRuntime",
  acpAgent: "ai.acpAgent",
  defaultModel: "ai.defaultModel",
  thinking: "ai.thinking",
} as const;

export function registerAiSettings(plugin: AiPlugin & Plugin): void {
  const binding = getWorkspaceHostBinding(plugin.app.workspace);
  if (!binding) return;
  const controller = binding.controller;
  const settings = plugin.getSettings();

  plugin.register(
    controller.registerSettingsSection({
      id: "ai",
      title: "AI",
      description: "Agent runtime, model, and thinking defaults.",
      icon: "sparkles",
      order: 35,
      navigationGroupId: "core-plugins",
      sourcePluginId: plugin.id,
      fields: [
        {
          id: FIELD_IDS.defaultRuntime,
          type: "enum",
          title: "Default runtime",
          description:
            "Capability-based selection stays automatic unless you pin a runtime.",
          default: DEFAULT_AI_SETTINGS.defaultRuntime,
          options: [
            { value: "auto", label: "Automatic" },
            { value: "acp", label: "ACP" },
            { value: "codex-native", label: "Codex native" },
            { value: "fake", label: "Fake (tests)" },
          ],
        },
        {
          id: FIELD_IDS.acpAgent,
          type: "string",
          title: "ACP agent",
          description: "Built-in acpx agent name used when ACP is selected.",
          default: DEFAULT_AI_SETTINGS.acpAgent,
        },
        {
          id: FIELD_IDS.defaultModel,
          type: "string",
          title: "Default model",
          description:
            "Model id sent on the next agent request. Live catalogs fill the composer list.",
          default: DEFAULT_AI_SETTINGS.defaultModel,
        },
        {
          id: FIELD_IDS.thinking,
          type: "enum",
          title: "Thinking",
          description: "How much model reasoning to request on each turn.",
          default: DEFAULT_AI_SETTINGS.thinking,
          options: [
            { value: "off", label: "Off" },
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ],
        },
      ],
    }),
  );

  controller.settings.update(FIELD_IDS.defaultRuntime, settings.defaultRuntime);
  controller.settings.update(FIELD_IDS.acpAgent, settings.acpAgent);
  controller.settings.update(FIELD_IDS.defaultModel, settings.defaultModel);
  controller.settings.update(FIELD_IDS.thinking, settings.thinking);

  const changeRef = controller.settings.on("change", (event) => {
    if (!event.id || !event.id.startsWith("ai.")) return;
    const values = controller.settings.getSnapshot().values;
    void plugin.updateSettings({
      defaultRuntime: values[FIELD_IDS.defaultRuntime] as
        | AiPluginSettings["defaultRuntime"]
        | undefined,
      acpAgent: String(values[FIELD_IDS.acpAgent] ?? ""),
      defaultModel: String(values[FIELD_IDS.defaultModel] ?? ""),
      thinking: values[FIELD_IDS.thinking] as AiPluginSettings["thinking"],
    });
  });
  plugin.register(() => controller.settings.offref(changeRef));
}
