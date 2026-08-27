import type {
  ConversationRepository,
  ConversationRepositoryChange,
} from "../conversations/conversation-repository";
import { conversationLocationFromSourcePath } from "../conversations/conversation-index-coordinator";
import type { ConversationLocation } from "../conversations/types";
import type { MemoryService } from "./types";

type PendingAction =
  | {
      type: "ingest";
      location: ConversationLocation;
      requireTerminal: boolean;
    }
  | { type: "rebuild" };

export type MemoryIngestionErrorHandler = (
  operation: "ingest" | "rebuild",
  location: ConversationLocation | undefined,
  error: unknown,
) => void;

export class MemoryIngestionCoordinator {
  readonly #pending = new Map<string, PendingAction>();
  #timer: ReturnType<typeof setTimeout> | undefined;
  #unsubscribe: (() => void) | undefined;
  #disposed = false;

  constructor(
    private readonly repository: ConversationRepository,
    private readonly memory: MemoryService,
    private readonly onError: MemoryIngestionErrorHandler = () => {},
    private readonly delay = 150,
  ) {
    this.#unsubscribe = repository.subscribe((change) =>
      this.handleRepositoryChange(change),
    );
  }

  handleRepositoryChange(change: ConversationRepositoryChange): void {
    if (change.type === "delete") {
      this.#pending.clear();
      this.#pending.set("rebuild", { type: "rebuild" });
    } else {
      this.#pending.set(locationKey(change.location), {
        type: "ingest",
        location: change.location,
        requireTerminal: true,
      });
    }
    this.schedule();
  }

  handleVaultChange(path: string, oldPath?: string): void {
    const current = conversationLocationFromSourcePath(path);
    const previous = oldPath
      ? conversationLocationFromSourcePath(oldPath)
      : null;
    if (previous && (!current || locationKey(previous) !== locationKey(current))) {
      this.#pending.set("rebuild", { type: "rebuild" });
    }
    if (current && path.endsWith("/transcript.jsonl")) {
      this.#pending.set(locationKey(current), {
        type: "ingest",
        location: current,
        requireTerminal: false,
      });
    }
    if (current || previous) this.schedule();
  }

  startCatchUp(): void {
    this.#pending.set("rebuild", { type: "rebuild" });
    this.schedule();
  }

  async flush(): Promise<void> {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = undefined;
    const actions = [...this.#pending.values()];
    this.#pending.clear();
    for (const action of actions) {
      if (this.#disposed) return;
      try {
        if (action.type === "rebuild") {
          await this.memory.rebuild();
        } else if (
          !action.requireTerminal ||
          (await this.hasTerminalTranscriptBoundary(action.location))
        ) {
          await this.memory.ingestConversation(action.location);
        }
      } catch (error) {
        this.onError(
          action.type,
          action.type === "ingest" ? action.location : undefined,
          error,
        );
      }
    }
  }

  dispose(): void {
    this.#disposed = true;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#pending.clear();
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
  }

  private schedule(): void {
    if (this.#disposed) return;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      void this.flush();
    }, this.delay);
  }

  private async hasTerminalTranscriptBoundary(
    location: ConversationLocation,
  ): Promise<boolean> {
    const snapshot = await this.repository.read(location);
    const last = snapshot.transcript.at(-1);
    return Boolean(
      last &&
        ((last.type === "message" && last.role === "assistant") ||
          last.type === "tool" ||
          last.type === "error" ||
          last.type === "cancelled"),
    );
  }
}

function locationKey(location: ConversationLocation): string {
  return `${location.scopeDir}\u0000${location.conversationId}`;
}
