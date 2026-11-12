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
  /**
   * Subscribe to metadata invalidation, returning an idempotent disposer.
   * Notify after registration and every reconnect or missed notification so the
   * caller can list authoritative claims. Report observation failures without
   * mutating or recovering claims. Disposing must stop delivery and reconnects.
   * Older hosts may omit this port and retain compatible recovery polling.
   */
  observe?(invalidate: () => void, error: (error: unknown) => void): () => void;
}
