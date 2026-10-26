import {
  FileEditingSessionRegistry,
  type AppStateProperties,
  type FileEditingRegistration,
  type NativeEditingIntents,
  type VaultSession,
} from "@lapis-notes/api";
import type {
  EditingIntentCommand,
  EditingIntentValue,
  TextSnapshot,
} from "@lapis-notes/api/native-editing-intents";

declare const call: (
  command: EditingIntentCommand,
) => Promise<EditingIntentValue>;
declare const read: (path: string) => Promise<TextSnapshot | null>;
const port: NativeEditingIntents = { call, read };
const properties: Pick<AppStateProperties, "nativeEditingIntents"> = {
  nativeEditingIntents: port,
};
const session: Pick<VaultSession, "nativeEditingIntents"> = properties;
const registry = new FileEditingSessionRegistry(session.nativeEditingIntents);
const registration: FileEditingRegistration = registry.register("note.md", {
  dirty: false,
  native: { hold: () => () => {}, savedText: () => "saved" },
  async flush() {},
  async protect() {
    return () => {};
  },
});
void registration.ready();
registration.changed();
registration();

void port.call({
  kind: "recover",
  editor_id: "00000000-0000-0000-0000-000000000001",
  generation: 1,
  revision: 2,
});
void port.call({
  kind: "discard",
  editor_id: "00000000-0000-0000-0000-000000000001",
  generation: 2,
  revision: 2,
});
// @ts-expect-error Captured revision is required for recovery decisions.
void port.call({ kind: "recover", editor_id: "id", generation: 1 });
// @ts-expect-error ID-only managed discard is not part of the public port.
void port.call({ kind: "discard", editor_id: "id" });
