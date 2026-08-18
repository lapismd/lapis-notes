import {
  Menu,
  Plugin,
  type App,
  type LanguageServiceProvider,
  type PluginManifest,
} from "@lapis-notes/api";
import manifestSpec from "../manifest.json";
import {
  SPELLCHECK_FORGET_IGNORED_COMMAND_ID,
  SPELLCHECK_PLUGIN_ID,
  SPELLCHECK_PROVIDER_ID,
  SPELLCHECK_STATUS_COMMAND_ID,
  SPELLCHECK_STATUS_ID,
} from "./ids";
import { createSpellcheckProviderForApp } from "./provider";
import { registerSpellcheckSettings } from "./register-spellcheck-settings";
import {
  readSpellcheckSettings,
  SPELLCHECK_SETTING_IDS,
  type SpellcheckDialect,
  updateSpellcheckSetting,
} from "./settings";
import { SpellcheckStatus } from "./status-item";

export class SpellcheckPlugin extends Plugin {
  readonly status = new SpellcheckStatus(
    this.app.statusBar,
    SPELLCHECK_STATUS_COMMAND_ID,
    (dialect) => {
      void this.setDialect(dialect);
    },
    () => {
      void this.toggleChecking();
    },
  );

  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    registerSpellcheckSettings(this);
    this.addCommand({
      id: "status",
      name: "Spell Check",
      callback: () => this.showStatusMenu(),
    });
    this.addCommand({
      id: "forget-ignored",
      name: "Forget ignored suggestions",
      callback: () => this.forgetIgnored(),
    });
    this.registerLapisServiceProvider({
      id: SPELLCHECK_PROVIDER_ID,
      service: "language-service",
      provider: createSpellcheckProviderForApp(this.app),
      metadata: {
        id: SPELLCHECK_PROVIDER_ID,
        languages: ["markdown", "plaintext"],
        runtime: "in-process",
        priority: 90,
        capabilities: { diagnostics: true, codeActions: true },
      },
    });
    this.refreshStatus();
    this.register(() => this.status.hide());
    this.registerEvent(
      this.app.configuration.on("updated", (event) => {
        if (
          event.key === SPELLCHECK_SETTING_IDS.dialect ||
          event.key === SPELLCHECK_SETTING_IDS.automaticChecking
        ) {
          this.refreshStatus();
        }
      }),
    );
  }

  onunload(): void {
    this.status.hide();
  }

  refreshStatus(): void {
    const settings = readSpellcheckSettings(this.app);
    this.status.show(settings.dialect, settings.automaticChecking);
  }

  async setDialect(dialect: SpellcheckDialect): Promise<void> {
    await updateSpellcheckSetting(
      this.app,
      SPELLCHECK_SETTING_IDS.dialect,
      dialect,
    );
    this.refreshStatus();
  }

  async toggleChecking(): Promise<void> {
    const settings = readSpellcheckSettings(this.app);
    await updateSpellcheckSetting(
      this.app,
      SPELLCHECK_SETTING_IDS.automaticChecking,
      !settings.automaticChecking,
    );
    this.refreshStatus();
  }

  async forgetIgnored(): Promise<void> {
    await updateSpellcheckSetting(
      this.app,
      SPELLCHECK_SETTING_IDS.ignoredLints,
      [],
    );
  }

  showStatusMenu(): void {
    const settings = readSpellcheckSettings(this.app);
    const menu = new Menu().dropdown();
    this.status.appendMenu(
      menu,
      settings.dialect,
      settings.automaticChecking,
    );
    const host =
      typeof document === "undefined"
        ? null
        : document.querySelector<HTMLElement>(
            `[data-status-bar-item-id="${SPELLCHECK_STATUS_ID}"]`,
          );
    if (host) {
      menu.showAtElement(host);
      return;
    }
    menu.showAtPosition({ x: 0, y: 0 });
  }
}

export { createSpellcheckProviderForApp };
export { SPELLCHECK_PLUGIN_ID, SPELLCHECK_STATUS_ID };
export { SPELLCHECK_FORGET_IGNORED_COMMAND_ID };

export default SpellcheckPlugin;
