import { PluginSettingTab, Setting, type App } from "@lapis-notes/api";
import type { AiPlugin } from "../ai-plugin";
import type { AiPluginSettings } from "./ai-settings";

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
  }
}
