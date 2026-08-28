import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { registerWebAgentRuntimeBridge } from "./agent-runtime-attach";

interface RefreshableAgentRuntimePlugin {
  refreshHostRuntimes?(): void;
}

export const WEB_AGENT_RUNTIME_URL_KEY = "web.agentRuntime.url";
export const WEB_AGENT_RUNTIME_TOKEN_KEY = "web.agentRuntime.token";

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function envUrl(): string {
  return trim(import.meta.env.LAPIS_AGENT_RUNTIME_URL);
}

function envToken(): string {
  return trim(import.meta.env.LAPIS_AGENT_RUNTIME_TOKEN);
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

export function resolveWebAgentRuntimeConfig(app: App): {
  url: string;
  token: string;
} {
  const config = app.configuration.getConfiguration();
  return {
    url: readConfigString(config, WEB_AGENT_RUNTIME_URL_KEY) || envUrl(),
    token: readConfigString(config, WEB_AGENT_RUNTIME_TOKEN_KEY) || envToken(),
  };
}

export function refreshWebAiHostRuntimes(app: App): void {
  const plugin = app.plugins.plugins.get("ai") as
    | RefreshableAgentRuntimePlugin
    | undefined;
  plugin?.refreshHostRuntimes?.();
}

export function syncWebAgentRuntime(app: App): boolean {
  const { url, token } = resolveWebAgentRuntimeConfig(app);
  const attached = registerWebAgentRuntimeBridge({ url, token });
  refreshWebAiHostRuntimes(app);
  return attached;
}

export function registerWebAgentRuntimeSettings(app: App): () => void {
  const { controller } = getWorkspaceHostBinding(app.workspace);
  const resolved = resolveWebAgentRuntimeConfig(app);
  const config = app.configuration.getConfiguration();
  if (resolved.url && !readConfigString(config, WEB_AGENT_RUNTIME_URL_KEY)) {
    void app.configuration.updateConfigurationOption(
      WEB_AGENT_RUNTIME_URL_KEY,
      resolved.url,
    );
  }
  if (resolved.token && !readConfigString(config, WEB_AGENT_RUNTIME_TOKEN_KEY)) {
    void app.configuration.updateConfigurationOption(
      WEB_AGENT_RUNTIME_TOKEN_KEY,
      resolved.token,
    );
  }

  const disposeSection = controller.registerSettingsSection({
    id: "web-agent-runtime",
    title: "Agent server",
    description:
      "Connect this browser vault to a local lapis-ai-host WebSocket.",
    icon: "sparkles",
    order: 36,
    fields: [
      {
        id: WEB_AGENT_RUNTIME_URL_KEY,
        type: "string",
        title: "Server URL",
        description:
          "WebSocket URI including host and port, for example ws://127.0.0.1:7345.",
        default: "",
        presentation: "url",
        placeholder: "ws://127.0.0.1:7345",
      },
      {
        id: WEB_AGENT_RUNTIME_TOKEN_KEY,
        type: "string",
        title: "Auth token",
        description: "Shared token required by the local agent server.",
        default: "",
        presentation: "password",
      },
    ],
  });
  controller.settings.update(WEB_AGENT_RUNTIME_URL_KEY, resolved.url);
  controller.settings.update(WEB_AGENT_RUNTIME_TOKEN_KEY, resolved.token);

  const updated = app.configuration.on("updated", (event) => {
    if (
      event.key === WEB_AGENT_RUNTIME_URL_KEY ||
      event.key === WEB_AGENT_RUNTIME_TOKEN_KEY
    ) {
      syncWebAgentRuntime(app);
    }
  });

  return () => {
    app.configuration.offref(updated);
    disposeSection();
  };
}
