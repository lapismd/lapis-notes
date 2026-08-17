import {
  PluginSettingTab,
  Setting,
  type App,
  type DropdownComponent,
} from "@lapis-notes/api";
import type { AiPlugin } from "../ai-plugin";
import type { AiThinkingLevel } from "../core/types";
import { ACP_AGENT_IDS, type AcpAgentId } from "./acp-agents";
import type { AiPluginSettings } from "./ai-settings";

const ACP_AGENT_LABELS: Record<AcpAgentId, string> = {
  codex: "Codex",
  cursor: "Cursor",
};

const THINKING_OPTIONS: Array<{ id: AiThinkingLevel; label: string }> = [
  { id: "off", label: "Off" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

export class AiSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly aiPlugin: AiPlugin,
  ) {
    super(app, aiPlugin);
  }

  display(): void {
    const settings = this.aiPlugin.getSettings();
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName("Default runtime")
      .setDesc(
        "Capability-based selection stays automatic unless you pin a runtime.",
      )
      .addDropdown((dropdown) => {
        dropdown
          .addOption("auto", "Automatic")
          .addOption("acp", "ACP")
          .addOption("codex-native", "Codex native")
          .addOption("fake", "Fake (tests)")
          .setValue(settings.defaultRuntime)
          .onChange((value) => {
            void this.aiPlugin.updateSettings({
              defaultRuntime: value as AiPluginSettings["defaultRuntime"],
            });
          });
      });

    new Setting(this.containerEl)
      .setName("ACP agent")
      .setDesc("Built-in ACP agent used when ACP is selected.")
      .addDropdown((dropdown) => {
        for (const id of ACP_AGENT_IDS) {
          dropdown.addOption(id, ACP_AGENT_LABELS[id]);
        }
        dropdown.setValue(settings.acpAgent).onChange((value) => {
          void this.aiPlugin
            .updateSettings({ acpAgent: value as AcpAgentId })
            .then(() => this.display());
        });
      });

    const modelSetting = new Setting(this.containerEl)
      .setName("Default model")
      .setDesc("Models reported by the selected agent provider.");
    modelSetting.addDropdown((dropdown) => {
      dropdown
        .setItems([
          {
            value: settings.defaultModel || "__loading__",
            label: settings.defaultModel || "Loading models…",
            disabled: !settings.defaultModel,
          },
        ])
        .setValue(settings.defaultModel || "__loading__")
        .setDisabled(true);
      void this.loadModels(dropdown, settings, modelSetting);
    });

    new Setting(this.containerEl)
      .setName("Thinking")
      .setDesc("How much model reasoning to request on each turn.")
      .addDropdown((dropdown) => {
        for (const option of THINKING_OPTIONS) {
          dropdown.addOption(option.id, option.label);
        }
        dropdown.setValue(settings.thinking).onChange((value) => {
          void this.aiPlugin.updateSettings({
            thinking: value as AiThinkingLevel,
          });
        });
      });

    new Setting(this.containerEl)
      .setName("Application tools")
      .setDesc(
        "Expose bundled note tools to new agent bindings. Existing bindings keep their frozen tool list.",
      )
      .addToggle((toggle) => {
        toggle.setValue(settings.appToolsEnabled).onChange((value) => {
          void this.aiPlugin.updateSettings({ appToolsEnabled: value });
        });
      });

    const communityTools = new Map<string, string[]>();
    for (const registered of this.app.agentTools.list()) {
      if (registered.owner.source !== "community") continue;
      const names = communityTools.get(registered.owner.pluginId) ?? [];
      names.push(registered.tool.name);
      communityTools.set(registered.owner.pluginId, names);
    }
    for (const [pluginId, toolNames] of [...communityTools].sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      new Setting(this.containerEl)
        .setName(`Community tools: ${pluginId}`)
        .setDesc(`Allow new bindings to invoke: ${toolNames.sort().join(", ")}`)
        .addToggle((toggle) => {
          toggle
            .setValue(
              settings.enabledCommunityToolPluginIds.includes(pluginId),
            )
            .onChange((value) => {
              const enabled = new Set(
                this.aiPlugin.getSettings().enabledCommunityToolPluginIds,
              );
              if (value) enabled.add(pluginId);
              else enabled.delete(pluginId);
              void this.aiPlugin.updateSettings({
                enabledCommunityToolPluginIds: [...enabled].sort(),
              });
            });
        });
    }
  }

  private async loadModels(
    dropdown: DropdownComponent,
    settings: AiPluginSettings,
    setting: Setting,
  ): Promise<void> {
    try {
      const models = await this.aiPlugin.models.listModels(settings.acpAgent);
      if (models.length === 0) {
        setting.setDesc(
          `The ${settings.acpAgent} provider returned no model catalog; keeping the saved selection.`,
        );
        dropdown.setDisabled(false);
        return;
      }
      const selected = models.some(
        (model) => model.model === settings.defaultModel,
      )
        ? settings.defaultModel
        : (models.find((model) => model.isDefault) ?? models[0])!.model;
      dropdown
        .setItems(
          models.map((model) => ({
            value: model.model,
            label: model.displayName ?? model.model,
          })),
        )
        .setValue(selected)
        .setDisabled(false)
        .onChange((value: string | string[]) => {
          void this.aiPlugin.updateSettings({ defaultModel: String(value) });
        });
      if (selected !== settings.defaultModel) {
        await this.aiPlugin.updateSettings({ defaultModel: selected });
      }
    } catch (error) {
      setting.setDesc(
        `Model catalog unavailable; keeping the saved selection. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      dropdown.setDisabled(false).onChange((value) => {
        void this.aiPlugin.updateSettings({ defaultModel: String(value) });
      });
    }
  }
}
