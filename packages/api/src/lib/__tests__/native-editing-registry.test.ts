import { describe, expect, it, vi } from "vitest";
import { Editor } from "../editor.svelte";
import { EventDispatcher } from "../events";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";
import { mutateFileText } from "../file-text-mutation";
import { FileTextStateWriter } from "../file-text-state-writer";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import type {
  EditingIntentCommand,
  EditingIntentState,
  EditingIntentValue,
  NativeEditingIntents,
} from "../native-editing-intents";

function fixture() {
  const events: string[] = [];
  let text: string | null = "saved",
    locks = 0,
    dirty = false,
    failSave = false;
  let state: EditingIntentState | undefined;
  let retired = false;
  const failed = new Set<string>();
  let fail: string | undefined, lose: string | undefined;
  let acquire: Promise<void> | undefined;
  const port: NativeEditingIntents = {
    async read(path) {
      return text === null ? null : { path, text, version: `version:${text}` };
    },
    async call(command: EditingIntentCommand): Promise<EditingIntentValue> {
      events.push(command.kind);
      if (fail === command.kind && !failed.has(command.kind)) {
        failed.add(command.kind);
        throw new Error(`failed ${command.kind}`);
      }
      if (command.kind === "acquire") {
        await acquire;
        state ??= {
          editor_id: command.editor_id,
          path: command.path,
          generation: 1,
          revision: 0,
          dirty: false,
          active: true,
          detached: false,
        };
      } else if (command.kind === "changed") {
        state!.dirty = true;
        state!.revision = command.revision;
      } else if (command.kind === "yield") {
        if (command.revision !== state!.revision)
          throw new Error("stale revision");
        state!.active = false;
        state!.dirty = false;
      } else if (command.kind === "resume") {
        state!.active = true;
        state!.generation = command.generation;
      } else if (command.kind === "retire") {
        retired = true;
        state = undefined;
      }
      if (lose === command.kind && !failed.has(command.kind)) {
        failed.add(command.kind);
        throw new Error(`lost ${command.kind}`);
      }
      if (retired) return { kind: "retired" };
      if (command.kind === "list")
        return { kind: "states", states: state ? [state] : [] };
      return state
        ? { kind: "state", state: { ...state } }
        : { kind: "missing" };
    },
  };
  const registry = new FileEditingSessionRegistry(port);
  const hold = () => {
    locks++;
    let held = true;
    return () => {
      if (held) {
        held = false;
        locks--;
        events.push("unlock");
      }
    };
  };
  const session = {
    native: { hold, savedText: () => text },
    get dirty() {
      return dirty;
    },
    async flush() {
      events.push("flush");
      if (failSave) throw new Error("save failed");
      dirty = false;
    },
    async protect() {
      return hold();
    },
  };
  return {
    registry,
    port,
    session,
    events,
    get state() {
      return state;
    },
    get locks() {
      return locks;
    },
    set dirty(value: boolean) {
      dirty = value;
    },
    set failSave(value: boolean) {
      failSave = value;
    },
    set fail(value: string | undefined) {
      fail = value;
    },
    set lose(value: string | undefined) {
      lose = value;
    },
    set acquire(value: Promise<void> | undefined) {
      acquire = value;
    },
    set text(value: string | null) {
      text = value;
    },
  };
}

describe("native editing registry", () => {
  it("holds editing synchronously until native admission is proven", async () => {
    const f = fixture();
    let admit!: () => void;
    f.acquire = new Promise((resolve) => {
      admit = resolve;
    });
    const registration = f.registry.register("note.md", f.session);
    expect(f.locks).toBe(1);
    const pending = registration.ready();
    await Promise.resolve();
    expect(f.locks).toBe(1);
    admit();
    await pending;
    expect(f.state).toMatchObject({ active: true, dirty: false });
    expect(f.locks).toBe(0);
  });

  it("yields only after protected flush and rearms before enabling edits", async () => {
    const f = fixture();
    const registration = f.registry.register("note.md", f.session);
    await registration.ready();
    f.dirty = true;
    registration.changed();
    await f.registry.guard("note.md", async () => {
      f.events.push("mutate");
      expect(f.state).toMatchObject({ active: false, dirty: false });
      expect(f.locks).toBe(1);
    });
    expect(f.state).toMatchObject({ active: true, generation: 2, revision: 1 });
    expect(f.events.indexOf("flush")).toBeLessThan(f.events.indexOf("yield"));
    expect(f.events.indexOf("yield")).toBeLessThan(f.events.indexOf("mutate"));
    expect(f.events.lastIndexOf("resume")).toBeLessThan(
      f.events.lastIndexOf("unlock"),
    );
  });

  it("keeps the newer dirty revision and never yields an unflushed writer", async () => {
    const f = fixture();
    const registration = f.registry.register("note.md", f.session);
    await registration.ready();
    f.dirty = true;
    registration.changed();
    registration.changed();
    f.failSave = true;
    let called = false;
    await expect(
      f.registry.guard("note.md", async () => {
        called = true;
      }),
    ).rejects.toThrow("save failed");
    expect(called).toBe(false);
    expect(f.state).toMatchObject({ active: true, dirty: true, revision: 2 });
    expect(f.events).not.toContain("yield");
  });

  it("retains detached failures until protected clean retirement", async () => {
    const f = fixture();
    const registration = f.registry.register("note.md", f.session);
    await registration.ready();
    f.dirty = true;
    registration.changed();
    registration();
    f.failSave = true;
    await expect(f.registry.dispose()).rejects.toThrow("save failed");
    expect(f.state?.active).toBe(true);
    f.failSave = false;
    await f.registry.dispose();
    expect(f.state).toBeUndefined();
    expect(f.events).toContain("retire");
    expect(f.locks).toBe(0);
  });

  it("keeps local protection after failed rearm and repairs before another mutation", async () => {
    const f = fixture();
    const registration = f.registry.register("note.md", f.session);
    await registration.ready();
    f.fail = "resume";
    await expect(f.registry.guard("note.md", async () => {})).rejects.toThrow(
      "failed resume",
    );
    expect(f.state?.active).toBe(false);
    expect(f.locks).toBe(1);
    let called = false;
    await f.registry.guard("note.md", async () => {
      called = true;
    });
    expect(called).toBe(true);
    expect(f.locks).toBe(0);
    expect(f.state).toMatchObject({ active: true, generation: 3 });
  });

  it("reconciles an applied lost admission reply without a second identity", async () => {
    const f = fixture();
    f.lose = "acquire";
    const registration = f.registry.register("note.md", f.session);
    await registration.ready();
    expect(f.events.filter((event) => event === "acquire")).toHaveLength(1);
    expect(f.events).toContain("inspect");
    expect(f.state?.active).toBe(true);
    expect(f.locks).toBe(0);
  });

  it("keeps failed initial admission protected and permits an explicit ready retry", async () => {
    const f = fixture();
    f.fail = "acquire";
    const registration = f.registry.register("note.md", f.session);
    await expect(registration.ready()).rejects.toThrow("failed acquire");
    expect(f.locks).toBe(1);
    await registration.ready();
    expect(f.state?.active).toBe(true);
    expect(f.locks).toBe(0);
  });

  it("reports the retained dirty generation after failed initial admission is retried", async () => {
    const f = fixture();
    f.dirty = true;
    f.fail = "acquire";
    const registration = f.registry.register("note.md", f.session);
    await expect(registration.ready()).rejects.toThrow("failed acquire");
    await registration.ready();
    await vi.waitFor(() =>
      expect(f.state).toMatchObject({ active: true, dirty: true, revision: 1 }),
    );
  });

  it("retires a clean detached writer asynchronously before removing ownership", async () => {
    const f = fixture();
    const registration = f.registry.register("note.md", f.session);
    await registration.ready();
    registration();
    await f.registry.afterMutations(async () => {});
    expect(f.state).toBeUndefined();
    expect(f.events.indexOf("yield")).toBeLessThan(f.events.indexOf("retire"));
    expect(f.locks).toBe(0);
  });

  it("uses a missing snapshot without inventing empty file content", async () => {
    const f = fixture();
    f.text = null;
    const registration = f.registry.register("new.md", f.session);
    await registration.ready();
    await f.registry.guard("new.md", async () => {});
    expect(f.state).toMatchObject({ active: true, generation: 2 });
  });

  it("keeps uncertain applied rearm protected until read-only reconciliation", async () => {
    const f = fixture();
    const registration = f.registry.register("note.md", f.session);
    await registration.ready();
    f.lose = "resume";
    f.fail = "inspect";
    await expect(f.registry.guard("note.md", async () => {})).rejects.toThrow(
      "lost resume",
    );
    expect(f.state).toMatchObject({ active: true, generation: 2 });
    expect(f.locks).toBe(1);
    await f.registry.guard("note.md", async () => {});
    expect(f.locks).toBe(0);
    expect(f.state).toMatchObject({ active: true, generation: 3 });
  });

  it("refuses stale acknowledged bytes before yielding the native fence", async () => {
    const f = fixture();
    f.session.native.savedText = () => "saved";
    const registration = f.registry.register("note.md", f.session);
    await registration.ready();
    f.text = "external version";
    let called = false;
    await expect(
      f.registry.guard("note.md", async () => {
        called = true;
      }),
    ).rejects.toMatchObject({ code: "ECONFLICT" });
    expect(called).toBe(false);
    expect(f.events).not.toContain("yield");
    expect(f.state?.active).toBe(true);
  });
});

async function editorFixture() {
  const native = fixture();
  const adapter = new MemoryVaultAdapter({ "note.md": "saved" });
  let fail = false;
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    async writeTextIfUnchanged(
      path: string,
      text: string,
      expected: string | null,
    ) {
      if (fail) throw new Error("real save failed");
      if ((await adapter.read(path)) !== expected)
        throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
      await adapter.write(path, text);
      native.text = text;
    },
  });
  const vault = new Vault(adapter);
  await vault.load();
  const measure = (_name: string, run: (span: any) => unknown) =>
    run({ setAttribute: vi.fn() });
  const app = {
    vault,
    fileEditingSessions: native.registry,
    workspace: Object.assign(new EventDispatcher(), { dispatch: vi.fn() }),
    telemetry: { measure, measureAsync: measure },
  } as any;
  const editor = new Editor("saved", [], app);
  const file = vault.getFileByPath("note.md")!;
  return {
    native,
    adapter,
    app,
    editor,
    file,
    setFail: (value: boolean) => {
      fail = value;
    },
  };
}

describe("actual App writer producers", () => {
  it("drains an admitted state update before native clean retirement", async () => {
    const f = await editorFixture();
    let admit!: () => void;
    f.native.acquire = new Promise((resolve) => {
      admit = resolve;
    });
    const writer = new FileTextStateWriter(f.app, f.file, "saved", () => {});
    const setting = writer.set("state update");
    let settled = false;
    const settling = f.native.registry.settleOperations().then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(await f.adapter.read("note.md")).toBe("saved");
    admit();
    await setting;
    await settling;
    expect(await f.adapter.read("note.md")).toBe("state update");
    writer.dispose();
    await f.native.registry.afterMutations(async () => {});
    expect(f.native.state).toBeUndefined();
    await f.editor.dispose();
    await f.native.registry.dispose();
  });
  it("fences real CodeMirror typing before native admission and yields its saved generation", async () => {
    const f = await editorFixture();
    let admit!: () => void;
    f.native.acquire = new Promise((resolve) => {
      admit = resolve;
    });
    try {
      const loading = f.editor.loadDocument(f.file, () =>
        f.app.vault.read(f.file),
      );
      f.editor.view.dispatch({ changes: { from: 0, to: 5, insert: "unsafe" } });
      expect(f.editor.editingProtected).toBe(true);
      expect(f.editor.getValue()).toBe("saved");
      admit();
      await loading;
      expect(f.editor.editingProtected).toBe(false);
      f.editor.view.dispatch({
        changes: { from: 0, to: 5, insert: "latest draft" },
      });
      await f.native.registry.guard("note.md", async () => {
        expect(f.editor.editingProtected).toBe(true);
        expect(f.native.state).toMatchObject({
          active: false,
          dirty: false,
          revision: 1,
        });
        expect(await f.adapter.read("note.md")).toBe("latest draft");
      });
      expect(f.editor.editingProtected).toBe(false);
      expect(f.native.state).toMatchObject({ active: true, generation: 2 });
    } finally {
      admit();
      await f.editor.dispose();
      await f.native.registry.dispose();
    }
    expect(f.native.state).toBeUndefined();
  });

  it("retains a failed destroyed editor and its native dirty claim until recovery", async () => {
    const f = await editorFixture();
    await f.editor.loadDocument(f.file, () => f.app.vault.read(f.file));
    f.editor.view.dispatch({
      changes: { from: 0, to: 5, insert: "retained draft" },
    });
    f.setFail(true);
    await expect(f.editor.dispose()).rejects.toThrow("real save failed");
    await expect(f.native.registry.dispose()).rejects.toThrow();
    expect(f.native.state).toMatchObject({ active: true, dirty: true });
    expect(await f.adapter.read("note.md")).toBe("saved");
    f.setFail(false);
    await f.native.registry.dispose();
    expect(await f.adapter.read("note.md")).toBe("retained draft");
    expect(f.native.state).toBeUndefined();
  });

  it("retires the existing one-shot conditional writer without adding another persistence path", async () => {
    const f = await editorFixture();
    await mutateFileText(f.app, f.file, async (text) => `${text}\n- [ ] task`);
    await f.native.registry.afterMutations(async () => {});
    expect(await f.adapter.read("note.md")).toBe("saved\n- [ ] task");
    expect(f.native.events).toContain("retire");
    expect(f.native.state).toBeUndefined();
    await f.editor.dispose();
    await f.native.registry.dispose();
  });

  it("retains the one-shot writer when initial native admission fails before transformation", async () => {
    const f = await editorFixture();
    f.native.fail = "acquire";
    const transform = vi.fn(
      async (text: string) => `${text}\n- [ ] retained task`,
    );
    await expect(mutateFileText(f.app, f.file, transform)).rejects.toThrow(
      "failed acquire",
    );
    expect(transform).not.toHaveBeenCalled();
    expect(f.native.registry.hasDirty("note.md")).toBe(true);
    expect(await f.adapter.read("note.md")).toBe("saved");
    await f.native.registry.flush("note.md");
    await f.native.registry.afterMutations(async () => {});
    expect(transform).toHaveBeenCalledTimes(1);
    expect(await f.adapter.read("note.md")).toBe("saved\n- [ ] retained task");
    expect(f.native.state).toBeUndefined();
    await f.editor.dispose();
    await f.native.registry.dispose();
  });
});
