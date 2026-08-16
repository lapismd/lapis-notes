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

export function deriveConversationTitle(text: string): string | undefined {
  const normalized = text.replace(/\s+/gu, " ").trim();
  if (!normalized) return undefined;
  return [...normalized].slice(0, 80).join("");
}

export class ConversationRepository {
  private readonly queue = new ConversationWriteQueue();

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
    return this.store.create(location, metadata);
  }

  read(location: ConversationLocation): Promise<ConversationSnapshot> {
    return this.store.read(location);
  }

  list(scopeDir: string): Promise<ConversationListEntry[]> {
    return this.store.list(scopeDir);
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
      return { ...snapshot, metadata };
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
      return { ...snapshot, metadata };
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
      return { ...snapshot, metadata };
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
      return this.store.read(location);
    });
  }

  delete(location: ConversationLocation): Promise<void> {
    return this.store.delete(location);
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
