import type { App } from "@lapis-notes/api";
import {
  createNativeChatPlugin,
  type NativeChatHost,
} from "@lapis-notes/app-profile/native-chat";

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
