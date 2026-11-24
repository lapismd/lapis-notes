import type { NotesWorkspaceSessionProps } from "./types";
import type { App } from "@lapis-notes/api";
import {
  createNativeChatPlugin,
  type NativeChatHost,
} from "../native-chat/index";

export function registerSessionNativeChat(
  app: App,
  factory: (app: App) => NativeChatHost,
  runtime: NotesWorkspaceSessionProps["runtime"],
): void {
  app.plugins.registerStaticPlugins([
    {
      plugin: createNativeChatPlugin(factory),
      required: false,
      enabledByDefault: runtime === "rust-server",
    },
  ]);
}
