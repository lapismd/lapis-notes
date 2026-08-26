import { describe, expect, it, vi } from "vitest";

import { createCapabilityRegistry } from "./capabilities";
import {
  createFileActionCommand,
  createExternalUrlCommand,
  createNotificationCommand,
  fileActionCapabilityAvailable,
  normalizeNativeNotification,
  normalizeExternalUrl,
  notificationCapabilityAvailable,
  runFileAction,
  openExternalUrl,
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
    expect(
      createCapabilityRegistry("darwin")["agent-runtime"].details,
    ).toMatchObject({ deferredStart: true, deferredModels: true });
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

  it("opens complete validated external URLs as one process argument", async () => {
    const url = normalizeExternalUrl(
      "https://example.com/a?value=one%20two&next=$(touch%20/tmp/nope)",
    );
    expect(createExternalUrlCommand("darwin", url)).toEqual({
      command: "open",
      args: [url],
    });
    expect(createExternalUrlCommand("linux", url)).toEqual({
      command: "xdg-open",
      args: [url],
    });
    const run = vi.fn(async () => ({ success: true }));
    await expect(openExternalUrl(url, "linux", run)).resolves.toBeUndefined();
    expect(run).toHaveBeenCalledWith({ command: "xdg-open", args: [url] });
  });

  it("rejects external URL schemes the host does not authorize", async () => {
    for (const url of ["file:///etc/passwd", "javascript:alert(1)", "/notes"]) {
      expect(() => normalizeExternalUrl(url)).toThrow(/external URL|scheme/u);
    }
    await expect(
      openExternalUrl("https://example.com", "windows", vi.fn()),
    ).rejects.toThrow(/unavailable/u);
  });
});
