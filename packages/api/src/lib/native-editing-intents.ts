import type {
  EditingIntentCommand,
  EditingIntentValue,
  TextSnapshot,
} from "./native-editing-intents-protocol";
export type * from "./native-editing-intents-protocol";

/** An admitted native fence; persistence stays with existing App writers. */
export interface NativeEditingIntents {
  call(command: EditingIntentCommand): Promise<EditingIntentValue>;
  /** Expected absence is null; unavailable or unreadable files reject. */
  read(path: string): Promise<TextSnapshot | null>;
}
