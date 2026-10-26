import { expect, it, vi } from "vitest";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import type {
  EditingIntentCommand,
  EditingIntentState,
  NativeEditingIntents,
} from "../native-editing-intents";

function fixture() {
  let current: string | null = "saved";
  let baseline: string | null = current;
  let state: EditingIntentState | undefined;
  let locks = 0;
  let dirty = false;
  let failRefreshRead = false;
  let failSave = false;
  const commands: EditingIntentCommand[] = [];
  const port: NativeEditingIntents = {
    async read(path) {
      if (failRefreshRead && state!.generation > 1)
        throw new Error("Refresh read failed");
      return current === null
        ? null
        : { path, text: current, version: `v:${current}` };
    },
    async call(command) {
      commands.push(command);
      if (command.kind === "acquire")
        state ??= {
          editor_id: command.editor_id,
          path: command.path,
          generation: 1,
          revision: 0,
          dirty: false,
          active: true,
          detached: false,
        };
      else if (command.kind === "yield") {
        expect(command.expected).toEqual(
          current === null
            ? { kind: "missing" }
            : { kind: "version", version: `v:${current}` },
        );
        state!.active = false;
        state!.dirty = false;
      } else if (command.kind === "resume") {
        state!.active = true;
        state!.generation = command.generation;
      } else if (command.kind === "retire") {
        state = undefined;
        return { kind: "retired" };
      } else if (command.kind === "changed") {
        state!.dirty = true;
        state!.revision = command.revision;
      }
      return state
        ? { kind: "state", state: { ...state } }
        : { kind: "missing" };
    },
  };
  const hold = () => {
    locks++;
    let held = true;
    return () => {
      if (held) {
        held = false;
        locks--;
      }
    };
  };
  const refresh = vi.fn((text: string | null) => {
    expect(locks).toBeGreaterThan(0);
    expect(state?.active).toBe(true);
    baseline = text;
  });
  const session = {
    native: { hold, savedText: () => baseline, refreshSavedText: refresh },
    get dirty() {
      return dirty;
    },
    async flush() {
      if (failSave) throw new Error("Save failed");
    },
    async protect() {
      return hold();
    },
  };
  const registry = new FileEditingSessionRegistry(port);
  const registration = registry.register("note.md", session);
  return {
    registry,
    registration,
    refresh,
    commands,
    state: () => state,
    locks: () => locks,
    baseline: () => baseline,
    current: (text: string | null) => {
      current = text;
    },
    failRead: (value: boolean) => {
      failRefreshRead = value;
    },
    dirty: (value: boolean) => {
      dirty = value;
    },
    failSave: () => {
      failSave = true;
    },
  };
}

it("refreshes after confirmed native rearm while local input stays protected", async () => {
  const f = fixture();
  await f.registration.ready();
  await f.registry.guard("note.md", async () => f.current("native saved"));
  expect(f.refresh).toHaveBeenCalledExactlyOnceWith("native saved");
  expect(f.baseline()).toBe("native saved");
  expect(f.locks()).toBe(0);
  expect(f.state()).toMatchObject({
    generation: 2,
    active: true,
    dirty: false,
  });
});

it("retains failed refresh protection until explicit retry without replaying the mutation", async () => {
  const f = fixture();
  await f.registration.ready();
  const mutate = vi.fn(async () => {
    f.current("native saved");
    f.failRead(true);
  });
  await expect(f.registry.guard("note.md", mutate)).rejects.toThrow(
    "Refresh read failed",
  );
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(f.locks()).toBe(1);
  expect(f.baseline()).toBe("saved");
  expect(f.state()).toMatchObject({ generation: 2, active: true });
  expect(f.registry.nativeIssues.entries).toEqual([
    expect.objectContaining({ phase: "rearm", status: "failed" }),
  ]);
  f.failRead(false);
  await f.registry.guard("note.md", async () => {});
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(f.refresh).toHaveBeenCalledExactlyOnceWith("native saved");
  expect(f.locks()).toBe(0);
  expect(f.registry.nativeIssues.entries).toEqual([]);
});

it("does not accept an out-of-guard saved mismatch during failed admission cleanup", async () => {
  const f = fixture();
  await f.registration.ready();
  f.current("foreign saved");
  const mutation = vi.fn(async () => {});
  await expect(f.registry.guard("note.md", mutation)).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  expect(mutation).not.toHaveBeenCalled();
  expect(f.refresh).not.toHaveBeenCalled();
  expect(f.baseline()).toBe("saved");
  expect(f.state()).toMatchObject({ generation: 1, active: true });
});

it("preserves dirty failed persistence without invoking saved-text refresh", async () => {
  const f = fixture();
  await f.registration.ready();
  f.dirty(true);
  f.failSave();
  const mutation = vi.fn(async () => f.current("unsafe"));
  await expect(f.registry.guard("note.md", mutation)).rejects.toThrow(
    "Save failed",
  );
  expect(mutation).not.toHaveBeenCalled();
  expect(f.refresh).not.toHaveBeenCalled();
  expect(f.commands.some((command) => command.kind === "yield")).toBe(false);
});

it("retains expected absence after an admitted delete without inventing empty text", async () => {
  const f = fixture();
  await f.registration.ready();
  await f.registry.guard("note.md", async () => f.current(null));
  expect(f.refresh).toHaveBeenCalledExactlyOnceWith(null);
  expect(f.baseline()).toBeNull();
  f.registration();
  await f.registry.afterMutations(async () => {});
  expect(
    f.commands.some(
      (command) =>
        command.kind === "yield" && command.expected.kind === "missing",
    ),
  ).toBe(true);
  expect(f.state()).toBeUndefined();
});
