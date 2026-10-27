import { expect, it, vi } from "vitest";
import { Editor } from "../editor.svelte";
import { EventDispatcher } from "../events";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";
import type {
  EditingIntentState,
  NativeEditingIntents,
} from "../native-editing-intents";

async function fixture() {
  const adapter = new MemoryVaultAdapter({ "note.md": "saved" });
  const write = vi.fn(
    async (path: string, text: string, expected: string | null) => {
      if ((await adapter.read(path)) !== expected)
        throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
      await adapter.write(path, text);
    },
  );
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    writeTextIfUnchanged: write,
  });
  let state: EditingIntentState | undefined;
  let failReads = 0;
  const port: NativeEditingIntents = {
    async read(path) {
      if (failReads > 0) {
        failReads--;
        throw new Error("Observed saved-text read failed");
      }
      const text = await adapter.read(path);
      return { path, text, version: `version:${text}` };
    },
    async call(command) {
      if (command.kind === "list")
        return { kind: "states", states: state ? [{ ...state }] : [] };
      if (command.kind === "acquire")
        state ??= {
          editor_id: command.editor_id,
          path: command.path,
          generation: 1,
          revision: 0,
          active: true,
          dirty: false,
          detached: false,
        };
      else if (command.kind === "yield") {
        expect(command.expected).toEqual({
          kind: "version",
          version: `version:${await adapter.read("note.md")}`,
        });
        state!.active = false;
        state!.dirty = false;
      } else if (command.kind === "resume") {
        state!.active = true;
        state!.generation = command.generation;
      } else if (command.kind === "retire") {
        state = undefined;
        return { kind: "retired" };
      } else if (command.kind === "changed") {
        state!.revision = command.revision;
        state!.dirty = true;
      }
      return state
        ? { kind: "state", state: { ...state } }
        : { kind: "missing" };
    },
  };
  const registry = new FileEditingSessionRegistry(port);
  const vault = new Vault(adapter);
  await vault.load();
  const measure = (_name: string, run: (span: any) => unknown) =>
    run({ setAttribute: vi.fn() });
  const workspace = Object.assign(new EventDispatcher(), { dispatch: vi.fn() });
  const app = {
    vault,
    workspace,
    fileEditingSessions: registry,
    telemetry: { measure, measureAsync: measure },
  } as any;
  const editor = new Editor("saved", [], app);
  const file = vault.getFileByPath("note.md")!;
  await editor.loadDocument(file, () => vault.read(file));
  return {
    adapter,
    write,
    registry,
    editor,
    file,
    workspace,
    state: () => state,
    failReadOnce: () => {
      failReads = 1;
    },
  };
}

it("reconciles a clean real editor's authoritative saved bytes in-guard before yielding", async () => {
  const f = await fixture();
  const stop = f.editor.trackChanges();
  const identity = f.state()!.editor_id;
  const mutation = vi.fn(async () => {
    // Protection is held across the in-guard saved-text observation.
    expect(f.editor.editingProtected).toBe(true);
    expect(f.editor.getValue()).toBe("external saved text");
    f.editor.view.dispatch({ changes: { from: 0, insert: "blocked" } });
    expect(f.editor.getValue()).toBe("external saved text");
  });
  try {
    await f.adapter.write("note.md", "external saved text");
    await f.registry.guard("note.md", mutation);
    expect(mutation).toHaveBeenCalledOnce();
    expect(f.editor.editingProtected).toBe(false);
    expect(f.editor.hasUnsavedChanges).toBe(false);
    expect(f.registry.nativeIssues.entries).toEqual([]);
    expect(f.state()).toMatchObject({
      editor_id: identity,
      generation: 2,
      active: true,
      dirty: false,
    });
    // The reconciled producer stays an ordinary editable surface afterwards.
    f.editor.view.dispatch({ changes: { from: 0, insert: "next " } });
    expect(f.editor.getValue()).toBe("next external saved text");
    expect(f.write).not.toHaveBeenCalled();
    expect(await f.adapter.read("note.md")).toBe("external saved text");
    await f.registry.preflightNativeRecovery();
  } finally {
    stop();
    await f.editor.dispose();
    await f.registry.dispose();
  }
});

it("keeps an unacknowledgeable clean editor fenced until file observation and explicit handoff retry", async () => {
  const f = await fixture();
  const stop = f.editor.trackChanges();
  const mutation = vi.fn(async () => {});
  const identity = f.state()!.editor_id;
  try {
    await f.adapter.write("note.md", "external saved text");
    // A failed protected observation cannot acknowledge the drift, so the
    // original saved-baseline comparison keeps the handoff fenced.
    f.failReadOnce();
    await expect(f.registry.guard("note.md", mutation)).rejects.toMatchObject({
      code: "ECONFLICT",
    });
    expect(f.editor.editingProtected).toBe(true);
    expect(f.registry.nativeIssues.entries[0]).toMatchObject({
      phase: "handoff",
      status: "failed",
    });
    f.editor.view.dispatch({ changes: { from: 0, insert: "blocked" } });
    expect(f.editor.getValue()).toBe("saved");
    expect(f.state()).toMatchObject({
      editor_id: identity,
      generation: 1,
      active: true,
      dirty: false,
    });
    f.workspace.trigger("file-change", f.file, "modify");
    await vi.waitFor(() =>
      expect(f.editor.getValue()).toBe("external saved text"),
    );
    expect(f.editor.editingProtected).toBe(true);
    expect(f.editor.hasUnsavedChanges).toBe(false);
    await f.registry.nativeIssues.retry(f.registry.nativeIssues.entries[0]!);
    expect(f.editor.editingProtected).toBe(false);
    expect(f.registry.nativeIssues.entries).toEqual([]);
    expect(f.state()).toMatchObject({
      editor_id: identity,
      active: true,
      dirty: false,
    });
    expect(mutation).not.toHaveBeenCalled();
    expect(f.write).not.toHaveBeenCalled();
    expect(await f.adapter.read("note.md")).toBe("external saved text");
    await f.registry.preflightNativeRecovery();
  } finally {
    stop();
    await f.editor.dispose();
    await f.registry.dispose();
  }
});
