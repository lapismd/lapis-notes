import type { AppDatabase, SearchDocumentRecord } from "@lapis-notes/api";
import type { ConversationRepository } from "./conversation-repository";
import type { ConversationListEntry } from "./transcript-store";
import type {
  ConversationLocation,
  ConversationMetadata,
  ConversationSnapshot,
} from "./types";

export const AI_CONVERSATION_SEARCH_PROVIDER_ID = "ai-conversations";
const INDEX_PATH_PREFIX = "ai-conversation";

export class AiConversationIndex {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly database: AppDatabase,
  ) {}

  async sync(location: ConversationLocation): Promise<void> {
    const snapshot = await this.repository.read(location);
    const document = conversationSearchDocument(snapshot);
    const existing = await this.database.getSearchDocument(document.path);
    if (existing?.checksum === document.checksum) return;
    await this.database.upsertSearchDocument(document);
  }

  delete(location: ConversationLocation): Promise<void> {
    return this.database.deleteSearchDocument(conversationIndexPath(location));
  }

  async search(query: string, limit = 100): Promise<ConversationListEntry[]> {
    if (!query.trim()) {
      return (await this.repository.listAll()).slice(0, limit);
    }
    const results = await this.database.searchDocuments(query, {
      sourceProviderIds: [AI_CONVERSATION_SEARCH_PROVIDER_ID],
      mode: "lexical",
      limit,
    });
    return results.flatMap((result): ConversationListEntry[] => {
      const decoded = decodeConversationIndexDocument(result.document);
      if (!decoded) return [];
      const preview = result.snippets.find(
        (snippet) => snippet.field === "content",
      )?.text;
      return [{ ...decoded, ...(preview ? { preview } : {}) }];
    });
  }

  async rebuild(): Promise<void> {
    const sourceEntries = await this.repository.listAll();
    const sourcePaths = new Set<string>();
    for (const entry of sourceEntries) {
      if (entry.unavailableReason) continue;
      try {
        const snapshot = await this.repository.read(entry.location);
        const document = conversationSearchDocument(snapshot);
        sourcePaths.add(document.path);
        await this.database.upsertSearchDocument(document);
      } catch {
        // One unavailable conversation must not prevent history repair.
      }
    }
    const indexed = (await this.database.listSearchDocuments()).filter(
      (document) =>
        document.sourceProviderId === AI_CONVERSATION_SEARCH_PROVIDER_ID,
    );
    for (const document of indexed) {
      if (!sourcePaths.has(document.path)) {
        await this.database.deleteSearchDocument(document.path);
      }
    }
  }
}

export function conversationIndexPath(location: ConversationLocation): string {
  return `${INDEX_PATH_PREFIX}/${encodeURIComponent(location.scopeDir || ".")}/${location.conversationId}`;
}

export function conversationSearchDocument(
  snapshot: ConversationSnapshot,
): SearchDocumentRecord {
  const content = [
    snapshot.metadata.title,
    ...projectSearchableTranscript(snapshot),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
  const metadataText = JSON.stringify({
    location: snapshot.location,
    metadata: snapshot.metadata,
  });
  return {
    path: conversationIndexPath(snapshot.location),
    sourceProviderId: AI_CONVERSATION_SEARCH_PROVIDER_ID,
    name: snapshot.metadata.title ?? "Untitled conversation",
    extension: "ai-conversation",
    checksum: stableChecksum(`${content}\u0000${metadataText}`),
    content,
    metadataText,
    tags: [],
    tagParts: [],
    tagHierarchy: [],
  };
}

function projectSearchableTranscript(snapshot: ConversationSnapshot): string[] {
  return snapshot.transcript.flatMap((entry): string[] => {
    if (entry.type === "message" || entry.type === "thinking.summary") {
      return [entry.text];
    }
    if (entry.type === "tool") {
      return [entry.name, ...(entry.input ? [entry.input] : [])];
    }
    return [];
  });
}

function decodeConversationIndexDocument(
  document: SearchDocumentRecord,
): ConversationListEntry | null {
  if (
    document.sourceProviderId !== AI_CONVERSATION_SEARCH_PROVIDER_ID ||
    !document.metadataText
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(document.metadataText) as {
      location?: ConversationLocation;
      metadata?: ConversationMetadata;
    };
    if (!parsed.location || !parsed.metadata) return null;
    return {
      location: structuredClone(parsed.location),
      metadata: structuredClone(parsed.metadata),
    };
  } catch {
    return null;
  }
}

function stableChecksum(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
