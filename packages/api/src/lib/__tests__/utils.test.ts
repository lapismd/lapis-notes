import { afterEach, describe, expect, it, vi } from "vitest";
import { debounce } from "../utils";

describe("debounce compatibility", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs once with the latest arguments by default", () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const debounced = debounce((value: string) => calls.push(value), 100);

    expect(debounced("first")).toBe(debounced);
    debounced("second");
    vi.advanceTimersByTime(99);
    expect(calls).toEqual([]);
    vi.advanceTimersByTime(1);

    expect(calls).toEqual(["second"]);
  });

  it("can keep the first timer while updating arguments", () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const debounced = debounce(
      (value: string) => calls.push(value),
      100,
      false,
    );

    debounced("first");
    vi.advanceTimersByTime(50);
    debounced("second");
    vi.advanceTimersByTime(50);

    expect(calls).toEqual(["second"]);
  });

  it("supports cancel and run", () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const debounced = debounce((value: string) => {
      calls.push(value);
      return value.toUpperCase();
    }, 100);

    debounced("cancelled").cancel();
    vi.advanceTimersByTime(100);
    expect(calls).toEqual([]);

    debounced("now");
    expect(debounced.run()).toBe("NOW");
    vi.advanceTimersByTime(100);
    expect(calls).toEqual(["now"]);
  });
});
