import type {
  AgentBindingRecord,
  ConversationLocation,
  ConversationMetadata,
  ConversationSnapshot,
  TranscriptEntry,
} from "./types";

export type ConversationListEntry = {
  location: ConversationLocation;
  metadata?: ConversationMetadata;
  unavailableReason?: string;
  /** Disposable search-index context. Never written to portable source files. */
  preview?: string;
};

export interface TranscriptStore {
  create(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<ConversationSnapshot>;
  read(location: ConversationLocation): Promise<ConversationSnapshot>;
  list(scopeDir: string): Promise<ConversationListEntry[]>;
  listAll(): Promise<ConversationListEntry[]>;
  writeMetadata(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<void>;
  appendAgentRecords(
    location: ConversationLocation,
    records: AgentBindingRecord[],
  ): Promise<void>;
  appendTranscriptEntries(
    location: ConversationLocation,
    entries: TranscriptEntry[],
  ): Promise<void>;
  delete(location: ConversationLocation): Promise<void>;
}

export function conversationStorageKey(location: ConversationLocation): string {
  return `${location.scopeDir}\u0000${location.conversationId}`;
}

export function cloneConversationSnapshot(
  snapshot: ConversationSnapshot,
): ConversationSnapshot {
  return structuredClone(snapshot);
}

export class ConversationWriteQueue {
  private readonly pending = new Map<string, Promise<void>>();

  async run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.pending.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.catch(() => undefined).then(() => gate);
    this.pending.set(key, queued);
    await previous.catch(() => undefined);
    try {
      return await operation();
    } finally {
      release();
      if (this.pending.get(key) === queued) this.pending.delete(key);
    }
  }
}
