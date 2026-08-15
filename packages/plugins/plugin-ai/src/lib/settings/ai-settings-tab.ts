import { PluginSettingTab, Setting, type App } from "@lapis-notes/api";
import type { AiPlugin } from "../ai-plugin";
import type { AiThinkingLevel } from "../core/types";
import type { AiPluginSettings } from "./ai-settings";

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
      .setDesc("Capability-based selection stays automatic unless you pin a runtime.")
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
      .setDesc("Built-in acpx agent name used when ACP is selected.")
      .addText((text) => {
        text.setValue(settings.acpAgent).onChange((value) => {
          void this.aiPlugin.updateSettings({ acpAgent: value });
        });
      });

    new Setting(this.containerEl)
      .setName("Default model")
      .setDesc("Model id sent on the next agent request. Live catalogs fill the composer list.")
      .addText((text) => {
        text.setValue(settings.defaultModel).onChange((value) => {
          void this.aiPlugin.updateSettings({ defaultModel: value });
        });
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
  }
}
