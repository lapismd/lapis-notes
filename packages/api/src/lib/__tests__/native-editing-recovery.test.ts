import { afterEach, describe, expect, it, vi } from "vitest";
import { NativeEditingRecovery } from "../native-editing-recovery";
import type {
  EditingIntentState,
  EditingIntentValue,
  NativeEditingIntents,
} from "../native-editing-intents";

const claim = (
  overrides: Partial<EditingIntentState> = {},
): EditingIntentState => ({
  editor_id: "detached-claim",
  path: "Note.md",
  generation: 2,
  revision: 4,
  dirty: true,
  active: true,
  detached: true,
  ...overrides,
});

function fixture(initial = [claim()]) {
  let states = initial.map((state) => ({ ...state }));
  let failList = false;
  let lose: "recover" | "discard" | undefined;
  const retired = new Set<string>();
  const call = vi.fn<NativeEditingIntents["call"]>(async (command) => {
    if (command.kind === "list") {
      if (failList) throw new Error("Offline");
      return { kind: "states", states: states.map((state) => ({ ...state })) };
    }
    const state = states.find((state) => state.editor_id === command.editor_id);
    if (command.kind === "inspect") {
      if (retired.has(command.editor_id)) return { kind: "retired" };
      return state && !state.detached
        ? { kind: "state", state: { ...state } }
        : { kind: "missing" };
    }
    if (command.kind !== "recover" && command.kind !== "discard")
      throw new Error("Unexpected mutation");
    if (
      !state ||
      state.generation !== command.generation ||
      state.revision !== command.revision
    )
      throw new Error("Stale claim");
    let value: EditingIntentValue;
    if (command.kind === "recover") {
      state.detached = false;
      state.generation++;
      value = { kind: "state", state: { ...state } };
    } else {
      states = states.filter((candidate) => candidate !== state);
      retired.add(state.editor_id);
      value = { kind: "retired" };
    }
    if (lose === command.kind) throw new Error("Lost acknowledgement");
    return value;
  });
  const read = vi.fn<NativeEditingIntents["read"]>();
  const track = vi.fn(async <T>(operation: () => Promise<T>) => operation());
  const model = new NativeEditingRecovery({ call, read }, track);
  return {
    model,
    call,
    read,
    track,
    set states(value: EditingIntentState[]) {
      states = value;
    },
    set failList(value: boolean) {
      failList = value;
    },
    set lose(value: "recover" | "discard") {
      lose = value;
    },
  };
}

afterEach(() => vi.useRealTimers());

describe("passive native editing recovery", () => {
  it("construction and passive subscription perform no native work", () => {
    const { model, call } = fixture();
    const stop = model.subscribe(vi.fn());
    expect(call).not.toHaveBeenCalled();
    expect(model.snapshot().claims).toEqual([]);
    stop();
  });

  it("lists detached claims while omitting another live writer", async () => {
    const { model, call } = fixture([
      claim(),
      claim({ editor_id: "live", detached: false }),
    ]);
    await model.refresh();
    expect(model.snapshot().claims).toEqual([claim()]);
    expect(call.mock.calls.map(([command]) => command.kind)).toEqual(["list"]);
  });

  it("rejects a stale captured action before native mutation", async () => {
    const f = fixture();
    await f.model.refresh();
    const captured = f.model.snapshot().claims[0]!;
    f.states = [claim({ revision: 5 })];
    await f.model.refresh();
    await expect(f.model.discard(captured)).rejects.toThrow("changed");
    expect(f.call.mock.calls.map(([command]) => command.kind)).toEqual([
      "list",
      "list",
    ]);
  });

  it("recovers the exact claim and retains adopted dirty metadata", async () => {
    const f = fixture();
    await f.model.refresh();
    await f.model.recover(f.model.snapshot().claims[0]!);
    await f.model.refresh();
    expect(f.model.snapshot().claims).toEqual([
      claim({ generation: 3, detached: false }),
    ]);
    expect(f.call).toHaveBeenCalledWith({
      kind: "recover",
      editor_id: "detached-claim",
      generation: 2,
      revision: 4,
    });
    expect(f.track).toHaveBeenCalledOnce();
    expect(f.read).not.toHaveBeenCalled();
  });

  it("reconciles a lost recovery reply by inspect without replay", async () => {
    const f = fixture();
    f.lose = "recover";
    await f.model.refresh();
    await f.model.recover(f.model.snapshot().claims[0]!);
    expect(f.call.mock.calls.map(([command]) => command.kind)).toEqual([
      "list",
      "recover",
      "inspect",
    ]);
    expect(f.model.snapshot().claims[0]?.generation).toBe(3);
  });

  it("reconciles terminal discard without content IO or mutation retry", async () => {
    const f = fixture();
    f.lose = "discard";
    await f.model.refresh();
    await f.model.discard(f.model.snapshot().claims[0]!);
    expect(f.model.snapshot().claims).toEqual([]);
    expect(f.call.mock.calls.map(([command]) => command.kind)).toEqual([
      "list",
      "discard",
      "inspect",
    ]);
    expect(f.read).not.toHaveBeenCalled();
  });

  it("keeps unresolved records visible when observation fails", async () => {
    const f = fixture();
    await f.model.refresh();
    f.failList = true;
    await expect(f.model.refresh()).rejects.toThrow("Offline");
    expect(f.model.snapshot().claims).toEqual([claim()]);
    expect(f.model.snapshot().error).toBe("Offline");
  });

  it("preflights retained claims without recovering or discarding them", async () => {
    const f = fixture();
    await expect(f.model.assertClear()).rejects.toThrow("Problems");
    expect(f.call.mock.calls.map(([command]) => command.kind)).toEqual([
      "list",
    ]);
    await f.model.discard(f.model.snapshot().claims[0]!);
    await expect(f.model.assertClear()).resolves.toBeUndefined();
  });

  it("does not overwrite a confirmed transition with an older list response", async () => {
    const f = fixture();
    await f.model.refresh();
    let finish!: (value: EditingIntentValue) => void;
    f.call.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const staleRead = f.model.refresh();
    await f.model.recover(f.model.snapshot().claims[0]!);
    finish({ kind: "states", states: [claim()] });
    await staleRead;
    expect(f.model.snapshot().claims).toEqual([
      claim({ generation: 3, detached: false }),
    ]);
  });

  it("retains uncertainty when read-only inspection cannot prove recovery", async () => {
    const f = fixture();
    await f.model.refresh();
    f.call.mockRejectedValueOnce(new Error("Connection lost"));
    f.call.mockResolvedValueOnce({ kind: "missing" });
    await expect(
      f.model.recover(f.model.snapshot().claims[0]!),
    ).rejects.toThrow("Connection lost");
    expect(f.model.snapshot().claims).toEqual([claim()]);
    expect(f.model.snapshot().error).toBe("Connection lost");
    expect(f.call.mock.calls.map(([command]) => command.kind)).toEqual([
      "list",
      "recover",
      "inspect",
    ]);
  });

  it("shares one observer and fences publication after final unmount", async () => {
    vi.useFakeTimers();
    const f = fixture();
    const first = f.model.observe();
    const second = f.model.observe();
    await vi.advanceTimersByTimeAsync(0);
    expect(f.call).toHaveBeenCalledTimes(1);
    first();
    await vi.advanceTimersByTimeAsync(1000);
    expect(f.call).toHaveBeenCalledTimes(2);
    let finish!: (value: EditingIntentValue) => void;
    f.call.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await vi.advanceTimersByTimeAsync(1000);
    second();
    finish({ kind: "states", states: [claim({ revision: 99 })] });
    await Promise.resolve();
    expect(f.model.snapshot().claims).toEqual([claim()]);
    await vi.advanceTimersByTimeAsync(5000);
    expect(f.call).toHaveBeenCalledTimes(3);
  });
});
