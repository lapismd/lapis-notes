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
