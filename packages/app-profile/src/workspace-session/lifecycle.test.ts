import { describe, expect, it, vi } from "vitest";
import { createNotesSessionLifecycle } from "./lifecycle";
import {
  prepareNativeRepositoryLeave,
  resumeNativeRepositoryLeave,
} from "../native-repository";

vi.mock("../native-chat/plugin", () => ({ prepareNativeChatLeave: vi.fn() }));
vi.mock("../native-repository", () => ({
  prepareNativeRepositoryLeave: vi.fn(),
  resumeNativeRepositoryLeave: vi.fn(),
}));

function fixture() {
  const events: string[] = [];
  const task = (name: string) =>
    vi.fn(async () => {
      events.push(name);
    });
  const resumeSync = vi.fn(() => {
    events.push("sync:resume");
  });
  const app = {
    nativeSync: {
      prepareLeave: vi.fn(async () => {
        events.push("sync:prepare");
        return resumeSync;
      }),
    },
    vaultChanges: { stop: task("watch:stop"), start: task("watch:resume") },
    workspace: {
      layoutReady: true,
      flushPluginChanges: task("plugins:flush"),
      flushLayout: task("layout:flush"),
      getLayout: () => ({ version: 1 }),
      disposeWorkspaceHost: task("workspace:dispose"),
    },
    plugins: {
      flushPendingConfigWrites: task("config:flush"),
      plugins: new Map([["plugin", { disable: task("plugin:disable") }]]),
    },
    fileEditingSessions: {
      settleOperations: task("writers:settle"),
      preflightNativeRecovery: task("writers:preflight"),
      guard: async (_: unknown, action: () => Promise<void>) => {
        events.push("writers:guard");
        return action();
      },
      dispose: task("writers:dispose"),
    },
    metadataCache: { dispose: task("metadata:dispose") },
    notifications: { notify: vi.fn() },
  };
  const session = {
    vaultAdapter: { mkdir: task("mkdir"), write: task("write") },
    close: task("session:close"),
  };
  const host = { dispose: task("host:dispose") };
  const lifecycle = createNotesSessionLifecycle({
    app: app as never,
    session: session as never,
    fence: () => {
      events.push("fence");
    },
    releaseObservers: () => {
      events.push("observers:release");
    },
    releaseServices: task("services:dispose"),
    releaseHostServices: host.dispose,
    releaseApplication: () => {
      events.push("compatibility:release");
    },
  });
  return { app, session, lifecycle, events, host, resumeSync };
}

describe("shared Notes session teardown", () => {
  it("drains native Sync before other preflights and entering the writer guard", async () => {
    const { app, lifecycle, events, resumeSync } = fixture();
    let finish!: () => void;
    app.nativeSync.prepareLeave.mockImplementationOnce(
      () =>
        new Promise((done) => {
          finish = () => done(resumeSync);
        }),
    );
    const pending = lifecycle.dispose(false);
    await vi.waitFor(() =>
      expect(app.nativeSync.prepareLeave).toHaveBeenCalledOnce(),
    );
    expect(events).not.toContain("watch:stop");
    expect(events).not.toContain("writers:guard");
    finish();
    await pending;
    expect(events.indexOf("writers:guard")).toBeLessThan(
      events.indexOf("metadata:dispose"),
    );
    expect(events.indexOf("metadata:dispose")).toBeLessThan(
      events.indexOf("sync:resume"),
    );
    expect(resumeSync).toHaveBeenCalledOnce();
  });

  it("releases native Sync preparation after refused layout persistence and prepares again on retry", async () => {
    const { app, session, lifecycle, resumeSync } = fixture();
    session.vaultAdapter.write.mockRejectedValueOnce(
      new Error("Layout save failed"),
    );
    await expect(lifecycle.dispose(true)).rejects.toThrow("Layout save failed");
    expect(resumeSync).toHaveBeenCalledOnce();
    expect(app.metadataCache.dispose).not.toHaveBeenCalled();
    expect(lifecycle.canRecoverLeave()).toBe(true);
    await lifecycle.dispose(true);
    expect(app.nativeSync.prepareLeave).toHaveBeenCalledTimes(2);
    expect(resumeSync).toHaveBeenCalledTimes(2);
  });

  it("releases preparation after irreversible cleanup failure without repeating teardown", async () => {
    const { app, lifecycle, resumeSync } = fixture();
    app.metadataCache.dispose.mockRejectedValueOnce(
      new Error("Transport detach failed"),
    );
    await expect(lifecycle.dispose(false)).rejects.toThrow(
      "cleanup did not complete",
    );
    expect(resumeSync).toHaveBeenCalledOnce();
    expect(lifecycle.canRecoverLeave()).toBe(false);
    await expect(lifecycle.dispose(false)).rejects.toThrow(
      "cleanup did not complete",
    );
    expect(app.nativeSync.prepareLeave).toHaveBeenCalledOnce();
    expect(app.metadataCache.dispose).toHaveBeenCalledOnce();
  });

  it("resumes file watching even when Repository observation cannot resume", async () => {
    const { session, lifecycle, events } = fixture();
    session.vaultAdapter.write.mockRejectedValueOnce(
      new Error("Layout save failed"),
    );
    vi.mocked(resumeNativeRepositoryLeave).mockRejectedValueOnce(
      new Error("Repository resume failed"),
    );
    await expect(lifecycle.dispose(true)).rejects.toThrow(/could not resume/);
    expect(events).toContain("watch:resume");
    expect(lifecycle.canRecoverLeave()).toBe(true);
    expect(session.close).not.toHaveBeenCalled();
  });
  it("retains the session and resumes Repository observation after refused leave", async () => {
    const { app, session, lifecycle, events } = fixture();
    const error = new Error("Repository could not pause");
    vi.mocked(prepareNativeRepositoryLeave).mockRejectedValueOnce(error);
    await expect(lifecycle.dispose(true)).rejects.toBe(error);
    expect(lifecycle.canRecoverLeave()).toBe(true);
    expect(resumeNativeRepositoryLeave).toHaveBeenCalledWith(app);
    expect(session.close).not.toHaveBeenCalled();
    expect(events).not.toContain("fence");
    await lifecycle.dispose(true);
    expect(session.close).toHaveBeenCalledOnce();
  });
  it("retains the live application on a failed layout save and permits an explicit retry", async () => {
    const { app, session, lifecycle, events } = fixture();
    const failure = new Error("Layout could not be saved");
    session.vaultAdapter.write.mockRejectedValueOnce(failure);
    await expect(lifecycle.dispose(true)).rejects.toBe(failure);
    expect(lifecycle.canRecoverLeave()).toBe(true);
    expect(events).toContain("watch:resume");
    expect(events).not.toContain("fence");
    expect(session.close).not.toHaveBeenCalled();
    expect(app.notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ message: failure.message }),
    );
    await lifecycle.dispose(true);
    expect(lifecycle.canRecoverLeave()).toBe(false);
    expect(session.close).toHaveBeenCalledOnce();
    expect(events.indexOf("services:dispose")).toBeLessThan(
      events.indexOf("session:close"),
    );
  });

  it("keeps the compatibility lease through plugin and session cleanup", async () => {
    const { session, lifecycle, events } = fixture();
    let close!: () => void;
    session.close.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          close = done;
        }),
    );
    const pending = lifecycle.dispose(false);
    await vi.waitFor(() => expect(session.close).toHaveBeenCalledOnce());
    expect(events).toContain("plugin:disable");
    expect(events).toContain("writers:dispose");
    expect(events).toContain("services:dispose");
    expect(events).not.toContain("compatibility:release");
    close();
    await pending;
    expect(events.at(-1)).toBe("compatibility:release");
    expect(session.vaultAdapter.write).not.toHaveBeenCalled();
  });

  it("awaits host attachment cleanup after the session and before compatibility release", async () => {
    const { host, lifecycle, events } = fixture();
    let finish!: () => void;
    host.dispose.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const pending = lifecycle.dispose(false);
    await vi.waitFor(() => expect(host.dispose).toHaveBeenCalledOnce());
    expect(events).toContain("session:close");
    expect(events).not.toContain("compatibility:release");
    finish();
    await pending;
    expect(events.at(-1)).toBe("compatibility:release");
  });

  it("retains compatibility ownership when host attachment cleanup fails", async () => {
    const { host, lifecycle, events } = fixture();
    host.dispose.mockRejectedValueOnce(new Error("Attachment could not close"));
    await expect(lifecycle.dispose(false)).rejects.toThrow(
      "Notes session cleanup did not complete",
    );
    expect(events).toContain("session:close");
    expect(events).not.toContain("compatibility:release");
    await expect(lifecycle.dispose(false)).rejects.toThrow(
      "Notes session cleanup did not complete",
    );
    expect(host.dispose).toHaveBeenCalledOnce();
  });
});
