import type { MemoryVaultAdapter } from "@lapis-notes/api";
import type {
  EditingIntentState,
  NativeEditingIntents,
} from "@lapis-notes/api/native-editing-intents";

/** Disposable transport fixture; production authority remains the Rust service. */
export function editingRecoveryPort(
  adapter: MemoryVaultAdapter,
  scenario: "detached" | "admission" | "handoff",
) {
  const states = new Map<string, EditingIntentState>();
  const retired = new Set<string>();
  if (scenario === "detached")
    states.set("f7e493fb-f113-45fa-81a8-509c9586df21", {
      editor_id: "f7e493fb-f113-45fa-81a8-509c9586df21",
      path: "Note.md",
      generation: 2,
      revision: 4,
      dirty: true,
      active: true,
      detached: true,
    });
  let failAdmission = scenario === "admission";
  const port: NativeEditingIntents = {
    async read(path) {
      if (!(await adapter.exists(path))) return null;
      return {
        path,
        text: await adapter.read(path),
        version: "story-saved-version",
      };
    },
    async call(command) {
      if (command.kind === "list")
        return {
          kind: "states",
          states: [...states.values()].map((state) => ({ ...state })),
        };
      let state = states.get(command.editor_id);
      if (command.kind === "acquire") {
        if (command.path === "Note.md" && failAdmission) {
          failAdmission = false;
          throw new Error("The native connection is temporarily unavailable");
        }
        state ??= {
          editor_id: command.editor_id,
          path: command.path,
          generation: 1,
          revision: 0,
          dirty: false,
          active: true,
          detached: false,
        };
        states.set(command.editor_id, state);
      } else if (command.kind === "discard" || command.kind === "retire") {
        states.delete(command.editor_id);
        retired.add(command.editor_id);
        return { kind: "retired" };
      } else if (state && command.kind === "recover") {
        state.detached = false;
        state.generation++;
      } else if (state && command.kind === "yield") {
        state.active = false;
        state.dirty = false;
      } else if (state && command.kind === "resume") {
        state.active = true;
        state.generation = command.generation;
      } else if (state && command.kind === "changed") {
        state.dirty = true;
        state.revision = command.revision;
      }
      if (retired.has(command.editor_id)) return { kind: "retired" };
      return state && !state.detached
        ? { kind: "state", state: { ...state } }
        : { kind: "missing" };
    },
  };
  return port;
}
