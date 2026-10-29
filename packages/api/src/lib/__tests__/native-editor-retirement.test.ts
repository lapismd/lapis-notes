import { expect, it, vi } from "vitest";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import type {
  EditingIntentState,
  NativeEditingIntents,
} from "../native-editing-intents";

function fixture() {
  let contents: string | null = "saved";
  let state: EditingIntentState | undefined;
  let retired = false;
  let retirement: Promise<void> | undefined;
  let dirty = false;
  let failSave = false;
  const commands: string[] = [];
  const port: NativeEditingIntents = {
    async read(path) {
      return contents === null
        ? null
        : { path, text: contents, version: contents };
    },
    async call(command) {
      commands.push(command.kind);
      if (command.kind === "list")
        return { kind: "states", states: state ? [{ ...state }] : [] };
      if (command.kind === "acquire") {
        if (retired) throw new Error("Native editor intent is retired");
        state ??= {
          editor_id: command.editor_id,
          path: command.path,
          generation: 1,
          revision: 0,
          active: true,
          dirty: false,
          detached: false,
        };
      } else if (command.kind === "changed") {
        state!.revision = command.revision;
        state!.dirty = true;
      } else if (command.kind === "yield") {
        expect(command.expected).toEqual(
          contents === null
            ? { kind: "missing" }
            : { kind: "version", version: contents },
        );
        state!.active = false;
        state!.dirty = false;
      } else if (command.kind === "resume") {
        state!.generation = command.generation;
        state!.active = true;
      } else if (command.kind === "retire") {
        await retirement;
        state = undefined;
        retired = true;
        return { kind: "retired" };
      }
      return retired
        ? { kind: "retired" }
        : state
          ? { kind: "state", state: { ...state } }
          : { kind: "missing" };
    },
  };
  const registry = new FileEditingSessionRegistry(port);
  const session = {
    native: { hold: () => () => {}, savedText: () => "saved" },
    get dirty() {
      return dirty;
    },
    async flush() {
      if (failSave) throw new Error("Save failed");
    },
    async protect() {
      return () => {};
    },
  };
  return {
    registry,
    session,
    commands,
    state: () => state,
    current(value: string | null) {
      contents = value;
    },
    dirty(value: boolean) {
      dirty = value;
      failSave = value;
    },
    delayRetirement(value: Promise<void>) {
      retirement = value;
    },
  };
}

it("retires a detached clean document after authoritative external deletion without writing", async () => {
  const f = fixture();
  const registration = f.registry.register("Note.md", f.session);
  await registration.ready();
  f.current(null);
  registration();
  await f.registry.afterMutations(async () => {});
  expect(f.registry.nativeIssues.entries).toEqual([]);
  expect(f.state()).toBeUndefined();
  await expect(f.registry.preflightNativeRecovery()).resolves.toBeUndefined();
});

it("drains already admitted clean retirement before native recovery preflight", async () => {
  const f = fixture();
  const registration = f.registry.register("Note.md", f.session);
  await registration.ready();
  let finish!: () => void;
  f.delayRetirement(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  registration();
  await vi.waitFor(() => expect(f.commands).toContain("retire"));
  let result = "pending";
  const preflight = f.registry.preflightNativeRecovery().then(
    () => {
      result = "clear";
    },
    () => {
      result = "failed";
    },
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(result).toBe("pending");
  finish();
  await preflight;
  expect(result).toBe("clear");
  expect(f.state()).toBeUndefined();
});

it("keeps a detached dirty failure fenced after external deletion", async () => {
  const f = fixture();
  const registration = f.registry.register("Note.md", f.session);
  await registration.ready();
  f.dirty(true);
  registration.changed();
  f.current(null);
  registration();
  await expect(f.registry.dispose()).rejects.toThrow("Save failed");
  expect(f.state()).toMatchObject({ active: true, dirty: true });
  expect(f.commands).not.toContain("retire");
});
