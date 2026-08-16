import { PluginSettingTab, Setting, type App } from "@lapis-notes/api";
import type { HistoryPlugin } from "./history-plugin";
import type { HistoryPluginSettingsPatch } from "./history-settings";

export class HistorySettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly historyPlugin: HistoryPlugin,
  ) {
    super(app, historyPlugin);
  }

  display(): void {
    const settings = this.historyPlugin.getSettings();
    this.containerEl.empty();

    this.addNumber(
      "Revisions per file",
      "Maximum stored snapshots for one path.",
      settings.retentionCount,
      1,
      200,
      1,
      (retentionCount) => ({ retentionCount }),
    );
    this.addNumber(
      "Maximum file size (KiB)",
      "Files larger than this are not snapshotted.",
      Math.round(settings.maxFileSizeBytes / 1024),
      1,
      2048,
      1,
      (kib) => ({ maxFileSizeBytes: kib * 1024 }),
    );
    this.addNumber(
      "Merge window (seconds)",
      "Replace the latest modify for the same path when another modify arrives inside this window.",
      Math.round(settings.mergeWindowMs / 1000),
      0,
      120,
      1,
      (seconds) => ({ mergeWindowMs: seconds * 1000 }),
    );
    this.addNumber(
      "Capture debounce (ms)",
      "Delay before create and modify snapshots are stored.",
      settings.debounceMs,
      0,
      5000,
      50,
      (debounceMs) => ({ debounceMs }),
    );

    new Setting(this.containerEl)
      .setName("Exclude globs")
      .setDesc(
        "Comma-separated globs that skip capture. Defaults include .obsidian, .lapis, .git, and .jj.",
      )
      .addText((text) => {
        text
          .setPlaceholder(".obsidian/**, .lapis/**")
          .setValue(settings.excludeGlobs.join(", "))
          .onChange((value) => {
            void this.update({
              excludeGlobs: value.split(","),
            });
          });
      });

    new Setting(this.containerEl)
      .setName("Include globs")
      .setDesc(
        "Optional path allowlist. Leave empty to snapshot remaining paths after excludes.",
      )
      .addText((text) => {
        text
          .setPlaceholder("Notes/**, Projects/**")
          .setValue(settings.includeGlobs.join(", "))
          .onChange((value) => {
            void this.update({
              includeGlobs: value.split(","),
            });
          });
      });

    new Setting(this.containerEl)
      .setName("Tracked extensions")
      .setDesc(
        "Optional allowlist. Leave empty to snapshot remaining UTF-8 text under the size cap.",
      )
      .addText((text) => {
        text
          .setPlaceholder("md, json, txt")
          .setValue(settings.trackedExtensions.join(", "))
          .onChange((value) => {
            void this.update({
              trackedExtensions: value.split(","),
            });
          });
      });
  }

  private addNumber(
    name: string,
    description: string,
    value: number,
    min: number,
    max: number,
    step: number,
    patch: (value: number) => HistoryPluginSettingsPatch,
  ): void {
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(description)
      .addSlider((slider) => {
        slider
          .setDynamicTooltip()
          .setLimits(min, max, step)
          .setValue(value)
          .onChange((next) => void this.update(patch(Number(next)), false));
      });
  }

  private async update(
    patch: HistoryPluginSettingsPatch,
    redisplay = true,
  ): Promise<void> {
    await this.historyPlugin.updateSettings(patch);
    if (redisplay) this.display();
  }
}
