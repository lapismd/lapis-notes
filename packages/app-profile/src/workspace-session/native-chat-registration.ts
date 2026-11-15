import type { App } from "@lapis-notes/api";
import {
  createNativeChatPlugin,
  type NativeChatHost,
} from "../native-chat/index";

export function registerSessionNativeChat(
  app: App,
  factory: (app: App) => NativeChatHost,
  runtime: "web-pwa" | "node-server" | "rust-server",
): void {
  app.plugins.registerStaticPlugins([
    {
      plugin: createNativeChatPlugin(factory),
      required: false,
      enabledByDefault: runtime === "rust-server",
    },
  ]);
}
