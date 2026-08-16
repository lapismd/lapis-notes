import { TFile, TFolder, type Vault } from "@lapis-notes/api/vault";
import { parse, stringify } from "yaml";
import { parseJsonLines, serializeJsonLine } from "./jsonl";
import {
  conversationDirectory,
  conversationSessionsPath,
  normalizeConversationLocation,
  normalizeConversationScope,
} from "./paths";
import {
  conversationStorageKey,
  ConversationWriteQueue,
  type ConversationListEntry,
  type TranscriptStore,
} from "./transcript-store";
import {
  CONVERSATION_ID_PATTERN,
  ConversationUnavailableError,
  type AgentBindingRecord,
  type ConversationLocation,
  type ConversationMetadata,
  type ConversationSnapshot,
  type TranscriptEntry,
} from "./types";
import {
  validateAgentBindingRecord,
  validateConversationMetadata,
  validateTranscriptEntry,
} from "./validation";

const MAX_METADATA_BYTES = 256 * 1024;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class VaultTranscriptStore implements TranscriptStore {
  private readonly queue = new ConversationWriteQueue();

  constructor(private readonly vault: Vault) {}

  async create(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<ConversationSnapshot> {
    const normalized = normalizeConversationLocation(location);
    return this.queue.run(conversationStorageKey(normalized), async () => {
      const directory = conversationDirectory(normalized);
      if (metadata.id !== normalized.conversationId) {
        throw new Error("Conversation metadata ID must match its directory");
      }
      if (this.vault.getAbstractFileByPath(directory)) {
        throw new Error("Conversation already exists");
      }
      await this.vault.mkpath(directory);
      await this.replaceText(
        `${directory}/metadata.yaml`,
        this.metadataYaml(metadata),
      );
      await this.replaceText(`${directory}/agents.jsonl`, "");
      await this.replaceText(`${directory}/transcript.jsonl`, "");
      return {
        location: normalized,
        metadata: structuredClone(metadata),
        agents: [],
        transcript: [],
        warnings: [],
      };
    });
  }

  async read(location: ConversationLocation): Promise<ConversationSnapshot> {
    const normalized = normalizeConversationLocation(location);
    try {
      const directory = conversationDirectory(normalized);
      const metadataContent = await this.readRequired(
        `${directory}/metadata.yaml`,
      );
      if (
        new TextEncoder().encode(metadataContent).byteLength >
        MAX_METADATA_BYTES
      ) {
        throw new Error("metadata.yaml exceeds the maximum supported size");
      }
      const metadata = validateConversationMetadata(
        parse(metadataContent, { maxAliasCount: 10 }),
      );
      if (metadata.id !== normalized.conversationId) {
        throw new Error("metadata.yaml ID does not match its directory");
      }
      const agents = parseJsonLines({
        content: await this.readRequired(`${directory}/agents.jsonl`),
        file: "agents.jsonl",
        validate: validateAgentBindingRecord,
      });
      const transcript = parseJsonLines({
        content: await this.readRequired(`${directory}/transcript.jsonl`),
        file: "transcript.jsonl",
        validate: validateTranscriptEntry,
      });
      return {
        location: normalized,
        metadata,
        agents: agents.records,
        transcript: transcript.records,
        warnings: [...agents.warnings, ...transcript.warnings],
      };
    } catch (error) {
      if (error instanceof ConversationUnavailableError) throw error;
      throw new ConversationUnavailableError(
        normalized,
        `Conversation is unavailable: ${errorMessage(error)}`,
        { cause: error },
      );
    }
  }

  async list(scopeDir: string): Promise<ConversationListEntry[]> {
    const normalizedScope = normalizeConversationScope(scopeDir);
    const sessionsPath = conversationSessionsPath(normalizedScope);
    const sessions = await this.vault.list(sessionsPath).catch(() => null);
    if (!sessions) return [];
    const entries = await Promise.all(
      sessions.folders
        .filter((name) => CONVERSATION_ID_PATTERN.test(name))
        .map(async (conversationId): Promise<ConversationListEntry> => {
          const location = {
            scopeDir: normalizedScope,
            conversationId,
          };
          try {
            const snapshot = await this.read(location);
            return { location, metadata: snapshot.metadata };
          } catch (error) {
            return { location, unavailableReason: errorMessage(error) };
          }
        }),
    );
    return entries.sort((left, right) =>
      (right.metadata?.updatedAt ?? "").localeCompare(
        left.metadata?.updatedAt ?? "",
      ),
    );
  }

  async listAll(): Promise<ConversationListEntry[]> {
    const locations = this.vault
      .getAllFolders()
      .flatMap((folder): ConversationLocation[] => {
        const match = folder.path.match(
          /^(?:(.*)\/)?\.lapis\/agents\/sessions\/([0-9a-f-]+)$/u,
        );
        if (!match || !CONVERSATION_ID_PATTERN.test(match[2] ?? "")) return [];
        return [
          {
            scopeDir: match[1] ?? "",
            conversationId: match[2]!,
          },
        ];
      });
    const entries = await Promise.all(
      locations.map(async (location): Promise<ConversationListEntry> => {
        try {
          const snapshot = await this.read(location);
          return { location, metadata: snapshot.metadata };
        } catch (error) {
          return { location, unavailableReason: errorMessage(error) };
        }
      }),
    );
    return entries.sort((left, right) =>
      (right.metadata?.updatedAt ?? "").localeCompare(
        left.metadata?.updatedAt ?? "",
      ),
    );
  }

  async writeMetadata(
    location: ConversationLocation,
    metadata: ConversationMetadata,
  ): Promise<void> {
    const normalized = normalizeConversationLocation(location);
    await this.queue.run(conversationStorageKey(normalized), async () => {
      if (metadata.id !== normalized.conversationId) {
        throw new Error("Conversation metadata ID must match its directory");
      }
      await this.replaceText(
        `${conversationDirectory(normalized)}/metadata.yaml`,
        this.metadataYaml(metadata),
      );
    });
  }

  async appendAgentRecords(
    location: ConversationLocation,
    records: AgentBindingRecord[],
  ): Promise<void> {
    const normalized = normalizeConversationLocation(location);
    await this.queue.run(conversationStorageKey(normalized), async () => {
      const existing = await this.read(normalized);
      const ids = new Set(existing.agents.map((record) => record.id));
      const additions = records
        .map(validateAgentBindingRecord)
        .filter((record) => !ids.has(record.id));
      if (!additions.length) return;
      await this.appendText(
        `${conversationDirectory(normalized)}/agents.jsonl`,
        additions.map(serializeJsonLine).join(""),
      );
    });
  }

  async appendTranscriptEntries(
    location: ConversationLocation,
    entries: TranscriptEntry[],
  ): Promise<void> {
    const normalized = normalizeConversationLocation(location);
    await this.queue.run(conversationStorageKey(normalized), async () => {
      const existing = await this.read(normalized);
      const ids = new Set(existing.transcript.map((entry) => entry.id));
      const provenance = new Set(
        existing.transcript.flatMap((entry) =>
          entry.source
            ? [
                `${entry.source.sessionId}\u0000${entry.source.runId}\u0000${entry.source.sequence}`,
              ]
            : [],
        ),
      );
      const additions = entries.map(validateTranscriptEntry).filter((entry) => {
        const sourceKey = entry.source
          ? `${entry.source.sessionId}\u0000${entry.source.runId}\u0000${entry.source.sequence}`
          : undefined;
        if (ids.has(entry.id) || (sourceKey && provenance.has(sourceKey))) {
          return false;
        }
        ids.add(entry.id);
        if (sourceKey) provenance.add(sourceKey);
        return true;
      });
      if (!additions.length) return;
      await this.appendText(
        `${conversationDirectory(normalized)}/transcript.jsonl`,
        additions.map(serializeJsonLine).join(""),
      );
    });
  }

  async delete(location: ConversationLocation): Promise<void> {
    const normalized = normalizeConversationLocation(location);
    await this.queue.run(conversationStorageKey(normalized), async () => {
      const folder = this.vault.getFolderByPath(
        conversationDirectory(normalized),
      );
      if (folder) await this.vault.trash(folder, true);
    });
  }

  private metadataYaml(metadata: ConversationMetadata): string {
    const validated = validateConversationMetadata(metadata);
    return stringify(validated, { lineWidth: 0 });
  }

  private async readRequired(path: string): Promise<string> {
    const file = this.vault.getFileByPath(path);
    if (!file) throw new Error(`Missing ${path.split("/").at(-1)}`);
    return this.vault.read(file);
  }

  private async replaceText(path: string, content: string): Promise<void> {
    const existing = this.vault.getAbstractFileByPath(path);
    if (existing instanceof TFolder) throw new Error(`${path} is a folder`);
    if (existing instanceof TFile) {
      await this.vault.modify(existing, content);
    } else {
      await this.vault.create(path, content);
    }
  }

  private async appendText(path: string, content: string): Promise<void> {
    const existing = this.vault.getAbstractFileByPath(path);
    if (existing instanceof TFolder) throw new Error(`${path} is a folder`);
    if (existing instanceof TFile) {
      await this.vault.append(existing, content);
    } else {
      await this.vault.create(path, content);
    }
  }
}

export { MAX_METADATA_BYTES };
