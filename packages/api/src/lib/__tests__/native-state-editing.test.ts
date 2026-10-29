import { expect, it, vi } from "vitest";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { FileTextStateWriter } from "../file-text-state-writer";
import { NativeRegisteredEditingSession } from "../native-editing-session";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";
import type { App } from "../context.svelte";
import type {
  EditingIntentState,
  NativeEditingIntents,
} from "../native-editing-intents";

const path = ".lapis/app.json";

async function shared() {
  let contents = "{}";
  const states = new Map<string, EditingIntentState & { owner: string }>();
  const retired = new Set<string>();
  const commands: string[] = [];
  const writes = vi.fn();
  let failYield = false;
  let failInspect = false;
  const create = async (owner: string) => {
    const port: NativeEditingIntents = {
      async read(file) {
        return { path: file, text: contents, version: contents };
      },
      async call(command) {
        commands.push(command.kind);
        if (command.kind === "list")
          return { kind: "states", states: [...states.values()] };
        if (!("editor_id" in command))
          throw new Error("Unused recovery command");
        if (command.kind === "acquire")
          states.set(command.editor_id, {
            editor_id: command.editor_id,
            path: command.path,
            owner,
            generation: 1,
            revision: 0,
            active: true,
            dirty: false,
            detached: false,
          });
        const state = states.get(command.editor_id);
        if (state && state.owner !== owner) throw new Error("Foreign editor");
        if (command.kind === "changed") {
          state!.revision = command.revision;
          state!.dirty = true;
        } else if (command.kind === "yield") {
          expect(state!.revision).toBe(command.revision);
          state!.active = false;
          state!.dirty = false;
          if (failYield) {
            failYield = false;
            throw new Error("Lost yield reply");
          }
        } else if (command.kind === "resume") {
          state!.generation = command.generation;
          state!.active = true;
        } else if (command.kind === "retire") {
          expect(state!.active || state!.dirty).toBe(false);
          states.delete(command.editor_id);
          retired.add(command.editor_id);
          return { kind: "retired" };
        } else if (command.kind === "inspect" && failInspect) {
          failInspect = false;
          throw new Error("Inspection unavailable");
        }
        if (retired.has(command.editor_id)) return { kind: "retired" };
        return state
          ? { kind: "state", state: { ...state } }
          : { kind: "missing" };
      },
    };
    const adapter = new MemoryVaultAdapter({ [path]: contents });
    Object.assign(adapter, {
      getCapabilities: () => ({ conditionalTextWrite: true }),
      async read() {
        return contents;
      },
      async writeTextIfUnchanged(
        _file: string,
        next: string,
        expected: string,
      ) {
        if (
          [...states.values()].some(
            (entry) => entry.owner !== owner && (entry.active || entry.dirty),
          )
        )
          throw Object.assign(new Error("Foreign writer is protected"), {
            code: "EBUSY",
          });
        if (contents !== expected)
          throw Object.assign(new Error("State changed"), {
            code: "ECONFLICT",
          });
        writes(next);
        contents = next;
      },
    });
    const vault = new Vault(adapter);
    await vault.load();
    const app = {
      vault,
      fileEditingSessions: new FileEditingSessionRegistry(port),
    } as unknown as App;
    const writer = new FileTextStateWriter(
      app,
      vault.getFileByPath(path)!,
      contents,
      () => {},
    );
    return { app, writer, port };
  };
  return {
    create,
    states,
    commands,
    writes,
    contents: () => contents,
    external(next: string) {
      contents = next;
    },
    loseYield() {
      failYield = true;
      failInspect = true;
    },
  };
}

it("lets a second idle App coexist while ordinary state saves retain scoped native ownership", async () => {
  const f = await shared();
  const first = await f.create("first");
  const second = await f.create("second");
  await first.writer.set('{"first":true}');
  expect(
    [...f.states.values()].some((state) => state.active || state.dirty),
  ).toBe(false);
  expect(second.writer.acceptBaseline(f.contents())).toBe(true);
  await second.writer.set('{"first":true,"second":true}');
  expect(f.contents()).toBe('{"first":true,"second":true}');
  expect(
    [...f.states.values()].some((state) => state.active || state.dirty),
  ).toBe(false);
  first.writer.dispose();
  second.writer.dispose();
  await first.app.fileEditingSessions.dispose();
  await second.app.fileEditingSessions.dispose();
});

it("keeps clean state idle across protected guards and reuses one native identity", async () => {
  const f = await shared();
  const { app, writer } = await f.create("owner");
  await app.fileEditingSessions.guard(path, async () => {});
  expect(f.commands).not.toContain("acquire");
  await writer.set('{"one":1}');
  const [id] = f.states.keys();
  await app.fileEditingSessions.guard(path, async () => {
    expect(f.states.get(id)?.active).toBe(false);
    f.external('{"external":true}');
  });
  expect(f.states.get(id)?.active).toBe(false);
  expect(writer.acceptBaseline(f.contents())).toBe(true);
  await writer.set('{"two":2}');
  expect([...f.states.keys()]).toEqual([id]);
  expect(f.states.get(id)).toMatchObject({ active: false, dirty: false });
  expect(f.commands.filter((command) => command === "acquire")).toHaveLength(1);
  writer.dispose();
  await app.fileEditingSessions.dispose();
});

it("reconciles a lost idle acknowledgement before another logical change without replaying saved bytes", async () => {
  const f = await shared();
  const { app, writer } = await f.create("owner");
  f.loseYield();
  const acknowledged = vi.fn();
  await expect(
    writer.update(() => ({ contents: '{"one":1}', onSaved: acknowledged })),
  ).rejects.toThrow("Lost yield reply");
  expect(f.writes).toHaveBeenCalledTimes(1);
  expect(acknowledged).toHaveBeenCalledTimes(1);
  await writer.flush();
  expect(f.writes).toHaveBeenCalledTimes(1);
  expect(acknowledged).toHaveBeenCalledTimes(1);
  await writer.set('{"two":2}');
  expect(f.writes.mock.calls).toEqual([['{"one":1}'], ['{"two":2}']]);
  expect([...f.states.values()][0]).toMatchObject({
    active: false,
    dirty: false,
  });
  writer.dispose();
  await app.fileEditingSessions.dispose();
});

it("keeps foreign editor fences and retains failed state persistence until explicit recovery", async () => {
  const f = await shared();
  const foreign = await f.create("foreign");
  const local = await f.create("local");
  const editor = crypto.randomUUID();
  await foreign.port.call({ kind: "acquire", editor_id: editor, path });
  await expect(local.writer.set('{"draft":true}')).rejects.toMatchObject({
    code: "EBUSY",
  });
  expect(local.app.fileEditingSessions.hasDirty(path)).toBe(true);
  expect(f.writes).not.toHaveBeenCalled();
  expect(
    [...f.states.values()].find((state) => state.owner === "local"),
  ).toMatchObject({ active: true, dirty: true });
  await foreign.port.call({
    kind: "yield",
    editor_id: editor,
    generation: 1,
    revision: 0,
    expected: { kind: "version", version: "{}" },
  });
  await foreign.port.call({ kind: "retire", editor_id: editor, generation: 1 });
  await local.app.fileEditingSessions.textConflicts.entries[0].resolve(
    "keep-local",
  );
  expect(f.contents()).toBe('{"draft":true}');
  expect(
    [...f.states.values()].some((state) => state.active || state.dirty),
  ).toBe(false);
  foreign.writer.dispose();
  local.writer.dispose();
  await foreign.app.fileEditingSessions.dispose();
  await local.app.fileEditingSessions.dispose();
});

it("observes pending and failed admission passively and clears it after explicit reconciliation", async () => {
  const f = await shared();
  const { port, writer, app } = await f.create("owner");
  const call = port.call.bind(port);
  let fail = true;
  let completeAdmission!: () => void;
  const admission = new Promise<void>((resolve) => {
    completeAdmission = resolve;
  });
  port.call = async (command) => {
    if (command.kind === "acquire" && fail) {
      fail = false;
      await admission;
      throw new Error("Admission unavailable");
    }
    return call(command);
  };
  let retiring = false;
  const session = new NativeRegisteredEditingSession(
    {
      dirty: false,
      native: { hold: () => () => {}, savedText: () => f.contents() },
      flush: async () => {},
      protect: async () => () => {},
    },
    port,
    path,
    () => retiring,
  );
  expect(session.issue).toMatchObject({
    phase: "admission",
    status: "pending",
  });
  const pending = session.issue;
  const observed = vi.fn();
  const before = [...f.commands];
  const unsubscribe = session.subscribe(observed);
  await Promise.resolve();
  expect(session.issue).toBe(pending);
  expect(f.commands).toEqual(before);
  completeAdmission();
  await vi.waitFor(() => expect(session.issue?.status).toBe("failed"));
  const failed = session.issue!;
  const calls = [...f.commands];
  expect(session.issue).toBe(failed);
  expect(f.commands).toEqual(calls);
  await session.ready();
  expect(session.issue).toBeUndefined();
  expect(failed.status).toBe("failed");
  expect(observed).toHaveBeenCalled();
  retiring = true;
  const release = await session.protect();
  await session.flush();
  await release();
  unsubscribe();
  writer.dispose();
  await app.fileEditingSessions.dispose();
});
