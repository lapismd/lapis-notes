import {
  fileActionCapabilityAvailable,
  notificationCapabilityAvailable,
} from "./native-actions.ts";

export function createCapabilityRegistry(platform = Deno.build.os) {
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
      status: "unavailable" as const,
    },
    "plugin-sidecar": {
      id: "plugin-sidecar" as const,
      status: "unavailable" as const,
    },
    "plugin-assets": {
      id: "plugin-assets" as const,
      status: "unavailable" as const,
    },
    "file-watch": { id: "file-watch" as const, status: "unavailable" as const },
    "file-system-actions": {
      id: "file-system-actions" as const,
      status: fileActionsAvailable
        ? ("available" as const)
        : ("unavailable" as const),
      provider: fileActionsAvailable ? "deno-command" : "unsupported-platform",
    },
    "agent-runtime": {
      id: "agent-runtime" as const,
      status: "unavailable" as const,
    },
    "terminal-runtime": {
      id: "terminal-runtime" as const,
      status: "unavailable" as const,
    },
    notebook: { id: "notebook" as const, status: "unavailable" as const },
    model: { id: "model" as const, status: "unavailable" as const },
  };
}
