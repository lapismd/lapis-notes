import { describe, expect, it, vi } from "vitest";
import type { App } from "../context.svelte";
import type { NotificationProgressHandle } from "../notifications";
import type { PluginInstallProgressEvent } from "../plugin-distribution/manager";
import {
  isAbortError,
  pluginInstallProgressMessage,
  reportPluginInstallProgress,
  withPluginInstallProgress,
} from "../plugin-install-progress";

describe("pluginInstallProgressMessage", () => {
  it("formats file progress with index and count", () => {
    expect(
      pluginInstallProgressMessage({
        pluginId: "lapis-docs",
        phase: "verifying-files",
        message: "Downloading main.js",
        filePath: "main.js",
        fileIndex: 2,
        fileCount: 5,
      }),
    ).toBe("Downloading main.js (2 of 5)");
  });

  it("humanizes phases without messages", () => {
    expect(
      pluginInstallProgressMessage({
        pluginId: "lapis-docs",
        phase: "downloading-bundle",
      }),
    ).toBe("Downloading Bundle");
  });

  it("formats determinate processed-byte progress", () => {
    expect(
      pluginInstallProgressMessage({
        pluginId: "lapis-docs",
        phase: "staging",
        message: "Staging main.mjs",
        filePath: "main.mjs",
        fileIndex: 3,
        fileCount: 5,
        processedBytes: 2048,
        totalBytes: 4096,
      }),
    ).toBe("Staging main.mjs (3 of 5) - 2.0 KB of 4.0 KB");
  });
});

describe("reportPluginInstallProgress", () => {
  it("reports determinate byte progress during downloads", () => {
    const progressHandle = {
      report: vi.fn(),
    } as unknown as NotificationProgressHandle;

    reportPluginInstallProgress(progressHandle, {
      pluginId: "lapis-docs",
      phase: "downloading-bundle",
      message: "Downloading plugin bundle",
      downloadedBytes: 50,
      totalBytes: 100,
    });

    expect(progressHandle.report).toHaveBeenCalledWith({
      current: 50,
      total: 100,
      message: "Downloading plugin bundle",
    });
  });

  it("reports determinate processed-byte progress during staging", () => {
    const progressHandle = {
      report: vi.fn(),
    } as unknown as NotificationProgressHandle;

    reportPluginInstallProgress(progressHandle, {
      pluginId: "lapis-docs",
      phase: "staging",
      message: "Staging main.mjs",
      processedBytes: 50,
      totalBytes: 100,
      filePath: "main.mjs",
      fileIndex: 1,
      fileCount: 2,
    });

    expect(progressHandle.report).toHaveBeenCalledWith({
      current: 50,
      total: 100,
      message: "Staging main.mjs (1 of 2) - 50 B of 100 B",
    });
  });
});

describe("withPluginInstallProgress", () => {
  it("wraps install work with notification progress and distribution events", async () => {
    const progressHandle = {
      report: vi.fn(),
    };
    const removeProgressListener = vi.fn();
    const addProgressListener = vi.fn(
      (listener: (event: PluginInstallProgressEvent) => void) => {
        listener({
          pluginId: "lapis-docs",
          phase: "enabling",
          message: "Enabling plugin",
        });
        return removeProgressListener;
      },
    );
    const withProgress = vi.fn(
      async (
        _options: unknown,
        task: (
          handle: NotificationProgressHandle,
          token: { signal: AbortSignal },
        ) => Promise<unknown>,
      ) =>
        task(progressHandle as NotificationProgressHandle, {
          signal: new AbortController().signal,
        }),
    );
    const install = vi.fn(async () => ({ pluginId: "lapis-docs" }));
    const app = {
      notifications: { withProgress },
      pluginDistribution: { addProgressListener, install },
    } as unknown as App;

    await withPluginInstallProgress(
      app,
      {
        pluginId: "lapis-docs",
        title: "Installing Lapis Docs",
      },
      (signal) => app.pluginDistribution.install("lapis-docs", { signal }),
    );

    expect(withProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Installing Lapis Docs",
        source: "Plugin registry",
        location: "status",
        cancellable: true,
      }),
      expect.any(Function),
    );
    expect(progressHandle.report).toHaveBeenCalledWith({
      message: "Starting",
      indeterminate: true,
    });
    expect(progressHandle.report).toHaveBeenCalledWith({
      message: "Enabling plugin",
      indeterminate: true,
    });
    expect(removeProgressListener).toHaveBeenCalled();
    expect(install).toHaveBeenCalled();
  });
});

describe("isAbortError", () => {
  it("detects abort errors", () => {
    expect(
      isAbortError(
        Object.assign(new Error("cancelled"), { name: "AbortError" }),
      ),
    ).toBe(true);
    expect(isAbortError(new Error("failed"))).toBe(false);
  });
});
