import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { AiPlugin } from "../ai-plugin";
import {
  ACP_AGENT_IDS,
  normalizeAcpAgent,
  type AcpAgentId,
} from "./acp-agents";
import { DEFAULT_AI_SETTINGS, type AiPluginSettings } from "./ai-settings";

const FIELD_IDS = {
  defaultRuntime: "ai.defaultRuntime",
  acpAgent: "ai.acpAgent",
  defaultModel: "ai.defaultModel",
  thinking: "ai.thinking",
  appToolsEnabled: "ai.appToolsEnabled",
} as const;
const COMMUNITY_TOOL_FIELD_PREFIX = "ai.communityTools.";

export function registerAiSettings(plugin: AiPlugin & Plugin): void {
  const binding = getWorkspaceHostBinding(plugin.app.workspace);
  if (!binding) return;
  const controller = binding.controller;
  const settings = plugin.getSettings();
  const modelSourceId = (provider: AcpAgentId) => `ai.models.${provider}`;
  const communityToolOwners = () => {
    const owners = new Map<string, string[]>();
    for (const registered of plugin.app.agentTools.list()) {
      if (registered.owner.source !== "community") continue;
      const tools = owners.get(registered.owner.pluginId) ?? [];
      tools.push(registered.tool.name);
      owners.set(registered.owner.pluginId, tools);
    }
    return [...owners]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([pluginId, tools]) => ({
        pluginId,
        tools: tools.sort(),
        fieldId: `${COMMUNITY_TOOL_FIELD_PREFIX}${pluginId}`,
      }));
  };
  for (const provider of ACP_AGENT_IDS) {
    const dispose = controller.configuration.optionSources.register({
      id: modelSourceId(provider),
      load: async () => {
        const current = plugin.getSettings();
        const saved = current.defaultModels[provider];
        try {
          const models = await plugin.models.listModels(provider);
          if (models.length === 0) {
            return saved
              ? [
                  {
                    value: saved,
                    label: saved,
                    description:
                      "Saved model; the provider returned no catalog.",
                  },
                ]
              : [];
          }
          const selected = models.some((model) => model.model === saved)
            ? saved
            : (models.find((model) => model.isDefault) ?? models[0])?.model;
          if (selected && selected !== saved) {
            await plugin.updateSettings({
              defaultModels: { ...current.defaultModels, [provider]: selected },
            });
            if (plugin.getSettings().acpAgent === provider) {
              controller.settings.update(FIELD_IDS.defaultModel, selected);
            }
          }
          return models.map((model) => ({
            value: model.model,
            label: model.displayName ?? model.model,
            description: model.description,
          }));
        } catch (error) {
          return saved
            ? [
                {
                  value: saved,
                  label: saved,
                  description: `Saved model; catalog unavailable: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                },
              ]
            : [];
        }
      },
    });
    plugin.register(dispose);
  }

  const createSection = (current: AiPluginSettings) => ({
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
        type: "enum" as const,
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
        type: "enum" as const,
        title: "ACP agent",
        description: "Built-in ACP agent used when ACP is selected.",
        default: DEFAULT_AI_SETTINGS.acpAgent,
        options: ACP_AGENT_IDS.map((value) => ({
          value,
          label: value === "cursor" ? "Cursor" : "Codex",
        })),
      },
      {
        id: FIELD_IDS.defaultModel,
        type: "string" as const,
        title: "Default model",
        description:
          "Model reported by the selected agent provider and sent on the next request.",
        default: current.defaultModel,
        optionsSource: modelSourceId(current.acpAgent),
        allowUnknownOptions: false,
      },
      {
        id: FIELD_IDS.thinking,
        type: "enum" as const,
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
      {
        id: FIELD_IDS.appToolsEnabled,
        type: "boolean" as const,
        title: "Application tools",
        description:
          "Expose bundled application tools to newly created agent bindings.",
        default: DEFAULT_AI_SETTINGS.appToolsEnabled,
      },
      ...communityToolOwners().map(({ pluginId, tools, fieldId }) => ({
        id: fieldId,
        type: "boolean" as const,
        title: `Community tools: ${pluginId}`,
        description: `Allow new bindings to invoke: ${tools.join(", ")}`,
        default: false,
      })),
    ],
  });

  let disposeSection = controller.registerSettingsSection(
    createSection(settings),
  );
  plugin.register(() => disposeSection());

  controller.settings.update(FIELD_IDS.defaultRuntime, settings.defaultRuntime);
  controller.settings.update(FIELD_IDS.acpAgent, settings.acpAgent);
  controller.settings.update(FIELD_IDS.defaultModel, settings.defaultModel);
  controller.settings.update(FIELD_IDS.thinking, settings.thinking);
  controller.settings.update(
    FIELD_IDS.appToolsEnabled,
    settings.appToolsEnabled,
  );
  const syncCommunityToolValues = (current: AiPluginSettings) => {
    const enabled = new Set(current.enabledCommunityToolPluginIds);
    for (const owner of communityToolOwners()) {
      controller.settings.update(owner.fieldId, enabled.has(owner.pluginId));
    }
  };
  syncCommunityToolValues(settings);

  const refreshSection = (current: AiPluginSettings) => {
    disposeSection();
    disposeSection = controller.registerSettingsSection(createSection(current));
    syncCommunityToolValues(current);
  };

  const toolRegistryRef = plugin.app.agentTools.on("changed", () => {
    refreshSection(plugin.getSettings());
  });
  plugin.register(() => plugin.app.agentTools.offref(toolRegistryRef));

  const changeRef = controller.settings.on("change", (event) => {
    if (!event.id || !event.id.startsWith("ai.")) return;
    const values = controller.settings.getSnapshot().values;
    if (event.id === FIELD_IDS.acpAgent) {
      void (async () => {
        await plugin.updateSettings({
          acpAgent: normalizeAcpAgent(values[FIELD_IDS.acpAgent]),
        });
        const next = plugin.getSettings();
        refreshSection(next);
        controller.settings.update(FIELD_IDS.defaultModel, next.defaultModel);
      })();
      return;
    }
    if (event.id === FIELD_IDS.defaultModel) {
      void plugin.updateSettings({
        defaultModel: String(values[FIELD_IDS.defaultModel] ?? ""),
      });
      return;
    }
    if (event.id === FIELD_IDS.defaultRuntime) {
      void plugin.updateSettings({
        defaultRuntime: values[FIELD_IDS.defaultRuntime] as
          | AiPluginSettings["defaultRuntime"]
          | undefined,
      });
      return;
    }
    if (event.id === FIELD_IDS.thinking) {
      void plugin.updateSettings({
        thinking: values[FIELD_IDS.thinking] as AiPluginSettings["thinking"],
      });
      return;
    }
    if (event.id === FIELD_IDS.appToolsEnabled) {
      void plugin.updateSettings({
        appToolsEnabled: values[FIELD_IDS.appToolsEnabled] !== false,
      });
      return;
    }
    if (event.id.startsWith(COMMUNITY_TOOL_FIELD_PREFIX)) {
      const pluginId = event.id.slice(COMMUNITY_TOOL_FIELD_PREFIX.length);
      if (!communityToolOwners().some((owner) => owner.pluginId === pluginId)) {
        return;
      }
      const enabled = new Set(
        plugin.getSettings().enabledCommunityToolPluginIds,
      );
      if (values[event.id] === true) enabled.add(pluginId);
      else enabled.delete(pluginId);
      void plugin.updateSettings({
        enabledCommunityToolPluginIds: [...enabled].sort(),
      });
    }
  });
  plugin.register(() => controller.settings.offref(changeRef));
}
