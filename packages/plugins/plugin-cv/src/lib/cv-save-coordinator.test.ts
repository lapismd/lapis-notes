import { describe, expect, it, vi } from "vitest";
import { CvSaveCoordinator } from "./cv-save-coordinator";

describe("CvSaveCoordinator", () => {
  it("debounces writes and persists only the latest queued value", async () => {
    vi.useFakeTimers();
    const writes: string[] = [];
    const coordinator = new CvSaveCoordinator<string>(async (value) => {
      writes.push(value);
    });

    const first = coordinator.queue("first");
    const latest = coordinator.queue("latest");
    await vi.advanceTimersByTimeAsync(1_199);
    expect(writes).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([first, latest]);
    expect(writes).toEqual(["latest"]);
    vi.useRealTimers();
  });

  it("serializes an edit queued while a write is running", async () => {
    let releaseFirst!: () => void;
    const writes: string[] = [];
    const coordinator = new CvSaveCoordinator<string>(
      async (value) => {
        writes.push(value);
        if (value === "first") {
          await new Promise<void>((resolve) => (releaseFirst = resolve));
        }
      },
      { delay: 0 },
    );

    const first = coordinator.queue("first");
    const flushing = coordinator.flush();
    await vi.waitFor(() => expect(writes).toEqual(["first"]));
    const latest = coordinator.queue("latest");
    releaseFirst();
    await flushing;
    await Promise.all([first, latest]);
    expect(writes).toEqual(["first", "latest"]);
  });

  it("flushes immediately for lifecycle boundaries", async () => {
    vi.useFakeTimers();
    const writes: string[] = [];
    const coordinator = new CvSaveCoordinator<string>(async (value) => {
      writes.push(value);
    });

    const queued = coordinator.queue("closing");
    await coordinator.flush();
    await queued;
    expect(writes).toEqual(["closing"]);
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("retains dirty data and reports failures until a later save succeeds", async () => {
    vi.useFakeTimers();
    let shouldFail = true;
    const states: Array<{ pending: boolean; error: string | null }> = [];
    const coordinator = new CvSaveCoordinator<string>(
      async () => {
        if (shouldFail) throw new Error("Vault unavailable");
      },
      {
        onStateChange: (state) =>
          states.push({ pending: state.pending, error: state.error }),
      },
    );

    const failed = coordinator.queue("dirty");
    const failedExpectation = expect(failed).rejects.toThrow("Vault unavailable");
    await vi.advanceTimersByTimeAsync(1_200);
    await failedExpectation;
    expect(coordinator.state).toMatchObject({
      pending: true,
      error: "Vault unavailable",
    });

    shouldFail = false;
    const retry = coordinator.queue("dirty");
    await vi.advanceTimersByTimeAsync(1_200);
    await retry;
    expect(coordinator.state).toEqual({
      pending: false,
      saving: false,
      error: null,
    });
    expect(states.some((state) => state.error === "Vault unavailable")).toBe(true);
    vi.useRealTimers();
  });
});
