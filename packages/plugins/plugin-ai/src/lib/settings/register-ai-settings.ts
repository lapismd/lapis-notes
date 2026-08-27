import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { AiPlugin } from "../ai-plugin";
import {
  ACP_AGENT_IDS,
  normalizeAcpAgent,
  type AcpAgentId,
} from "./acp-agents";
import {
  APP_TOOL_SETTING_PREFIX,
  DEFAULT_AI_SETTINGS,
  applyAppToolEnablement,
  migrateLegacyCommunityToolOptIns,
  type AiPluginSettings,
} from "./ai-settings";
import {
  listAppToolSettingRows,
  registeredAppToolRefs,
} from "./app-tool-setting-rows";

const FIELD_IDS = {
  defaultRuntime: "ai.defaultRuntime",
  acpAgent: "ai.acpAgent",
  defaultModel: "ai.defaultModel",
  thinking: "ai.thinking",
  memoryAutomaticRecall: "ai.memoryAutomaticRecall",
  memoryConsolidationEnabled: "ai.memoryConsolidationEnabled",
  memoryConsolidationRuntime: "ai.memoryConsolidationRuntime",
  memoryConsolidationAgent: "ai.memoryConsolidationAgent",
  memoryConsolidationModel: "ai.memoryConsolidationModel",
  handoffSummariesEnabled: "ai.handoffSummariesEnabled",
  handoffSummaryRuntime: "ai.handoffSummaryRuntime",
  handoffSummaryAgent: "ai.handoffSummaryAgent",
  handoffSummaryModel: "ai.handoffSummaryModel",
  appToolsEnabled: "ai.appToolsEnabled",
  appTools: "ai.appTools",
} as const;

export function registerAiSettings(plugin: AiPlugin & Plugin): void {
  const binding = getWorkspaceHostBinding(plugin.app.workspace);
  if (!binding) return;
  const controller = binding.controller;
  const settings = plugin.getSettings();
  const modelSourceId = (provider: AcpAgentId) => `ai.models.${provider}`;
  const persistLegacyToolMigration = () => {
    const current = plugin.getSettings();
    const migrated = migrateLegacyCommunityToolOptIns(
      current,
      registeredAppToolRefs(plugin.app),
    );
    if (
      migrated.enabledAppToolNames.join("\0") ===
        current.enabledAppToolNames.join("\0") &&
      migrated.enabledCommunityToolPluginIds.join("\0") ===
        current.enabledCommunityToolPluginIds.join("\0")
    ) {
      return;
    }
    void plugin.updateSettings({
      enabledAppToolNames: migrated.enabledAppToolNames,
      enabledCommunityToolPluginIds: migrated.enabledCommunityToolPluginIds,
    });
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
            description: model.badges?.length
              ? model.badges.join(" · ")
              : model.description,
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
        id: FIELD_IDS.memoryAutomaticRecall,
        type: "boolean" as const,
        title: "Automatic memory recall",
        description:
          "Inject up to three trusted curated memories into a turn. Transcript evidence remains available only through memory tools.",
        default: DEFAULT_AI_SETTINGS.memoryAutomaticRecall,
      },
      {
        id: FIELD_IDS.memoryConsolidationEnabled,
        type: "boolean" as const,
        title: "Automatic memory consolidation",
        description:
          "Use the separately pinned processor below for bounded background proposals. This may consume provider quota.",
        default: DEFAULT_AI_SETTINGS.memoryConsolidationEnabled,
      },
      {
        id: FIELD_IDS.memoryConsolidationRuntime,
        type: "enum" as const,
        title: "Memory processor runtime",
        description: "Pinned independently from the interactive chat runtime.",
        default: DEFAULT_AI_SETTINGS.memoryConsolidationRuntime,
        options: [
          { value: "acp", label: "ACP" },
          { value: "codex-native", label: "Codex native" },
        ],
      },
      {
        id: FIELD_IDS.memoryConsolidationAgent,
        type: "enum" as const,
        title: "Memory processor agent",
        description: "Pinned independently from the interactive chat agent.",
        default: DEFAULT_AI_SETTINGS.memoryConsolidationAgent,
        options: ACP_AGENT_IDS.map((value) => ({
          value,
          label: value === "cursor" ? "Cursor" : "Codex",
        })),
      },
      {
        id: FIELD_IDS.memoryConsolidationModel,
        type: "string" as const,
        title: "Memory processor model",
        description:
          "Exact model used only for restricted background consolidation.",
        default: DEFAULT_AI_SETTINGS.memoryConsolidationModel,
      },
      {
        id: FIELD_IDS.handoffSummariesEnabled,
        type: "boolean" as const,
        title: "Background handoff summaries",
        description:
          "Prepare verified summaries after long turns for future cross-agent switches. This never runs during a switch and may consume provider quota.",
        default: DEFAULT_AI_SETTINGS.handoffSummariesEnabled,
      },
      {
        id: FIELD_IDS.handoffSummaryRuntime,
        type: "enum" as const,
        title: "Handoff summary runtime",
        description: "Pinned independently from the interactive chat runtime.",
        default: DEFAULT_AI_SETTINGS.handoffSummaryRuntime,
        options: [
          { value: "acp", label: "ACP" },
          { value: "codex-native", label: "Codex native" },
        ],
      },
      {
        id: FIELD_IDS.handoffSummaryAgent,
        type: "enum" as const,
        title: "Handoff summary agent",
        description: "Pinned independently from the interactive chat agent.",
        default: DEFAULT_AI_SETTINGS.handoffSummaryAgent,
        options: ACP_AGENT_IDS.map((value) => ({
          value,
          label: value === "cursor" ? "Cursor" : "Codex",
        })),
      },
      {
        id: FIELD_IDS.handoffSummaryModel,
        type: "string" as const,
        title: "Handoff summary model",
        description:
          "Exact model used only for restricted background summaries.",
        default: DEFAULT_AI_SETTINGS.handoffSummaryModel,
      },
      {
        id: FIELD_IDS.appToolsEnabled,
        type: "boolean" as const,
        title: "Application tools",
        description:
          "Expose enabled application tools to newly created agent bindings.",
        default: DEFAULT_AI_SETTINGS.appToolsEnabled,
      },
      {
        id: FIELD_IDS.appTools,
        type: "group" as const,
        presentation: "toggle-table" as const,
        title: "Registered tools",
        description:
          "Enable or disable each currently registered tool for new agent bindings.",
        fields: listAppToolSettingRows(plugin.app, current).map((row) => ({
          id: row.fieldId,
          type: "boolean" as const,
          title: row.name,
          description: row.description,
          default: row.owner.source !== "community",
        })),
      },
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
    FIELD_IDS.memoryAutomaticRecall,
    settings.memoryAutomaticRecall,
  );
  controller.settings.update(
    FIELD_IDS.memoryConsolidationEnabled,
    settings.memoryConsolidationEnabled,
  );
  controller.settings.update(
    FIELD_IDS.memoryConsolidationRuntime,
    settings.memoryConsolidationRuntime,
  );
  controller.settings.update(
    FIELD_IDS.memoryConsolidationAgent,
    settings.memoryConsolidationAgent,
  );
  controller.settings.update(
    FIELD_IDS.memoryConsolidationModel,
    settings.memoryConsolidationModel,
  );
  controller.settings.update(
    FIELD_IDS.handoffSummariesEnabled,
    settings.handoffSummariesEnabled,
  );
  controller.settings.update(
    FIELD_IDS.handoffSummaryRuntime,
    settings.handoffSummaryRuntime,
  );
  controller.settings.update(
    FIELD_IDS.handoffSummaryAgent,
    settings.handoffSummaryAgent,
  );
  controller.settings.update(
    FIELD_IDS.handoffSummaryModel,
    settings.handoffSummaryModel,
  );
  controller.settings.update(
    FIELD_IDS.appToolsEnabled,
    settings.appToolsEnabled,
  );
  const syncAppToolValues = (current: AiPluginSettings) => {
    for (const row of listAppToolSettingRows(plugin.app, current)) {
      controller.settings.update(row.fieldId, row.enabled);
    }
  };
  syncAppToolValues(settings);
  persistLegacyToolMigration();

  const refreshSection = (current: AiPluginSettings) => {
    disposeSection();
    disposeSection = controller.registerSettingsSection(createSection(current));
    syncAppToolValues(current);
  };

  const toolRegistryRef = plugin.app.agentTools.on("changed", () => {
    persistLegacyToolMigration();
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
    if (event.id === FIELD_IDS.memoryAutomaticRecall) {
      void plugin.updateSettings({
        memoryAutomaticRecall: values[FIELD_IDS.memoryAutomaticRecall] === true,
      });
      return;
    }
    if (event.id === FIELD_IDS.memoryConsolidationEnabled) {
      void plugin.updateSettings({
        memoryConsolidationEnabled:
          values[FIELD_IDS.memoryConsolidationEnabled] === true,
      });
      return;
    }
    if (event.id === FIELD_IDS.memoryConsolidationRuntime) {
      void plugin.updateSettings({
        memoryConsolidationRuntime:
          values[FIELD_IDS.memoryConsolidationRuntime] === "codex-native"
            ? "codex-native"
            : "acp",
      });
      return;
    }
    if (event.id === FIELD_IDS.memoryConsolidationAgent) {
      void plugin.updateSettings({
        memoryConsolidationAgent: normalizeAcpAgent(
          values[FIELD_IDS.memoryConsolidationAgent],
        ),
      });
      return;
    }
    if (event.id === FIELD_IDS.memoryConsolidationModel) {
      void plugin.updateSettings({
        memoryConsolidationModel: String(
          values[FIELD_IDS.memoryConsolidationModel] ?? "",
        ),
      });
      return;
    }
    if (event.id === FIELD_IDS.handoffSummariesEnabled) {
      void plugin.updateSettings({
        handoffSummariesEnabled:
          values[FIELD_IDS.handoffSummariesEnabled] === true,
      });
      return;
    }
    if (event.id === FIELD_IDS.handoffSummaryRuntime) {
      void plugin.updateSettings({
        handoffSummaryRuntime:
          values[FIELD_IDS.handoffSummaryRuntime] === "codex-native"
            ? "codex-native"
            : "acp",
      });
      return;
    }
    if (event.id === FIELD_IDS.handoffSummaryAgent) {
      void plugin.updateSettings({
        handoffSummaryAgent: normalizeAcpAgent(
          values[FIELD_IDS.handoffSummaryAgent],
        ),
      });
      return;
    }
    if (event.id === FIELD_IDS.handoffSummaryModel) {
      void plugin.updateSettings({
        handoffSummaryModel: String(
          values[FIELD_IDS.handoffSummaryModel] ?? "",
        ),
      });
      return;
    }
    if (event.id === FIELD_IDS.appToolsEnabled) {
      void plugin.updateSettings({
        appToolsEnabled: values[FIELD_IDS.appToolsEnabled] !== false,
      });
      return;
    }
    if (
      event.id.startsWith(APP_TOOL_SETTING_PREFIX) &&
      event.id !== FIELD_IDS.appTools
    ) {
      const toolName = event.id.slice(APP_TOOL_SETTING_PREFIX.length);
      const registered = plugin.app.agentTools.get(toolName);
      if (!registered) return;
      void plugin.updateSettings(
        applyAppToolEnablement(
          plugin.getSettings(),
          { name: registered.tool.name, owner: registered.owner },
          values[event.id] === true,
          registeredAppToolRefs(plugin.app),
        ),
      );
    }
  });
  plugin.register(() => controller.settings.offref(changeRef));
}
