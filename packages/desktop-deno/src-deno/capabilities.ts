import {
  fileActionCapabilityAvailable,
  notificationCapabilityAvailable,
} from "./native-actions.ts";

export function createCapabilityRegistry(
  platform = Deno.build.os,
  options: { terminalAvailable?: boolean } = {},
) {
  const notificationsAvailable = notificationCapabilityAvailable(platform);
  const fileActionsAvailable = fileActionCapabilityAvailable(platform);
  return {
    resource: { id: "resource" as const, status: "available" as const },
    notifications: {
      id: "notifications" as const,
      status: notificationsAvailable
        ? ("available" as const)
        : ("unavailable" as const),
      provider: notificationsAvailable
        ? "deno-osascript"
        : "unsupported-platform",
    },
    database: { id: "database" as const, status: "unavailable" as const },
    search: { id: "search" as const, status: "unavailable" as const },
    "language-service": {
      id: "language-service" as const,
      status: "available" as const,
      provider: "deno-markdownlint-runtime",
      details: {
        markdown: "markdownlint-node",
        protocolVersion: 1,
        lifecycle: "deno-runtime",
      },
    },
    "plugin-sidecar": {
      id: "plugin-sidecar" as const,
      status: "unavailable" as const,
    },
    "plugin-assets": {
      id: "plugin-assets" as const,
      status: "available" as const,
      provider: "deno-http-plugin-assets",
      details: {
        route: "/__lapis/plugins",
        protocol: "desktop_plugin_assets_register",
      },
    },
    "file-watch": {
      id: "file-watch" as const,
      status: "available" as const,
      provider: "deno-watch-fs",
    },
    "file-system-actions": {
      id: "file-system-actions" as const,
      status: fileActionsAvailable
        ? ("available" as const)
        : ("unavailable" as const),
      provider: fileActionsAvailable ? "deno-command" : "unsupported-platform",
    },
    "agent-runtime": {
      id: "agent-runtime" as const,
      status: "available" as const,
      provider: "deno-ai-host",
      details: {
        protocol: "desktop_agent_*",
        protocolVersion: 3,
        acp: "acpx/runtime",
        process: "stdio",
        appTools: "http-mcp",
      },
    },
    "terminal-runtime": {
      id: "terminal-runtime" as const,
      status: options.terminalAvailable === false
        ? ("unavailable" as const)
        : ("available" as const),
      provider: options.terminalAvailable === false
        ? "deno-pty-unavailable"
        : "deno-sigma-pty-ffi",
      details: options.terminalAvailable === false
        ? undefined
        : {
            protocol: "desktop_terminal_session_*",
            lifecycle: "deno-runtime",
          },
    },
    notebook: { id: "notebook" as const, status: "unavailable" as const },
    model: { id: "model" as const, status: "unavailable" as const },
  };
}
