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
        persistOnError: true,
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

function queueFixture() {
  const handles: {
    report: ReturnType<typeof vi.fn>;
    abort: AbortController;
  }[] = [];
  const app = {
    notifications: {
      withProgress: async (
        _: unknown,
        action: (handle: unknown, token: unknown) => Promise<unknown>,
      ) => {
        const h = { report: vi.fn(), abort: new AbortController() };
        handles.push(h);
        return action(h, { signal: h.abort.signal });
      },
    },
    pluginDistribution: { addProgressListener: vi.fn(() => () => {}) },
  } as unknown as App;
  return { app, handles };
}

describe("App-owned install progress queue", () => {
  it("keeps separate progress items and serializes overlapping installs", async () => {
    const { app, handles } = queueFixture();
    let finish!: () => void;
    const first = withPluginInstallProgress(
      app,
      { pluginId: "a", title: "A" },
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
    const runSecond = vi.fn(async () => "installed-b");
    const second = withPluginInstallProgress(
      app,
      { pluginId: "b", title: "B" },
      runSecond,
    );
    expect(handles).toHaveLength(2);
    expect(runSecond).not.toHaveBeenCalled();
    expect(handles[1].report).toHaveBeenCalledWith({
      message: "Queued",
      indeterminate: true,
    });
    finish();
    await first;
    await expect(second).resolves.toBe("installed-b");
    expect(handles[0].abort.signal.aborted).toBe(false);
  });

  it("cancels a queued install without cancelling its predecessor or blocking its successor", async () => {
    const { app, handles } = queueFixture();
    let finish!: () => void;
    const first = withPluginInstallProgress(
      app,
      { pluginId: "a", title: "A" },
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
    const runSecond = vi.fn(async () => {});
    const second = withPluginInstallProgress(
      app,
      { pluginId: "b", title: "B" },
      runSecond,
    );
    const rejected = expect(second).rejects.toMatchObject({
      name: "AbortError",
    });
    handles[1].abort.abort();
    const runThird = vi.fn(async () => "c");
    const third = withPluginInstallProgress(
      app,
      { pluginId: "c", title: "C" },
      runThird,
    );
    expect(handles[0].abort.signal.aborted).toBe(false);
    finish();
    await first;
    await rejected;
    await expect(third).resolves.toBe("c");
    expect(runSecond).not.toHaveBeenCalled();
  });
});
