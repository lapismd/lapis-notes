export type NativeActionPlatform = "darwin" | "linux" | "windows" | string;

export type NativeNotification = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "error";
};

export type NativeCommand = {
  command: string;
  args: string[];
};

type CommandResult = { success: boolean };
type CommandRunner = (command: NativeCommand) => Promise<CommandResult>;

const shownNotificationIds = new Set<string>();

function readBoundedString(
  value: unknown,
  maximumLength: number,
): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().slice(0, maximumLength);
  return normalized || undefined;
}

export function normalizeNativeNotification(
  value: unknown,
): NativeNotification {
  const payload =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const id = readBoundedString(payload.id, 200);
  const body = readBoundedString(payload.message, 2_000);
  if (!id || !body) {
    throw new Error("Invalid desktop notification payload");
  }
  const severity =
    payload.severity === "warning" || payload.severity === "error"
      ? payload.severity
      : "info";
  return {
    id,
    title:
      readBoundedString(payload.title, 200) ??
      readBoundedString(payload.source, 80) ??
      "Lapis Notes",
    body,
    severity,
  };
}

export function createNotificationCommand(
  platform: NativeActionPlatform,
  notification: NativeNotification,
): NativeCommand | null {
  if (platform === "darwin") {
    return {
      command: "osascript",
      args: [
        "-e",
        "on run argv\n  display notification (item 2 of argv) with title (item 1 of argv)\nend run",
        notification.title,
        notification.body,
      ],
    };
  }
  return null;
}

async function runNativeCommand(
  command: NativeCommand,
): Promise<CommandResult> {
  return await new Deno.Command(command.command, {
    args: command.args,
    stdout: "null",
    stderr: "piped",
  }).output();
}

export async function showNativeNotification(
  value: unknown,
  platform: NativeActionPlatform = Deno.build.os,
  run: CommandRunner = runNativeCommand,
): Promise<{ shown: boolean; reason?: string }> {
  const notification = normalizeNativeNotification(value);
  if (shownNotificationIds.has(notification.id)) {
    return { shown: false, reason: "duplicate" };
  }
  const command = createNotificationCommand(platform, notification);
  if (!command) return { shown: false, reason: "unsupported" };

  const result = await run(command);
  if (!result.success) return { shown: false, reason: "failed" };
  shownNotificationIds.add(notification.id);
  return { shown: true };
}

export function notificationCapabilityAvailable(
  platform: NativeActionPlatform,
): boolean {
  return platform === "darwin";
}

export function fileActionCapabilityAvailable(
  platform: NativeActionPlatform,
): boolean {
  return platform === "darwin" || platform === "linux";
}

export function createFileActionCommand(
  platform: NativeActionPlatform,
  action: "open" | "reveal",
  path: string,
): NativeCommand | null {
  if (platform === "darwin") {
    return {
      command: "open",
      args: action === "reveal" ? ["-R", path] : [path],
    };
  }
  if (platform === "linux") {
    const target =
      action === "reveal" ? path.replace(/\/[^/]+$/u, "") || "/" : path;
    return { command: "xdg-open", args: [target] };
  }
  return null;
}

export async function runFileAction(
  action: "open" | "reveal",
  path: string,
  platform: NativeActionPlatform = Deno.build.os,
  run: CommandRunner = runNativeCommand,
): Promise<void> {
  const command = createFileActionCommand(platform, action, path);
  if (!command) {
    throw new Error(`File ${action} is unavailable on ${platform}`);
  }
  const result = await run(command);
  if (!result.success) throw new Error(`File ${action} failed for ${path}`);
}
