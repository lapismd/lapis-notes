import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { TerminalPlugin } from "@lapis-notes/lapis-plugin-terminal";
import { registerWebTerminalRuntimeBridge } from "./terminal-runtime-attach";

export const WEB_TERMINAL_HOST_URL_KEY = "web.terminalHost.url";
export const WEB_TERMINAL_HOST_TOKEN_KEY = "web.terminalHost.token";

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function envUrl(): string {
  return trim(import.meta.env.LAPIS_TERMINAL_HOST_URL);
}

function envToken(): string {
  return trim(import.meta.env.LAPIS_TERMINAL_HOST_TOKEN);
}

function readConfigString(
  config: ReturnType<App["configuration"]["getConfiguration"]>,
  key: string,
): string {
  for (const [id, value] of config.entries()) {
    if (id === key) return trim(value);
  }
  return trim(config.get(key, ""));
}

export function resolveWebTerminalRuntimeConfig(app: App): {
  url: string;
  token: string;
} {
  const config = app.configuration.getConfiguration();
  return {
    url: readConfigString(config, WEB_TERMINAL_HOST_URL_KEY) || envUrl(),
    token: readConfigString(config, WEB_TERMINAL_HOST_TOKEN_KEY) || envToken(),
  };
}

export function refreshWebTerminalPlugin(app: App): void {
  const plugin = app.plugins.plugins.get("terminal") as TerminalPlugin | undefined;
  plugin?.refreshHostSessions?.();
}

export function syncWebTerminalRuntime(app: App): boolean {
  const { url, token } = resolveWebTerminalRuntimeConfig(app);
  const attached = registerWebTerminalRuntimeBridge({ url, token });
  refreshWebTerminalPlugin(app);
  return attached;
}

export function registerWebTerminalRuntimeSettings(app: App): () => void {
  const { controller } = getWorkspaceHostBinding(app.workspace);
  const resolved = resolveWebTerminalRuntimeConfig(app);
  const config = app.configuration.getConfiguration();
  if (resolved.url && !readConfigString(config, WEB_TERMINAL_HOST_URL_KEY)) {
    void app.configuration.updateConfigurationOption(
      WEB_TERMINAL_HOST_URL_KEY,
      resolved.url,
    );
  }
  if (resolved.token && !readConfigString(config, WEB_TERMINAL_HOST_TOKEN_KEY)) {
    void app.configuration.updateConfigurationOption(
      WEB_TERMINAL_HOST_TOKEN_KEY,
      resolved.token,
    );
  }

  const disposeSection = controller.registerSettingsSection({
    id: "web-terminal-host",
    title: "Terminal server",
    description:
      "Connect this browser vault to a local lapis-terminal-host WebSocket.",
    icon: "terminal",
    order: 37,
    fields: [
      {
        id: WEB_TERMINAL_HOST_URL_KEY,
        type: "string",
        title: "Server URL",
        description:
          "WebSocket URI including host and port, for example ws://127.0.0.1:7346.",
        default: "",
        presentation: "url",
        placeholder: "ws://127.0.0.1:7346",
      },
      {
        id: WEB_TERMINAL_HOST_TOKEN_KEY,
        type: "string",
        title: "Auth token",
        description: "Shared token required by the local terminal server.",
        default: "",
        presentation: "password",
      },
    ],
  });
  controller.settings.update(WEB_TERMINAL_HOST_URL_KEY, resolved.url);
  controller.settings.update(WEB_TERMINAL_HOST_TOKEN_KEY, resolved.token);

  const updated = app.configuration.on("updated", (event) => {
    if (
      event.key === WEB_TERMINAL_HOST_URL_KEY ||
      event.key === WEB_TERMINAL_HOST_TOKEN_KEY
    ) {
      syncWebTerminalRuntime(app);
    }
  });

  return () => {
    app.configuration.offref(updated);
    disposeSection();
  };
}
