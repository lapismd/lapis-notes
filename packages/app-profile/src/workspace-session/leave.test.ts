import { describe, expect, it, vi } from "vitest";
import { createWorkspaceLeave } from "./leave";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("workspace leave preparation", () => {
  it("keeps disposal behind the complete native recovery preflight", async () => {
    const gate = deferred();
    const commit = vi.fn(async () => {});
    const leave = createWorkspaceLeave({
      preflight: () => gate.promise,
      commit,
      isDisposed: () => false,
      onRefused: vi.fn(),
    });
    const pending = leave(true);
    await Promise.resolve();
    expect(commit).not.toHaveBeenCalled();
    gate.resolve();
    await pending;
    expect(commit).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("retains the live workspace and error identity after refusal, then allows explicit retry", async () => {
    const refused = new Error("Resolve the retained native writer in Problems");
    const preflight = vi
      .fn()
      .mockRejectedValueOnce(refused)
      .mockResolvedValue(undefined);
    const onRefused = vi.fn();
    let disposed = false;
    const commit = vi.fn(async () => {
      disposed = true;
    });
    const leave = createWorkspaceLeave({
      preflight,
      commit,
      isDisposed: () => disposed,
      onRefused,
    });
    await expect(leave(true)).rejects.toBe(refused);
    expect(disposed).toBe(false);
    expect(commit).not.toHaveBeenCalled();
    expect(onRefused).toHaveBeenCalledExactlyOnceWith(refused);
    await leave(false);
    expect(commit).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("joins concurrent requests through the entire disposal, including after its initial fence", async () => {
    const commitGate = deferred();
    const preflight = vi.fn(async () => {});
    let disposed = false;
    const commit = vi.fn(async () => {
      disposed = true;
      await commitGate.promise;
    });
    const leave = createWorkspaceLeave({
      preflight,
      commit,
      isDisposed: () => disposed,
      onRefused: vi.fn(),
    });
    const first = leave(true);
    const second = leave(false);
    expect(second).toBe(first);
    await vi.waitFor(() => expect(commit).toHaveBeenCalledTimes(1));
    const third = leave(false);
    expect(third).toBe(first);
    let finished = false;
    void third.then(() => {
      finished = true;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    commitGate.resolve();
    await Promise.all([first, second, third]);
    expect(preflight).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("does not re-enter recovery or cleanup after disposal has finished", async () => {
    const preflight = vi.fn(async () => {});
    const commit = vi.fn(async () => {});
    const leave = createWorkspaceLeave({
      preflight,
      commit,
      isDisposed: () => true,
      onRefused: vi.fn(),
    });
    await leave(true);
    expect(preflight).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it("does not misreport a later cleanup failure as native recovery refusal", async () => {
    const failure = new Error("Client release failed");
    const onRefused = vi.fn();
    let disposed = false;
    const leave = createWorkspaceLeave({
      preflight: async () => {},
      commit: async () => {
        disposed = true;
        throw failure;
      },
      isDisposed: () => disposed,
      onRefused,
    });
    await expect(leave(true)).rejects.toBe(failure);
    expect(onRefused).not.toHaveBeenCalled();
  });
  it("retains a failed post-fence cleanup on later requests without reporting success", async () => {
    const failure = new Error("Native writer retirement failed");
    const onRefused = vi.fn();
    const preflight = vi.fn(async () => {});
    let disposed = false;
    const commit = vi.fn(async () => {
      disposed = true;
      throw failure;
    });
    const leave = createWorkspaceLeave({
      preflight,
      commit,
      isDisposed: () => disposed,
      onRefused,
    });
    const first = leave(true);
    await expect(first).rejects.toBe(failure);
    const repeated = leave(false);
    expect(repeated).toBe(first);
    await expect(repeated).rejects.toBe(failure);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(preflight).toHaveBeenCalledTimes(1);
    expect(onRefused).not.toHaveBeenCalled();
  });

  it("reports a final writer-flush refusal before the disposal fence and permits retry", async () => {
    const failure = new Error("Final save failed before cleanup");
    const onRefused = vi.fn();
    let disposed = false;
    const commit = vi
      .fn()
      .mockRejectedValueOnce(failure)
      .mockImplementation(async () => {
        disposed = true;
      });
    const leave = createWorkspaceLeave({
      preflight: async () => {},
      commit,
      isDisposed: () => disposed,
      onRefused,
    });
    await expect(leave(true)).rejects.toBe(failure);
    expect(onRefused).toHaveBeenCalledExactlyOnceWith(failure);
    expect(disposed).toBe(false);
    await leave(true);
    expect(disposed).toBe(true);
  });
});
