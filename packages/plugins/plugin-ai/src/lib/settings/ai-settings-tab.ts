import {
  PluginSettingTab,
  Setting,
  type App,
  type DropdownComponent,
} from "@lapis-notes/api";
import type { AiPlugin } from "../ai-plugin";
import type { AiThinkingLevel } from "../core/types";
import { ACP_AGENT_IDS, type AcpAgentId } from "./acp-agents";
import { applyAppToolEnablement, type AiPluginSettings } from "./ai-settings";
import {
  listAppToolSettingRows,
  registeredAppToolRefs,
} from "./app-tool-setting-rows";

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
    const toolRegistryRef = this.app.agentTools.on("changed", () => {
      if (this.containerEl?.isConnected) this.display();
    });
    this.aiPlugin.register(() => this.app.agentTools.offref(toolRegistryRef));
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
      .setName("Automatic memory recall")
      .setDesc(
        "Inject up to three trusted curated memories into turns. Migrated vaults keep this off until enabled.",
      )
      .addToggle((toggle) => {
        toggle.setValue(settings.memoryAutomaticRecall).onChange((value) => {
          void this.aiPlugin.updateSettings({ memoryAutomaticRecall: value });
        });
      });

    new Setting(this.containerEl)
      .setName("Automatic memory consolidation")
      .setDesc(
        "Run bounded background proposals with a separately pinned processor. Enabling this may consume provider quota.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(settings.memoryConsolidationEnabled)
          .onChange((value) => {
            void this.aiPlugin.updateSettings({
              memoryConsolidationEnabled: value,
            });
          });
      });

    new Setting(this.containerEl)
      .setName("Memory processor runtime")
      .setDesc("Pinned independently from the interactive chat runtime.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("acp", "ACP")
          .addOption("codex-native", "Codex native")
          .setValue(settings.memoryConsolidationRuntime)
          .onChange((value) => {
            void this.aiPlugin.updateSettings({
              memoryConsolidationRuntime:
                value === "codex-native" ? "codex-native" : "acp",
            });
          });
      });

    new Setting(this.containerEl)
      .setName("Memory processor agent")
      .setDesc("Pinned independently from the interactive chat agent.")
      .addDropdown((dropdown) => {
        for (const id of ACP_AGENT_IDS) {
          dropdown.addOption(id, ACP_AGENT_LABELS[id]);
        }
        dropdown
          .setValue(settings.memoryConsolidationAgent)
          .onChange((value) => {
            void this.aiPlugin.updateSettings({
              memoryConsolidationAgent: value as AcpAgentId,
            });
          });
      });

    new Setting(this.containerEl)
      .setName("Memory processor model")
      .setDesc("Exact model used only for restricted background consolidation.")
      .addText((text) => {
        text.setValue(settings.memoryConsolidationModel).onChange((value) => {
          void this.aiPlugin.updateSettings({
            memoryConsolidationModel: value,
          });
        });
      });

    new Setting(this.containerEl)
      .setName("Background handoff summaries")
      .setDesc(
        "Prepare verified summaries after long turns for future cross-agent switches. This is never run during a switch and may consume provider quota.",
      )
      .addToggle((toggle) => {
        toggle.setValue(settings.handoffSummariesEnabled).onChange((value) => {
          void this.aiPlugin.updateSettings({
            handoffSummariesEnabled: value,
          });
        });
      });

    new Setting(this.containerEl)
      .setName("Handoff summary runtime")
      .setDesc("Pinned independently from the interactive chat runtime.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("acp", "ACP")
          .addOption("codex-native", "Codex native")
          .setValue(settings.handoffSummaryRuntime)
          .onChange((value) => {
            void this.aiPlugin.updateSettings({
              handoffSummaryRuntime:
                value === "codex-native" ? "codex-native" : "acp",
            });
          });
      });

    new Setting(this.containerEl)
      .setName("Handoff summary agent")
      .setDesc("Pinned independently from the interactive chat agent.")
      .addDropdown((dropdown) => {
        for (const id of ACP_AGENT_IDS) {
          dropdown.addOption(id, ACP_AGENT_LABELS[id]);
        }
        dropdown.setValue(settings.handoffSummaryAgent).onChange((value) => {
          void this.aiPlugin.updateSettings({
            handoffSummaryAgent: value as AcpAgentId,
          });
        });
      });

    new Setting(this.containerEl)
      .setName("Handoff summary model")
      .setDesc("Exact model used only for restricted background summaries.")
      .addText((text) => {
        text.setValue(settings.handoffSummaryModel).onChange((value) => {
          void this.aiPlugin.updateSettings({
            handoffSummaryModel: value,
          });
        });
      });

    new Setting(this.containerEl)
      .setName("Application tools")
      .setDesc(
        "Expose enabled application tools to new agent bindings. Existing bindings keep their frozen tool list.",
      )
      .addToggle((toggle) => {
        toggle.setValue(settings.appToolsEnabled).onChange((value) => {
          void this.aiPlugin.updateSettings({ appToolsEnabled: value });
        });
      });

    for (const row of listAppToolSettingRows(this.app, settings)) {
      new Setting(this.containerEl)
        .setName(row.name)
        .setDesc(row.description)
        .addToggle((toggle) => {
          toggle.setValue(row.enabled).onChange((value) => {
            const registered = this.app.agentTools.get(row.name);
            if (!registered) return;
            void this.aiPlugin.updateSettings(
              applyAppToolEnablement(
                this.aiPlugin.getSettings(),
                { name: registered.tool.name, owner: registered.owner },
                value,
                registeredAppToolRefs(this.app),
              ),
            );
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
            label: model.badges?.length
              ? `${model.displayName ?? model.model} ${model.badges.join(" · ")}`
              : (model.displayName ?? model.model),
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
