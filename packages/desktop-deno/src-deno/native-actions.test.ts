import { describe, expect, it, vi } from "vitest";

import { createCapabilityRegistry } from "./capabilities";
import {
  createFileActionCommand,
  createNotificationCommand,
  fileActionCapabilityAvailable,
  normalizeNativeNotification,
  notificationCapabilityAvailable,
  runFileAction,
  showNativeNotification,
} from "./native-actions";

describe("Deno native desktop actions", () => {
  it("builds bounded macOS notifications without shell interpolation", async () => {
    const payload = {
      id: "notice-1",
      title: 'A "quoted" title',
      message: "$(touch /tmp/not-a-command)",
      severity: "error",
    };
    const notification = normalizeNativeNotification(payload);
    const command = createNotificationCommand("darwin", notification);
    expect(command?.command).toBe("osascript");
    expect(command?.args.slice(-2)).toEqual([
      'A "quoted" title',
      "$(touch /tmp/not-a-command)",
    ]);

    const run = vi.fn(async () => ({ success: true }));
    await expect(
      showNativeNotification(payload, "darwin", run),
    ).resolves.toEqual({ shown: true });
    await expect(
      showNativeNotification(payload, "darwin", run),
    ).resolves.toEqual({ shown: false, reason: "duplicate" });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("advertises only implemented platform actions", () => {
    expect(notificationCapabilityAvailable("darwin")).toBe(true);
    expect(notificationCapabilityAvailable("linux")).toBe(false);
    expect(fileActionCapabilityAvailable("darwin")).toBe(true);
    expect(fileActionCapabilityAvailable("linux")).toBe(true);
    expect(fileActionCapabilityAvailable("windows")).toBe(false);
    expect(createCapabilityRegistry("darwin").notifications.status).toBe(
      "available",
    );
    expect(createCapabilityRegistry("linux").notifications.status).toBe(
      "unavailable",
    );
    expect(
      createCapabilityRegistry("windows")["file-system-actions"].status,
    ).toBe("unavailable");
  });

  it("opens the containing folder for Linux reveal", async () => {
    expect(
      createFileActionCommand("linux", "reveal", "/vault/note.md"),
    ).toEqual({ command: "xdg-open", args: ["/vault"] });
    const run = vi.fn(async () => ({ success: false }));
    await expect(
      runFileAction("open", "/vault/note.md", "linux", run),
    ).rejects.toThrow(/File open failed/u);
  });
});
