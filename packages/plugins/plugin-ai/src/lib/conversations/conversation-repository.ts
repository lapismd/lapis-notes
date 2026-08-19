import { normalizeApprovalGrants } from "./approval-grants";
import { normalizePortableVaultPath, relativePathWithinScope } from "./paths";
import type { DurableSanitizationOptions } from "./redaction";
import { sanitizeDurableField } from "./redaction";
import type {
  ConversationListEntry,
  TranscriptStore,
} from "./transcript-store";
import {
  conversationStorageKey,
  ConversationWriteQueue,
} from "./transcript-store";
import {
  CONVERSATION_SCHEMA_VERSION,
  type AgentBindingRecord,
  type ConversationApprovalGrant,
  type ConversationLocation,
  type ConversationMetadata,
  type ConversationSnapshot,
  type TranscriptEntry,
} from "./types";

export type CreateConversationInput = {
  scopeDir: string;
  launchNotePath?: string;
  workspacePath?: string;
  now?: string;
  id?: string;
};

export type ConversationRepositoryChange =
  | { type: "upsert"; location: ConversationLocation }
  | { type: "delete"; location: ConversationLocation };

export function deriveConversationTitle(text: string): string | undefined {
  const normalized = text.replace(/\s+/gu, " ").trim();
  if (!normalized) return undefined;
  return [...normalized].slice(0, 80).join("");
}

export class ConversationRepository {
  private readonly queue = new ConversationWriteQueue();
  private readonly listeners = new Set<
    (change: ConversationRepositoryChange) => void
  >();

  constructor(
    private readonly store: TranscriptStore,
    private readonly sanitization: DurableSanitizationOptions = {},
  ) {}

  async create(input: CreateConversationInput): Promise<ConversationSnapshot> {
    const conversationId = input.id ?? crypto.randomUUID();
    const location = { scopeDir: input.scopeDir, conversationId };
    const now = input.now ?? new Date().toISOString();
    const metadata: ConversationMetadata = {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: conversationId,
      createdAt: now,
      updatedAt: now,
      status: "active",
      ...(input.launchNotePath
        ? {
            launchContext: {
              notePath: relativePathWithinScope(
                input.scopeDir,
                input.launchNotePath,
              ),
            },
          }
        : {}),
      ...(input.workspacePath
        ? {
            workspace: {
              path: normalizePortableVaultPath(input.workspacePath, {
                allowRoot: true,
                label: "Workspace reference",
              }),
            },
          }
        : {}),
    };
    const snapshot = await this.store.create(location, metadata);
    this.emit({ type: "upsert", location: snapshot.location });
    return snapshot;
  }

  read(location: ConversationLocation): Promise<ConversationSnapshot> {
    return this.store.read(location);
  }

  list(scopeDir: string): Promise<ConversationListEntry[]> {
    return this.store.list(scopeDir);
  }

  listAll(): Promise<ConversationListEntry[]> {
    return this.store.listAll();
  }

  subscribe(
    listener: (change: ConversationRepositoryChange) => void,
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async appendTranscript(
    location: ConversationLocation,
    entries: TranscriptEntry[],
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const safeEntries = entries.map((entry) => this.sanitizeEntry(entry));
      await this.store.appendTranscriptEntries(location, safeEntries);
      const snapshot = await this.store.read(location);
      const firstUserMessage = snapshot.transcript.find(
        (entry) => entry.type === "message" && entry.role === "user",
      );
      const title =
        snapshot.metadata.title ??
        deriveConversationTitle(
          firstUserMessage?.type === "message" ? firstUserMessage.text : "",
        );
      const updatedAt =
        safeEntries.at(-1)?.createdAt ?? new Date().toISOString();
      const metadata = {
        ...snapshot.metadata,
        ...(title ? { title } : {}),
        updatedAt,
      };
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async appendAgentRecords(
    location: ConversationLocation,
    records: AgentBindingRecord[],
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      await this.store.appendAgentRecords(location, records);
      const snapshot = await this.store.read(location);
      const updatedAt = records.at(-1)?.createdAt ?? new Date().toISOString();
      const activeBinding = [...records]
        .reverse()
        .find((record) => record.type === "binding.created");
      const metadata = {
        ...snapshot.metadata,
        updatedAt,
        ...(activeBinding ? { activeAgentBindingId: activeBinding.id } : {}),
      };
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async writeApprovalGrants(
    location: ConversationLocation,
    grants: ConversationApprovalGrant[],
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location);
      const approvalGrants = normalizeApprovalGrants(grants);
      const metadata: ConversationMetadata = {
        ...snapshot.metadata,
        updatedAt: new Date().toISOString(),
      };
      if (approvalGrants.length > 0) metadata.approvalGrants = approvalGrants;
      else delete metadata.approvalGrants;
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async writePinned(
    location: ConversationLocation,
    pinned: boolean,
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location);
      const metadata: ConversationMetadata = {
        ...snapshot.metadata,
        updatedAt: new Date().toISOString(),
      };
      if (pinned) metadata.pinned = true;
      else delete metadata.pinned;
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async archive(
    location: ConversationLocation,
    archived = true,
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location);
      const metadata: ConversationMetadata = {
        ...snapshot.metadata,
        status: archived ? "archived" : "active",
        updatedAt: new Date().toISOString(),
      };
      await this.store.writeMetadata(location, metadata);
      const result = { ...snapshot, metadata };
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async activateBinding(
    location: ConversationLocation,
    bindingId: string,
    switchEntry?: TranscriptEntry,
  ): Promise<ConversationSnapshot> {
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location);
      const binding = snapshot.agents.find(
        (record) =>
          record.type === "binding.created" && record.id === bindingId,
      );
      if (!binding) throw new Error(`Unknown agent binding: ${bindingId}`);
      if (switchEntry) {
        await this.store.appendTranscriptEntries(location, [
          this.sanitizeEntry(switchEntry),
        ]);
      }
      const metadata: ConversationMetadata = {
        ...snapshot.metadata,
        activeAgentBindingId: bindingId,
        updatedAt: switchEntry?.createdAt ?? new Date().toISOString(),
      };
      await this.store.writeMetadata(location, metadata);
      const result = await this.store.read(location);
      this.emit({ type: "upsert", location: result.location });
      return result;
    });
  }

  async delete(location: ConversationLocation): Promise<void> {
    await this.store.delete(location);
    this.emit({ type: "delete", location: { ...location } });
  }

  private emit(change: ConversationRepositoryChange): void {
    for (const listener of this.listeners) listener(change);
  }

  private sanitizeEntry(entry: TranscriptEntry): TranscriptEntry {
    if (entry.type === "tool") {
      const input = sanitizeDurableField(entry.input, this.sanitization);
      const output = sanitizeDurableField(entry.output, this.sanitization);
      return {
        ...entry,
        input: input.text,
        output: output.text,
        redacted:
          entry.redacted || input.redacted || output.redacted || undefined,
        truncated:
          entry.truncated || input.truncated || output.truncated || undefined,
      };
    }
    if (entry.type === "approval.request" && entry.tool?.input) {
      const input = sanitizeDurableField(entry.tool.input, this.sanitization);
      return {
        ...entry,
        tool: { ...entry.tool, input: input.text },
        redacted: entry.redacted || input.redacted || undefined,
        truncated: entry.truncated || input.truncated || undefined,
      };
    }
    if (entry.type === "error") {
      return {
        ...entry,
        message:
          sanitizeDurableField(entry.message, this.sanitization).text ?? "",
      };
    }
    return entry;
  }
}
