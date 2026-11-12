import { afterEach, expect, it, vi } from "vitest";
import { NativeEditingRecovery } from "../native-editing-recovery";
import type {
  EditingIntentState,
  EditingIntentValue,
  NativeEditingIntents,
} from "../native-editing-intents";

const claim: EditingIntentState = {
  editor_id: "detached",
  path: "Note.md",
  generation: 1,
  revision: 1,
  active: true,
  dirty: true,
  detached: true,
};

function fixture() {
  let invalidate!: () => void;
  let fail!: (error: unknown) => void;
  const close = vi.fn();
  const observe = vi.fn(
    (changed: () => void, error: (error: unknown) => void) => {
      invalidate = changed;
      fail = error;
      return close;
    },
  );
  const call = vi
    .fn<NativeEditingIntents["call"]>()
    .mockResolvedValue({ kind: "states", states: [claim] });
  const port: NativeEditingIntents = { call, read: vi.fn(), observe };
  const model = new NativeEditingRecovery(port, async (operation) =>
    operation(),
  );
  return {
    model,
    call,
    observe,
    close,
    invalidate: () => invalidate(),
    fail: (error: unknown) => fail(error),
  };
}

afterEach(() => vi.useRealTimers());

it("shares native observation and performs no idle list polling", async () => {
  vi.useFakeTimers();
  const f = fixture();
  const first = f.model.observe(),
    second = f.model.observe();
  try {
    await vi.advanceTimersByTimeAsync(20_000);
    expect(f.call).toHaveBeenCalledTimes(1);
    expect(f.observe).toHaveBeenCalledTimes(1);
    first();
    expect(f.close).not.toHaveBeenCalled();
    second();
    second();
    expect(f.close).toHaveBeenCalledTimes(1);
  } finally {
    first();
    second();
  }
});

it("refreshes after an invalidation received during an older list", async () => {
  const f = fixture();
  let finish!: (value: EditingIntentValue) => void;
  f.call.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const stop = f.model.observe();
  try {
    expect(f.observe).toHaveBeenCalledTimes(1);
    f.invalidate();
    f.invalidate();
    f.call.mockResolvedValue({
      kind: "states",
      states: [{ ...claim, revision: 2 }],
    });
    finish({ kind: "states", states: [claim] });
    await vi.waitFor(() =>
      expect(f.model.snapshot().claims[0]?.revision).toBe(2),
    );
    expect(f.call).toHaveBeenCalledTimes(2);
  } finally {
    stop();
  }
});

it("retains claims and observation errors until reconnection invalidates them", async () => {
  const f = fixture();
  const stop = f.model.observe();
  try {
    expect(f.observe).toHaveBeenCalledTimes(1);
    await f.model.refresh();
    f.fail(new Error("Stream disconnected"));
    await f.model.refresh();
    expect(f.model.snapshot().claims).toEqual([claim]);
    expect(f.model.snapshot().error).toBe("Stream disconnected");
    f.invalidate();
    await vi.waitFor(() => expect(f.model.snapshot().error).toBeUndefined());
  } finally {
    stop();
  }
});

it("fences callbacks and pending reads after final unmount", async () => {
  const f = fixture();
  const stop = f.model.observe();
  expect(f.observe).toHaveBeenCalledTimes(1);
  await f.model.refresh();
  let finish!: (value: EditingIntentValue) => void;
  f.call.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  f.invalidate();
  stop();
  finish({ kind: "states", states: [] });
  f.invalidate();
  f.fail(new Error("Late error"));
  await Promise.resolve();
  expect(f.model.snapshot().claims).toEqual([claim]);
  expect(f.model.snapshot().error).toBeUndefined();
  expect(f.call).toHaveBeenCalledTimes(2);
  expect(f.close).toHaveBeenCalledOnce();
});

it("starts a fresh observation and rejects callbacks from the earlier mount", async () => {
  const f = fixture();
  const first = f.model.observe();
  await f.model.refresh();
  const [oldInvalidate, oldError] = f.observe.mock.calls[0]!;
  first();
  const second = f.model.observe();
  try {
    await f.model.refresh();
    oldInvalidate();
    oldError(new Error("Retired observer"));
    expect(f.observe).toHaveBeenCalledTimes(2);
    expect(f.call).toHaveBeenCalledTimes(2);
    expect(f.model.snapshot().error).toBeUndefined();
  } finally {
    second();
  }
  expect(f.close).toHaveBeenCalledTimes(2);
});

it("keeps failed registration visible without silently resuming idle polling", async () => {
  vi.useFakeTimers();
  const f = fixture();
  f.observe.mockImplementationOnce(() => {
    throw new Error("Registration failed");
  });
  const stop = f.model.observe();
  try {
    await vi.advanceTimersByTimeAsync(20_000);
    expect(f.call).toHaveBeenCalledTimes(1);
    expect(f.model.snapshot().claims).toEqual([claim]);
    expect(f.model.snapshot().error).toBe("Registration failed");
  } finally {
    stop();
  }
});

it("refreshes authoritative claims after a failed list when the stream reconnects", async () => {
  const f = fixture();
  f.call.mockRejectedValueOnce(new Error("List offline"));
  const stop = f.model.observe();
  try {
    await expect(f.model.refresh()).rejects.toThrow("List offline");
    f.invalidate();
    await vi.waitFor(() => expect(f.model.snapshot().claims).toEqual([claim]));
    expect(f.model.snapshot().error).toBeUndefined();
    expect(f.call).toHaveBeenCalledTimes(2);
  } finally {
    stop();
  }
});

it.each(["recover", "discard"] as const)(
  "keeps a disconnected observer visible after confirmed %s",
  async (action) => {
    const f = fixture();
    const stop = f.model.observe();
    try {
      await f.model.refresh();
      f.fail(new Error("Stream disconnected"));
      f.call.mockResolvedValueOnce(
        action === "discard"
          ? { kind: "retired" }
          : {
              kind: "state",
              state: { ...claim, generation: 2, detached: false },
            },
      );
      await f.model[action](claim);
      expect(f.model.snapshot().error).toBe("Stream disconnected");
    } finally {
      stop();
    }
  },
);
