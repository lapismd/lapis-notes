import type { App } from "./context.svelte";
import type {
  NotificationProgressHandle,
  NotificationProgressOptions,
} from "./notifications";
import type { PluginInstallProgressEvent } from "./plugin-distribution/manager";

export function humanizePluginInstallPhase(phase: string): string {
  return phase
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function pluginInstallProgressMessage(
  event: PluginInstallProgressEvent,
): string {
  let message = event.message ?? humanizePluginInstallPhase(event.phase);
  if (
    event.filePath &&
    typeof event.fileIndex === "number" &&
    typeof event.fileCount === "number"
  ) {
    message = `${message} (${event.fileIndex} of ${event.fileCount})`;
  }
  if (
    typeof event.processedBytes === "number" &&
    typeof event.totalBytes === "number" &&
    event.totalBytes > 0
  ) {
    message = `${message} - ${formatByteSize(event.processedBytes)} of ${formatByteSize(event.totalBytes)}`;
  }
  return message;
}

export function reportPluginInstallProgress(
  progressHandle: NotificationProgressHandle,
  event: PluginInstallProgressEvent,
): void {
  const message = pluginInstallProgressMessage(event);
  if (typeof event.totalBytes === "number" && event.totalBytes > 0) {
    if (
      event.phase === "downloading-bundle" &&
      typeof event.downloadedBytes === "number"
    ) {
      progressHandle.report({
        current: event.downloadedBytes,
        total: event.totalBytes,
        message,
      });
      return;
    }
    if (typeof event.processedBytes === "number") {
      progressHandle.report({
        current: event.processedBytes,
        total: event.totalBytes,
        message,
      });
      return;
    }
  }
  progressHandle.report({ message, indeterminate: true });
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  for (const unit of units) {
    if (value < 1024 || unit === units.at(-1)) {
      return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
    }
    value /= 1024;
  }
  return `${bytes} B`;
}

export interface WithPluginInstallProgressOptions {
  pluginId: string;
  title: string;
  source?: string;
  location?: NotificationProgressOptions["location"];
  persistOnError?: boolean;
}

export async function withPluginInstallProgress<T>(
  app: App,
  options: WithPluginInstallProgressOptions,
  action: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  return app.notifications.withProgress(
    {
      title: options.title,
      source: options.source ?? "Plugin registry",
      location: options.location ?? "status",
      cancellable: true,
      persistOnError: options.persistOnError ?? false,
    },
    async (progressHandle, token) => {
      const removeProgressListener = app.pluginDistribution.addProgressListener(
        (event) => {
          if (event.pluginId !== options.pluginId) {
            return;
          }
          reportPluginInstallProgress(progressHandle, event);
        },
      );
      try {
        progressHandle.report({ message: "Starting", indeterminate: true });
        return await action(token.signal);
      } finally {
        removeProgressListener();
      }
    },
  );
}
