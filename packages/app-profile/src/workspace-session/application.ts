import {
  App,
  installApplicationCompatibility,
  registerDefaultDailyDocumentProvider,
  takeHostSyncService,
} from "@lapis-notes/api";
import { appStatePath } from "@lapis-notes/api/path";
import {
  registerNotesPluginBrowser,
  registerNotesPluginSettings,
} from "../index";
import type { NotesWorkspaceSessionProps } from "./types";

export function createNotesApplication(options: NotesWorkspaceSessionProps) {
  const app = new App({
    version: "2026.6.3",
    configPath: appStatePath("app.json"),
    session: options.session,
    syncHost: options.host?.syncHost,
    pluginAssetServer: options.pluginAssetServer,
    pluginDistributionOptions: options.pluginDistributionOptions,
    unavailablePlugins: options.host?.unavailablePlugins ?? {
      ...(options.nativeChat ? {} : { ai: "desktop-only" }),
      terminal: "desktop-only",
    },
    workspaceShell: {
      application: {
        name: "Lapis Notes",
        buildTime: null,
        copyright: "Copyright © Lapis Notes contributors.",
      },
      notifications: true,
    },
    markdownRenderer: async () => {},
  });
  const syncHost = takeHostSyncService(app);
  const releaseCompatibility = installApplicationCompatibility(app);
  const releaseSettings = registerNotesPluginSettings(app);
  const releaseBrowser = registerNotesPluginBrowser(app);
  const daily = registerDefaultDailyDocumentProvider(app);
  const releaseHost = options.host?.attach?.(app, syncHost);
  return {
    app,
    syncHost,
    disposeServices: () => syncHost.dispose(),
    disposeHostServices: async () => {
      await options.host?.dispose?.(app);
    },
    release() {
      daily.dispose();
      releaseBrowser();
      releaseSettings();
      releaseHost?.();
      releaseCompatibility();
    },
  };
}
