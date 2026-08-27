import { afterEach, describe, expect, it, vi } from "vitest";
import { GraphHoverIntent } from "./graph-hover-intent";

describe("GraphHoverIntent", () => {
  afterEach(() => vi.useRealTimers());

  it("activates after dwell and releases after the grace period", () => {
    vi.useFakeTimers();
    const changes: Array<string | null> = [];
    const intent = new GraphHoverIntent(
      () => ({ activationDelayMs: 500, releaseDelayMs: 350 }),
      (nodeId) => changes.push(nodeId),
    );

    intent.setPointerNode("a");
    vi.advanceTimersByTime(499);
    expect(changes).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(changes).toEqual(["a"]);

    intent.setPointerNode(null);
    vi.advanceTimersByTime(349);
    expect(changes).toEqual(["a"]);
    vi.advanceTimersByTime(1);
    expect(changes).toEqual(["a", null]);
  });

  it("retains the old emphasis while moving directly to a new node", () => {
    vi.useFakeTimers();
    const changes: Array<string | null> = [];
    const intent = new GraphHoverIntent(
      () => ({ activationDelayMs: 500, releaseDelayMs: 350 }),
      (nodeId) => changes.push(nodeId),
    );

    intent.setPointerNode("a");
    vi.advanceTimersByTime(500);
    intent.setPointerNode("b");
    vi.advanceTimersByTime(349);
    expect(changes).toEqual(["a"]);
    vi.advanceTimersByTime(1);
    expect(changes).toEqual(["a", null]);
    vi.advanceTimersByTime(150);
    expect(changes).toEqual(["a", null, "b"]);
  });

  it("cancels stale activation and clears all timers", () => {
    vi.useFakeTimers();
    const changes: Array<string | null> = [];
    const intent = new GraphHoverIntent(
      () => ({ activationDelayMs: 500, releaseDelayMs: 350 }),
      (nodeId) => changes.push(nodeId),
    );

    intent.setPointerNode("a");
    vi.advanceTimersByTime(200);
    intent.setPointerNode("b");
    vi.advanceTimersByTime(300);
    expect(changes).toEqual([]);
    intent.clear();
    vi.runAllTimers();
    expect(changes).toEqual([]);
  });

  it("supports zero-delay reduced-motion state transitions", () => {
    const changes: Array<string | null> = [];
    const intent = new GraphHoverIntent(
      () => ({ activationDelayMs: 0, releaseDelayMs: 0 }),
      (nodeId) => changes.push(nodeId),
    );

    intent.setPointerNode("a");
    intent.setPointerNode(null);
    expect(changes).toEqual(["a", null]);
  });
});
