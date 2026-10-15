import { App, type AppStateProperties } from "@lapis-notes/api";
import {
  DEFAULT_APP_STATE_DIRECTORY,
  appStatePath,
} from "@lapis-notes/api/path";
import {
  isNativeDesktopRuntime,
  type RuntimeTarget,
} from "@lapis-notes/api/runtime";

const properties: AppStateProperties = {
  version: "public-contract",
  markdownRenderer: async () => undefined,
};
const app = new App(properties);
const resolvedPath: string = app.props.configPath;
const directory: ".lapis" = DEFAULT_APP_STATE_DIRECTORY;
const configurationPath: string = appStatePath("app.json");
const runtime: RuntimeTarget = "tauri-desktop";
const native: boolean = isNativeDesktopRuntime(runtime);
void [app, resolvedPath, directory, configurationPath, native];
